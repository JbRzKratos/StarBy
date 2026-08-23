import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCashfreeOrderStatus } from '@/lib/cashfree';
import { dispatchNotification } from '@/lib/notifications';

/**
 * POST /api/verify-payment
 *
 * Called by the frontend after the Cashfree checkout flow completes.
 * The frontend sends the cashfreeOrderId; we verify the payment status
 * by calling the Cashfree GET /orders/:orderId API server-side.
 *
 * We NEVER trust the client's claim that payment succeeded.
 * The webhook (POST /api/webhooks/cashfree) is the primary source of truth;
 * this endpoint acts as a fast-path so the user doesn't wait for the webhook.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cashfreeOrderId } = body;

    if (!cashfreeOrderId || typeof cashfreeOrderId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid cashfreeOrderId' },
        { status: 400 },
      );
    }

    // 1. Look up internal order
    const order = await prisma.order.findFirst({
      where: { paymentGatewayOrderId: cashfreeOrderId },
      include: { items: true, user: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // 2. If already paid, return success immediately (idempotent)
    if (order.paymentStatus === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        orderId: order.id,
        publicOrderId: order.publicOrderId,
        status: 'paid',
      });
    }

    // 3. Verify payment status via Cashfree API (server-to-server)
    let cfStatus;
    try {
      cfStatus = await getCashfreeOrderStatus(cashfreeOrderId);
    } catch (err) {
      console.error('Cashfree status check failed:', err);
      return NextResponse.json(
        {
          success: false,
          message:
            'Unable to verify payment status. The webhook will update your order automatically.',
          orderId: order.id,
          publicOrderId: order.publicOrderId,
          status: 'pending',
        },
        { status: 202 },
      );
    }

    // 4. Handle Cashfree order status
    if (cfStatus.order_status === 'PAID') {
      // Mark as paid
      await prisma.$transaction(async (tx) => {
        // Update order
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'paid',
            paymentGatewayPaymentId: cfStatus.cf_order_id?.toString() || null,
            status: 'placed',
          },
        });

        // Record status history
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            oldStatus: order.status,
            newStatus: 'placed',
            changedBy: 'system',
            note: 'Payment verified via Cashfree API (client verification)',
          },
        });

        // Decrement stock for each item
        for (const item of order.items) {
          if (item.variantId && item.variantId !== 'default') {
            await tx.productVariant.updateMany({
              where: { id: item.variantId, stockQuantity: { gt: 0 } },
              data: { stockQuantity: { decrement: item.quantity } },
            });
          }
        }

        // Increment coupon usage
        if (order.couponCode) {
          await tx.coupon.update({
            where: { code: order.couponCode },
            data: { usageCount: { increment: 1 } },
          });
        }
      });

      // Send confirmation notifications (outside transaction, non-blocking)
      try {
        const address = order.shippingAddress as Record<string, string> | null;
        await dispatchNotification('PAYMENT_CONFIRMED', {
          orderId: order.id,
          publicOrderId: order.publicOrderId || undefined,
          customerName: address?.name || order.user?.fullName || 'Valued Customer',
          customerEmail: address?.email || order.user?.email || undefined,
          customerPhone: address?.phone || order.user?.phone || undefined,
          total: order.total,
        });
      } catch (notifErr) {
        console.warn('Notification dispatch error (non-critical):', notifErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        orderId: order.id,
        publicOrderId: order.publicOrderId,
        status: 'paid',
      });
    } else if (cfStatus.order_status === 'ACTIVE') {
      // Payment is still pending
      return NextResponse.json({
        success: true,
        message: 'Payment is being processed',
        orderId: order.id,
        publicOrderId: order.publicOrderId,
        status: 'pending',
      });
    } else {
      // EXPIRED or TERMINATED
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'failed',
          status: 'cancelled',
        },
      });

      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          oldStatus: order.status,
          newStatus: 'cancelled',
          changedBy: 'system',
          note: `Payment ${cfStatus.order_status.toLowerCase()} via Cashfree`,
        },
      });

      return NextResponse.json({
        success: false,
        message: 'Payment failed or expired. Please try again.',
        orderId: order.id,
        publicOrderId: order.publicOrderId,
        status: 'failed',
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error during payment verification' },
      { status: 500 },
    );
  }
}
