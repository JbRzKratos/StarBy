import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { sendContactEmail, sendContactAutoReply } from '@/lib/email';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
  // honeypot — bots fill this, humans leave it empty
  website: z.string().max(0).optional(),
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
    // Rate limiting by IP
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a minute and try again.' },
        { status: 429 },
      );
    }

    const body = await request.json();

    // Honeypot check — spambots fill hidden fields
    if (body.website && body.website.length > 0) {
      // Silent 200 to not tip off bots
      return NextResponse.json({ success: true });
    }

    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: result.error.issues },
        { status: 400 },
      );
    }

    const { name, email, subject, message } = result.data;

    // Send message to StarBy inbox
    const sent = await sendContactEmail(name, email, subject, message);

    if (!sent) {
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
          { success: false, error: 'Failed to send email. Please try again later.' },
          { status: 500 },
        );
      }
    }

    // Send auto-reply to customer (fire-and-forget — don't fail the request if it errors)
    sendContactAutoReply(email, name).catch((err) =>
      console.error('Auto-reply send error (non-fatal):', err),
    );

    return NextResponse.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
