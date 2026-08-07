'use client';

import { useState, useTransition } from 'react';
import { ConfirmDialog, AdminToast, useToast } from '../ui/confirm-dialog';
import { StatusBadge } from '@/components/admin/status-badge';
import { createCoupon, updateCoupon, deleteCoupon } from '@/app/admin/lib/actions';

interface CouponRow {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number | null;
  maxUses: number | null;
  usageCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const BLANK = {
  code: '',
  discountType: 'percentage',
  discountValue: 10,
  minOrderValue: null as number | null,
  maxUses: null as number | null,
  isActive: true,
  expiresAt: '',
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
          expiresAt: form.expiresAt ? new Date(form.expiresAt) : null,
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
      } finally {
        setDeleteId(null);
      }
    });
  }

  const inputClass =
    'w-full text-sm font-mono bg-graphite border border-smoke text-bone rounded-sm px-3 py-2 focus:outline-none focus:border-cobalt';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-display-sm font-bold text-bone mb-2">Coupons Manager</h1>
          <p className="font-mono text-body-sm text-pearl">Manage discount codes</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-cobalt text-bone text-caption font-mono uppercase tracking-widest hover:bg-cobalt/90 transition-colors w-full sm:w-auto"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Coupon
        </button>
      </div>

      {showCreate && (
        <div className="bg-charcoal rounded-sm border border-smoke p-5 space-y-4 mb-4">
          <h2 className="text-body-lg font-display text-bone border-b border-smoke pb-2">New Coupon</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-caption font-mono uppercase tracking-widest text-ash block mb-2">Code</label>
              <input
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '') })
                }
                className={`${inputClass} font-mono uppercase`}
                placeholder="SUMMER20"
              />
            </div>
            <div>
              <label className="text-caption font-mono uppercase tracking-widest text-ash block mb-2">Type</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className={inputClass}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="text-caption font-mono uppercase tracking-widest text-ash block mb-2">Value</label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) =>
                  setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-caption font-mono uppercase tracking-widest text-ash block mb-2">Expiry Date</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-caption font-mono uppercase tracking-widest text-ash block mb-2">
                Min Order Amount (₹)
              </label>
              <input
                type="number"
                placeholder="No limit"
                value={form.minOrderValue || ''}
                onChange={(e) =>
                  setForm({ ...form, minOrderValue: parseFloat(e.target.value) || null })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-caption font-mono uppercase tracking-widest text-ash block mb-2">Max Uses</label>
              <input
                type="number"
                placeholder="Unlimited"
                value={form.maxUses || ''}
                onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value) || null })}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={isPending || !form.code || form.discountValue <= 0}
              className="px-6 py-3 bg-cobalt text-bone text-caption font-mono uppercase tracking-widest hover:bg-cobalt/90 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Saving…' : 'Create Coupon'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-6 py-3 text-caption font-mono uppercase tracking-widest text-ash hover:text-bone"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-charcoal rounded-sm border border-smoke overflow-x-auto">
        <table className="w-full text-left font-mono text-body-sm text-bone">
          <thead className="bg-graphite border-b border-smoke">
            <tr>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">
                Code
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">
                Discount
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">
                Limits
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption text-center">
                Uses
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">
                Status
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-smoke">
            {coupons.map((c) => {
              const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
              const isMaxedOut = c.maxUses && c.usageCount >= c.maxUses;
              const statusVariant = !c.isActive
                ? 'inactive'
                : isExpired || isMaxedOut
                  ? 'inactive'
                  : 'active';

              return (
                <tr key={c.id} className="hover:bg-smoke/10">
                  <td className="px-6 py-4 font-bold text-bone">{c.code}</td>
                  <td className="px-6 py-4 text-pearl">
                    {c.discountType === 'percentage'
                      ? `${c.discountValue}% off`
                      : `₹${c.discountValue} off`}
                  </td>
                  <td className="px-6 py-4 text-ash space-y-1">
                    {c.minOrderValue ? <p>Min: ₹{c.minOrderValue}</p> : <p>Min: None</p>}
                    {c.expiresAt ? (
                      <p>Exp: {new Date(c.expiresAt).toLocaleDateString('en-IN')}</p>
                    ) : (
                      <p>Exp: Never</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-pearl">
                    {c.usageCount} {c.maxUses ? `/ ${c.maxUses}` : ''}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={statusVariant} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <button
                        onClick={() => handleToggleActive(c.id, c.isActive)}
                        className="text-cobalt uppercase text-caption hover:underline"
                      >
                        {c.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => setDeleteId(c.id)}
                        className="text-ember uppercase text-caption hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-ash">
                  No coupons created yet
                </td>
              </tr>
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
