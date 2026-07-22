'use client';

import { useState, useTransition } from 'react';
import { ConfirmDialog, AdminToast, useToast } from '../ui/confirm-dialog';
import { AdminBadge } from '../ui/badge';
import { promoteToStaff, demoteToCustomer } from '@/app/admin/lib/actions';

interface StaffRow {
  id: string; email: string; name: string; role: string; createdAt: string;
}

export function StaffClient({ staff }: { staff: StaffRow[] }) {
  const { toast, show, dismiss } = useToast();
  const [isPending, startTransition] = useTransition();
  const [demoteId, setDemoteId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addEmail, setAddEmail] = useState('');

  function handlePromote() {
    if (!addEmail) return;
    startTransition(async () => {
      try {
        await promoteToStaff(addEmail);
        show('User promoted to STAFF', 'success');
        setShowAdd(false);
        setAddEmail('');
      } catch (e) {
        show(e instanceof Error ? e.message : 'User not found or error', 'error');
      }
    });
  }

  function handleDemote() {
    if (!demoteId) return;
    startTransition(async () => {
      try {
        await demoteToCustomer(demoteId);
        show('Staff demoted to customer', 'success');
      } catch (e) {
        show(e instanceof Error ? e.message : 'Cannot demote', 'error');
      } finally {
        setDemoteId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Staff Access</h1>
          <p className="text-sm text-gray-500">Manage admin panel users</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-[#3B5EFF] text-white text-sm font-medium rounded-lg hover:bg-[#2a4de8] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Staff
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 flex items-end gap-3 max-w-xl">
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-700 block mb-1">User Email to Promote</label>
            <input
              type="email"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#3B5EFF]/20 focus:border-[#3B5EFF]"
            />
          </div>
          <button onClick={handlePromote} disabled={isPending || !addEmail} className="px-4 py-2.5 bg-[#3B5EFF] text-white text-sm font-semibold rounded-lg hover:bg-[#2a4de8] disabled:opacity-50 transition-colors">
            {isPending ? 'Promoting…' : 'Promote'}
          </button>
          <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name / Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {staff.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <AdminBadge variant={u.role === 'ADMIN' ? 'paid' : 'staff'} label={u.role} />
                </td>
                <td className="px-4 py-3 text-gray-600 text-sm">
                  {new Date(u.createdAt).toLocaleDateString('en-IN')}
                </td>
                <td className="px-4 py-3 text-right">
                  {u.role !== 'ADMIN' && (
                    <button onClick={() => setDemoteId(u.id)} className="text-xs text-red-600 hover:underline font-medium">
                      Remove Access
                    </button>
                  )}
                  {u.role === 'ADMIN' && (
                    <span className="text-xs text-gray-400 italic">Superadmin</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {demoteId && (
        <ConfirmDialog
          title="Remove Staff Access"
          description="This will demote the user to a standard CUSTOMER. They will lose access to the admin panel immediately."
          confirmLabel="Remove Access"
          destructive
          onConfirm={handleDemote}
          onCancel={() => setDemoteId(null)}
        />
      )}
      {toast && <AdminToast message={toast.message} type={toast.type} onDismiss={dismiss} />}
    </div>
  );
}
