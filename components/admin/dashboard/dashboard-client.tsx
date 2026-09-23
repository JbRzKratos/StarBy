'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/admin/status-badge';
import { RevenueChart } from './revenue-chart';
import { StorageWidget } from './storage-widget';
import { AdminPrintInvoiceButton } from '../orders/print-invoice-button';
import { X, User, MapPin, Phone, Mail, Package, Clock, ArrowRight } from 'lucide-react';

interface DashboardStats {
  totalRevenue: number;
  ordersToday: number;
  totalCustomers: number;
  totalOrders: number;
  aov: number;
}

export interface RecentOrderItem {
  id: string;
  name: string;
  quantity: number;
  size?: string | null;
  unitPrice: number;
  totalPrice: number;
}

export interface RecentOrder {
  id: string;
  publicOrderId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone?: string;
    email?: string;
  };
  status: string;
  paymentStatus: string;
  paymentProvider?: string;
  total: number;
  createdAt: string;
  itemCount: number;
  items?: RecentOrderItem[];
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B5EFF" strokeWidth="2">
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    bg: 'bg-[#3B5EFF]/10',
  },
  {
    label: 'Orders Today',
    value: stats.ordersToday.toString(),
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
    bg: 'bg-emerald-500/10',
  },
  {
    label: 'Total Customers',
    value: stats.totalCustomers.toLocaleString(),
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    bg: 'bg-amber-500/10',
  },
  {
    label: 'Avg Order Value',
    value: `₹${stats.aov.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    bg: 'bg-purple-500/10',
  },
];

export function DashboardClient({
  stats,
  recentOrders,
  revenueData,
  topProducts,
  lowStockVariants,
}: DashboardClientProps) {
  const [selectedOrder, setSelectedOrder] = useState<RecentOrder | null>(null);
  const statCards = STAT_CARDS(stats);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-[#1A1A1E] rounded-xl border border-white/10 p-5 font-mono shadow-lg hover:shadow-xl hover:border-cobalt/40 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {card.label}
                </p>
                <p className="text-3xl font-bold tracking-tight text-white mt-1">{card.value}</p>
              </div>
              <div
                className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}
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
          <div className="bg-[#1A1A1E] rounded-xl border border-white/10 p-6 shadow-lg h-full">
            <h2 className="font-display text-lg tracking-tight text-white font-bold mb-6 flex items-center gap-2">
              Revenue
              <span className="text-xs font-mono uppercase tracking-widest text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md ml-2">
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
        <div className="bg-[#1A1A1E] rounded-xl border border-white/10 shadow-lg flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <div>
              <h2 className="font-display text-lg tracking-tight text-white font-bold">
                Recent Orders
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Click any order to view customer details
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-mono uppercase tracking-widest text-cobalt hover:text-cobalt/80 transition-colors font-bold"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-white/5 font-mono flex-1">
            {recentOrders.length === 0 && (
              <p className="text-sm text-slate-400 px-6 py-8 text-center">No orders yet</p>
            )}
            {recentOrders.slice(0, 7).map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="flex items-center justify-between px-6 py-4 hover:bg-white/5 cursor-pointer transition-colors group"
                title="Click to view customer & order details"
              >
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-cobalt transition-colors">
                      {order.customerName}
                    </p>
                    {order.customerPhone && order.customerPhone !== '—' && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        {order.customerPhone}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-blue-400 font-mono font-medium">
                      {order.publicOrderId || order.id.slice(0, 14)}
                    </span>
                    <span className="text-slate-500 text-xs">•</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={order.status} />
                  <span className="text-sm font-bold text-white tabular-nums">
                    ₹{order.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-cobalt group-hover:underline font-mono ml-1 font-medium hidden sm:inline">
                    Details →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: top products + low stock */}
        <div className="space-y-6">
          {/* Top products */}
          <div className="bg-[#1A1A1E] rounded-xl border border-white/10 shadow-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <h2 className="font-display text-lg tracking-tight text-white font-bold">
                Top Products{' '}
                <span className="text-slate-400 text-sm ml-1 font-sans font-normal">(30d)</span>
              </h2>
              <Link
                href="/admin/products"
                className="text-xs font-mono uppercase tracking-widest text-cobalt hover:text-cobalt/80 transition-colors font-bold"
              >
                Manage →
              </Link>
            </div>
            <div className="divide-y divide-white/5 font-mono">
              {topProducts.length === 0 && (
                <p className="text-sm text-slate-400 px-6 py-6 text-center">No sales data yet</p>
              )}
              {topProducts.slice(0, 4).map((product, i) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors"
                >
                  <span className="text-xs text-slate-400 w-4 flex-shrink-0 font-bold">
                    {i + 1}
                  </span>
                  <p className="text-sm text-white font-medium flex-1 truncate">{product.name}</p>
                  <span className="text-xs font-semibold text-slate-200 bg-white/10 px-2.5 py-1 rounded-md">
                    {product.unitsSold} units
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Low stock alerts */}
          <div className="bg-[#1A1A1E] rounded-xl border border-amber-500/20 shadow-lg shadow-amber-500/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <div className="flex items-center justify-between px-6 py-5 border-b border-amber-500/10">
              <h2 className="font-display text-lg tracking-tight text-amber-400 flex items-center gap-2 font-bold">
                Low Stock Alerts
              </h2>
              <span className="text-xs bg-amber-500/15 text-amber-300 font-mono font-bold tracking-widest px-2.5 py-1 rounded-md border border-amber-500/30">
                {lowStockVariants.length} items
              </span>
            </div>
            <div className="divide-y divide-white/5 max-h-[220px] overflow-y-auto font-mono custom-scrollbar">
              {lowStockVariants.length === 0 && (
                <p className="text-sm text-slate-400 px-6 py-6 text-center">
                  All variants well-stocked ✓
                </p>
              )}
              {lowStockVariants.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-amber-500/5 transition-colors"
                >
                  <div className="min-w-0 pr-4">
                    <p className="text-xs font-medium text-white truncate">{v.productName}</p>
                    <p className="text-xs text-slate-400 mt-1">{v.name}</p>
                  </div>
                  <StatusBadge status={v.inStock ? 'low_stock' : 'out_of_stock'} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Customer & Order Details Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-[#1A1A1E] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative font-mono"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-display text-xl font-bold text-white">Order Details</h3>
                  <span className="px-2.5 py-0.5 bg-cobalt/15 text-blue-300 border border-cobalt/30 rounded text-xs font-bold">
                    {selectedOrder.publicOrderId || selectedOrder.id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Placed on{' '}
                  {new Date(selectedOrder.createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 bg-black/40 p-4 rounded-xl border border-white/5">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                  Order Status
                </span>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                  Payment Status
                </span>
                <span
                  className={`inline-block px-2.5 py-1 text-[11px] font-bold uppercase rounded border ${
                    selectedOrder.paymentStatus === 'paid'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {selectedOrder.paymentStatus} ({selectedOrder.paymentProvider || 'Cashfree'})
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                  Total Amount
                </span>
                <span className="text-lg font-bold text-white">
                  ₹{selectedOrder.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Customer Details Box */}
            <div className="bg-black/30 border border-white/10 rounded-xl p-5 mb-6 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
                <User className="w-4 h-4 text-cobalt" />
                Customer Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Full Name:</span>
                  <span className="text-white font-semibold text-base">
                    {selectedOrder.customerName}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block">Phone Number:</span>
                  {selectedOrder.customerPhone && selectedOrder.customerPhone !== '—' ? (
                    <a
                      href={`tel:${selectedOrder.customerPhone}`}
                      className="text-blue-300 hover:text-blue-200 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {selectedOrder.customerPhone}
                    </a>
                  ) : (
                    <span className="text-slate-400">Not provided</span>
                  )}
                </div>

                <div>
                  <span className="text-xs text-slate-400 block">Email Address:</span>
                  {selectedOrder.customerEmail && selectedOrder.customerEmail !== '—' ? (
                    <a
                      href={`mailto:${selectedOrder.customerEmail}`}
                      className="text-blue-300 hover:text-blue-200 hover:underline flex items-center gap-1"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {selectedOrder.customerEmail}
                    </a>
                  ) : (
                    <span className="text-slate-400">Not provided</span>
                  )}
                </div>

                <div>
                  <span className="text-xs text-slate-400 block">Shipping Destination:</span>
                  <span className="text-slate-200">
                    {selectedOrder.shippingAddress?.city
                      ? `${selectedOrder.shippingAddress.city}, ${selectedOrder.shippingAddress.state || ''}`
                      : 'Standard Delivery'}
                  </span>
                </div>
              </div>

              {/* Full Address */}
              {selectedOrder.shippingAddress && (
                <div className="pt-3 border-t border-white/5">
                  <span className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-cobalt" />
                    Delivery Address:
                  </span>
                  <p className="text-sm text-slate-200 bg-white/5 p-3 rounded-lg border border-white/5 leading-relaxed">
                    {selectedOrder.shippingAddress.street && (
                      <span className="block">{selectedOrder.shippingAddress.street}</span>
                    )}
                    <span>
                      {[
                        selectedOrder.shippingAddress.city,
                        selectedOrder.shippingAddress.state,
                        selectedOrder.shippingAddress.zip,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                    {selectedOrder.shippingAddress.country && (
                      <span className="block text-xs text-slate-400 mt-1 font-semibold">
                        {selectedOrder.shippingAddress.country}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Items Ordered */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div className="bg-black/30 border border-white/10 rounded-xl p-5 mb-6">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-3 mb-3">
                  <Package className="w-4 h-4 text-emerald-400" />
                  Items Ordered ({selectedOrder.items.length})
                </h4>

                <div className="divide-y divide-white/5">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-sm">
                      <div className="min-w-0 pr-4">
                        <p className="text-white font-medium truncate">{item.name}</p>
                        <p className="text-xs text-slate-400">
                          Qty: {item.quantity} {item.size ? `• Size: ${item.size}` : ''}
                        </p>
                      </div>
                      <span className="text-white font-bold whitespace-nowrap">
                        ₹{item.totalPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                Close
              </button>
              <AdminPrintInvoiceButton orderId={selectedOrder.id} variant="secondary" />
              <Link
                href={`/admin/orders/${selectedOrder.id}`}
                className="px-4 py-2 bg-cobalt hover:bg-cobalt/90 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-lg shadow-cobalt/20"
              >
                Open Full Order Page
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
