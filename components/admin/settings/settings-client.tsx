'use client';

import { useState, useTransition } from 'react';
import { AdminToast, useToast } from '../ui/confirm-dialog';
import { updateSettings } from '@/app/admin/lib/actions';

interface StoreSettings {
  id: string;
  storeName: string;
  contactEmail: string;
  taxRate: number;
}

interface ShippingZone {
  id: string;
  name: string;
  states: string[];
  rateType: string;
  rateValue: number;
}

export function SettingsClient({
  settings,
  shippingZones,
}: {
  settings: StoreSettings;
  shippingZones: ShippingZone[];
}) {
  const { toast, show, dismiss } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(settings);

  function handleSave() {
    startTransition(async () => {
      try {
        await updateSettings({
          storeName: form.storeName,
          contactEmail: form.contactEmail,
          taxRate: form.taxRate,
          currency: 'INR',
          maintenanceMode: false,
        });
        show('Settings saved successfully', 'success');
      } catch {
        show('Error saving settings', 'error');
      }
    });
  }

  const inputClass =
    'w-full text-sm font-mono bg-graphite border border-smoke text-bone rounded-sm px-3 py-2.5 focus:outline-none focus:border-cobalt';

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-display-sm font-bold text-bone mb-2">Store Settings</h1>
        <p className="font-mono text-body-sm text-pearl">Global configurations for StarBy</p>
      </div>

      <div className="bg-charcoal rounded-sm border border-smoke p-6 space-y-6">
        <h2 className="font-mono text-caption uppercase tracking-widest text-bone border-b border-smoke pb-3">
          General Information
        </h2>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="text-caption font-mono uppercase tracking-widest text-ash block mb-2">Store Name</label>
            <input
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-caption font-mono uppercase tracking-widest text-ash block mb-2">Contact Email</label>
            <input
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="bg-charcoal rounded-sm border border-smoke p-6 space-y-6">
        <h2 className="font-mono text-caption uppercase tracking-widest text-bone border-b border-smoke pb-3">
          Finance & Tax
        </h2>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="text-caption font-mono uppercase tracking-widest text-ash block mb-2">Tax Rate (%)</label>
            <input
              type="number"
              value={form.taxRate}
              onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="bg-charcoal rounded-sm border border-smoke p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-smoke pb-3">
          <h2 className="font-mono text-caption uppercase tracking-widest text-bone">Shipping Zones</h2>
          <span className="text-caption font-mono text-ash italic">Database management only for now</span>
        </div>
        <div className="space-y-3">
          {shippingZones.map((z) => (
            <div
              key={z.id}
              className="flex justify-between items-center p-4 border border-smoke rounded-sm bg-smoke/10"
            >
              <div>
                <p className="font-mono text-body-sm text-bone font-medium">{z.name}</p>
                <p className="text-caption text-ash mt-1">{z.states.join(', ')}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-body-sm font-semibold text-bone">
                  {z.rateType === 'percentage' ? `${z.rateValue}%` : `₹${z.rateValue}`}
                </p>
              </div>
            </div>
          ))}
          {shippingZones.length === 0 && (
            <p className="text-sm font-mono text-ash">No shipping zones configured in database.</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-3 bg-cobalt text-bone text-caption font-mono uppercase tracking-widest hover:bg-cobalt/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      {toast && <AdminToast message={toast.message} type={toast.type} onDismiss={dismiss} />}
    </div>
  );
}
