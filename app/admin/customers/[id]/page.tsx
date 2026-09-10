import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/app/admin/lib/auth';
import { CustomerDetailClient } from '@/components/admin/customers/customer-detail-client';

export const dynamic = 'force-dynamic';

export default async function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  await requireStaff();

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      addresses: true,
      designs: {
        orderBy: { createdAt: 'desc' },
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  // Calculate metrics
  const completedOrders = user.orders.filter((o) => o.paymentStatus === 'paid' || o.paymentStatus === 'completed');
  const totalSpent = completedOrders.reduce((sum, order) => sum + order.total, 0);
  const aov = completedOrders.length > 0 ? totalSpent / completedOrders.length : 0;

  const metrics = {
    totalOrders: user.orders.length,
    totalSpent,
    aov,
  };

  const formattedOrders = user.orders.map((o) => ({
    id: o.id,
    publicOrderId: o.publicOrderId,
    total: o.total,
    status: o.status,
    paymentStatus: o.paymentStatus,
    createdAt: o.createdAt.toISOString(),
    itemCount: o.items.reduce((acc, item) => acc + item.quantity, 0),
  }));

  const formattedAddresses = user.addresses.map((a) => ({
    id: a.id,
    name: a.name,
    street: a.street,
    city: a.city,
    state: a.state,
    zip: a.zip,
    country: a.country,
    isDefault: a.isDefault,
  }));

  const formattedDesigns = user.designs.map((d) => ({
    id: d.id,
    title: d.title || 'Untitled Design',
    productId: d.productId,
    previewUrl: d.previewUrl,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <CustomerDetailClient
      customer={{
        id: user.id,
        name: user.fullName || 'No Name Provided',
        email: user.email,
        phone: user.phone || '—',
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      }}
      metrics={metrics}
      orders={formattedOrders}
      addresses={formattedAddresses}
      designs={formattedDesigns}
    />
  );
}
