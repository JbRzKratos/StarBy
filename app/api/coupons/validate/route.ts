import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rate = await rateLimit(`coupon:${ip}`, 20, 60 * 1000);
    if (!rate.success) {
      return NextResponse.json(
        { valid: false, message: 'Too many attempts. Please wait a moment.' },
        { status: 429 },
      );
    }

    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, message: 'Invalid coupon code' }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, message: 'Coupon not found' }, { status: 404 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ valid: false, message: 'Coupon is inactive' }, { status: 400 });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, message: 'Coupon has expired' }, { status: 400 });
    }

    if (coupon.maxUses && coupon.usageCount >= coupon.maxUses) {
      return NextResponse.json(
        { valid: false, message: 'Coupon usage limit reached' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      valid: true,
      message: 'Coupon applied successfully',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ valid: false, message: 'Internal server error' }, { status: 500 });
  }
}
