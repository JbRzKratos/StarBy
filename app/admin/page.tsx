import { prisma } from '@/lib/prisma';
import { DashboardClient } from '@/components/admin/dashboard/dashboard-client';

export default async function AdminDashboardPage() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [
    totalOrders,
    totalRevenueData,
    ordersToday,
    totalCustomers,
    recentOrders,
    allOrders90d,
    topVariants,
    lowStockVariants,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: { in: ['paid', 'completed'] } },
    }),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true, email: true } } },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: ninetyDaysAgo },
        paymentStatus: { in: ['paid', 'completed'] },
      },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    // Top selling by order items (last 30 days)
    prisma.orderItem.groupBy({
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
    }),
    prisma.productVariant.findMany({
      where: { OR: [{ inStock: false }, { stockQuantity: { lte: 5 } }] },
      include: { product: { select: { id: true, name: true, slug: true } } },
      orderBy: { stockQuantity: 'asc' },
      take: 10,
    }),
  ]);

  // Fetch product names for top items
  const topProductIds = topVariants.map((v) => v.productId);
  const topProducts = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true },
  });
  const topProductsWithSales = topVariants.map((v) => {
    const product = topProducts.find((p) => p.id === v.productId);
    return { id: v.productId, name: product?.name || 'Unknown', unitsSold: v._sum.quantity || 0 };
  });

  const totalRevenue = totalRevenueData._sum.total || 0;
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <DashboardClient
      stats={{
        totalRevenue,
        ordersToday,
        totalCustomers,
        totalOrders,
        aov,
      }}
      recentOrders={recentOrders.map((o) => ({
        id: o.id,
        customerName: o.user?.fullName || o.user?.email || 'Guest',
        status: o.status,
        paymentStatus: o.paymentStatus,
        total: o.total,
        createdAt: o.createdAt.toISOString(),
        itemCount: 0,
      }))}
      revenueData={allOrders90d.map((o) => ({
        date: o.createdAt.toISOString().split('T')[0] ?? '',
        revenue: o.total,
      }))}
      topProducts={topProductsWithSales}
      lowStockVariants={lowStockVariants.map((v) => ({
        id: v.id,
        name: v.name,
        productId: v.product.id,
        productName: v.product.name,
        productSlug: v.product.slug,
        stockQuantity: v.stockQuantity,
        inStock: v.inStock,
        reorderThreshold: v.reorderThreshold,
      }))}
    />
  );
}
