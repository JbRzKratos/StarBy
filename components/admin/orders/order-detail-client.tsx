'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { AdminBadge } from '../ui/badge';
import { AdminToast, useToast } from '../ui/confirm-dialog';
import {
  updateOrderStatus,
  updateOrderInternalNotes,
  updateOrderTracking,
} from '@/app/admin/lib/actions';

type OrderStatus = 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

const STATUS_STEPS: OrderStatus[] = ['placed', 'processing', 'shipped', 'delivered'];

interface OrderDetailProps {
  order: {
    id: string;
    publicOrderId: string | null;
    status: string;
    paymentStatus: string;
    paymentProvider: string;
    paymentGatewayOrderId: string | null;
    paymentGatewayPaymentId: string | null;
    subtotal: number;
    total: number;
    discount: number;
    shippingFee: number;
    tax: number;
    couponCode: string | null;
    shippingMethod: string;
    estimatedDeliveryDate: string | null;
    carrier: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    internalNotes: string;
    createdAt: string;
    updatedAt: string;
    customer: { id: string; name: string; email: string } | null;
    shippingAddress: {
      name?: string;
      firstName?: string;
      lastName?: string;
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
      phone?: string;
      email?: string;
    };
    items: {
      id: string;
      productName: string;
      productSlug: string;
      variantName: string;
      variantColor: string;
      variantColorHex: string;
      variantImage: string | null;
      quantity: number;
      price: number;
      size: string | null;
      orderCustomization: {
        designFileUrl?: string | null;
        designFileName?: string | null;
        printPosition?: string | null;
        printInstructions?: string | null;
        customerNotes?: string | null;
        productionStatus?: string | null;
      } | null;
    }[];
    statusHistory?: {
      id: string;
      oldStatus: string | null;
      newStatus: string;
      changedBy: string | null;
      note: string | null;
      createdAt: string;
    }[];
  };
}

