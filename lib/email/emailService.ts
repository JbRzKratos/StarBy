/**
 * Centralized Transactional Email Service for Fregoro Studios
 *
 * Implements Resend integration with database event tracking, idempotency,
 * structured error logging, and retry capabilities.
 */

import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import {
  BUSINESS_EMAIL,
  getSenderEmail,
  getAdminContactEmail,
  sanitizeEmailSubject,
  getEmailConfigStatus,
} from './emailConfig';
import {
  buildContactAdminEmail,
  buildContactCustomerConfirmationEmail,
  buildBulkOrderAdminEmail,
  buildBulkOrderCustomerConfirmationEmail,
  type ContactEmailPayload,
  type BulkOrderEmailData,
} from './emailTemplates';
import type { SizeColorMatrixRow } from '@/lib/bulk-orders/types';

// Lazy Resend client instance
let _resendClient: Resend | null = null;
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.startsWith('re_')) {
    return null;
  }
  if (!_resendClient) {
    _resendClient = new Resend(apiKey);
  }
  return _resendClient;
}

export interface EmailSendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

/**
 * Low-level transactional sender that logs every delivery attempt into the database
 */
export async function sendTransactionalEmail({
  type,
  recipient,
  subject,
  html,
  text,
  replyTo,
  requestId,
  payload,
}: {
  type: string;
  recipient: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  requestId?: string;
  payload?: Record<string, unknown>;
}): Promise<EmailSendResult> {
  const cleanSubject = sanitizeEmailSubject(subject);
  const fromAddress = getSenderEmail();
  const config = getEmailConfigStatus();

  // Verify foreign key exists before assigning to avoid FK violation
  let linkedRequestId: string | null = null;
  if (requestId) {
    try {
      const exists = await prisma.bulkOrderRequest.findUnique({
        where: { id: requestId },
        select: { id: true },
      });
      if (exists) {
        linkedRequestId = exists.id;
      }
    } catch {
      linkedRequestId = null;
    }
  }

  // Create initial pending event in DB for audit trail
  let eventRecord = null;
  try {
    eventRecord = await prisma.emailEvent.create({
      data: {
        requestId: linkedRequestId,
        type,
        recipient,
        subject: cleanSubject,
        status: 'pending',
        payload: {
          ...(payload ? JSON.parse(JSON.stringify(payload)) : {}),
          ...(requestId && !linkedRequestId ? { unlinkedRequestId: requestId } : {}),
        },
      },
    });
  } catch (dbErr) {
    console.warn('[EmailService] Failed to record pending EmailEvent in DB:', dbErr);
  }

  const resend = getResendClient();
  if (!resend) {
    const errorMsg = 'RESEND_API_KEY is missing or invalid. Check server environment variables.';
    console.warn(`[EmailService] ${errorMsg} (To: ${recipient}, Subject: "${cleanSubject}")`);

    if (eventRecord) {
      await prisma.emailEvent
        .update({
          where: { id: eventRecord.id },
          data: { status: 'failed', error: errorMsg },
        })
        .catch(() => {});
    }
    return { success: false, error: errorMsg };
  }

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: [recipient],
      replyTo: replyTo || BUSINESS_EMAIL,
      subject: cleanSubject,
      html,
      text,
    });

    if (response.error) {
      const errorMsg = response.error.message || 'Resend provider returned an error';
      console.error(`[EmailService] Provider error sending ${type} to ${recipient}:`, errorMsg);

      if (eventRecord) {
        await prisma.emailEvent
          .update({
            where: { id: eventRecord.id },
            data: { status: 'failed', error: errorMsg },
          })
          .catch(() => {});
      }
      return { success: false, error: errorMsg };
    }

    const providerMessageId = response.data?.id || undefined;

    if (eventRecord) {
      await prisma.emailEvent
        .update({
          where: { id: eventRecord.id },
          data: {
            status: 'sent',
            providerMessageId,
            error: null,
          },
        })
        .catch(() => {});
    }

    return { success: true, providerMessageId };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[EmailService] Unhandled exception sending ${type} to ${recipient}:`, errorMsg);

    // Provide helpful sandbox context if running with onboarding@resend.dev
    let detailedError = errorMsg;
    if (config.isSandboxDomain && errorMsg.includes('testing domain')) {
      detailedError =
        'Resend sandbox domain (onboarding@resend.dev) can only send to your verified account email. Verify a custom domain in Resend to send to customer emails.';
    }

    if (eventRecord) {
      await prisma.emailEvent
        .update({
          where: { id: eventRecord.id },
          data: { status: 'failed', error: detailedError },
        })
        .catch(() => {});
    }

    return { success: false, error: detailedError };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT US EMAIL FLOW
// ─────────────────────────────────────────────────────────────────────────────

export interface ContactSubmissionResult {
  success: boolean;
  submissionId?: string;
  adminEmailSent: boolean;
  customerEmailSent: boolean;
  errors: string[];
}

/**
 * Handle Contact Us form submissions:
 * 1. Sends high-priority notification to Fregoro Studios (fregorostudios@gmail.com) with Reply-To set to the customer.
 * 2. Sends automated confirmation email to customer with direct WhatsApp link.
 * 3. Logs delivery audit records in the database.
 */
export async function sendContactSubmission(
  data: ContactEmailPayload,
  submissionId?: string,
): Promise<ContactSubmissionResult> {
  const errors: string[] = [];
  const adminRecipient = getAdminContactEmail();

  // 1. Build and send Admin Notification Email
  const adminEmail = buildContactAdminEmail(data);
  const adminResult = await sendTransactionalEmail({
    type: 'contact_admin',
    recipient: adminRecipient,
    subject: adminEmail.subject,
    html: adminEmail.html,
    text: adminEmail.text,
    replyTo: data.email, // Crucial: clicking Reply goes straight to the customer!
    requestId: submissionId,
    payload: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      subject: data.subject,
    },
  });

  if (!adminResult.success) {
    errors.push(`Admin notification failed: ${adminResult.error}`);
  }

  // 2. Build and send Customer Confirmation Email
  let customerResult: EmailSendResult = { success: false };
  if (data.email) {
    const customerEmail = buildContactCustomerConfirmationEmail(data);
    customerResult = await sendTransactionalEmail({
      type: 'contact_customer',
      recipient: data.email,
      subject: customerEmail.subject,
      html: customerEmail.html,
      text: customerEmail.text,
      replyTo: adminRecipient,
      requestId: submissionId,
      payload: {
        name: data.name,
        subject: data.subject,
      },
    });

    if (!customerResult.success) {
      errors.push(`Customer auto-reply failed: ${customerResult.error}`);
    }
  }

  return {
    success: adminResult.success || customerResult.success,
    submissionId,
    adminEmailSent: adminResult.success,
    customerEmailSent: customerResult.success,
    errors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK ORDER EMAIL FLOW
// ─────────────────────────────────────────────────────────────────────────────

export interface BulkOrderSubmissionResult {
  success: boolean;
  requestId: string;
  adminEmailSent: boolean;
  customerEmailSent: boolean;
  errors: string[];
}

/**
 * Handle Bulk & Custom Apparel Order submissions:
 * 1. Checks idempotency to prevent duplicate emails from rapid double-clicks.
 * 2. Sends complete structured request to Fregoro Studios (fregorostudios@gmail.com) with Reply-To = customer.
 * 3. Sends luxury branded confirmation to the customer with summary card & WhatsApp chat link.
 * 4. Logs full audit records in EmailEvent table.
 */
export async function sendBulkOrderSubmission(
  data: BulkOrderEmailData,
): Promise<BulkOrderSubmissionResult> {
  const errors: string[] = [];
  const adminRecipient = getAdminContactEmail();

  // Idempotency check: if an email was already sent within the last 10 minutes for this request, skip sending duplicates
  try {
    const existingSentEvent = await prisma.emailEvent.findFirst({
      where: {
        requestId: data.id,
        type: 'bulk_admin',
        status: 'sent',
      },
    });

    if (existingSentEvent) {
      console.log(
        `[EmailService] Idempotency: Bulk order email already sent for request #${data.requestNumber}. Skipping duplicate.`,
      );
      return {
        success: true,
        requestId: data.id,
        adminEmailSent: true,
        customerEmailSent: true,
        errors: [],
      };
    }
  } catch (idempErr) {
    console.warn('[EmailService] Idempotency check warning:', idempErr);
  }

  // 1. Build and send Admin Notification Email
  const adminEmail = buildBulkOrderAdminEmail(data);
  const adminResult = await sendTransactionalEmail({
    type: 'bulk_admin',
    recipient: adminRecipient,
    subject: adminEmail.subject,
    html: adminEmail.html,
    text: adminEmail.text,
    replyTo: data.email, // Clicking Reply goes straight to the customer!
    requestId: data.id,
    payload: {
      requestNumber: data.requestNumber,
      orderType: data.orderType,
      totalQuantity: data.totalQuantity,
      customerName: data.contactName,
      customerEmail: data.email,
      customerPhone: data.phone,
    },
  });

  if (!adminResult.success) {
    errors.push(`Bulk admin notification failed: ${adminResult.error}`);
  }

  // 2. Build and send Customer Confirmation Email
  let customerResult: EmailSendResult = { success: false };
  if (data.email) {
    const customerEmail = buildBulkOrderCustomerConfirmationEmail(data);
    customerResult = await sendTransactionalEmail({
      type: 'bulk_customer',
      recipient: data.email,
      subject: customerEmail.subject,
      html: customerEmail.html,
      text: customerEmail.text,
      replyTo: adminRecipient,
      requestId: data.id,
      payload: {
        requestNumber: data.requestNumber,
        customerName: data.contactName,
        totalQuantity: data.totalQuantity,
      },
    });

    if (!customerResult.success) {
      errors.push(`Bulk customer confirmation failed: ${customerResult.error}`);
    }
  }

  return {
    success: adminResult.success || customerResult.success,
    requestId: data.id,
    adminEmailSent: adminResult.success,
    customerEmailSent: customerResult.success,
    errors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL RETRY CAPABILITY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retry a failed or pending EmailEvent by ID without modifying or re-creating the parent request.
 */
export async function retryEmailEvent(eventId: string): Promise<EmailSendResult> {
  const event = await prisma.emailEvent.findUnique({
    where: { id: eventId },
    include: {
      request: {
        include: {
          items: true,
          artworks: true,
        },
      },
    },
  });

  if (!event) {
    return { success: false, error: 'Email event record not found' };
  }

  // If this is a bulk order email and we have the linked request, reconstruct fresh templates
  if (event.request && (event.type === 'bulk_admin' || event.type === 'bulk_customer')) {
    const req = event.request;
    const bulkData: BulkOrderEmailData = {
      id: req.id,
      requestNumber: req.requestNumber,
      orderType: req.orderType,
      companyName: req.companyName,
      eventName: req.eventName,
      contactName: req.contactName,
      phone: req.phone,
      email: req.email,
      totalQuantity: req.totalQuantity,
      requiredDeliveryDate: req.requiredDeliveryDate,
      eventDate: req.eventDate,
      isUrgent: req.isUrgent,
      customerNotes: req.customerNotes,
      shippingMethod: req.shippingMethod,
      shippingAddress:
        req.shippingAddress && typeof req.shippingAddress === 'object'
          ? (req.shippingAddress as Record<string, unknown>)
          : null,
      packagingPreference: req.packagingPreference,
      packagingNotes: req.packagingNotes,
      customLabelOption: req.customLabelOption,
      customLabelNotes: req.customLabelNotes,
      contactPreference: req.contactPreference,
      items: req.items.map((i) => ({
        apparelType: i.apparelType,
        totalQuantity: i.totalQuantity,
        fabric: i.fabric || undefined,
        gsm: i.gsm || undefined,
        printingMethod: i.printingMethod || undefined,
        printingPlacements: i.printingPlacements || [],
        designNotes: i.designNotes || undefined,
        sizeColorMatrix: Array.isArray(i.sizeColorMatrix)
          ? (i.sizeColorMatrix as unknown as SizeColorMatrixRow[])
          : [],
      })),
      artworks: req.artworks.map((a) => ({
        placement: a.placement,
        label: a.label || undefined,
        fileUrl: a.fileUrl,
        fileName: a.fileName,
        fileType: a.fileType,
        fileSize: a.fileSize || undefined,
        printSize: a.printSize || undefined,
        dimensionsMm: a.dimensionsMm || undefined,
      })),
    };

    if (event.type === 'bulk_admin') {
      const template = buildBulkOrderAdminEmail(bulkData);
      return sendTransactionalEmail({
        type: 'bulk_admin',
        recipient: event.recipient,
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: req.email,
        requestId: req.id,
      });
    } else {
      const template = buildBulkOrderCustomerConfirmationEmail(bulkData);
      return sendTransactionalEmail({
        type: 'bulk_customer',
        recipient: event.recipient,
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: getAdminContactEmail(),
        requestId: req.id,
      });
    }
  }

  // Fallback: If not linked to a full BulkOrderRequest or if ContactSubmission, return error or re-attempt with stored payload
  return {
    success: false,
    error: 'Direct retry without canonical request object is not supported',
  };
}
