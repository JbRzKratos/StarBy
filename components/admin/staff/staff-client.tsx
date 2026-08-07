'use client';

import { useState, useTransition } from 'react';
import { ConfirmDialog, AdminToast, useToast } from '../ui/confirm-dialog';
import { StatusBadge } from '@/components/admin/status-badge';
import { promoteToStaff, demoteToCustomer } from '@/app/admin/lib/actions';

interface StaffRow {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-sm font-bold text-bone mb-2">Staff Access</h1>
          <p className="font-mono text-body-sm text-pearl">Manage admin panel users</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-6 py-3 bg-cobalt text-bone text-caption font-mono uppercase tracking-widest hover:bg-cobalt/90 transition-colors"
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
          Add Staff
        </button>
      </div>

      {showAdd && (
        <div className="bg-charcoal rounded-sm border border-smoke p-5 mb-4 flex flex-col sm:flex-row items-start sm:items-end gap-4 max-w-2xl">
          <div className="flex-1 w-full">
            <label className="text-caption font-mono uppercase tracking-widest text-ash block mb-2">
              User Email to Promote
            </label>
            <input
              type="email"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full text-sm font-mono border border-smoke bg-graphite text-bone rounded-sm px-3 py-2.5 focus:outline-none focus:border-cobalt"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handlePromote}
              disabled={isPending || !addEmail}
              className="px-6 py-2.5 bg-cobalt text-bone text-caption font-mono uppercase tracking-widest hover:bg-cobalt/90 disabled:opacity-50 transition-colors w-full sm:w-auto"
            >
              {isPending ? 'Promoting…' : 'Promote'}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-6 py-2.5 text-caption font-mono uppercase tracking-widest text-ash hover:text-bone w-full sm:w-auto"
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
                Name / Email
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">
                Role
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">
                Joined
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-smoke">
            {staff.map((u) => (
              <tr key={u.id} className="hover:bg-smoke/10">
                <td className="px-6 py-4">
                  <p className="font-medium text-bone">{u.name}</p>
                  <p className="text-caption text-ash mt-1">{u.email}</p>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={u.role} variant={u.role === 'ADMIN' ? 'success' : 'info'} />
                </td>
                <td className="px-6 py-4 text-pearl">
                  {new Date(u.createdAt).toLocaleDateString('en-IN')}
                </td>
                <td className="px-6 py-4 text-right">
                  {u.role !== 'ADMIN' && (
                    <button
                      onClick={() => setDemoteId(u.id)}
                      className="text-ember uppercase text-caption hover:underline"
                    >
                      Remove Access
                    </button>
                  )}
                  {u.role === 'ADMIN' && (
                    <span className="text-caption text-ash italic">Superadmin</span>
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
