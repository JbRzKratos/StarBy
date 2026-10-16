import { prisma } from '@/lib/prisma';
import { DashboardClient } from '@/components/admin/dashboard/dashboard-client';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  try {
    const [
      totalOrdersResult,
      totalRevenueResult,
      ordersTodayResult,
      totalCustomersResult,
      recentOrdersResult,
      allOrders90dResult,
      topVariantsResult,
      lowStockVariantsResult,
    ] = await Promise.allSettled([
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
        include: {
          user: { select: { fullName: true, email: true, phone: true } },
          items: true,
        },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: ninetyDaysAgo },
          paymentStatus: { in: ['paid', 'completed'] },
        },
        select: { total: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
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

    const totalOrders = totalOrdersResult.status === 'fulfilled' ? totalOrdersResult.value : 0;
    const totalRevenueData =
      totalRevenueResult.status === 'fulfilled' ? totalRevenueResult.value : { _sum: { total: 0 } };
    const ordersToday = ordersTodayResult.status === 'fulfilled' ? ordersTodayResult.value : 0;
    const totalCustomers =
      totalCustomersResult.status === 'fulfilled' ? totalCustomersResult.value : 0;
    const recentOrders =
      recentOrdersResult.status === 'fulfilled' && Array.isArray(recentOrdersResult.value)
        ? recentOrdersResult.value
        : [];
    const allOrders90d =
      allOrders90dResult.status === 'fulfilled' && Array.isArray(allOrders90dResult.value)
        ? allOrders90dResult.value
        : [];
    const topVariants =
      topVariantsResult.status === 'fulfilled' && Array.isArray(topVariantsResult.value)
        ? topVariantsResult.value
        : [];
    const lowStockVariants =
      lowStockVariantsResult.status === 'fulfilled' && Array.isArray(lowStockVariantsResult.value)
        ? lowStockVariantsResult.value
        : [];

    // Fetch product names for top items
    const topProductIds = topVariants.map((v) => v.productId).filter(Boolean);
    let topProducts: Array<{ id: string; name: string }> = [];
    if (topProductIds.length > 0) {
      try {
        topProducts = await prisma.product.findMany({
          where: { id: { in: topProductIds } },
          select: { id: true, name: true },
        });
      } catch (err) {
        console.warn('[AdminDashboard] Could not fetch top product names:', err);
      }
    }

    const topProductsWithSales = topVariants.map((v) => {
      const product = topProducts.find((p) => p.id === v.productId);
      return { id: v.productId, name: product?.name || 'Unknown', unitsSold: v._sum?.quantity || 0 };
    });

    const totalRevenue = totalRevenueData._sum?.total || 0;
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
        recentOrders={recentOrders.map((o) => {
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
            status: o.status,
            paymentStatus: o.paymentStatus,
            paymentProvider: o.paymentProvider || 'Cashfree',
            total: o.total,
            createdAt: o.createdAt ? o.createdAt.toISOString() : new Date().toISOString(),
            itemCount: Array.isArray(o.items)
              ? o.items.reduce((sum, i) => sum + (i.quantity || 0), 0)
              : 0,
            items: Array.isArray(o.items)
              ? o.items.map((i) => ({
                  id: i.id,
                  name: i.productNameSnapshot || i.productId,
                  quantity: i.quantity || 1,
                  size: i.size || null,
                  unitPrice: i.unitPrice || i.price || 0,
                  totalPrice: i.totalPrice || (i.price ? i.price * (i.quantity || 1) : 0),
                }))
              : [],
          };
        })}
        revenueData={allOrders90d.map((o) => ({
          date: o.createdAt ? o.createdAt.toISOString().split('T')[0] ?? '' : '',
          revenue: o.total || 0,
        }))}
        topProducts={topProductsWithSales}
        lowStockVariants={lowStockVariants.map((v) => ({
          id: v.id,
          name: v.name,
          productId: v.product?.id || v.productId,
          productName: v.product?.name || 'Unknown Product',
          productSlug: v.product?.slug || '',
          stockQuantity: typeof v.stockQuantity === 'number' ? v.stockQuantity : 0,
          inStock: Boolean(v.inStock),
          reorderThreshold: typeof v.reorderThreshold === 'number' ? v.reorderThreshold : 5,
        }))}
      />
    );
  } catch (err) {
    console.error('[AdminDashboard] Server error fetching stats:', err);
    return (
      <DashboardClient
        stats={{
          totalRevenue: 0,
          ordersToday: 0,
          totalCustomers: 0,
          totalOrders: 0,
          aov: 0,
        }}
        recentOrders={[]}
        revenueData={[]}
        topProducts={[]}
        lowStockVariants={[]}
      />
    );
  }
}
