import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/admin/lib/auth';
import { AnalyticsClient } from '@/components/admin/analytics/analytics-client';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Daily revenue aggregation initialization
  const dailyMap: Record<string, number> = {};
  for (let i = 0; i <= 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const dayKey = d.toISOString().split('T')[0] ?? '';
    dailyMap[dayKey] = 0;
  }

  let totalRevenue30d = 0;
  let totalOrders30d = 0;
  let topSellers: Array<{
    id: string;
    name: string;
    category: string;
    unitsSold: number;
  }> = [];

  try {
    const [recentOrders, topProducts] = await Promise.all([
      prisma.order
        .findMany({
          where: {
            createdAt: { gte: thirtyDaysAgo },
            paymentStatus: { in: ['paid', 'completed'] },
          },
          select: { total: true, createdAt: true, status: true },
          orderBy: { createdAt: 'asc' },
        })
        .catch(() => []),
      prisma.orderItem
        .groupBy({
          by: ['productId'],
          where: {
            order: {
              createdAt: { gte: thirtyDaysAgo },
              paymentStatus: { in: ['paid', 'completed'] },
            },
          },
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5,
        })
        .catch(() => []),
    ]);

    for (const o of Array.isArray(recentOrders) ? recentOrders : []) {
      if (o.status !== 'cancelled' && o.status !== 'refunded') {
        const day = o.createdAt ? o.createdAt.toISOString().split('T')[0] ?? '' : '';
        if (dailyMap[day] !== undefined) {
          dailyMap[day] += o.total || 0;
        }
        totalRevenue30d += o.total || 0;
        totalOrders30d++;
      }
    }

    const validTopProducts = Array.isArray(topProducts) ? topProducts : [];
    const productIds = validTopProducts.map((p) => p.productId).filter(Boolean);

    let productInfo: Array<{ id: string; name: string; categorySlug: string }> = [];
    if (productIds.length > 0) {
      try {
        productInfo = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, categorySlug: true },
        });
      } catch (err) {
        console.warn('[AdminAnalyticsPage] Could not load product names:', err);
      }
    }

    const productMap = Object.fromEntries(productInfo.map((p) => [p.id, p]));
    topSellers = validTopProducts.map((p) => ({
      id: p.productId,
      name: productMap[p.productId]?.name || 'Unknown',
      category: productMap[p.productId]?.categorySlug || '—',
      unitsSold: p._sum?.quantity || 0,
    }));
  } catch (err) {
    console.error('[AdminAnalyticsPage] Error loading analytics:', err);
  }

  const chartData = Object.entries(dailyMap).map(([date, revenue]) => ({
    date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    revenue,
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
