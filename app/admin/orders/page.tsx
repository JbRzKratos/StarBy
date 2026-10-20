import { prisma } from '@/lib/prisma';
import { OrdersClient } from '@/components/admin/orders/orders-client';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  let mappedOrders: Array<{
    id: string;
    publicOrderId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: {
      name: string;
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
      phone: string;
      email: string;
    };
    status: string;
    paymentStatus: string;
    paymentProvider: string;
    total: number;
    itemCount: number;
    createdAt: string;
    couponCode: string | null;
    discount: number;
    shippingMethod: string;
    carrier: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    items: Array<{
      id: string;
      productName: string;
      quantity: number;
      size: string | null;
      price: number;
      totalPrice: number;
      artworkUrl: string | null;
    }>;
  }> = [];

  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        items: {
          include: {
            orderCustomization: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    mappedOrders = orders.map((o) => {
      const addr = (o.shippingAddress as Record<string, unknown>) || {};
      const customerName =
        (typeof addr.name === 'string' && addr.name.trim()) ||
        `${typeof addr.firstName === 'string' ? addr.firstName : ''} ${typeof addr.lastName === 'string' ? addr.lastName : ''}`.trim() ||
        o.user?.fullName ||
        o.user?.email ||
        'Customer';
      const customerEmail =
        (typeof addr.email === 'string' && addr.email) || o.user?.email || '—';
      const customerPhone =
        (typeof addr.phone === 'string' && addr.phone) || o.user?.phone || '—';
      const shippingStreet = typeof addr.street === 'string' ? addr.street : '';
      const shippingCity = typeof addr.city === 'string' ? addr.city : '';
      const shippingState = typeof addr.state === 'string' ? addr.state : '';
      const shippingZip = typeof addr.zip === 'string' ? addr.zip : '';
      const shippingCountry = typeof addr.country === 'string' ? addr.country : 'India';

      const itemsList = Array.isArray(o.items) ? o.items : [];

      return {
        id: o.id,
        publicOrderId: o.publicOrderId || o.id,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress: {
          name: customerName,
          street: shippingStreet,
          city: shippingCity,
          state: shippingState,
          zip: shippingZip,
          country: shippingCountry,
          phone: customerPhone,
          email: customerEmail,
        },
        status: o.status || 'pending',
        paymentStatus: o.paymentStatus || 'unpaid',
        paymentProvider: o.paymentProvider || 'Cashfree',
        total: o.total || 0,
        itemCount: itemsList.reduce((sum, i) => sum + (i.quantity || 1), 0),
        createdAt: o.createdAt ? o.createdAt.toISOString() : new Date().toISOString(),
        couponCode: o.couponCode || null,
        discount: o.discount || 0,
        shippingMethod: o.shippingMethod || 'standard',
        carrier: o.carrier || null,
        trackingNumber: o.trackingNumber || null,
        trackingUrl: o.trackingUrl || null,
        items: itemsList.map((i) => ({
          id: i.id,
          productName: i.productNameSnapshot || i.productId || 'Product',
          quantity: i.quantity || 1,
          size: i.size || null,
          price: i.unitPrice ?? i.price ?? (i.quantity ? i.totalPrice / i.quantity : 0),
          totalPrice: i.totalPrice || (i.price ? i.price * (i.quantity || 1) : 0) || 0,
          artworkUrl: i.orderCustomization?.designFileUrl || null,
        })),
      };
    });
  } catch (err) {
    console.error('[AdminOrdersPage] Error loading orders:', err);
  }

  return <OrdersClient orders={mappedOrders} />;
}
