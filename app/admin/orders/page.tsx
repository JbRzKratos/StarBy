import { prisma } from '@/lib/prisma';
import { requireStaff } from '../lib/auth';
import { OrdersClient } from '@/components/admin/orders/orders-client';

export default async function AdminOrdersPage() {
  await requireStaff();

  const orders = await prisma.order.findMany({
    include: {
      user: { select: { fullName: true, email: true } },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <OrdersClient
      orders={orders.map((o) => ({
        id: o.id,
        customerName: o.user?.fullName || o.user?.email || 'Guest',
        customerEmail: o.user?.email || '—',
        status: o.status,
        paymentStatus: o.paymentStatus,
        total: o.total,
        itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
        createdAt: o.createdAt.toISOString(),
        couponCode: o.couponCode,
        discount: o.discount || 0,
        shippingMethod: o.shippingMethod || 'standard',
      }))}
    />
  );
}
