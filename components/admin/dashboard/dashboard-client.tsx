'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/admin/status-badge';
import { RevenueChart } from './revenue-chart';

interface DashboardStats {
  totalRevenue: number;
  ordersToday: number;
  totalCustomers: number;
  totalOrders: number;
  aov: number;
}

interface RecentOrder {
  id: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  itemCount: number;
}

interface RevenueDataPoint {
  date: string;
  revenue: number;
}

interface TopProduct {
  id: string;
  name: string;
  unitsSold: number;
}

interface LowStockVariant {
  id: string;
  name: string;
  productId: string;
  productName: string;
  productSlug: string;
  stockQuantity: number;
  inStock: boolean;
  reorderThreshold: number;
}

interface DashboardClientProps {
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  revenueData: RevenueDataPoint[];
  topProducts: TopProduct[];
  lowStockVariants: LowStockVariant[];
}

const STAT_CARDS = (stats: DashboardStats) => [
  {
    label: 'Total Revenue',
    value: `₹${stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#3B5EFF"
        strokeWidth="1.75"
      >
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    bg: 'bg-[#3B5EFF]/8',
  },
  {
    label: 'Orders Today',
    value: stats.ordersToday.toString(),
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#10b981"
        strokeWidth="1.75"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
    bg: 'bg-green-50',
  },
  {
    label: 'Total Customers',
    value: stats.totalCustomers.toLocaleString(),
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#f59e0b"
        strokeWidth="1.75"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    bg: 'bg-amber-50',
  },
  {
    label: 'Avg Order Value',
    value: `₹${stats.aov.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#8b5cf6"
        strokeWidth="1.75"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    bg: 'bg-purple-50',
  },
];


export function DashboardClient({
  stats,
  recentOrders,
  revenueData,
  topProducts,
  lowStockVariants,
}: DashboardClientProps) {
  const statCards = STAT_CARDS(stats);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-charcoal rounded-sm border border-smoke p-4 font-mono">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-caption text-ash uppercase tracking-widest mb-1">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-bone mt-1">{card.value}</p>
              </div>
              <div
                className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-charcoal rounded-sm border border-smoke p-6">
        <h2 className="font-mono text-caption uppercase tracking-widest text-pearl mb-4">Revenue (last 90 days)</h2>
        <RevenueChart data={revenueData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent orders */}
        <div className="bg-charcoal rounded-sm border border-smoke">
          <div className="flex items-center justify-between px-5 py-4 border-b border-smoke">
            <h2 className="font-mono text-caption uppercase tracking-widest text-pearl">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-caption font-mono uppercase tracking-widest text-cobalt hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-smoke font-mono">
            {recentOrders.length === 0 && (
              <p className="text-sm text-ash px-5 py-4">No orders yet</p>
            )}
            {recentOrders.slice(0, 6).map((order) => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3 hover:bg-smoke/10">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-bone truncate">{order.customerName}</p>
                  <p className="text-xs text-gray-500">{order.id.slice(0, 12)}…</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={order.status} />
                  <span className="text-sm font-semibold text-bone">
                    ₹{order.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: top products + low stock */}
        <div className="space-y-4">
          {/* Top products */}
          <div className="bg-charcoal rounded-sm border border-smoke">
            <div className="flex items-center justify-between px-5 py-4 border-b border-smoke">
              <h2 className="font-mono text-caption uppercase tracking-widest text-pearl">Top Products (30d)</h2>
              <Link
                href="/admin/products"
                className="text-caption font-mono uppercase tracking-widest text-cobalt hover:underline"
              >
                Manage
              </Link>
            </div>
            <div className="divide-y divide-smoke font-mono">
              {topProducts.length === 0 && (
                <p className="text-sm text-ash px-5 py-4">No sales data yet</p>
              )}
              {topProducts.slice(0, 4).map((product, i) => (
                <div key={product.id} className="flex items-center gap-3 px-5 py-3 hover:bg-smoke/10">
                  <span className="text-xs text-ash w-4">{i + 1}</span>
                  <p className="text-sm text-bone flex-1 truncate">{product.name}</p>
                  <span className="text-xs font-semibold text-pearl">
                    {product.unitsSold} units
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Low stock alerts */}
          <div className="bg-charcoal rounded-sm border border-amber-500/20">
            <div className="flex items-center justify-between px-5 py-4 border-b border-amber-500/10">
              <h2 className="font-mono text-caption uppercase tracking-widest text-amber-500 flex items-center gap-2">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Low Stock Alerts
              </h2>
              <span className="text-[10px] bg-amber-500/10 text-amber-500 font-mono tracking-widest px-2 py-0.5 rounded-sm border border-amber-500/20">
                {lowStockVariants.length}
              </span>
            </div>
            <div className="divide-y divide-smoke max-h-40 overflow-y-auto font-mono">
              {lowStockVariants.length === 0 && (
                <p className="text-sm text-ash px-5 py-4">All variants well-stocked ✓</p>
              )}
              {lowStockVariants.map((v) => (
                <div key={v.id} className="flex items-center justify-between px-5 py-3 hover:bg-smoke/10">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-bone truncate">{v.productName}</p>
                    <p className="text-xs text-ash">{v.name}</p>
                  </div>
                  <StatusBadge
                    status={v.inStock ? 'low_stock' : 'out_of_stock'}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
