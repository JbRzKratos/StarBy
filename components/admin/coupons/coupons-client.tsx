'use client';

import { useState, useTransition } from 'react';
import { ConfirmDialog, AdminToast, useToast } from '../ui/confirm-dialog';
import { AdminBadge } from '../ui/badge';
import { createCoupon, updateCoupon, deleteCoupon } from '@/app/admin/lib/actions';

interface CouponRow {
  id: string; code: string; discountType: string; discountValue: number;
  minOrderValue: number | null; maxUses: number | null; usageCount: number;
  isActive: boolean; expiresAt: string | null; createdAt: string;
}

const BLANK = {
  code: '', discountType: 'percentage', discountValue: 10,
  minOrderValue: null as number | null, maxUses: null as number | null,
  isActive: true, expiresAt: ''
};

export function CouponsClient({ coupons }: { coupons: CouponRow[] }) {
  const { toast, show, dismiss } = useToast();
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(BLANK);

  function openCreate() {
    setShowCreate(true);
    setForm(BLANK);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await createCoupon({
          ...form,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        });
        show('Coupon created', 'success');
        setShowCreate(false);
      } catch (e) {
        show(e instanceof Error ? e.message : 'Error', 'error');
      }
    });
  }

  function handleToggleActive(id: string, currentStatus: boolean) {
    startTransition(async () => {
      try {
        await updateCoupon(id, { isActive: !currentStatus });
        show('Coupon status updated', 'success');
      } catch {
        show('Error updating coupon', 'error');
      }
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      try {
        await deleteCoupon(deleteId);
        show('Coupon deleted', 'success');
      } catch (e) {
        show(e instanceof Error ? e.message : 'Cannot delete', 'error');
      } finally { setDeleteId(null); }
    });
  }

  const inputClass = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3B5EFF]/20 focus:border-[#3B5EFF]';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-500">Manage discount codes</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-[#3B5EFF] text-white text-sm font-medium rounded-lg hover:bg-[#2a4de8] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Create Coupon
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-900">New Coupon</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Code</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '') })} className={`${inputClass} font-mono uppercase`} placeholder="SUMMER20" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Type</label>
              <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className={inputClass}>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Value</label>
              <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Expiry Date</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Min Order Amount (₹)</label>
              <input type="number" placeholder="No limit" value={form.minOrderValue || ''} onChange={(e) => setForm({ ...form, minOrderValue: parseFloat(e.target.value) || null })} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Max Uses</label>
              <input type="number" placeholder="Unlimited" value={form.maxUses || ''} onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value) || null })} className={inputClass} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={isPending || !form.code || form.discountValue <= 0} className="px-4 py-2 bg-[#3B5EFF] text-white text-sm font-semibold rounded-lg hover:bg-[#2a4de8] disabled:opacity-50 transition-colors">
              {isPending ? 'Saving…' : 'Create Coupon'}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Discount</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Limits</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Uses</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {coupons.map((c) => {
              const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
              const isMaxedOut = c.maxUses && c.usageCount >= c.maxUses;
              const statusVariant = !c.isActive ? 'cancelled' : isExpired || isMaxedOut ? 'refunded' : 'active';
              const statusLabel = !c.isActive ? 'Inactive' : isExpired ? 'Expired' : isMaxedOut ? 'Depleted' : 'Active';

              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">{c.code}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {c.discountType === 'percentage' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 space-y-0.5">
                    {c.minOrderValue ? <p>Min: ₹{c.minOrderValue}</p> : <p>Min: None</p>}
                    {c.expiresAt ? <p>Exp: {new Date(c.expiresAt).toLocaleDateString('en-IN')}</p> : <p>Exp: Never</p>}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {c.usageCount} {c.maxUses ? `/ ${c.maxUses}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <AdminBadge variant={statusVariant} label={statusLabel} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => handleToggleActive(c.id, c.isActive)} className="text-xs text-gray-600 hover:text-gray-900 font-medium">
                        {c.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => setDeleteId(c.id)} className="text-xs text-red-600 hover:underline font-medium">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {coupons.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">No coupons created yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {deleteId && (
        <ConfirmDialog
          title="Delete coupon"
          description="Are you sure you want to permanently delete this coupon?"
          confirmLabel="Delete"
          destructive
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
      {toast && <AdminToast message={toast.message} type={toast.type} onDismiss={dismiss} />}
    </div>
  );
}
