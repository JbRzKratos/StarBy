import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { orderId, email } = await request.json();

    if (!orderId || !email) {
      return NextResponse.json(
        { success: false, message: 'Order ID and email are required' },
        { status: 400 },
      );
    }

    // Search by internal ID or public Order ID (STB-YYYY-XXXXX)
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { publicOrderId: orderId }],
      },
      include: {
        user: true,
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // Verify email against user or shippingAddress email
    const shipping = (order.shippingAddress as Record<string, string>) || {};
    const inputEmail = email.trim().toLowerCase();
    const userEmail = order.user?.email?.toLowerCase();
    const shippingEmail = shipping.email?.toLowerCase();

    const matches =
      (userEmail && userEmail === inputEmail) || (shippingEmail && shippingEmail === inputEmail);

    if (!matches && (userEmail || shippingEmail)) {
      return NextResponse.json(
        { success: false, message: 'Email address does not match order record' },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.publicOrderId || order.id,
      status: order.status,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      total: order.total,
      paymentStatus: order.paymentStatus,
      carrier: order.carrier || null,
      trackingNumber: order.trackingNumber || null,
      trackingUrl: order.trackingUrl || null,
      itemsCount: order.items.length,
    });
  } catch (error) {
    console.error('Tracking API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
