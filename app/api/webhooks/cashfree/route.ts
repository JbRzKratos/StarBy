import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCashfreeWebhookSignature } from '@/lib/cashfree';
import { dispatchNotification } from '@/lib/notifications';

/**
 * POST /api/webhooks/cashfree
 *
 * This is the PRIMARY source of truth for payment status.
 * It is called by Cashfree's servers and must be idempotent.
 *
 * Security:
 * - Verifies HMAC-SHA256 webhook signature
 * - Stores events in WebhookEvent table for idempotency
 * - Uses database transactions for data consistency
 *
 * Reference: https://www.cashfree.com/docs/payments/online/webhooks
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature') || '';
    const timestamp = req.headers.get('x-webhook-timestamp') || '';

    // 1. Verify webhook signature
    if (!signature || !timestamp) {
      console.warn('Cashfree webhook: missing signature or timestamp headers');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    let isValid = false;
    try {
      isValid = await verifyCashfreeWebhookSignature(rawBody, signature, timestamp);
    } catch (sigErr) {
      console.error('Cashfree webhook signature verification error:', sigErr);
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
    }

    if (!isValid) {
      console.warn('Cashfree webhook: invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Parse the webhook payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const eventType = payload?.type || payload?.data?.payment?.payment_status || 'UNKNOWN';
    const paymentData = payload?.data?.payment || {};
    const orderData = payload?.data?.order || {};
    const cfOrderId = orderData?.order_id || paymentData?.order?.order_id;

    if (!cfOrderId) {
      console.warn('Cashfree webhook: no order_id in payload');
      return NextResponse.json({ received: true });
    }

    // 3. Idempotency check — extract a unique event identifier
    const eventId =
      paymentData?.cf_payment_id?.toString() || `${cfOrderId}_${eventType}_${timestamp}`;

    const existingEvent = await prisma.webhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider: 'cashfree',
          eventId,
        },
      },
    });

    if (existingEvent) {
      // Already processed — return 200 so Cashfree doesn't retry
      return NextResponse.json({ received: true, duplicate: true });
    }

    // 4. Find the internal order
    const order = await prisma.order.findFirst({
      where: { paymentGatewayOrderId: cfOrderId },
      include: { items: true, user: true },
    });

    if (!order) {
      console.warn(`Cashfree webhook: order not found for cf_order_id=${cfOrderId}`);
      // Still record the event so we don't reprocess
      await prisma.webhookEvent.create({
        data: {
          provider: 'cashfree',
          eventId,
          eventType,
          orderId: null,
          payload: payload,
        },
      });
      return NextResponse.json({ received: true, orderNotFound: true });
    }

    // 5. Process based on payment status
    const paymentStatus = paymentData?.payment_status || orderData?.order_status;

    if (paymentStatus === 'SUCCESS' || paymentStatus === 'PAID') {
      // ──── Payment Successful ────
      if (order.paymentStatus !== 'paid') {
        await prisma.$transaction(async (tx) => {
          // Update order
          await tx.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'paid',
              paymentGatewayPaymentId: paymentData?.cf_payment_id?.toString() || null,
              status: 'placed',
            },
          });

          // Status history
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              oldStatus: order.status,
              newStatus: 'placed',
              changedBy: 'webhook',
              note: `Cashfree payment confirmed (payment_id: ${paymentData?.cf_payment_id || 'N/A'})`,
            },
          });

          // Decrement stock
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

          // Record webhook event
          await tx.webhookEvent.create({
            data: {
              provider: 'cashfree',
              eventId,
              eventType: 'PAYMENT_SUCCESS',
              orderId: order.id,
              payload: payload,
            },
          });
        });

        // Send notifications (non-blocking, outside transaction)
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
          console.warn('Webhook notification error (non-critical):', notifErr);
        }
      } else {
        // Already paid — just record the duplicate event
        await prisma.webhookEvent.create({
          data: {
            provider: 'cashfree',
            eventId,
            eventType: 'PAYMENT_SUCCESS_DUPLICATE',
            orderId: order.id,
            payload: payload,
          },
        });
      }
    } else if (
      paymentStatus === 'FAILED' ||
      paymentStatus === 'USER_DROPPED' ||
      paymentStatus === 'VOID' ||
      paymentStatus === 'CANCELLED' ||
      paymentStatus === 'EXPIRED' ||
      paymentStatus === 'TERMINATED'
    ) {
      // ──── Payment Failed ────
      if (order.paymentStatus !== 'paid') {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'failed',
              status: 'cancelled',
            },
          });

          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              oldStatus: order.status,
              newStatus: 'cancelled',
              changedBy: 'webhook',
              note: `Cashfree payment ${paymentStatus.toLowerCase()} (payment_id: ${paymentData?.cf_payment_id || 'N/A'})`,
            },
          });

          await tx.webhookEvent.create({
            data: {
              provider: 'cashfree',
              eventId,
              eventType: `PAYMENT_${paymentStatus}`,
              orderId: order.id,
              payload: payload,
            },
          });
        });
      }
    } else {
      // Unknown status — just record it
      await prisma.webhookEvent.create({
        data: {
          provider: 'cashfree',
          eventId,
          eventType: `UNKNOWN_${paymentStatus}`,
          orderId: order.id,
          payload: payload,
        },
      });
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Cashfree webhook processing error:', error);
    // Return 500 so Cashfree retries
    return NextResponse.json({ error: 'Internal webhook processing error' }, { status: 500 });
  }
}
