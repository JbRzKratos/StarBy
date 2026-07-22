import { NextResponse } from 'next/server';
import { CheckoutSchema } from '@/lib/validations/schemas';
import { rateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { Prisma } from '@prisma/client';



// Create a Razorpay order using their REST API directly (no Node.js SDK needed)
async function createRazorpayOrder(amountInPaise: number, receipt: string) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured');
  }

  const credentials = btoa(`${keyId}:${keySecret}`);

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Razorpay API error ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<{ id: string }>;
}

export async function POST(request: Request) {
  try {
    // 1. Upstash Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await rateLimit(`checkout:${ip}`, 10, 60 * 1000);

    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, message: 'Too many checkout requests. Please try again in a minute.' },
        { status: 429 },
      );
    }

    // 2. Parse & Validate Payload
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

    const { items, address, paymentMethod, couponCode } = validation.data;
    let totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discountAmount = 0;

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (coupon && coupon.isActive) {
        if (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date()) {
          if (!coupon.maxUses || coupon.usageCount < coupon.maxUses) {
            if (coupon.discountType === 'percentage') {
              discountAmount = totalAmount * (coupon.discountValue / 100);
            } else if (coupon.discountType === 'flat') {
              discountAmount = coupon.discountValue;
            }
            totalAmount = Math.max(0, totalAmount - discountAmount);
          }
        }
      }
    }

    // 3. Get Authenticated User & Ensure User exists in DB
    let userId: string | null = null;
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const userEmail = user.email || `${user.id}@guest.local`;
        const userName =
          user.user_metadata?.name || user.user_metadata?.full_name || userEmail.split('@')[0];

        const dbUser = await prisma.user.upsert({
          where: { id: user.id },
          update: {
            email: userEmail,
            fullName: userName,
          },
          create: {
            id: user.id,
            email: userEmail,
            fullName: userName,
          },
        });
        userId = dbUser.id;
      }
    } catch (authErr) {
      console.warn('Auth user sync notice:', authErr);
      userId = null;
    }

    // Calculate Estimated Delivery Date (5 days from now)
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);

    // 4. Handle Razorpay vs COD
    const isCod = paymentMethod === 'cod';
    let razorpayOrderId: string | null = null;

    if (!isCod) {
      try {
        const rzpOrder = await createRazorpayOrder(
          Math.round(totalAmount * 100),
          `rcpt_${Date.now()}`,
        );
        razorpayOrderId = rzpOrder.id;
      } catch (err) {
        console.error(
          'Razorpay order creation failed:',
          err instanceof Error ? err.message : String(err),
        );
        return NextResponse.json(
          {
            success: false,
            message:
              'Payment gateway error (Check Cloudflare Environment Variables). Please try again.',
          },
          { status: 500 },
        );
      }
    }

    // 5. Save Order
    let orderId = `ORD_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const createOrderData = (targetUserId: string | null) => ({
      userId: targetUserId,
      total: totalAmount,
      status: isCod ? 'placed' : 'pending_payment',
      paymentStatus: isCod ? 'pending' : 'pending',
      shippingAddress: address as unknown as Prisma.InputJsonValue,
      razorpayOrderId,
      couponCode: couponCode || null,
      discount: discountAmount,
      estimatedDeliveryDate,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || 'default',
          quantity: item.quantity,
          price: item.price,
          size: item.size || null,
          customization: item.customization
            ? (item.customization as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        })),
      },
    });

    try {
      const newOrder = await prisma.order.create({
        data: createOrderData(userId),
      });
      orderId = newOrder.id;
    } catch (dbError) {
      console.warn('DB order creation notice (retrying without userId constraint):', dbError);
      try {
        const fallbackOrder = await prisma.order.create({
          data: createOrderData(null),
        });
        orderId = fallbackOrder.id;
      } catch (fallbackError) {
        console.error('Final DB order creation error:', fallbackError);
        return NextResponse.json(
          { success: false, message: 'Failed to create order in database.' },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order initiated',
      orderId,
      razorpayOrderId,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: totalAmount,
      isCod,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error during checkout.' },
      { status: 500 },
    );
  }
}