const ALL_STATUSES: OrderStatus[] = [
  'placed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

export function OrderDetailClient({ order }: OrderDetailProps) {
  const { toast, show, dismiss } = useToast();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(order.internalNotes || '');
  const [notesSaved, setNotesSaved] = useState(false);
  const [tracking, setTracking] = useState({
    carrier: order.carrier || '',
    trackingNumber: order.trackingNumber || '',
    trackingUrl: order.trackingUrl || '',
  });
  const [trackingSaved, setTrackingSaved] = useState(false);

  function handleStatusChange(status: string) {
    startTransition(async () => {
      try {
        await updateOrderStatus(order.id, status);
        show('Status updated', 'success');
      } catch {
        show('Failed to update status', 'error');
      }
    });
  }

  function handleSaveNotes() {
    startTransition(async () => {
      try {
        await updateOrderInternalNotes(order.id, notes);
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
      } catch {
        show('Failed to save notes', 'error');
      }
    });
  }

  function handleSaveTracking() {
    startTransition(async () => {
      try {
        await updateOrderTracking(order.id, tracking);
        setTrackingSaved(true);
        setTimeout(() => setTrackingSaved(false), 2000);
      } catch {
        show('Failed to save tracking info', 'error');
      }
    });
  }

  const stepIndex = STATUS_STEPS.indexOf(order.status as OrderStatus);
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';

  const customerFullName =
    order.shippingAddress.name ||
    `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim() ||
    order.customer?.name ||
    'Customer';

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Back */}
      <Link
        href="/admin/orders"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors w-fit font-mono"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        ← All Orders
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 font-mono">
              {order.publicOrderId || order.id}
            </h1>
            {order.publicOrderId && (
              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                DB ID: {order.id.slice(0, 8)}…
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 font-mono mt-1">
            Placed{' '}
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AdminBadge variant={order.paymentStatus === 'paid' ? 'paid' : 'pending'} />
          <select
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isPending}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#3B5EFF]/20 disabled:opacity-50 font-mono"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress stepper */}
      {!isCancelled && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-0">
            {STATUS_STEPS.map((step, i) => {
              const done = stepIndex >= i;
              const active = stepIndex === i;
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                        done ? 'bg-[#3B5EFF] border-[#3B5EFF]' : 'bg-white border-gray-200'
                      }`}
                    >
                      {done ? (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium capitalize ${active ? 'text-[#3B5EFF]' : done ? 'text-gray-700' : 'text-gray-400'}`}
                    >
                      {step}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mt-[-14px] ${done && stepIndex > i ? 'bg-[#3B5EFF]' : 'bg-gray-100'}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Items — left 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                Order Items ({order.items.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {order.items.map((item) => (
                <div key={item.id} className="p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-lg flex-shrink-0 border border-gray-100 overflow-hidden"
                      style={{ background: item.variantColorHex + '22' }}
                    >
                      {item.variantImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.variantImage}
                          alt={item.variantName}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                      <p className="text-xs text-gray-500">
                        {item.variantName}
                        {item.size && ` · Size: ${item.size}`}
                        {' · '}
                        <span className="inline-flex items-center gap-1">
                          <span
                            className="w-3 h-3 rounded-full border border-gray-200 inline-block"
                            style={{ background: item.variantColorHex }}
                          />
                          {item.variantColor}
                        </span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900 font-mono">
                        ₹{item.price.toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">×{item.quantity}</p>
                    </div>
                  </div>

                  {/* Artwork / Customization info */}
                  {item.orderCustomization && (
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs space-y-1 mt-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700 uppercase tracking-wider text-[10px]">
                          Custom Artwork
                        </span>
                        <span className="px-2 py-0.5 bg-blue-50 text-[#3B5EFF] rounded text-[10px] font-mono uppercase">
                          {item.orderCustomization.productionStatus || 'Pending'}
                        </span>
                      </div>
                      {item.orderCustomization.designFileUrl && (
                        <p>
                          <a
                            href={item.orderCustomization.designFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#3B5EFF] hover:underline font-mono"
                          >
                            Download Artwork: {item.orderCustomization.designFileName || 'File'} ↗
                          </a>
                        </p>
                      )}
                      {item.orderCustomization.printInstructions && (
                        <p className="text-gray-600">
                          <strong>Print Note:</strong> {item.orderCustomization.printInstructions}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="px-5 py-4 border-t border-gray-100 space-y-2 font-mono">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span>
                <span>₹{(order.subtotal || order.total).toLocaleString('en-IN')}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-xs text-green-700">
                  <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                  <span>−₹{order.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {order.shippingFee > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Shipping</span>
                  <span>+₹{order.shippingFee.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Grand Total</span>
                <span>₹{order.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>

          {/* Internal notes */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Internal Notes (Staff Only)</h2>
            </div>
            <div className="p-5">
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes about this order…"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#3B5EFF]/20 focus:border-[#3B5EFF] font-mono"
              />
              <div className="flex items-center justify-end mt-2 gap-2">
                {notesSaved && <span className="text-xs text-green-600">Saved ✓</span>}
                <button
                  onClick={handleSaveNotes}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs font-medium bg-[#3B5EFF] text-white rounded-lg hover:bg-[#2a4de8] transition-colors disabled:opacity-50"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar — right col */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Customer</h2>
            <div>
              <p className="text-sm font-medium text-gray-900">{customerFullName}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {order.shippingAddress.email || order.customer?.email || 'No email provided'}
              </p>
              {order.shippingAddress.phone && (
                <p className="text-xs text-gray-500 mt-0.5">Tel: {order.shippingAddress.phone}</p>
              )}
              {order.customer && (
                <Link
                  href={`/admin/customers/${order.customer.id}`}
                  className="text-xs text-[#3B5EFF] hover:underline mt-2 block font-mono"
                >
                  View customer profile →
                </Link>
              )}
            </div>
          </div>

          {/* Shipping address */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Shipping Address</h2>
            <address className="text-sm text-gray-700 not-italic space-y-0.5">
              <p className="font-medium">{customerFullName}</p>
              {order.shippingAddress.street && <p>{order.shippingAddress.street}</p>}
              {(order.shippingAddress.city || order.shippingAddress.state) && (
                <p>
                  {[
                    order.shippingAddress.city,
                    order.shippingAddress.state,
                    order.shippingAddress.zip,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
              {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
            </address>
            <p className="text-xs text-gray-500 mt-2 capitalize font-mono">
              Method: {order.shippingMethod}
            </p>
          </div>

          {/* Payment info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Payment Info</h2>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500">Gateway</span>
                <span className="text-xs font-bold uppercase text-[#3B5EFF]">
                  {order.paymentProvider || 'Cashfree'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <AdminBadge variant={order.paymentStatus === 'paid' ? 'paid' : 'pending'} />
              </div>
              {order.paymentGatewayOrderId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">CF Order ID</span>
                  <span className="text-xs text-gray-700">{order.paymentGatewayOrderId}</span>
                </div>
              )}
              {order.paymentGatewayPaymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment ID</span>
                  <span className="text-xs text-gray-700">{order.paymentGatewayPaymentId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tracking info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Fulfillment & Tracking</h2>
            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-gray-700 mb-1 block">Carrier</label>
                <input
                  type="text"
                  value={tracking.carrier}
                  onChange={(e) => setTracking((t) => ({ ...t, carrier: e.target.value }))}
                  placeholder="e.g. BlueDart, Delhivery"
                  className="w-full border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#3B5EFF]"
                />
              </div>
              <div>
                <label className="text-gray-700 mb-1 block">Tracking Number</label>
                <input
                  type="text"
                  value={tracking.trackingNumber}
                  onChange={(e) => setTracking((t) => ({ ...t, trackingNumber: e.target.value }))}
                  placeholder="Tracking Number"
                  className="w-full border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#3B5EFF]"
                />
              </div>
              <div>
                <label className="text-gray-700 mb-1 block">Tracking URL</label>
                <input
                  type="url"
                  value={tracking.trackingUrl}
                  onChange={(e) => setTracking((t) => ({ ...t, trackingUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#3B5EFF]"
                />
              </div>
              <div className="flex items-center justify-end pt-2 gap-2">
                {trackingSaved && <span className="text-xs text-green-600">Saved ✓</span>}
                <button
                  onClick={handleSaveTracking}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs font-medium bg-[#3B5EFF] text-white rounded hover:bg-[#2a4de8] transition-colors disabled:opacity-50"
                >
                  Save Tracking
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && <AdminToast message={toast.message} type={toast.type} onDismiss={dismiss} />}
    </div>
  );
}
