'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, MessageCircle, ChevronRight, ExternalLink } from 'lucide-react';
import { STATUS_LABELS } from '@/lib/bulk-orders/types';
import { formatAdminToCustomerWhatsappMessage, getWhatsappLink } from '@/lib/whatsapp';

export interface AdminBulkOrderRow {
  id: string;
  requestNumber: string;
  customerName: string;
  companyName: string | null;
  email: string;
  phone: string;
  orderType: string;
  eventName: string | null;
  totalQuantity: number;
  apparelTypesSummary: string;
  requiredDeliveryDate: string;
  isUrgent: boolean;
  status: string;
  createdAt: string;
  latestQuoteTotal: number | null;
  latestQuoteVersion: number | null;
  itemsCount: number;
  artworksCount: number;
}

interface AdminBulkOrdersClientProps {
  initialOrders: AdminBulkOrderRow[];
}

export function AdminBulkOrdersClient({ initialOrders }: AdminBulkOrdersClientProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'delivery' | 'quantity'>('newest');

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = initialOrders.length;
    const newCount = initialOrders.filter(
      (o) => o.status === 'new' || o.status === 'under_review',
    ).length;
    const quotePending = initialOrders.filter(
      (o) => o.status === 'under_review' || o.status === 'need_more_info',
    ).length;
    const approvedProduction = initialOrders.filter(
      (o) => o.status === 'approved' || o.status === 'paid' || o.status === 'production',
    ).length;
    const totalPipelineUnits = initialOrders.reduce((sum, o) => sum + o.totalQuantity, 0);

    return { total, newCount, quotePending, approvedProduction, totalPipelineUnits };
  }, [initialOrders]);

  // Filtered and sorted data
  const filteredOrders = useMemo(() => {
    return initialOrders
      .filter((order) => {
        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchNumber = order.requestNumber.toLowerCase().includes(q);
          const matchCustomer = order.customerName.toLowerCase().includes(q);
          const matchCompany = (order.companyName || '').toLowerCase().includes(q);
          const matchEmail = order.email.toLowerCase().includes(q);
          const matchPhone = order.phone.toLowerCase().includes(q);
          const matchApparel = order.apparelTypesSummary.toLowerCase().includes(q);
          if (
            !matchNumber &&
            !matchCustomer &&
            !matchCompany &&
            !matchEmail &&
            !matchPhone &&
            !matchApparel
          ) {
            return false;
          }
        }

        // Status
        if (statusFilter !== 'all' && order.status !== statusFilter) {
          return false;
        }

        // Order Type
        if (typeFilter !== 'all' && order.orderType !== typeFilter) {
          return false;
        }

        // Urgency
        if (urgentOnly && !order.isUrgent) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'delivery') {
          return (
            new Date(a.requiredDeliveryDate).getTime() - new Date(b.requiredDeliveryDate).getTime()
          );
        }
        if (sortBy === 'quantity') {
          return b.totalQuantity - a.totalQuantity;
        }
        return 0;
      });
  }, [initialOrders, search, statusFilter, typeFilter, urgentOnly, sortBy]);

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'under_review':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'need_more_info':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse';
      case 'quote_sent':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'customer_reviewing':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'approved':
      case 'payment_pending':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'paid':
      case 'production':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'shipped':
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/40';
      case 'cancelled':
        return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/40';
      default:
        return 'bg-white/10 text-pearl border-white/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-smoke/30">
        <div>
          <span className="font-mono text-caption text-cobalt uppercase tracking-widest block mb-1">
            Manufacturing & Wholesale Portal
          </span>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tight text-bone font-black">
            Bulk & Custom Orders
          </h1>
          <p className="font-mono text-xs text-pearl mt-1">
            Review B2B inquiries, generate custom quotes, review artwork, and track production.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/bulk-orders"
            target="_blank"
            className="px-4 py-2 bg-graphite hover:bg-smoke/30 border border-smoke/40 text-bone font-mono text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>Live Customer Form</span>
            <ExternalLink className="w-3.5 h-3.5 text-pearl" />
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-graphite border border-smoke/40 rounded-xl p-4 space-y-1">
          <span className="font-mono text-[10px] text-pearl uppercase tracking-wider block">
            Total Requests
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl font-black text-bone">{metrics.total}</span>
            <span className="font-mono text-[11px] text-cobalt font-bold">
              {metrics.totalPipelineUnits.toLocaleString()} units
            </span>
          </div>
        </div>

        <div className="bg-graphite border border-smoke/40 rounded-xl p-4 space-y-1">
          <span className="font-mono text-[10px] text-blue-400 uppercase tracking-wider block">
            New / Reviewing
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl font-black text-blue-400">
              {metrics.newCount}
            </span>
            <span className="font-mono text-[10px] text-pearl">Action needed</span>
          </div>
        </div>

        <div className="bg-graphite border border-smoke/40 rounded-xl p-4 space-y-1">
          <span className="font-mono text-[10px] text-amber-400 uppercase tracking-wider block">
            Quotes In Pipeline
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl font-black text-amber-400">
              {metrics.quotePending}
            </span>
            <span className="font-mono text-[10px] text-pearl">Estimates</span>
          </div>
        </div>

        <div className="bg-graphite border border-smoke/40 rounded-xl p-4 space-y-1">
          <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-wider block">
            Approved / Production
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl font-black text-emerald-400">
              {metrics.approvedProduction}
            </span>
            <span className="font-mono text-[10px] text-pearl">Manufacturing</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-graphite border border-smoke/40 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-pearl absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer, company, ref #, phone..."
              className="w-full bg-charcoal border border-smoke/40 focus:border-cobalt pl-9 pr-3 py-2 text-xs font-mono text-bone placeholder-pearl/50 rounded-lg outline-none transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-charcoal border border-smoke/40 focus:border-cobalt px-3 py-2 text-xs font-mono text-bone rounded-lg outline-none cursor-pointer"
            >
              <option value="all">All Statuses ({initialOrders.length})</option>
              <option value="new">New</option>
              <option value="under_review">Under Review</option>
              <option value="need_more_info">Need More Info</option>
              <option value="quote_sent">Quote Sent</option>
              <option value="approved">Approved</option>
              <option value="payment_pending">Payment Pending</option>
              <option value="paid">Paid</option>
              <option value="production">Production</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Order Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-charcoal border border-smoke/40 focus:border-cobalt px-3 py-2 text-xs font-mono text-bone rounded-lg outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="Corporate">Corporate</option>
              <option value="College">College</option>
              <option value="School">School</option>
              <option value="Event">Event</option>
              <option value="Sports Team">Sports Team</option>
              <option value="Brand Merchandise">Brand Merchandise</option>
              <option value="Creator Merchandise">Creator Merchandise</option>
              <option value="Community">Community</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-charcoal border border-smoke/40 focus:border-cobalt px-3 py-2 text-xs font-mono text-bone rounded-lg outline-none cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="delivery">Sort: Delivery Date</option>
              <option value="quantity">Sort: Largest Quantity</option>
            </select>
          </div>
        </div>

        {/* Urgency Toggle */}
        <div className="flex items-center justify-between text-xs font-mono border-t border-smoke/20 pt-3">
          <label className="flex items-center gap-2 cursor-pointer text-pearl hover:text-bone transition-colors">
            <input
              type="checkbox"
              checked={urgentOnly}
              onChange={(e) => setUrgentOnly(e.target.checked)}
              className="rounded bg-charcoal border-smoke/40 text-cobalt focus:ring-0"
            />
            <span>Show Urgent Orders Only</span>
          </label>

          <span className="text-pearl">
            Showing <strong className="text-bone">{filteredOrders.length}</strong> of{' '}
            {initialOrders.length} requests
          </span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-graphite border border-smoke/40 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-charcoal text-pearl border-b border-smoke/40 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Request #</th>
                <th className="py-3 px-4">Customer & Company</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Apparel & Qty</th>
                <th className="py-3 px-4">Delivery By</th>
                <th className="py-3 px-4">Quote</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-smoke/20">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-pearl">
                    No bulk order requests found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const customerWhatsapp = getWhatsappLink(
                    formatAdminToCustomerWhatsappMessage(
                      order.customerName,
                      order.requestNumber,
                      order.phone,
                    ),
                  );

                  return (
                    <tr key={order.id} className="hover:bg-charcoal/50 transition-colors group">
                      {/* Request Number */}
                      <td className="py-3.5 px-4 font-bold text-bone">
                        <Link
                          href={`/admin/bulk-orders/${order.id}`}
                          className="hover:text-cobalt transition-colors flex items-center gap-1.5"
                        >
                          <span>{order.requestNumber}</span>
                          {order.isUrgent && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          )}
                        </Link>
                        <span className="text-[10px] text-pearl block font-normal">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </td>

                      {/* Customer & Company */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-bone block">{order.customerName}</span>
                        {order.companyName && (
                          <span className="text-pearl block text-[11px] truncate max-w-[180px]">
                            {order.companyName}
                          </span>
                        )}
                        <span className="text-pearl text-[10px]">{order.phone}</span>
                      </td>

                      {/* Order Type */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-charcoal border border-smoke/30 text-[10px] uppercase font-bold text-pearl">
                          {order.orderType}
                        </span>
                      </td>

                      {/* Apparel & Qty */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-bone block text-sm">
                          {order.totalQuantity} pcs
                        </span>
                        <span className="text-pearl text-[10px] truncate max-w-[200px] block">
                          {order.apparelTypesSummary}
                        </span>
                      </td>

                      {/* Target Delivery Date */}
                      <td className="py-3.5 px-4">
                        <span className="text-bone block">
                          {new Date(order.requiredDeliveryDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {order.isUrgent && (
                          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                            Rush Delivery
                          </span>
                        )}
                      </td>

                      {/* Quote Total */}
                      <td className="py-3.5 px-4">
                        {order.latestQuoteTotal ? (
                          <div>
                            <span className="text-bone font-bold block">
                              ₹{order.latestQuoteTotal.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-cobalt">
                              v{order.latestQuoteVersion}
                            </span>
                          </div>
                        ) : (
                          <span className="text-pearl italic text-[11px]">Quote required</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full border text-[10px] uppercase font-bold tracking-wider inline-block ${getStatusBadgeStyle(
                            order.status,
                          )}`}
                        >
                          {STATUS_LABELS[order.status]?.label || order.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={customerWhatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat on WhatsApp"
                            className="p-1.5 rounded-lg bg-smoke/20 hover:bg-[#25D366]/20 border border-smoke/40 hover:border-[#25D366]/40 text-[#25D366] transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>

                          <Link
                            href={`/admin/bulk-orders/${order.id}`}
                            className="px-3 py-1.5 rounded-lg bg-cobalt/20 hover:bg-cobalt text-cobalt hover:text-white border border-cobalt/40 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                          >
                            <span>Open</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
