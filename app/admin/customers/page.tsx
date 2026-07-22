import { prisma } from '@/lib/prisma';
import { CustomersClient } from '@/components/admin/customers/customers-client';

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    include: {
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const revenueData = await prisma.order.groupBy({
    by: ['userId'],
    _sum: { total: true },
    where: {
      userId: { in: customers.map((c) => c.id) },
      paymentStatus: { in: ['paid', 'completed'] },
    },
  });
  const revenueMap = Object.fromEntries(revenueData.map((r) => [r.userId, r._sum.total || 0]));

  return (
    <CustomersClient
      customers={customers.map((c) => ({
        id: c.id,
        name: c.fullName || '—',
        email: c.email,
        orderCount: c._count.orders,
        totalSpent: revenueMap[c.id] || 0,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
