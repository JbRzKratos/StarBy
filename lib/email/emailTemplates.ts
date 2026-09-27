/**
 * Transactional Email Templates for Fregoro Studios
 *
 * Implements premium, responsive, client-safe HTML and plain-text fallbacks
 * for Contact Us and Bulk & Custom Apparel Orders.
 */

import {
  BUSINESS_NAME,
  BUSINESS_EMAIL,
  BUSINESS_ADDRESS_NAME,
  BUSINESS_FULL_ADDRESS,
  escapeEmailHtml,
  getEmailBaseUrl,
  getEmailWhatsappLink,
} from './emailConfig';
import type { BulkOrderItemInput, BulkOrderArtworkInput } from '@/lib/bulk-orders/types';

/**
 * Shared email shell wrapping content in Fregoro's celestial dark branding
 */
export function renderEmailShell({
  previewText,
  title,
  subtitle,
  badgeText,
  contentHtml,
}: {
  previewText?: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  contentHtml: string;
}): string {
  const baseUrl = getEmailBaseUrl();

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${escapeEmailHtml(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .responsive-table { width: 100% !important; }
      .mobile-padding { padding-left: 16px !important; padding-right: 16px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
      .mobile-center { text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #090A10; color: #F5F1EA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; line-height: 1.6;">

  ${
    previewText
      ? `<div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #090A10;">
          ${escapeEmailHtml(previewText)}
        </div>`
      : ''
  }

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #090A10; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 24px 12px 48px 12px;" class="mobile-padding">

        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #11131B; border: 1px solid rgba(245, 241, 234, 0.12); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 45px rgba(0, 0, 0, 0.65);" class="responsive-table">

          <!-- Brand Celestial Header -->
          <tr>
            <td style="padding: 36px 28px 24px 28px; text-align: center; background: radial-gradient(circle at 50% 0%, rgba(229, 194, 135, 0.18) 0%, rgba(17, 19, 27, 0) 75%), #11131B; border-bottom: 1px solid rgba(245, 241, 234, 0.08);">
              <div style="letter-spacing: 4px; font-size: 11px; text-transform: uppercase; color: #E5C287; font-weight: 700; margin-bottom: 8px;">
                ✦ F R E G O R O &nbsp; S T U D I O S ✦
              </div>
              ${
                badgeText
                  ? `<div style="margin-bottom: 10px;">
                      <span style="display: inline-block; background-color: rgba(229, 194, 135, 0.12); border: 1px solid rgba(229, 194, 135, 0.35); color: #E5C287; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 100px; text-transform: uppercase; letter-spacing: 1px;">
                        ${escapeEmailHtml(badgeText)}
                      </span>
                    </div>`
                  : ''
              }
              <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #F5F1EA;">
                ${escapeEmailHtml(title)}
              </h1>
              ${
                subtitle
                  ? `<p style="margin: 0; font-size: 13px; color: #9E9EA7; letter-spacing: 0.5px;">
                      ${escapeEmailHtml(subtitle)}
                    </p>`
                  : ''
              }
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 28px 28px 20px 28px;" class="mobile-padding">
              ${contentHtml}
            </td>
          </tr>

          <!-- Official Business Footer -->
          <tr>
            <td style="padding: 28px 24px; text-align: center; background-color: #0C0D13; border-top: 1px solid rgba(245, 241, 234, 0.08); font-size: 12px; color: #71717A;">
              <p style="margin: 0 0 6px 0; font-weight: 700; color: #A1A1AA; letter-spacing: 0.5px;">
                ${BUSINESS_ADDRESS_NAME}
              </p>
              <p style="margin: 0 0 10px 0; line-height: 1.5; color: #8E8E93;">
                ${BUSINESS_FULL_ADDRESS}
              </p>
              <p style="margin: 0 0 14px 0; font-size: 12px; color: #8E8E93;">
                Have questions? Reach our studio team at
                <a href="mailto:${BUSINESS_EMAIL}" style="color: #E5C287; text-decoration: none; font-weight: 600;">${BUSINESS_EMAIL}</a>
                or visit <a href="${baseUrl}" style="color: #E5C287; text-decoration: none;">fregorostudios.com</a>.
              </p>
              <p style="margin: 0; font-size: 11px; color: #52525B;">
                Designed for your wall · Made for your brand.<br />
                &copy; ${new Date().getFullYear()} ${BUSINESS_NAME}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CONTACT FORM: ADMIN NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

export interface ContactEmailPayload {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  subject: string;
  message: string;
  submittedAt?: Date | string;
  createdAt?: Date | string;
}

export function buildContactAdminEmail(data: ContactEmailPayload): {
  html: string;
  text: string;
  subject: string;
} {
  const safeName = escapeEmailHtml(data.name);
  const safeEmail = escapeEmailHtml(data.email);
  const safePhone = escapeEmailHtml(data.phone || 'Not provided');
  const safeCompany = escapeEmailHtml(data.company || 'Not provided');
  const safeSubject = escapeEmailHtml(data.subject);
  const safeMessage = escapeEmailHtml(data.message);
  const timestamp = new Date(data.submittedAt || new Date()).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const whatsappMessage = `Hi ${data.name}, this is Fregoro Studios following up on your message regarding "${data.subject}".`;
  const whatsappUrl = `https://wa.me/${(data.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

  const contentHtml = `
    <div style="margin-bottom: 20px;">
      <span style="display: inline-block; background-color: rgba(59, 94, 255, 0.15); border: 1px solid rgba(59, 94, 255, 0.4); color: #8BA2FF; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
        Source: Contact Us Form
      </span>
      <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #F5F1EA; font-weight: 700;">
        Customer Message Details
      </h2>
    </div>

    <!-- Contact Metadata Table -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #171924; border: 1px solid rgba(245, 241, 234, 0.08); border-radius: 10px; overflow: hidden; margin-bottom: 20px; font-size: 13px;">
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #9E9EA7; width: 30%; font-weight: 600;">Customer Name</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #F5F1EA; font-weight: 700;">${safeName}</td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #9E9EA7; font-weight: 600;">Email Address</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #E5C287; font-weight: 600;">
          <a href="mailto:${safeEmail}" style="color: #E5C287; text-decoration: underline;">${safeEmail}</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #9E9EA7; font-weight: 600;">Phone Number</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #F5F1EA;">
          ${data.phone ? `<a href="tel:${safePhone}" style="color: #F5F1EA; text-decoration: none;">${safePhone}</a>` : safePhone}
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #9E9EA7; font-weight: 600;">Company / Org</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #F5F1EA;">${safeCompany}</td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #9E9EA7; font-weight: 600;">Subject</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #F5F1EA; font-weight: 700;">${safeSubject}</td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; color: #9E9EA7; font-weight: 600;">Submitted At</td>
        <td style="padding: 10px 14px; color: #9E9EA7;">${timestamp}</td>
      </tr>
    </table>

    <!-- Message Content Box -->
    <div style="margin-bottom: 24px;">
      <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #E5C287; letter-spacing: 1px; margin-bottom: 8px;">
        Enquiry Message
      </div>
      <div style="background-color: #171924; border-left: 3px solid #E5C287; border-radius: 4px 8px 8px 4px; padding: 16px; font-size: 14px; line-height: 1.6; color: #F5F1EA; white-space: pre-wrap; font-family: monospace;">
${safeMessage}
      </div>
    </div>

    <!-- Quick Action Bar -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 10px;">
      <tr>
        <td align="center" style="padding-bottom: 10px;">
          <a href="mailto:${safeEmail}?subject=Re: ${encodeURIComponent(data.subject)} — Fregoro Studios" style="display: inline-block; width: 85%; max-width: 280px; background-color: #3B5EFF; color: #FFFFFF; font-weight: 700; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-size: 13px; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">
            Reply to ${safeName} &rarr;
          </a>
        </td>
      </tr>
      ${
        data.phone
          ? `<tr>
              <td align="center">
                <a href="${whatsappUrl}" target="_blank" style="display: inline-block; width: 85%; max-width: 280px; background-color: #25D366; color: #000000; font-weight: 700; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-size: 13px; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">
                  Chat with Customer on WhatsApp
                </a>
              </td>
            </tr>`
          : ''
      }
    </table>
    <p style="text-align: center; font-size: 11px; color: #8E8E93; margin: 12px 0 0 0;">
      Hit &ldquo;Reply&rdquo; in your email client to respond directly to ${safeEmail}.
    </p>
  `;

  const html = renderEmailShell({
    previewText: `New Contact Enquiry from ${data.name}: ${data.subject}`,
    title: 'New Contact Enquiry',
    subtitle: 'Customer Message via Fregoro Website',
    badgeText: 'Fregoro Studios Inbox',
    contentHtml,
  });

  const text = `FREGORO STUDIOS — NEW CONTACT ENQUIRY
==================================================

Customer Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}
Company: ${data.company || 'Not provided'}
Subject: ${data.subject}
Submitted: ${timestamp}
Source: Contact Us Form

MESSAGE:
--------------------------------------------------
${data.message}
--------------------------------------------------

Hit Reply in your email client to respond directly to ${data.email}.
`;

  return {
    html,
    text,
    subject: `New Contact Enquiry — ${data.subject}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CONTACT FORM: CUSTOMER AUTO-REPLY CONFIRMATION
// ─────────────────────────────────────────────────────────────────────────────

export function buildContactCustomerConfirmationEmail(data: ContactEmailPayload): {
  html: string;
  text: string;
  subject: string;
} {
  const safeName = escapeEmailHtml(data.name);
  const whatsappUrl = getEmailWhatsappLink(
    `Hi Fregoro Studios, I submitted a contact enquiry regarding "${data.subject}" and would like to chat with your team.`,
  );

  const contentHtml = `
    <div style="font-size: 15px; color: #F5F1EA; margin-bottom: 20px;">
      Hi <strong>${safeName}</strong>,
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #C7C7CC; margin: 0 0 16px 0;">
      Thanks for reaching out to <strong>Fregoro Studios</strong>.
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #C7C7CC; margin: 0 0 20px 0;">
      We&apos;ve received your message regarding &ldquo;<strong>${escapeEmailHtml(data.subject)}</strong>&rdquo; and our team will review it shortly. We&apos;ll get back to you as soon as possible.
    </p>

    <!-- Message Summary Box -->
    <div style="background-color: #171924; border: 1px solid rgba(245, 241, 234, 0.08); border-radius: 10px; padding: 16px; margin-bottom: 24px;">
      <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #E5C287; letter-spacing: 1px; margin-bottom: 8px;">
        Summary of Your Message
      </div>
      <div style="font-size: 13px; color: #9E9EA7; line-height: 1.6; font-style: italic;">
        &ldquo;${escapeEmailHtml(data.message)}&rdquo;
      </div>
    </div>

    <!-- WhatsApp CTA Card -->
    <div style="background: rgba(37, 211, 102, 0.08); border: 1px solid rgba(37, 211, 102, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 13px; font-weight: 700; color: #25D366; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
        Need a Faster Response?
      </div>
      <p style="font-size: 13px; color: #C7C7CC; margin: 0 0 14px 0; line-height: 1.5;">
        For faster communication or custom requests, chat directly with our studio team on WhatsApp.
      </p>
      <a href="${whatsappUrl}" target="_blank" style="display: inline-block; background-color: #25D366; color: #000000; font-weight: 800; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
        Chat with Fregoro on WhatsApp
      </a>
    </div>

    <p style="font-size: 13px; color: #9E9EA7; line-height: 1.5; margin: 0;">
      Warm regards,<br />
      <strong>The Fregoro Studios Team</strong>
    </p>
  `;

  const html = renderEmailShell({
    previewText: `We received your message at Fregoro Studios. We'll be in touch shortly.`,
    title: 'Message Received',
    subtitle: 'Thank you for reaching out to Fregoro Studios',
    badgeText: 'Message Confirmation',
    contentHtml,
  });

  const text = `FREGORO STUDIOS — WE RECEIVED YOUR MESSAGE
==================================================

Hi ${data.name},

Thanks for reaching out to Fregoro Studios.

We've received your message regarding "${data.subject}" and our team will review it shortly. We'll get back to you as soon as possible.

YOUR MESSAGE:
"${data.message}"

For faster communication, you can also contact us directly on WhatsApp:
${whatsappUrl}

Warm regards,
The Fregoro Studios Team
`;

  return {
    html,
    text,
    subject: 'We received your message — Fregoro Studios',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BULK & CUSTOM ORDER: ADMIN NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

export interface BulkOrderEmailData {
  id: string;
  requestNumber: string;
  orderType: string;
  companyName?: string | null;
  eventName?: string | null;
  contactName: string;
  phone: string;
  email: string;
  estimatedQuantity?: number | null;
  totalQuantity: number;
  requiredDeliveryDate?: string | Date | null;
  eventDate?: string | Date | null;
  isUrgent: boolean;
  websiteOrSocial?: string | null;
  budgetRange?: string | null;
  customerNotes?: string | null;
  shippingMethod?: string | null;
  shippingAddress?: Record<string, unknown> | null;
  packagingPreference?: string | null;
  packagingNotes?: string | null;
  customLabelOption?: string | null;
  customLabelNotes?: string | null;
  contactPreference?: string | null;
  createdAt?: string | Date;
  items?: BulkOrderItemInput[];
  artworks?: BulkOrderArtworkInput[];
}

export function buildBulkOrderAdminEmail(data: BulkOrderEmailData): {
  html: string;
  text: string;
  subject: string;
} {
  const baseUrl = getEmailBaseUrl();
  const safeReqNum = escapeEmailHtml(data.requestNumber);
  const safeContact = escapeEmailHtml(data.contactName);
  const safeEmail = escapeEmailHtml(data.email);
  const safePhone = escapeEmailHtml(data.phone);
  const safeCompany = escapeEmailHtml(data.companyName || 'Not specified');
  const safeOrderType = escapeEmailHtml(data.orderType);
  const safeEvent = escapeEmailHtml(data.eventName || 'Not specified');
  const safeRequiredDate = data.requiredDeliveryDate
    ? new Date(data.requiredDeliveryDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Flexible / Not specified';
  const safeEventDate = data.eventDate
    ? new Date(data.eventDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Not specified';

  const adminUrl = `${baseUrl}/admin/bulk-orders/${encodeURIComponent(data.id || data.requestNumber)}`;
  const cleanPhone = (data.phone || '').replace(/[^0-9]/g, '');
  const whatsappCustomerUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hi ${data.contactName}, this is Fregoro Studios regarding your bulk order request #${data.requestNumber}. We are preparing your quotation.`,
  )}`;

  // Item / Matrix Breakdown HTML
  const itemsHtml = (data.items || [])
    .map((item, idx) => {
      const apparelTitle = escapeEmailHtml(item.apparelType);
      const fabricGsm = [item.fabric, item.gsm].filter(Boolean).join(' · ');
      const printing = item.printingMethod || 'Not Sure';
      const placements = (item.printingPlacements || []).join(', ') || 'front';

      let matrixRows = '';
      if (Array.isArray(item.sizeColorMatrix)) {
        matrixRows = item.sizeColorMatrix
          .map((row) => {
            const sizeTokens = Object.entries(row.quantities || {})
              .filter(([_, q]) => Number(q) > 0)
              .map(([s, q]) => `<strong>${escapeEmailHtml(s)}:</strong> ${q}`)
              .join(' &nbsp;|&nbsp; ');

            return `
              <tr style="border-bottom: 1px solid rgba(245, 241, 234, 0.04);">
                <td style="padding: 8px 10px; color: #F5F1EA; font-weight: 600;">
                  <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${escapeEmailHtml(row.colorHex || '#FFFFFF')}; margin-right: 6px;"></span>
                  ${escapeEmailHtml(row.colorName)}
                </td>
                <td style="padding: 8px 10px; color: #C7C7CC; font-family: monospace; font-size: 12px;">
                  ${sizeTokens || '<span style="color: #71717A;">None</span>'}
                </td>
                <td align="right" style="padding: 8px 10px; color: #E5C287; font-weight: 700; font-family: monospace;">
                  ${row.total} pcs
                </td>
              </tr>
            `;
          })
          .join('');
      }

      return `
        <div style="background-color: #171924; border: 1px solid rgba(245, 241, 234, 0.08); border-radius: 10px; padding: 14px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
            <strong style="color: #F5F1EA; font-size: 15px;">#${idx + 1}. ${apparelTitle}</strong>
            <span style="color: #E5C287; font-weight: 700; font-family: monospace; font-size: 14px;">${item.totalQuantity} Pieces</span>
          </div>
          <div style="font-size: 12px; color: #9E9EA7; margin-bottom: 10px;">
            ✦ Fabric/GSM: ${escapeEmailHtml(fabricGsm || 'Studio Standard')}<br />
            ✦ Printing: ${escapeEmailHtml(printing)} (${escapeEmailHtml(placements)})
          </div>
          ${
            matrixRows
              ? `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 12px; background: rgba(0,0,0,0.25); border-radius: 6px; overflow: hidden;">
                  <thead>
                    <tr style="background: rgba(245, 241, 234, 0.04); color: #9E9EA7; font-size: 10px; text-transform: uppercase;">
                      <th align="left" style="padding: 6px 10px;">Colour</th>
                      <th align="left" style="padding: 6px 10px;">Sizes</th>
                      <th align="right" style="padding: 6px 10px;">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>${matrixRows}</tbody>
                </table>`
              : ''
          }
        </div>
      `;
    })
    .join('');

  // Artwork Gallery HTML
  const artworksHtml =
    (data.artworks || []).length > 0
      ? `<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">` +
        data.artworks
          ?.map(
            (art) => `
          <div style="background-color: #171924; border: 1px solid rgba(245, 241, 234, 0.08); border-radius: 8px; padding: 10px; width: 100%; max-width: 250px; font-size: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 50px; height: 50px; background: #000; border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <img src="${escapeEmailHtml(art.fileUrl)}" alt="${escapeEmailHtml(art.label || 'Artwork')}" width="50" height="50" style="max-height: 50px; max-width: 50px; object-fit: contain;" />
              </div>
              <div style="overflow: hidden;">
                <strong style="color: #F5F1EA; text-transform: uppercase; font-size: 11px; display: block;">${escapeEmailHtml(art.label || art.placement)}</strong>
                <span style="color: #8E8E93; font-size: 10px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeEmailHtml(art.fileName)}</span>
                <span style="color: #9E9EA7; font-size: 10px;">${escapeEmailHtml(art.dimensionsMm || art.printSize || 'Standard')}</span>
                <div style="margin-top: 4px;">
                  <a href="${escapeEmailHtml(art.fileUrl)}" target="_blank" style="color: #3B5EFF; font-weight: 700; text-decoration: none; font-size: 10px;">📥 View / Download &rarr;</a>
                </div>
              </div>
            </div>
          </div>
        `,
          )
          .join('') +
        `</div>`
      : '<p style="color: #8E8E93; font-style: italic; font-size: 13px; margin: 0;">No artwork files uploaded directly. Customer may provide files over WhatsApp.</p>';

  // Address
  const addr = data.shippingAddress;
  const addressString = addr
    ? [
        addr.street,
        [addr.city, addr.state, addr.pincode || addr.zip].filter(Boolean).join(', '),
        addr.country || 'India',
      ]
        .filter(Boolean)
        .join('<br />')
    : 'Self-Pickup or Address Pending';

  const contentHtml = `
    <!-- Top Urgent / Fast Scan Banner -->
    <div style="background: linear-gradient(135deg, rgba(59, 94, 255, 0.2) 0%, rgba(17, 19, 27, 0) 100%); border: 1px solid rgba(59, 94, 255, 0.35); border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td>
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #8BA2FF; letter-spacing: 1.5px; margin-bottom: 4px;">
              ⚡ NEW BULK ORDER REQUEST
            </div>
            <div style="font-size: 20px; font-weight: 800; color: #F5F1EA; font-family: monospace;">
              ${safeReqNum}
            </div>
            <div style="font-size: 13px; color: #C7C7CC; margin-top: 2px;">
              ${safeOrderType} &bull; ${data.totalQuantity} Total Pieces
            </div>
          </td>
          <td align="right" style="vertical-align: top;">
            ${
              data.isUrgent
                ? `<span style="background-color: #EF4444; color: #FFFFFF; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">
                    ⚡ URGENT DELIVERY
                  </span>`
                : `<span style="background-color: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.4); color: #4ADE80; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; text-transform: uppercase;">
                    Standard Timeline
                  </span>`
            }
            <div style="font-size: 12px; color: #E5C287; margin-top: 6px; font-weight: 600;">
              Due: ${safeRequiredDate}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Admin CTA Action Bar -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center" style="padding-bottom: 10px;">
          <a href="${adminUrl}" target="_blank" style="display: inline-block; width: 85%; max-width: 320px; background-color: #3B5EFF; color: #FFFFFF; font-weight: 800; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-size: 13px; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
            Open Bulk Order in Admin &rarr;
          </a>
        </td>
      </tr>
      <tr>
        <td align="center">
          <a href="${whatsappCustomerUrl}" target="_blank" style="display: inline-block; width: 85%; max-width: 320px; background-color: #25D366; color: #000000; font-weight: 800; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
            Talk to Customer on WhatsApp
          </a>
        </td>
      </tr>
    </table>

    <!-- Customer & Order Dossier -->
    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #E5C287; letter-spacing: 1.5px; margin-bottom: 8px;">
      ✦ Customer &amp; Event Dossier
    </div>
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #171924; border: 1px solid rgba(245, 241, 234, 0.08); border-radius: 10px; overflow: hidden; margin-bottom: 24px; font-size: 13px;">
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #9E9EA7; width: 35%; font-weight: 600;">Contact Person</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #F5F1EA; font-weight: 700;">${safeContact}</td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #9E9EA7; font-weight: 600;">Company / Brand</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #F5F1EA;">${safeCompany}</td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #9E9EA7; font-weight: 600;">Email</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #E5C287;">
          <a href="mailto:${safeEmail}" style="color: #E5C287; text-decoration: underline;">${safeEmail}</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #9E9EA7; font-weight: 600;">Phone Number</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #F5F1EA;">
          <a href="tel:${safePhone}" style="color: #F5F1EA; text-decoration: none;">${safePhone}</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #9E9EA7; font-weight: 600;">Contact Preference</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #4ADE80; font-weight: 700; text-transform: uppercase;">
          ${escapeEmailHtml(data.contactPreference || 'WhatsApp')}
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #9E9EA7; font-weight: 600;">Purpose / Event</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); color: #F5F1EA;">${safeEvent} (${safeEventDate})</td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; color: #9E9EA7; font-weight: 600;">Delivery Method</td>
        <td style="padding: 10px 14px; color: #F5F1EA;">
          <strong>${escapeEmailHtml(data.shippingMethod || 'delivery')}</strong><br />
          <span style="font-size: 12px; color: #8E8E93;">${addressString}</span>
        </td>
      </tr>
    </table>

    <!-- Apparel & Quantity Breakdown -->
    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #E5C287; letter-spacing: 1.5px; margin-bottom: 8px;">
      ✦ Apparel Specifications &amp; Size Matrix (${data.totalQuantity} PCS Total)
    </div>
    ${itemsHtml}

    <!-- Artwork Section -->
    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #E5C287; letter-spacing: 1.5px; margin: 20px 0 8px 0;">
      ✦ Customer Uploaded Artwork &amp; Mockups
    </div>
    ${artworksHtml}

    <!-- Packaging & Notes -->
    <div style="margin-top: 24px; background-color: #171924; border: 1px solid rgba(245, 241, 234, 0.08); border-radius: 10px; padding: 14px; font-size: 12px; line-height: 1.6;">
      <div style="font-weight: 700; color: #E5C287; text-transform: uppercase; margin-bottom: 4px;">
        Packaging &amp; Special Instructions
      </div>
      <div style="color: #C7C7CC;">
        <strong>Packaging:</strong> ${escapeEmailHtml(data.packagingPreference || 'Standard Individual Polybag')}<br />
        <strong>Custom Labels:</strong> ${escapeEmailHtml(data.customLabelOption || 'None')}<br />
        ${data.customerNotes ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(245, 241, 234, 0.06);"><strong>Customer Notes:</strong><br />${escapeEmailHtml(data.customerNotes)}</div>` : ''}
      </div>
    </div>
  `;

  const html = renderEmailShell({
    previewText: `New Bulk Order Request #${data.requestNumber} (${data.totalQuantity} pcs) from ${data.contactName}`,
    title: 'Bulk Order Request',
    subtitle: `${data.orderType} · ${data.totalQuantity} Pieces Total`,
    badgeText: `Request #${data.requestNumber}`,
    contentHtml,
  });

  const text = `FREGORO STUDIOS — BULK ORDER REQUEST
==================================================
REQUEST ID: ${data.requestNumber}
STATUS: New Request
TOTAL QUANTITY: ${data.totalQuantity} PCS
REQUIRED DELIVERY DATE: ${safeRequiredDate}
${data.isUrgent ? '*** URGENT DELIVERY REQUEST ***\n' : ''}
CUSTOMER INFORMATION:
--------------------------------------------------
Name: ${data.contactName}
Company: ${data.companyName || 'Not specified'}
Email: ${data.email}
Phone: ${data.phone}
Contact Preference: ${data.contactPreference || 'WhatsApp'}

ORDER INFORMATION:
--------------------------------------------------
Order Type: ${data.orderType}
Event Name: ${data.eventName || 'Not specified'}
Event Date: ${safeEventDate}

APPAREL ITEMS:
--------------------------------------------------
${(data.items || [])
  .map(
    (i, idx) =>
      `Item ${idx + 1}: ${i.apparelType} (${i.totalQuantity} pcs)
Fabric: ${i.fabric || 'Default'} | Print: ${i.printingMethod || 'DTF'}
Sizes: ${JSON.stringify(i.sizeColorMatrix)}`,
  )
  .join('\n\n')}

ARTWORKS:
--------------------------------------------------
${(data.artworks || [])
  .map(
    (a) =>
      `• ${a.label || a.placement}: ${a.fileName} (${a.fileUrl}) [Size: ${a.dimensionsMm || a.printSize || 'Standard'}]`,
  )
  .join('\n')}

DELIVERY:
--------------------------------------------------
Method: ${data.shippingMethod || 'delivery'}
${JSON.stringify(data.shippingAddress || {})}

Open in Admin Panel: ${adminUrl}
Chat with Customer on WhatsApp: ${whatsappCustomerUrl}
`;

  return {
    html,
    text,
    subject: `New Bulk Order Request — ${data.requestNumber}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. BULK & CUSTOM ORDER: CUSTOMER CONFIRMATION
// ─────────────────────────────────────────────────────────────────────────────

export function buildBulkOrderCustomerConfirmationEmail(data: BulkOrderEmailData): {
  html: string;
  text: string;
  subject: string;
} {
  const baseUrl = getEmailBaseUrl();
  const safeName = escapeEmailHtml(data.contactName);
  const safeReqNum = escapeEmailHtml(data.requestNumber);
  const safeOrderType = escapeEmailHtml(data.orderType);
  const safeDate = data.requiredDeliveryDate
    ? new Date(data.requiredDeliveryDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Flexible';

  const viewUrl = `${baseUrl}/bulk-orders/request/${encodeURIComponent(data.id || data.requestNumber)}`;
  const whatsappUrl = getEmailWhatsappLink(
    `Hi Fregoro Studios, I have submitted bulk order request #${data.requestNumber} (${data.totalQuantity} pcs). I'd like to discuss the requirements with your team.`,
  );

  // Apparel items summary list
  const apparelSummary =
    (data.items || []).map((i) => i.apparelType).join(', ') || 'Custom Apparel';
  const coloursSummary =
    Array.from(
      new Set(
        (data.items || []).flatMap((i) =>
          Array.isArray(i.sizeColorMatrix) ? i.sizeColorMatrix.map((r) => r.colorName) : [],
        ),
      ),
    ).join(' + ') || 'Custom Selected';

  const contentHtml = `
    <div style="font-size: 16px; color: #F5F1EA; margin-bottom: 14px;">
      Dear <strong>${safeName}</strong>,
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #C7C7CC; margin: 0 0 20px 0;">
      Thanks, <strong>${safeName}</strong>. We&apos;ve received your bulk custom apparel request. Our production specialists and print engineers are reviewing your specifications and artwork.
    </p>

    <!-- Clean Summary Card -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #171924; border: 1px solid rgba(229, 194, 135, 0.25); border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); width: 40%; font-size: 12px; text-transform: uppercase; color: #9E9EA7; font-weight: 600;">Request Reference</td>
        <td style="padding: 14px 18px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); font-size: 14px; font-weight: 700; color: #E5C287; font-family: monospace;">#${safeReqNum}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); font-size: 12px; text-transform: uppercase; color: #9E9EA7; font-weight: 600;">Order Type</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); font-size: 13px; color: #F5F1EA; font-weight: 600;">${safeOrderType}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); font-size: 12px; text-transform: uppercase; color: #9E9EA7; font-weight: 600;">Apparel</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); font-size: 13px; color: #F5F1EA;">${escapeEmailHtml(apparelSummary)}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); font-size: 12px; text-transform: uppercase; color: #9E9EA7; font-weight: 600;">Colours</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); font-size: 13px; color: #F5F1EA;">${escapeEmailHtml(coloursSummary)}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); font-size: 12px; text-transform: uppercase; color: #9E9EA7; font-weight: 600;">Total Quantity</td>
        <td style="padding: 12px 18px; border-bottom: 1px solid rgba(245, 241, 234, 0.06); font-size: 14px; font-weight: 700; color: #4ADE80; font-family: monospace;">${data.totalQuantity} Pieces</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; font-size: 12px; text-transform: uppercase; color: #9E9EA7; font-weight: 600;">Required Date</td>
        <td style="padding: 12px 18px; font-size: 13px; color: #F5F1EA;">${escapeEmailHtml(safeDate)}</td>
      </tr>
    </table>

    <!-- What Happens Next Timeline -->
    <div style="background-color: #171924; border: 1px solid rgba(245, 241, 234, 0.08); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #E5C287; margin-bottom: 14px;">
        ✦ What Happens Next
      </div>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; line-height: 1.6;">
        <tr>
          <td style="vertical-align: top; width: 28px; padding-bottom: 12px;">
            <div style="width: 20px; height: 20px; border-radius: 50%; background: #3B5EFF; color: #fff; text-align: center; line-height: 20px; font-size: 11px; font-weight: 700;">1</div>
          </td>
          <td style="padding-bottom: 12px; color: #C7C7CC;">
            <strong style="color: #F5F1EA;">Technical Review:</strong> Our team reviews your requirements and checks artwork resolution, print placements, and garment stock.
          </td>
        </tr>
        <tr>
          <td style="vertical-align: top; width: 28px; padding-bottom: 12px;">
            <div style="width: 20px; height: 20px; border-radius: 50%; background: #3B5EFF; color: #fff; text-align: center; line-height: 20px; font-size: 11px; font-weight: 700;">2</div>
          </td>
          <td style="padding-bottom: 12px; color: #C7C7CC;">
            <strong style="color: #F5F1EA;">Digital Proofing &amp; Quote:</strong> We generate an itemized quote with volume discounts, estimated production turnaround, and shipping options.
          </td>
        </tr>
        <tr>
          <td style="vertical-align: top; width: 28px;">
            <div style="width: 20px; height: 20px; border-radius: 50%; background: #3B5EFF; color: #fff; text-align: center; line-height: 20px; font-size: 11px; font-weight: 700;">3</div>
          </td>
          <td style="color: #C7C7CC;">
            <strong style="color: #F5F1EA;">Direct Consultation:</strong> Our team will review your request and get back to you on WhatsApp within 24 hours.
          </td>
        </tr>
      </table>
    </div>

    <!-- Action Buttons -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
      <tr>
        <td align="center" style="padding-bottom: 10px;">
          <a href="${whatsappUrl}" target="_blank" style="display: inline-block; width: 85%; max-width: 320px; background-color: #25D366; color: #000000; font-weight: 800; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-size: 13px; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
            Chat With Us On WhatsApp
          </a>
        </td>
      </tr>
      <tr>
        <td align="center">
          <a href="${viewUrl}" target="_blank" style="display: inline-block; width: 85%; max-width: 320px; background-color: transparent; border: 1px solid rgba(245, 241, 234, 0.25); color: #F5F1EA; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; text-align: center;">
            View Your Request Online &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailShell({
    previewText: `Bulk Order Request Received #${data.requestNumber} — Fregoro Studios`,
    title: 'Request Received',
    subtitle: 'Custom Apparel & Merchandise Production',
    badgeText: `Request #${data.requestNumber}`,
    contentHtml,
  });

  const text = `FREGORO STUDIOS — REQUEST RECEIVED
==================================================

Thanks, ${data.contactName}. We've received your bulk custom apparel request.

SUMMARY:
--------------------------------------------------
Request ID: #${data.requestNumber}
Order Type: ${data.orderType}
Apparel: ${apparelSummary}
Colours: ${coloursSummary}
Total Quantity: ${data.totalQuantity} Pieces
Required Date: ${safeDate}

WHAT HAPPENS NEXT:
1. Our team reviews your requirements.
2. We'll check artwork, garment availability and production requirements.
3. We'll contact you with pricing and any questions.

Our team will review your request and get back to you on WhatsApp within 24 hours.

Chat with us on WhatsApp:
${whatsappUrl}

View your request online:
${viewUrl}

Warm regards,
The Fregoro Studios Team
`;

  return {
    html,
    text,
    subject: `Bulk Order Request Received — Fregoro Studios #${data.requestNumber}`,
  };
}
