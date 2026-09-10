'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/admin/status-badge';
import { RevenueChart } from './revenue-chart';
import { StorageWidget } from './storage-widget';

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-[#1A1A1E]/80 backdrop-blur-md rounded-xl border border-[#F5F1EA]/10 p-5 font-mono shadow-lg hover:shadow-xl hover:scale-[1.02] hover:border-cobalt/30 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-caption text-ash uppercase tracking-widest mb-2 group-hover:text-pearl transition-colors">
                  {card.label}
                </p>
                <p className="text-3xl font-bold tracking-tight text-bone mt-1">{card.value}</p>
              </div>
              <div
                className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center flex-shrink-0 bg-opacity-10 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Revenue chart */}
          <div className="bg-[#1A1A1E]/80 backdrop-blur-md rounded-xl border border-[#F5F1EA]/10 p-6 shadow-lg h-full">
            <h2 className="font-display text-lg tracking-tight text-bone mb-6 flex items-center gap-2">
              Revenue
              <span className="text-xs font-mono uppercase tracking-widest text-ash bg-smoke/20 px-2 py-1 rounded-md ml-2">
                Last 90 Days
              </span>
            </h2>
            <RevenueChart data={revenueData} />
          </div>
        </div>

        {/* Storage Widget */}
        <div className="lg:col-span-1">
          <StorageWidget />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-[#1A1A1E]/80 backdrop-blur-md rounded-xl border border-[#F5F1EA]/10 shadow-lg flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#F5F1EA]/10">
            <h2 className="font-display text-lg tracking-tight text-bone">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-xs font-mono uppercase tracking-widest text-cobalt hover:text-cobalt/80 transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-[#F5F1EA]/5 font-mono flex-1">
            {recentOrders.length === 0 && (
              <p className="text-sm text-ash px-6 py-6 text-center">No orders yet</p>
            )}
            {recentOrders.slice(0, 6).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-[#F5F1EA]/5 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-bone truncate group-hover:text-cobalt transition-colors">
                    {order.customerName}
                  </p>
                  <p className="text-xs text-ash mt-1">{order.id.slice(0, 12)}…</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <StatusBadge status={order.status} />
                  <span className="text-sm font-semibold text-bone tabular-nums">
                    ₹{order.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: top products + low stock */}
        <div className="space-y-6">
          {/* Top products */}
          <div className="bg-[#1A1A1E]/80 backdrop-blur-md rounded-xl border border-[#F5F1EA]/10 shadow-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#F5F1EA]/10">
              <h2 className="font-display text-lg tracking-tight text-bone">
                Top Products{' '}
                <span className="text-ash text-sm ml-1 font-sans font-normal">(30d)</span>
              </h2>
              <Link
                href="/admin/products"
                className="text-xs font-mono uppercase tracking-widest text-cobalt hover:text-cobalt/80 transition-colors"
              >
                Manage
              </Link>
            </div>
            <div className="divide-y divide-[#F5F1EA]/5 font-mono">
              {topProducts.length === 0 && (
                <p className="text-sm text-ash px-6 py-6 text-center">No sales data yet</p>
              )}
              {topProducts.slice(0, 4).map((product, i) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-[#F5F1EA]/5 transition-colors"
                >
                  <span className="text-xs text-ash w-4 flex-shrink-0">{i + 1}</span>
                  <p className="text-sm text-bone flex-1 truncate">{product.name}</p>
                  <span className="text-xs font-semibold text-pearl bg-smoke/20 px-2 py-1 rounded-md">
                    {product.unitsSold} units
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Low stock alerts */}
          <div className="bg-[#1A1A1E]/80 backdrop-blur-md rounded-xl border border-amber-500/20 shadow-lg shadow-amber-500/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <div className="flex items-center justify-between px-6 py-5 border-b border-amber-500/10">
              <h2 className="font-display text-lg tracking-tight text-amber-500 flex items-center gap-2">
                Low Stock Alerts
              </h2>
              <span className="text-[10px] bg-amber-500/10 text-amber-500 font-mono tracking-widest px-2.5 py-1 rounded-md border border-amber-500/20">
                {lowStockVariants.length}
              </span>
            </div>
            <div className="divide-y divide-[#F5F1EA]/5 max-h-[220px] overflow-y-auto font-mono custom-scrollbar">
              {lowStockVariants.length === 0 && (
                <p className="text-sm text-ash px-6 py-6 text-center">
                  All variants well-stocked ✓
                </p>
              )}
              {lowStockVariants.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-amber-500/5 transition-colors"
                >
                  <div className="min-w-0 pr-4">
                    <p className="text-xs font-medium text-bone truncate">{v.productName}</p>
                    <p className="text-xs text-ash mt-1">{v.name}</p>
                  </div>
                  <StatusBadge status={v.inStock ? 'low_stock' : 'out_of_stock'} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
