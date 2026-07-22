'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AdminBadge } from '../ui/badge';
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B5EFF" strokeWidth="1.75">
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    bg: 'bg-[#3B5EFF]/8',
  },
  {
    label: 'Orders Today',
    value: stats.ordersToday.toString(),
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.75">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.75">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.75">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    bg: 'bg-purple-50',
  },
];

function getOrderStatusVariant(status: string): Parameters<typeof AdminBadge>[0]['variant'] {
  const map: Record<string, Parameters<typeof AdminBadge>[0]['variant']> = {
    processing: 'processing',
    placed: 'placed',
    shipped: 'shipped',
    delivered: 'delivered',
    cancelled: 'cancelled',
    refunded: 'refunded',
  };
  return map[status] || 'processing';
}

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Revenue (last 90 days)</h2>
        <RevenueChart data={revenueData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent orders */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-[#3B5EFF] hover:underline font-medium">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.length === 0 && (
              <p className="text-sm text-gray-500 px-5 py-4">No orders yet</p>
            )}
            {recentOrders.slice(0, 6).map((order) => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{order.customerName}</p>
                  <p className="text-xs text-gray-500">{order.id.slice(0, 12)}…</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <AdminBadge variant={getOrderStatusVariant(order.status)} />
                  <span className="text-sm font-semibold text-gray-900">
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
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Top Products (30d)</h2>
              <Link href="/admin/products" className="text-xs text-[#3B5EFF] hover:underline font-medium">
                Manage
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {topProducts.length === 0 && (
                <p className="text-sm text-gray-500 px-5 py-4">No sales data yet</p>
              )}
              {topProducts.slice(0, 4).map((product, i) => (
                <div key={product.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                  <p className="text-sm text-gray-800 flex-1 truncate">{product.name}</p>
                  <span className="text-xs font-semibold text-gray-600">{product.unitsSold} units</span>
                </div>
              ))}
            </div>
          </div>

          {/* Low stock alerts */}
          <div className="bg-white rounded-xl border border-orange-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-orange-100">
              <h2 className="text-sm font-semibold text-orange-900 flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Low Stock Alerts
              </h2>
              <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
                {lowStockVariants.length}
              </span>
            </div>
            <div className="divide-y divide-orange-50 max-h-40 overflow-y-auto">
              {lowStockVariants.length === 0 && (
                <p className="text-sm text-gray-500 px-5 py-4">All variants well-stocked ✓</p>
              )}
              {lowStockVariants.map((v) => (
                <div key={v.id} className="flex items-center justify-between px-5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{v.productName}</p>
                    <p className="text-xs text-gray-500">{v.name}</p>
                  </div>
                  <AdminBadge variant={v.inStock ? 'low-stock' : 'out-of-stock'} label={v.inStock ? `${v.stockQuantity} left` : 'Out'} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
