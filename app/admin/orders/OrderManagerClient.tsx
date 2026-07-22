'use client';

import React, { useTransition, useState } from 'react';
import { updateOrderStatus } from '../actions';

type OrderManagerClientProps = {
  orders: any[];
};

export function OrderManagerClient({ orders }: OrderManagerClientProps) {
  const [isPending, startTransition] = useTransition();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    startTransition(async () => {
      await updateOrderStatus(orderId, newStatus);
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-cobalt/20 text-cobalt';
      case 'shipped': return 'bg-emerald-400/20 text-emerald-400';
      case 'delivered': return 'bg-emerald-600/20 text-emerald-600';
      case 'cancelled': return 'bg-ember/20 text-ember';
      default: return 'bg-smoke/20 text-ash';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-display-sm font-bold text-bone mb-2">Orders Manager</h1>
        <p className="font-mono text-body-sm text-pearl">View and manage customer orders and fulfillment statuses.</p>
      </div>

      <div className="bg-charcoal border border-smoke rounded-sm overflow-hidden">
        <table className="w-full text-left font-mono text-body-sm text-bone">
          <thead className="bg-graphite border-b border-smoke">
            <tr>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">Order ID</th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">Date</th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">Customer</th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">Total</th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">Status</th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-smoke">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-ash">No orders found.</td>
              </tr>
            ) : orders.map(order => (
              <React.Fragment key={order.id}>
                <tr className="hover:bg-smoke/10 transition-colors cursor-pointer" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                  <td className="px-6 py-4">{order.id}</td>
                  <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {order.user ? order.user.fullName || order.user.email : 'Guest'}
                  </td>
                  <td className="px-6 py-4">₹{order.total}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-caption uppercase ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
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
                          <h4 className="font-display text-body-lg text-bone mb-4">Shipping Details</h4>
                          {order.shippingAddress ? (
                            <div className="text-pearl text-body-sm space-y-1">
                              <p><strong>Name:</strong> {order.shippingAddress.name}</p>
                              <p><strong>Address:</strong> {order.shippingAddress.street}</p>
                              <p><strong>Location:</strong> {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                              <p><strong>Phone:</strong> {order.shippingAddress.phone || 'N/A'}</p>
                            </div>
                          ) : (
                            <p className="text-ash">No shipping details provided.</p>
                          )}
                          
                          <div className="mt-6 text-pearl text-body-sm">
                            <p><strong>Payment Method:</strong> {order.paymentStatus} / {order.shippingMethod}</p>
                            {order.razorpayOrderId && <p><strong>Gateway ID:</strong> {order.razorpayOrderId}</p>}
                            {order.couponCode && <p><strong>Coupon Used:</strong> {order.couponCode} (-₹{order.discount})</p>}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-display text-body-lg text-bone mb-4">Order Items</h4>
                          <div className="space-y-4">
                            {order.items.map((item: any) => (
                              <div key={item.id} className="flex justify-between items-start border-b border-smoke/30 pb-4">
                                <div>
                                  <p className="text-bone font-bold">{item.productId} <span className="text-ash font-normal">x {item.quantity}</span></p>
                                  <p className="text-pearl text-caption mt-1">Variant: {item.variantId}</p>
                                  {item.size && <p className="text-pearl text-caption">Size: {item.size}</p>}
                                </div>
                                <p className="text-bone text-body-sm">₹{item.price * item.quantity}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
