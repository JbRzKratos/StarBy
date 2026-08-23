import { NextResponse } from 'next/server';
import { CheckoutSchema } from '@/lib/validations/schemas';
import { rateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { Prisma } from '@prisma/client';
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from '@/lib/email';
import { createCashfreeOrder, generatePublicOrderId, getCashfreeEnvironment } from '@/lib/cashfree';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Get the site URL for Cashfree return_url dynamically from the request or env */
function getSiteUrl(req?: Request): string {
  if (req) {
    const origin = req.headers.get('origin');
    if (origin) return origin.replace(/\/$/, '');
    const host = req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    if (host) return `${proto}://${host}`.replace(/\/$/, '');
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting
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

    // 3. Get Authenticated User & Ensure User exists in DB
    let userId: string | null = null;
    let userEmail: string | undefined;
    let userName: string | undefined;

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userEmail = user.email || `${user.id}@guest.local`;
        userName =
          user.user_metadata?.name || user.user_metadata?.full_name || userEmail.split('@')[0];

        const dbUser = await prisma.user.upsert({
          where: { id: user.id },
          update: {
            email: userEmail,
            fullName: userName || null,
          },
          create: {
            id: user.id,
            email: userEmail,
            fullName: userName || null,
          },
        });
        userId = dbUser.id;
      }
    } catch (authErr) {
      console.warn('Auth user sync notice:', authErr);
      userId = null;
    }

    // 4. ──── SECURITY FIX: Server-side price recalculation ────
    // NEVER trust client-sent prices. Fetch real prices from DB.
    const productIds = Array.from(new Set(items.map((i) => i.productId)));
    const variantIds = Array.from(
      new Set(items.map((i) => i.variantId).filter((v) => v && v !== 'default')),
    );

    const [dbProducts, dbVariants] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, basePrice: true, customizable: true },
      }),
      variantIds.length > 0
        ? prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            select: {
              id: true,
              productId: true,
              price: true,
              inStock: true,
              stockQuantity: true,
              name: true,
            },
          })
        : Promise.resolve([]),
    ]);

    // Build lookup maps
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    const variantMap = new Map(dbVariants.map((v) => [v.id, v]));

    // 5. ──── Validate products, variants, stock ────
    let subtotal = 0;
    const validatedItems: Array<{
      productId: string;
      variantId: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      size: string | null;
      customization: unknown;
      productNameSnapshot: string;
      skuSnapshot: string | null;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, message: `Product "${item.productId}" not found.` },
          { status: 400 },
        );
      }

      let unitPrice = product.basePrice;
      let skuSnapshot: string | null = null;

      if (item.variantId && item.variantId !== 'default') {
        const variant = variantMap.get(item.variantId);
        if (!variant) {
          return NextResponse.json(
            { success: false, message: `Variant "${item.variantId}" not found.` },
            { status: 400 },
          );
        }
        if (!variant.inStock) {
          return NextResponse.json(
            {
              success: false,
              message: `"${product.name} — ${variant.name}" is currently out of stock.`,
            },
            { status: 409 },
          );
        }
        // If finite inventory is tracked (> 0) and product is not made-to-order
        if (
          !product.customizable &&
          variant.stockQuantity > 0 &&
          variant.stockQuantity < item.quantity
        ) {
          return NextResponse.json(
            {
              success: false,
              message: `Only ${variant.stockQuantity} of "${product.name} — ${variant.name}" available. You requested ${item.quantity}.`,
            },
            { status: 409 },
          );
        }
        unitPrice = variant.price;
        skuSnapshot = variant.id; // Use variant ID as SKU for now
      }

      const totalItemPrice = unitPrice * item.quantity;
      subtotal += totalItemPrice;

      validatedItems.push({
        productId: item.productId,
        variantId: item.variantId || 'default',
        quantity: item.quantity,
        unitPrice,
        totalPrice: totalItemPrice,
        size: item.size || null,
        customization: item.customization || null,
        productNameSnapshot: product.name,
        skuSnapshot,
      });
    }

    // 6. ──── Apply coupon (with per-customer limit check) ────
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (coupon && coupon.isActive) {
        if (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date()) {
          if (!coupon.maxUses || coupon.usageCount < coupon.maxUses) {
            // Per-customer limit check
            if (coupon.perCustomerLimit && userId) {
              const userCouponUses = await prisma.order.count({
                where: {
                  userId,
                  couponCode: couponCode.toUpperCase(),
                  paymentStatus: { in: ['paid', 'pending'] },
                },
              });
              if (userCouponUses >= coupon.perCustomerLimit) {
                return NextResponse.json(
                  {
                    success: false,
                    message: 'You have already used this coupon the maximum number of times.',
                  },
                  { status: 400 },
                );
              }
            }

            if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
              return NextResponse.json(
                {
                  success: false,
                  message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon.`,
                },
                { status: 400 },
              );
            }

            if (coupon.discountType === 'percentage') {
              discountAmount = subtotal * (coupon.discountValue / 100);
            } else if (coupon.discountType === 'flat') {
              discountAmount = coupon.discountValue;
            }
          }
        }
      }
    }

    // 7. ──── Calculate final amount ────
    // TODO: Implement shipping zone-based calculation when needed
    const shippingFee = 0;
    const tax = 0;
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee + tax);

    // 8. ──── Generate IDs ────
    const publicOrderId = generatePublicOrderId();
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);

    const isCod = paymentMethod === 'cod';

    // 9. ──── Handle Cashfree payment order creation ────
    let paymentGatewayOrderId: string | null = null;
    let paymentSessionId: string | null = null;

    if (!isCod) {
      try {
        // Create unique Cashfree order ID based on public order ID
        const cfOrderId = publicOrderId.replace(/[^a-zA-Z0-9_-]/g, '_');

        // Clean phone number for Cashfree API (Cashfree requires standard 10-digit Indian phone)
        const rawPhone = (address.phone || '').replace(/[^0-9]/g, '');
        let cleanPhone = '9999999999';
        if (rawPhone.length === 10) {
          cleanPhone = rawPhone;
        } else if (rawPhone.length === 12 && rawPhone.startsWith('91')) {
          cleanPhone = rawPhone.slice(2);
        } else if (rawPhone.length >= 10) {
          cleanPhone = rawPhone.slice(-10);
        }

        const cfOrder = await createCashfreeOrder({
          order_id: cfOrderId,
          order_amount: Math.round(totalAmount * 100) / 100, // Cashfree expects amount in rupees, not paise
          order_currency: 'INR',
          customer_details: {
            customer_id: userId || `guest_${Date.now()}`,
            customer_name: address.name || 'Valued Customer',
            customer_email: address.email,
            customer_phone: cleanPhone,
          },
          order_meta: {
            return_url: `${getSiteUrl(request)}/payment/status?order_id=${cfOrderId}`,
            notify_url: `${getSiteUrl(request)}/api/webhooks/cashfree`,
          },
          order_note: `StarBy Order ${publicOrderId}`,
        });

        paymentGatewayOrderId = cfOrder.cf_order_id.toString();
        paymentSessionId = cfOrder.payment_session_id;
      } catch (err) {
        console.error(
          'Cashfree order creation failed:',
          err instanceof Error ? err.message : String(err),
        );

        let errorMsg = 'Payment gateway error. Please try again or contact support.';
        if (err instanceof Error && err.message) {
          try {
            const jsonStart = err.message.indexOf('{');
            if (jsonStart !== -1) {
              const parsed = JSON.parse(err.message.slice(jsonStart));
              if (parsed.message) errorMsg = parsed.message;
            }
          } catch {}
        }

        return NextResponse.json(
          {
            success: false,
            message: errorMsg,
          },
          { status: 500 },
        );
      }
    }

    // 10. ──── Save Order to Database ────
    const createOrderData = (targetUserId: string | null) => ({
      publicOrderId,
      userId: targetUserId,
      subtotal,
      discount: discountAmount,
      shippingFee,
      tax,
      total: totalAmount,
      currency: 'INR',
      status: isCod ? 'placed' : 'pending_payment',
      paymentStatus: isCod ? 'pending' : 'pending',
      paymentProvider: isCod ? 'cod' : 'cashfree',
      paymentGatewayOrderId: isCod
        ? null
        : paymentGatewayOrderId || publicOrderId.replace(/[^a-zA-Z0-9_-]/g, '_'),
      shippingAddress: address as unknown as Prisma.InputJsonValue,
      couponCode: couponCode?.toUpperCase() || null,
      estimatedDeliveryDate,
      items: {
        create: validatedItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          productNameSnapshot: item.productNameSnapshot,
          skuSnapshot: item.skuSnapshot,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          size: item.size,
          customization: item.customization
            ? (item.customization as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        })),
      },
      statusHistory: {
        create: {
          oldStatus: null,
          newStatus: isCod ? 'placed' : 'pending_payment',
          changedBy: 'system',
          note: isCod ? 'COD order placed' : 'Online payment order created',
        },
      },
    });

    let orderId: string;
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

    // 11. ──── COD post-order side effects ────
    if (isCod) {
      // Decrement stock
      for (const item of validatedItems) {
        if (item.variantId && item.variantId !== 'default') {
          await prisma.productVariant.updateMany({
            where: { id: item.variantId, stockQuantity: { gt: 0 } },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        }
      }

      // Increment coupon usage
      if (couponCode) {
        await prisma.coupon.update({
          where: { code: couponCode.toUpperCase() },
          data: { usageCount: { increment: 1 } },
        });
      }

      // Send confirmation email for COD orders
      const orderAddress = address as Record<string, string> | null;
      if (orderAddress && orderAddress.email) {
        await sendOrderConfirmationEmail(
          orderAddress.email,
          publicOrderId,
          orderAddress.name || 'Customer',
          totalAmount,
        );
      }

      // Notify admin
      await sendAdminNewOrderEmail(publicOrderId, totalAmount);
    }

    // 12. ──── Return response ────
    return NextResponse.json({
      success: true,
      message: 'Order initiated',
      orderId,
      publicOrderId,
      paymentSessionId, // Cashfree payment session ID for frontend SDK
      cashfreeOrderId: isCod ? null : publicOrderId.replace(/[^a-zA-Z0-9_-]/g, '_'),
      cashfreeEnvironment: getCashfreeEnvironment(),
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
