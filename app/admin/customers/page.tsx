import { prisma } from '@/lib/prisma';
import { CustomersClient } from '@/components/admin/customers/customers-client';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  let mappedCustomers: Array<{
    id: string;
    name: string;
    email: string;
    orderCount: number;
    totalSpent: number;
    createdAt: string;
  }> = [];

  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      include: {
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const customerIds = (Array.isArray(customers) ? customers : []).map((c) => c.id);

    let revenueMap: Record<string, number> = {};
    if (customerIds.length > 0) {
      try {
        const revenueData = await prisma.order.groupBy({
          by: ['userId'],
          _sum: { total: true },
          where: {
            userId: { in: customerIds },
            paymentStatus: { in: ['paid', 'completed'] },
          },
        });
        revenueMap = Object.fromEntries(
          (Array.isArray(revenueData) ? revenueData : []).map((r) => [r.userId, r._sum?.total || 0]),
        );
      } catch (revErr) {
        console.warn('[AdminCustomersPage] Error fetching customer revenue map:', revErr);
      }
    }

    mappedCustomers = (Array.isArray(customers) ? customers : []).map((c) => ({
      id: c.id,
      name: c.fullName || '—',
      email: c.email || '—',
      orderCount: c._count?.orders || 0,
      totalSpent: revenueMap[c.id] || 0,
      createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error('[AdminCustomersPage] Error loading customers:', err);
  }

  return <CustomersClient customers={mappedCustomers} />;
}
