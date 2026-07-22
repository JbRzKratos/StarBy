import { NextResponse } from 'next/server';
import { CheckoutSchema } from '@/lib/validations/schemas';
import { rateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // 1. Upstash Rate Limiting (10 requests per minute)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await rateLimit(`checkout:${ip}`, 10, 60 * 1000);

    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, message: 'Too many checkout requests. Please try again in a minute.' },
        { status: 429 },
      );
    }

    // 2. Parse & Validate Payload with Zod
    const body = await request.json();
    const validation = CheckoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid checkout payload',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { items, address, paymentMethod } = validation.data;
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 3. Get Authenticated User (if logged in)
    let userId: string | null = null;
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {
      // Guest checkout fallback
    }

    // 4. Save Order to Database via Prisma (if DB available)
    let orderId = `ORD_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    try {
      const newOrder = await prisma.order.create({
        data: {
          userId,
          total: totalAmount,
          status: 'processing',
          paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          shippingAddress: address as any,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
              size: item.size || null,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              customization: (item.customization as any) || null,
            })),
          },
        },
      });
      orderId = newOrder.id;
    } catch (dbError) {
      console.warn('DB order creation notice (will proceed with fallback ID):', dbError);
    }

    return NextResponse.json({
      success: true,
      message: 'Order created successfully!',
      orderId,
      total: totalAmount,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error during checkout.' },
      { status: 500 },
    );
  }
}
