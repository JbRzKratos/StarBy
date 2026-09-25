import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCashfreeOrderStatus, getCashfreeOrderPayments } from '@/lib/cashfree';
import { dispatchNotification } from '@/lib/notifications';

/**
 * POST /api/verify-payment
 *
 * Called by the frontend after the Cashfree checkout flow completes.
 * The frontend sends the cashfreeOrderId; we verify the payment status
 * by inspecting Cashfree order status and payment attempts server-side.
 *
 * We NEVER trust the client's claim that payment succeeded.
 * The webhook (POST /api/webhooks/cashfree) is the primary source of truth;
 * this endpoint acts as a fast-path so the user doesn't wait for the webhook.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cashfreeOrderId, attempt = 0 } = body;

    if (!cashfreeOrderId || typeof cashfreeOrderId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid cashfreeOrderId' },
        { status: 400 },
      );
    }

    // 1. Look up internal order (by paymentGatewayOrderId, publicOrderId, or internal id)
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { paymentGatewayOrderId: cashfreeOrderId },
          { publicOrderId: cashfreeOrderId },
          { id: cashfreeOrderId },
        ],
      },
      include: {
        items: {
          include: {
            orderCustomization: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // 2. If already marked paid in DB, return success immediately (idempotent)
    if (order.paymentStatus === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        orderId: order.id,
        publicOrderId: order.publicOrderId,
        amount: order.total,
        status: 'paid',
      });
    }

    // If order was already marked failed / cancelled in DB by webhook
    if (order.paymentStatus === 'failed' || order.status === 'cancelled') {
      return NextResponse.json({
        success: false,
        message: 'Payment was cancelled or could not be completed.',
        orderId: order.id,
        publicOrderId: order.publicOrderId,
        status: 'failed',
        failureType: 'cancelled',
      });
    }

    // 3. Verify payment status via Cashfree APIs (order status + payment attempts)
    const lookupOrderId = order.paymentGatewayOrderId || order.publicOrderId || cashfreeOrderId;

    const [cfStatusResult, paymentsResult] = await Promise.allSettled([
      getCashfreeOrderStatus(lookupOrderId),
      getCashfreeOrderPayments(lookupOrderId),
    ]);

    const cfStatus = cfStatusResult.status === 'fulfilled' ? cfStatusResult.value : null;
    const payments = paymentsResult.status === 'fulfilled' ? paymentsResult.value : [];

    // Helper to safely mark order as cancelled if unpaid
    const cancelOrderIfUnpaid = async (note: string) => {
      try {
        const fresh = await prisma.order.findUnique({
          where: { id: order.id },
          select: { paymentStatus: true, status: true },
        });
        if (fresh && fresh.paymentStatus !== 'paid') {
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
              oldStatus: fresh.status,
              newStatus: 'cancelled',
              changedBy: 'system',
              note,
            },
          });
        }
      } catch (err) {
        console.error('Failed to mark order as cancelled:', err);
      }
    };

    // 4. Check if payment succeeded
    const isPaidInOrder = cfStatus?.order_status === 'PAID';
    const successfulPayment = payments.find((p) => p.payment_status === 'SUCCESS');

    if (isPaidInOrder || successfulPayment) {
      const paymentId =
        successfulPayment?.cf_payment_id?.toString() || cfStatus?.cf_order_id?.toString() || null;

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'paid',
            paymentGatewayPaymentId: paymentId,
            status: 'placed',
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            oldStatus: order.status,
            newStatus: 'placed',
            changedBy: 'system',
            note: 'Payment verified via Cashfree API (client verification)',
          },
        });

        for (const item of order.items) {
          if (item.variantId && item.variantId !== 'default') {
            await tx.productVariant.updateMany({
              where: { id: item.variantId, stockQuantity: { gt: 0 } },
              data: { stockQuantity: { decrement: item.quantity } },
            });
          }
        }

        if (order.couponCode) {
          await tx.coupon.update({
            where: { code: order.couponCode },
            data: { usageCount: { increment: 1 } },
          });
        }
      });

      // Send confirmation notifications (outside transaction, non-blocking)
      try {
        const address = (order.shippingAddress as Record<string, string | undefined>) || {};
        const mappedItems = order.items.map((item) => ({
          id: item.id,
          name: item.productNameSnapshot || `Product #${item.productId}`,
          variant: item.variantId,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.unitPrice ?? (item.totalPrice ? item.totalPrice / item.quantity : 0),
          totalPrice: item.totalPrice,
          customization: item.customization as Record<string, unknown> | null,
          previewUrl: item.orderCustomization?.previewFileUrl || null,
          designFileUrl: item.orderCustomization?.designFileUrl || null,
        }));

        await dispatchNotification('PAYMENT_CONFIRMED', {
          orderId: order.id,
          publicOrderId: order.publicOrderId || undefined,
          customerName: address.name || order.user?.fullName || 'Valued Customer',
          customerEmail: address.email || order.user?.email || undefined,
          customerPhone: address.phone || order.user?.phone || undefined,
          total: order.total,
          subtotal: order.subtotal,
          shippingFee: order.shippingFee,
          discount: order.discount,
          couponCode: order.couponCode,
          paymentMethod: order.paymentProvider || 'Cashfree',
          paymentGatewayPaymentId: paymentId || undefined,
          paymentStatus: 'paid',
          shippingAddress: address,
          items: mappedItems,
          createdAt: order.createdAt,
        });
      } catch (notifErr) {
        console.warn('Notification dispatch error (non-critical):', notifErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        orderId: order.id,
        publicOrderId: order.publicOrderId,
        amount: order.total,
        status: 'paid',
      });
    }

    // 5. Inspect specific payment attempts from Cashfree
    const latestPayment = payments.length > 0 ? payments[payments.length - 1] : null;

    if (latestPayment) {
      if (latestPayment.payment_status === 'USER_DROPPED') {
        await cancelOrderIfUnpaid('User cancelled payment during checkout');
        return NextResponse.json({
          success: false,
          status: 'failed',
          failureType: 'cancelled',
          message: 'Payment was cancelled. No amount was debited from your account.',
          orderId: order.id,
          publicOrderId: order.publicOrderId,
        });
      }

      if (latestPayment.payment_status === 'CANCELLED') {
        await cancelOrderIfUnpaid('Payment was cancelled');
        return NextResponse.json({
          success: false,
          status: 'failed',
          failureType: 'cancelled',
          message:
            'Payment was cancelled. If any amount was debited, it will be refunded automatically within 3-5 business days.',
          orderId: order.id,
          publicOrderId: order.publicOrderId,
        });
      }

      if (latestPayment.payment_status === 'FAILED' || latestPayment.payment_status === 'VOID') {
        const failureReason =
          latestPayment.error_details?.error_description ||
          latestPayment.payment_message ||
          'Payment attempt failed or was declined by your bank/UPI provider.';

        await cancelOrderIfUnpaid(`Payment failed: ${failureReason}`);
        return NextResponse.json({
          success: false,
          status: 'failed',
          failureType: 'declined',
          message: failureReason,
          orderId: order.id,
          publicOrderId: order.publicOrderId,
        });
      }

      if (latestPayment.payment_status === 'PENDING') {
        return NextResponse.json({
          success: true,
          status: 'pending',
          message: 'Payment is awaiting confirmation from your bank or UPI provider.',
          orderId: order.id,
          publicOrderId: order.publicOrderId,
        });
      }
    }

    // 6. Check overall Cashfree order status
    if (cfStatus && cfStatus.order_status !== 'ACTIVE' && cfStatus.order_status !== 'PAID') {
      await cancelOrderIfUnpaid(`Cashfree order ${cfStatus.order_status.toLowerCase()}`);
      return NextResponse.json({
        success: false,
        status: 'failed',
        failureType: 'expired',
        message: 'Payment session expired or was terminated. Please retry checkout.',
        orderId: order.id,
        publicOrderId: order.publicOrderId,
      });
    }

    // 7. Cashfree order is ACTIVE but no payment was completed (customer returned without paying)
    if (attempt >= 1) {
      await cancelOrderIfUnpaid('No payment completed; customer exited checkout');
      return NextResponse.json({
        success: false,
        status: 'failed',
        failureType: 'cancelled',
        message: 'No payment was completed. The checkout session was cancelled or closed.',
        orderId: order.id,
        publicOrderId: order.publicOrderId,
      });
    }

    // For attempt === 0, give Cashfree 1 brief poll opportunity (in case of slight network latency)
    return NextResponse.json({
      success: true,
      status: 'pending',
      isAwaitingPayment: true,
      message: 'Checking for payment confirmation...',
      orderId: order.id,
      publicOrderId: order.publicOrderId,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error during payment verification' },
      { status: 500 },
    );
  }
}
