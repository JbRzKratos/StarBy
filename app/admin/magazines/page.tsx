'use client';

import { useState } from 'react';

interface MagazineAdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  magazineTitle: string;
  orderType: 'Template Created' | 'Customer PDF Upload';
  pageCount: number;
  format: string;
  coverFinish: string;
  paperWeight: string;
  binding: string;
  quantity: number;
  totalPrice: number;
  preflightStatus: 'Passed (300 DPI)' | 'Requires Review';
  fileUrl: string;
  status: 'Ready for Printing' | 'Preflight Review' | 'Printing' | 'Shipped' | 'Delivered';
  createdAt: string;
}

const SAMPLE_MAGAZINE_ORDERS: MagazineAdminOrder[] = [
  {
    id: 'ord-m01',
    orderNumber: 'FRG-2026-0891',
    customerName: 'Marcus Vance',
    customerEmail: 'marcus@vancestudio.com',
    magazineTitle: 'Vogue Luxe Editorial · Issue 04',
    orderType: 'Template Created',
    pageCount: 12,
    format: 'A4 Portrait (210×297mm)',
    coverFinish: 'Velvet Soft-Touch Matte (300gsm)',
    paperWeight: '170gsm Heavy Silk',
    binding: 'Saddle-Stitched',
    quantity: 50,
    totalPrice: 24950,
    preflightStatus: 'Passed (300 DPI)',
    fileUrl: '/sample-print.pdf',
    status: 'Ready for Printing',
    createdAt: '2026-08-24T14:30:00Z',
  },
  {
    id: 'ord-m02',
    orderNumber: 'FRG-2026-0892',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah@kinetictech.io',
    magazineTitle: 'Future Tech & Gear Catalogue',
    orderType: 'Customer PDF Upload',
    pageCount: 16,
    format: 'A4 Landscape (297×210mm)',
    coverFinish: 'High-Gloss UV Coated (300gsm)',
    paperWeight: '250gsm Heavy Gloss',
    binding: 'Perfect Bound',
    quantity: 100,
    totalPrice: 64900,
    preflightStatus: 'Passed (300 DPI)',
    fileUrl: '/sample-tech.pdf',
    status: 'Printing',
    createdAt: '2026-08-23T11:15:00Z',
  },
];

export default function AdminMagazinesPage() {
  const [orders] = useState<MagazineAdminOrder[]>(SAMPLE_MAGAZINE_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<MagazineAdminOrder | null>(null);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-bone">Magazine Print Production</h1>
          <p className="text-sm text-ash/60">
            Inspect preflight validation, customer print specifications, and download
            production-ready PDFs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
            {orders.length} Active Print Orders
          </span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-black/20 rounded-xl border border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-ash/80">
            <thead className="bg-black/40 text-xs uppercase font-semibold text-ash/60 border-b border-white/10">
              <tr>
                <th className="px-6 py-3.5">Order ID</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Magazine Title</th>
                <th className="px-6 py-3.5">Type & Pages</th>
                <th className="px-6 py-3.5">Preflight</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-bone">{ord.orderNumber}</td>
                  <td className="px-6 py-4">
                    <div className="text-bone font-semibold">{ord.customerName}</div>
                    <div className="text-xs text-ash/60 font-mono">{ord.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-bone">{ord.magazineTitle}</div>
                    <div className="text-xs text-ash/60">{ord.format}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-white/5 text-ash font-mono">
                      {ord.orderType} · {ord.pageCount}p
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      ✓ {ord.preflightStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                      {ord.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(ord)}
                      className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold transition-colors"
                    >
                      Print Details →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Inspection Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black/20 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-[#0057FF] uppercase">
                  Production Inspection
                </span>
                <h3 className="text-xl font-bold text-bone">{selectedOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-ash/60 hover:text-gray-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl bg-black/40 space-y-1">
                <span className="text-xs text-ash/60 block">Customer Information</span>
                <div className="font-bold text-bone">{selectedOrder.customerName}</div>
                <div className="text-xs text-ash/80">{selectedOrder.customerEmail}</div>
              </div>

              <div className="p-4 rounded-xl bg-black/40 space-y-1">
                <span className="text-xs text-ash/60 block">Order Specifications</span>
                <div className="font-bold text-bone">
                  {selectedOrder.pageCount} Pages · {selectedOrder.format}
                </div>
                <div className="text-xs text-ash/80">
                  {selectedOrder.quantity} Copies · ₹{selectedOrder.totalPrice.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm border-t border-white/5 pt-4">
              <h4 className="font-bold text-bone">Print Team Specifications</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-ash/80">
                <div>
                  Cover Finish:{' '}
                  <strong className="text-bone">{selectedOrder.coverFinish}</strong>
                </div>
                <div>
                  Interior Stock:{' '}
                  <strong className="text-bone">{selectedOrder.paperWeight}</strong>
                </div>
                <div>
                  Binding: <strong className="text-bone">{selectedOrder.binding}</strong>
                </div>
                <div>
                  Bleed Setup: <strong className="text-emerald-600">+3mm Verified</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-lg bg-white/5 text-ash font-semibold text-xs"
              >
                Close
              </button>
              <a
                href={selectedOrder.fileUrl}
                download
                className="px-5 py-2.5 rounded-lg bg-[#0057FF] hover:bg-[#0046CC] text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-[#0057FF]/20"
              >
                <span>Download Print PDF (300 DPI)</span>
                <span>↓</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
