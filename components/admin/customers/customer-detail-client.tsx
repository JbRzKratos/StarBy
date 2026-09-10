'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Calendar, Package, MapPin, Palette } from 'lucide-react';
import { StatusBadge } from '@/components/admin/status-badge';

interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

interface Metrics {
  totalOrders: number;
  totalSpent: number;
  aov: number;
}

interface OrderRow {
  id: string;
  publicOrderId: string | null;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  itemCount: number;
}

interface AddressRow {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

interface DesignRow {
  id: string;
  title: string;
  productId: string;
  previewUrl: string | null;
  createdAt: string;
}

interface CustomerDetailClientProps {
  customer: CustomerProfile;
  metrics: Metrics;
  orders: OrderRow[];
  addresses: AddressRow[];
  designs: DesignRow[];
}

export function CustomerDetailClient({
  customer,
  metrics,
  orders,
  addresses,
  designs,
}: CustomerDetailClientProps) {
  return (
    <div className="space-y-8 max-w-[90rem]">
      {/* Header */}
      <div>
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-2 text-sm font-mono text-ash hover:text-bone mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </Link>
        <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between bg-[#1A1A1E]/80 backdrop-blur-md rounded-xl border border-[#F5F1EA]/10 p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-cobalt to-[#8b5cf6] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border border-white/10">
              <span className="text-3xl font-display font-bold text-white uppercase">
                {customer.name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-bone">{customer.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm font-mono text-ash">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-cobalt" /> {customer.email}
                </span>
                {customer.phone !== '—' && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-emerald-400" /> {customer.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-400" /> Joined{' '}
                  {new Date(customer.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-[#1A1A1E]/80 backdrop-blur-md rounded-xl border border-[#F5F1EA]/10 p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-ash mb-1">Total Spent</p>
            <p className="text-3xl font-display font-bold text-bone">
              ₹{metrics.totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
        <div className="bg-[#1A1A1E]/80 backdrop-blur-md rounded-xl border border-[#F5F1EA]/10 p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-ash mb-1">
              Total Orders
            </p>
            <p className="text-3xl font-display font-bold text-bone">{metrics.totalOrders}</p>
          </div>
        </div>
        <div className="bg-[#1A1A1E]/80 backdrop-blur-md rounded-xl border border-[#F5F1EA]/10 p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-ash mb-1">
              Average Order Value
            </p>
            <p className="text-3xl font-display font-bold text-bone">
              ₹{metrics.aov.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Order History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1A1A1E]/80 backdrop-blur-md rounded-xl border border-[#F5F1EA]/10 shadow-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-[#F5F1EA]/10 flex items-center gap-2">
              <Package className="w-5 h-5 text-cobalt" />
              <h2 className="text-lg font-display tracking-tight text-bone">Order History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-sm text-bone">
                <thead className="bg-black/20 border-b border-[#F5F1EA]/10">
                  <tr>
                    <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-xs">
                      Order
                    </th>
                    <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-xs">
                      Date
                    </th>
                    <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-xs text-center">
                      Items
                    </th>
                    <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-xs">
                      Status
                    </th>
                    <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-xs text-right">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F1EA]/5">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-ash">
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#F5F1EA]/5 transition-colors group">
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-cobalt hover:underline"
                          >
                            {order.publicOrderId || order.id.slice(0, 8)}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-ash">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center">{order.itemCount}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-4 text-right font-medium">
                          ₹{order.total.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Addresses & Designs */}
        <div className="space-y-6">
          {/* Addresses */}
          <div className="bg-[#1A1A1E]/80 backdrop-blur-md rounded-xl border border-[#F5F1EA]/10 shadow-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-[#F5F1EA]/10 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-display tracking-tight text-bone">Saved Addresses</h2>
            </div>
            <div className="divide-y divide-[#F5F1EA]/5 font-mono max-h-[300px] overflow-y-auto custom-scrollbar">
              {addresses.length === 0 ? (
                <p className="px-6 py-6 text-sm text-ash text-center">No saved addresses.</p>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-bone">{addr.name}</span>
                      {addr.isDefault && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20 uppercase tracking-widest">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ash leading-relaxed">
                      {addr.street}
                      <br />
                      {addr.city}, {addr.state} {addr.zip}
                      <br />
                      {addr.country}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Designs */}
          <div className="bg-[#1A1A1E]/80 backdrop-blur-md rounded-xl border border-[#F5F1EA]/10 shadow-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-[#F5F1EA]/10 flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-display tracking-tight text-bone">Saved Designs</h2>
            </div>
            <div className="divide-y divide-[#F5F1EA]/5 font-mono max-h-[300px] overflow-y-auto custom-scrollbar">
              {designs.length === 0 ? (
                <p className="px-6 py-6 text-sm text-ash text-center">No saved designs.</p>
              ) : (
                designs.map((design) => (
                  <div
                    key={design.id}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-[#F5F1EA]/5 transition-colors"
                  >
                    {design.previewUrl ? (
                      <img
                        src={design.previewUrl}
                        alt={design.title}
                        className="w-12 h-12 rounded-lg object-cover bg-white/5 border border-white/10"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center text-[10px] text-ash text-center p-1">
                        No Image
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-bone">{design.title}</p>
                      <p className="text-xs text-ash mt-0.5">
                        Product ID: {design.productId.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
