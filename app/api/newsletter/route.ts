import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const NewsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rate = await rateLimit(`newsletter:${ip}`, 5, 60 * 1000);
    if (!rate.success) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please wait a moment.' },
        { status: 429 },
      );
    }

    const body = await req.json();
    const { email } = NewsletterSchema.parse(body);

    // Try to create the subscriber. If they exist, prisma will throw a unique constraint error
    await prisma.newsletterSubscriber.create({
      data: {
        email,
      },
    });

    return NextResponse.json({ success: true, message: 'Successfully subscribed!' });
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'This email is already subscribed.' },
        { status: 400 },
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues?.[0]?.message || 'Validation failed.' },
        { status: 400 },
      );
    }
    return NextResponse.json({ success: false, message: 'Something went wrong.' }, { status: 500 });
  }
}
