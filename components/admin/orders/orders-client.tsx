'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { AdminBadge } from '../ui/badge';
import { ConfirmDialog, AdminToast, useToast } from '../ui/confirm-dialog';
import { updateOrderStatus } from '@/app/admin/lib/actions';
import { AdminPrintInvoiceButton } from './print-invoice-button';
import {
  Search,
  ChevronDown,
  ChevronUp,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  ArrowRight,
} from 'lucide-react';

type OrderStatus = 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface OrderRow {
  id: string;
  publicOrderId?: string;
  customerName: string;
  customerEmail: string;
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
  itemCount: number;
  createdAt: string;
  couponCode: string | null;
  discount: number;
  shippingMethod: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  items?: {
    id: string;
    productName: string;
    quantity: number;
    size?: string | null;
    price: number;
    totalPrice?: number;
    artworkUrl?: string | null;
  }[];
}

const STATUS_OPTIONS: OrderStatus[] = [
  'placed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

export function OrdersClient({ orders }: { orders: OrderRow[] }) {
  const { toast, show, dismiss } = useToast();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  // Status update
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<{ orderId: string; status: OrderStatus } | null>(null);

  const filtered = orders
    .filter((o) => filter === 'all' || o.status === filter)
    .filter((o) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        o.id.toLowerCase().includes(s) ||
        (o.publicOrderId && o.publicOrderId.toLowerCase().includes(s)) ||
        o.customerName.toLowerCase().includes(s) ||
        o.customerEmail.toLowerCase().includes(s) ||
        (o.customerPhone && o.customerPhone.toLowerCase().includes(s)) ||
        (o.shippingAddress?.city && o.shippingAddress.city.toLowerCase().includes(s))
      );
    })
    .sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === 'desc' ? -diff : diff;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleStatusChange(orderId: string, status: string) {
    setConfirm({ orderId, status: status as OrderStatus });
  }

  function handleConfirm() {
    if (!confirm) return;
    startTransition(async () => {
      try {
        await updateOrderStatus(confirm.orderId, confirm.status);
        show('Order status updated', 'success');
      } catch {
        show('Failed to update status', 'error');
      } finally {
        setConfirm(null);
      }
    });
  }

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Orders Manager</h1>
          <p className="text-sm text-slate-300 font-mono mt-1">
            {orders.length} total orders · Click any order row to view full customer details &
            customization
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-[#1A1A1E] rounded-xl border border-white/10 p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by order ID, customer name, phone, email, city…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-sm font-mono border border-white/15 bg-black/40 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt/40 focus:border-cobalt placeholder:text-slate-400"
            />
          </div>

          {/* Sort */}
          <button
            onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-medium text-slate-200 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          >
            {sortDir === 'desc' ? '↓ Newest First' : '↑ Oldest First'}
          </button>
        </div>

        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
          {['all', ...STATUS_OPTIONS].map((s) => (
            <button
              key={s}
              onClick={() => {
                setFilter(s);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-wider transition-colors ${
                filter === s
                  ? 'bg-cobalt text-white shadow-md shadow-cobalt/25'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#1A1A1E] rounded-xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono text-left">
            <thead className="bg-[#121215] border-b border-white/10">
              <tr>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-200 uppercase tracking-wider text-right">
                  Total
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-200 uppercase tracking-wider text-center">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                    No orders found matching your search or filter criteria.
                  </td>
                </tr>
              )}
              {paginated.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                return (
                  <React.Fragment key={order.id}>
                    <tr
                      onClick={() => toggleExpand(order.id)}
                      className={`hover:bg-white/5 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-white/[0.04]' : ''
                      }`}
                    >
                      {/* Order ID */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-blue-400 hover:text-blue-300 block">
                          {order.publicOrderId || order.id.slice(0, 14)}
                        </span>
                        {order.publicOrderId && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            ID: {order.id.slice(0, 8)}…
                          </span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-white">{order.customerName}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-300">
                          {order.customerPhone && order.customerPhone !== '—' && (
                            <span className="text-slate-300 font-medium">
                              {order.customerPhone}
                            </span>
                          )}
                          {order.customerPhone &&
                            order.customerPhone !== '—' &&
                            order.customerEmail !== '—' && (
                              <span className="text-slate-500">•</span>
                            )}
                          {order.customerEmail !== '—' && (
                            <span className="text-slate-400 truncate max-w-[180px]">
                              {order.customerEmail}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          disabled={isPending}
                          className="text-xs border border-white/15 rounded-lg px-2.5 py-1.5 bg-black/40 text-white font-medium focus:outline-none focus:ring-2 focus:ring-cobalt/40 disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s} className="bg-[#1A1A1E] text-white">
                              {s.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3.5">
                        <AdminBadge variant={order.paymentStatus === 'paid' ? 'paid' : 'pending'} />
                        <span className="text-[10px] text-slate-400 block mt-1 uppercase">
                          {order.paymentProvider || 'Cashfree'}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5 text-right font-bold text-white text-base">
                        ₹{order.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap text-xs">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <AdminPrintInvoiceButton
                            orderId={order.id}
                            variant="compact"
                            label="Print"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(order.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white rounded-lg text-xs font-mono transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                Hide <ChevronUp className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                Details <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Customer Details Panel */}
                    {isExpanded && (
                      <tr className="bg-black/40 border-t border-b border-white/10">
                        <td colSpan={7} className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-sm">
                            {/* Column 1: Customer Details */}
                            <div className="bg-[#1A1A1E] border border-white/10 rounded-xl p-5 space-y-3 shadow-md">
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
                                <User className="w-4 h-4 text-cobalt" />
                                Customer Details
                              </h4>
                              <div className="space-y-1.5 text-xs">
                                <div>
                                  <span className="text-slate-400 block text-[11px]">
                                    Customer Name:
                                  </span>
                                  <span className="text-white font-bold text-sm">
                                    {order.customerName}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[11px]">Phone:</span>
                                  {order.customerPhone && order.customerPhone !== '—' ? (
                                    <a
                                      href={`tel:${order.customerPhone}`}
                                      className="text-blue-300 hover:underline font-semibold flex items-center gap-1"
                                    >
                                      <Phone className="w-3 h-3" />
                                      {order.customerPhone}
                                    </a>
                                  ) : (
                                    <span className="text-slate-400">None provided</span>
                                  )}
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[11px]">Email:</span>
                                  {order.customerEmail !== '—' ? (
                                    <a
                                      href={`mailto:${order.customerEmail}`}
                                      className="text-blue-300 hover:underline flex items-center gap-1"
                                    >
                                      <Mail className="w-3 h-3" />
                                      {order.customerEmail}
                                    </a>
                                  ) : (
                                    <span className="text-slate-400">None provided</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Column 2: Shipping Address */}
                            <div className="bg-[#1A1A1E] border border-white/10 rounded-xl p-5 space-y-3 shadow-md">
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
                                <MapPin className="w-4 h-4 text-emerald-400" />
                                Shipping Address
                              </h4>
                              {order.shippingAddress ? (
                                <div className="text-xs text-slate-200 space-y-1 leading-relaxed">
                                  <p className="font-semibold text-white">
                                    {order.shippingAddress.name || order.customerName}
                                  </p>
                                  {order.shippingAddress.street && (
                                    <p>{order.shippingAddress.street}</p>
                                  )}
                                  <p>
                                    {[
                                      order.shippingAddress.city,
                                      order.shippingAddress.state,
                                      order.shippingAddress.zip,
                                    ]
                                      .filter(Boolean)
                                      .join(', ')}
                                  </p>
                                  {order.shippingAddress.country && (
                                    <p className="text-slate-400 font-medium">
                                      {order.shippingAddress.country}
                                    </p>
                                  )}
                                  <p className="text-[11px] text-slate-400 pt-1">
                                    Method:{' '}
                                    <span className="text-slate-300 font-semibold">
                                      {order.shippingMethod}
                                    </span>
                                  </p>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400">No address recorded</p>
                              )}
                            </div>

                            {/* Column 3: Items & Actions */}
                            <div className="bg-[#1A1A1E] border border-white/10 rounded-xl p-5 space-y-3 shadow-md flex flex-col justify-between">
                              <div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
                                  <Package className="w-4 h-4 text-amber-400" />
                                  Ordered Items ({order.items?.length || order.itemCount})
                                </h4>
                                <div className="space-y-2 max-h-36 overflow-y-auto pr-1 divide-y divide-white/5">
                                  {order.items && order.items.length > 0 ? (
                                    order.items.map((item, iIdx) => (
                                      <div key={iIdx} className="pt-1.5 first:pt-0">
                                        <div className="flex justify-between items-start text-xs">
                                          <span className="text-white font-medium truncate pr-2">
                                            {item.productName}
                                          </span>
                                          <span className="text-slate-300 font-bold whitespace-nowrap">
                                            ₹
                                            {(
                                              item.totalPrice || item.price * item.quantity
                                            ).toLocaleString('en-IN')}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                          <span>Qty: {item.quantity}</span>
                                          {item.size && <span>• Size: {item.size}</span>}
                                          {item.artworkUrl && (
                                            <a
                                              href={item.artworkUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-cobalt hover:underline flex items-center gap-0.5 ml-auto"
                                            >
                                              Artwork ↗
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-slate-400">
                                      {order.itemCount} items
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                                <AdminPrintInvoiceButton
                                  orderId={order.id}
                                  variant="secondary"
                                  className="w-full sm:w-auto"
                                />
                                <Link
                                  href={`/admin/orders/${order.id}`}
                                  className="w-full sm:w-auto py-2 px-3.5 bg-cobalt hover:bg-cobalt/90 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-cobalt/20"
                                >
                                  Open Dedicated Order Page
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#121215]">
            <p className="text-xs text-slate-400 font-mono">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of{' '}
              {filtered.length} orders
            </p>
            <div className="flex gap-2 font-mono">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 border border-white/15 rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 border border-white/15 rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          title="Update order status"
          description={`Change status to "${confirm.status.toUpperCase()}"?`}
          confirmLabel="Update"
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
      {toast && <AdminToast message={toast.message} type={toast.type} onDismiss={dismiss} />}
    </div>
  );
}
