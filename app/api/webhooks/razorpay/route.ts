import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return NextResponse.json(
        { success: false, message: 'Missing signature or secret' },
        { status: 400 },
      );
    }

    const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    // Idempotency: you could check if the event.id was already processed in a separate WebhookEvent table.
    // Here we'll check the order's paymentStatus to avoid duplicate emails/updates.

    if (event.event === 'order.paid' || event.event === 'payment.captured') {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id; // This is the Razorpay order ID

      if (orderId) {
        const order = await prisma.order.findFirst({
          where: { razorpayOrderId: orderId },
          include: { user: true },
        });

        if (order && order.paymentStatus !== 'paid' && order.paymentStatus !== 'completed') {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'paid',
              status: 'placed', // transition from pending_payment to placed
            },
          });

          // Send admin notification (could be implemented later)

          // Send confirmation email if user has email
          const emailTo = order.user?.email;
          const name = order.user?.fullName || 'Customer';
          if (emailTo) {
            await sendOrderConfirmationEmail(emailTo, order.id, name, order.total);
          }
        }
      }
    } else if (event.event === 'payment.failed') {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;

      if (orderId) {
        const order = await prisma.order.findFirst({
          where: { razorpayOrderId: orderId },
        });

        if (order && order.paymentStatus === 'pending') {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'failed' },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, message: 'Webhook processing failed' },
      { status: 500 },
    );
  }
}
