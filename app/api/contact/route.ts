import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { sendContactSubmission } from '@/lib/email/emailService';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().optional().or(z.literal('')),
  company: z.string().trim().optional().or(z.literal('')),
  subject: z.string().trim().min(1, 'Subject is required'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters long'),
  // Honeypot field — bots fill this, humans leave it empty
  website: z.string().max(0, 'Spam detected').optional().or(z.literal('')),
});

// Simple in-memory rate limit: max 5 submissions per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  if (record.count >= 5) return true;

  record.count++;
  return false;
}

export async function POST(request: Request) {
  try {
    // 1. Rate limiting by IP
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a minute and try again.' },
        { status: 429 },
      );
    }

    const body = await request.json();

    // 2. Honeypot check — spambots fill hidden fields
    if (body.website && String(body.website).trim().length > 0) {
      // Silent 200 to discard bot submissions without alerting them
      console.warn('[Contact API] Bot honeypot triggered by IP:', ip);
      return NextResponse.json({ success: true, message: 'Message sent successfully' });
    }

    // 3. Schema validation
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || 'Invalid form input',
          details: result.error.issues,
        },
        { status: 400 },
      );
    }

    const { name, email, phone, company, subject, message } = result.data;

    // 4. Persist contact submission in database first so customer enquiries are never lost
    let submission = null;
    try {
      submission = await prisma.contactSubmission.create({
        data: {
          name,
          email,
          phone: phone || null,
          company: company || null,
          subject,
          message,
          status: 'new',
          emailStatus: 'pending',
        },
      });
    } catch (dbError) {
      console.error('[Contact API] Database error storing contact submission:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to record your message. Please try again.' },
        { status: 500 },
      );
    }

    // 5. Send emails via central email service
    // Sends Admin notification to fregorostudios@gmail.com with Reply-To set to the customer
    // Sends Automated confirmation to the customer with direct WhatsApp link
    let emailResult = null;
    try {
      emailResult = await sendContactSubmission(
        {
          name,
          email,
          phone,
          company,
          subject,
          message,
          submittedAt: submission.createdAt,
        },
        submission.id,
      );

      // Update delivery status in database
      await prisma.contactSubmission
        .update({
          where: { id: submission.id },
          data: {
            emailStatus: emailResult.adminEmailSent ? 'sent' : 'failed',
            emailError: emailResult.errors.length > 0 ? emailResult.errors.join(' | ') : null,
          },
        })
        .catch((err) =>
          console.warn('[Contact API] Failed to update submission emailStatus:', err),
        );
    } catch (emailErr) {
      console.error('[Contact API] Email service error:', emailErr);
      await prisma.contactSubmission
        .update({
          where: { id: submission.id },
          data: {
            emailStatus: 'failed',
            emailError: emailErr instanceof Error ? emailErr.message : String(emailErr),
          },
        })
        .catch(() => {});
    }

    // 6. Return successful response to customer
    // The enquiry is safely recorded in the database, even if email delivery is delayed
    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully.',
      submissionId: submission.id,
      emailDelivered: Boolean(emailResult?.adminEmailSent),
    });
  } catch (error) {
    console.error('[Contact API] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error. Please try again later.' },
      { status: 500 },
    );
  }
}
