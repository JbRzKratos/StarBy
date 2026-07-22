import { prisma } from '@/lib/prisma';
import { requireStaff } from '../lib/auth';
import { AnalyticsClient } from '@/components/admin/analytics/analytics-client';

export default async function AdminAnalyticsPage() {
  await requireStaff();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [recentOrders, topProducts] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { total: true, createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ]);

  // Daily revenue aggregation
  const dailyMap: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const dayKey = d.toISOString().split('T')[0] ?? '';
    dailyMap[dayKey] = 0;
  }

  let totalRevenue30d = 0;
  let totalOrders30d = 0;

  for (const o of recentOrders) {
    if (o.status !== 'cancelled' && o.status !== 'refunded') {
      const day = o.createdAt.toISOString().split('T')[0] ?? '';
      if (dailyMap[day] !== undefined) {
        dailyMap[day] += o.total;
      }
      totalRevenue30d += o.total;
      totalOrders30d++;
    }
  }

  const chartData = Object.entries(dailyMap).map(([date, revenue]) => ({
    date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    revenue,
  }));

  // Fetch product names for top products
  const productInfo = await prisma.product.findMany({
    where: { id: { in: topProducts.map((p) => p.productId) } },
    select: { id: true, name: true, categorySlug: true },
  });

  const productMap = Object.fromEntries(productInfo.map((p) => [p.id, p]));
  const topSellers = topProducts.map((p) => ({
    id: p.productId,
    name: productMap[p.productId]?.name || 'Unknown',
    category: productMap[p.productId]?.categorySlug || '—',
    unitsSold: p._sum.quantity || 0,
  }));

  return (
    <AnalyticsClient
      chartData={chartData}
      totalRevenue30d={totalRevenue30d}
      totalOrders30d={totalOrders30d}
      topSellers={topSellers}
    />
  );
}
