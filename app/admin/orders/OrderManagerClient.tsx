'use client';

import React, { useTransition, useState } from 'react';
import { updateOrderStatus, updateOrderTracking } from '@/app/admin/lib/actions';
import { StatusBadge } from '@/components/admin/status-badge';

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  variantId: string;
  size?: string | null;
  price: number;
}

export interface Order {
  id: string;
  createdAt: string | Date;
  user?: { fullName?: string | null; email?: string | null } | null;
  total: number;
  status: string;
  shippingAddress?: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    phone?: string;
  } | null;
  paymentStatus?: string | null;
  shippingMethod?: string | null;
  razorpayOrderId?: string | null;
  couponCode?: string | null;
  discount?: number | null;
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  items: OrderItem[];
}

type OrderManagerClientProps = {
  orders: Order[];
};

export function OrderManagerClient({ orders }: OrderManagerClientProps) {
  const [isPending, startTransition] = useTransition();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState<string | null>(null);
  const [trackingForm, setTrackingForm] = useState({ carrier: '', trackingNumber: '', trackingUrl: '' });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    if (newStatus === 'shipped') {
      const order = orders.find((o) => o.id === orderId);
      setTrackingForm({
        carrier: order?.carrier || '',
        trackingNumber: order?.trackingNumber || '',
        trackingUrl: order?.trackingUrl || '',
      });
      setTrackingModalOrder(orderId);
      return;
    }
    
    startTransition(async () => {
      await updateOrderStatus(orderId, newStatus);
    });
  };

  const handleTrackingSubmit = () => {
    if (!trackingModalOrder) return;
    startTransition(async () => {
      await updateOrderTracking(trackingModalOrder, trackingForm);
      await updateOrderStatus(trackingModalOrder, 'shipped');
      setTrackingModalOrder(null);
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-display-sm font-bold text-bone mb-2">Orders Manager</h1>
        <p className="font-mono text-body-sm text-pearl">
          View and manage customer orders and fulfillment statuses.
        </p>
      </div>

      <div className="bg-charcoal border border-smoke rounded-sm overflow-hidden">
        <table className="w-full text-left font-mono text-body-sm text-bone">
          <thead className="bg-graphite border-b border-smoke">
            <tr>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">
                Order ID
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">
                Date
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">
                Customer
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">
                Total
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">
                Status
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-smoke">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-ash">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr
                    className="hover:bg-smoke/10 transition-colors cursor-pointer"
                    onClick={() =>
                      setExpandedOrderId(expandedOrderId === order.id ? null : order.id)
                    }
                  >
                    <td className="px-6 py-4">{order.id}</td>
                    <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {order.user ? order.user.fullName || order.user.email : 'Guest'}
                    </td>
                    <td className="px-6 py-4">₹{order.total}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        disabled={isPending}
                        value={order.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="bg-graphite border border-smoke text-bone text-caption uppercase outline-none px-2 py-1 rounded-sm disabled:opacity-50"
                      >
                        <option value="pending_payment">Pending Payment</option>
                        <option value="placed">Placed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                  {expandedOrderId === order.id && (
                    <tr className="bg-graphite/50 border-t border-smoke/30">
                      <td colSpan={6} className="px-6 py-6">
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <h4 className="font-display text-body-lg text-bone mb-4">
                              Shipping Details
                            </h4>
                            {order.shippingAddress ? (
                              <div className="text-pearl text-body-sm space-y-1">
                                <p>
                                  <strong>Name:</strong> {order.shippingAddress.name}
                                </p>
                                <p>
                                  <strong>Address:</strong> {order.shippingAddress.street}
                                </p>
                                <p>
                                  <strong>Location:</strong> {order.shippingAddress.city},{' '}
                                  {order.shippingAddress.state} {order.shippingAddress.zip}
                                </p>
                                <p>
                                  <strong>Phone:</strong> {order.shippingAddress.phone || 'N/A'}
                                </p>
                              </div>
                            ) : (
                              <p className="text-ash">No shipping details provided.</p>
                            )}

                            <div className="mt-6 text-pearl text-body-sm">
                              <p>
                                <strong>Payment Method:</strong> {order.paymentStatus} /{' '}
                                {order.shippingMethod}
                              </p>
                              {order.razorpayOrderId && (
                                <p>
                                  <strong>Gateway ID:</strong> {order.razorpayOrderId}
                                </p>
                              )}
                              {order.couponCode && (
                                <p>
                                  <strong>Coupon Used:</strong> {order.couponCode} (-₹
                                  {order.discount})
                                </p>
                              )}
                              {(order.carrier || order.trackingNumber) && (
                                <div className="mt-4 p-3 bg-graphite/50 border border-smoke/30 rounded-sm">
                                  <p className="text-bone font-medium mb-1">Tracking Info</p>
                                  <p><strong>Carrier:</strong> {order.carrier}</p>
                                  <p><strong>Tracking Number:</strong> {order.trackingNumber}</p>
                                  {order.trackingUrl && (
                                    <p className="mt-2">
                                      <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="text-cobalt hover:underline">
                                        Track Package
                                      </a>
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-display text-body-lg text-bone mb-4">
                              Order Items
                            </h4>
                            <div className="space-y-4">
                              {order.items.map((item: OrderItem) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between items-start border-b border-smoke/30 pb-4"
                                >
                                  <div>
                                    <p className="text-bone font-bold">
                                      {item.productId}{' '}
                                      <span className="text-ash font-normal">
                                        x {item.quantity}
                                      </span>
                                    </p>
                                    <p className="text-pearl text-caption mt-1">
                                      Variant: {item.variantId}
                                    </p>
                                    {item.size && (
                                      <p className="text-pearl text-caption">Size: {item.size}</p>
                                    )}
                                  </div>
                                  <p className="text-bone text-body-sm">
                                    ₹{item.price * item.quantity}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {trackingModalOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-charcoal border border-smoke rounded-sm w-full max-w-md p-6">
            <h3 className="font-display text-body-lg text-bone mb-4">Add Tracking Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-caption font-mono uppercase tracking-widest text-ash block mb-2">Carrier Name</label>
                <input
                  type="text"
                  value={trackingForm.carrier}
                  onChange={(e) => setTrackingForm({ ...trackingForm, carrier: e.target.value })}
                  className="w-full text-sm font-mono bg-graphite border border-smoke text-bone rounded-sm px-3 py-2 focus:outline-none focus:border-cobalt"
                  placeholder="e.g. Delhivery, Bluedart"
                />
              </div>
              <div>
                <label className="text-caption font-mono uppercase tracking-widest text-ash block mb-2">Tracking Number</label>
                <input
                  type="text"
                  value={trackingForm.trackingNumber}
                  onChange={(e) => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                  className="w-full text-sm font-mono bg-graphite border border-smoke text-bone rounded-sm px-3 py-2 focus:outline-none focus:border-cobalt"
                  placeholder="e.g. 123456789"
                />
              </div>
              <div>
                <label className="text-caption font-mono uppercase tracking-widest text-ash block mb-2">Tracking URL</label>
                <input
                  type="url"
                  value={trackingForm.trackingUrl}
                  onChange={(e) => setTrackingForm({ ...trackingForm, trackingUrl: e.target.value })}
                  className="w-full text-sm font-mono bg-graphite border border-smoke text-bone rounded-sm px-3 py-2 focus:outline-none focus:border-cobalt"
                  placeholder="https://..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setTrackingModalOrder(null)}
                  className="px-4 py-2 text-caption font-mono uppercase tracking-widest text-ash hover:text-bone transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTrackingSubmit}
                  disabled={isPending}
                  className="px-4 py-2 bg-cobalt text-bone text-caption font-mono uppercase tracking-widest hover:bg-cobalt/90 disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'Saving...' : 'Save & Mark Shipped'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
