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
    'w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#3B5EFF]/20 focus:border-[#3B5EFF]';

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Store Settings</h1>
        <p className="text-sm text-gray-500">Global configurations for StarBy</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
          General Information
        </h2>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Store Name</label>
            <input
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Contact Email</label>
            <input
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
          Finance & Tax
        </h2>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Tax Rate (%)</label>
            <input
              type="number"
              value={form.taxRate}
              onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-sm font-semibold text-gray-900">Shipping Zones</h2>
          <span className="text-xs text-gray-500 italic">Database management only for now</span>
        </div>
        <div className="space-y-3">
          {shippingZones.map((z) => (
            <div
              key={z.id}
              className="flex justify-between items-center p-3 border border-gray-100 rounded-lg bg-gray-50"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{z.name}</p>
                <p className="text-xs text-gray-500">{z.states.join(', ')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {z.rateType === 'percentage' ? `${z.rateValue}%` : `₹${z.rateValue}`}
                </p>
              </div>
            </div>
          ))}
          {shippingZones.length === 0 && (
            <p className="text-sm text-gray-500">No shipping zones configured in database.</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2.5 bg-[#3B5EFF] text-white text-sm font-semibold rounded-lg hover:bg-[#2a4de8] disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      {toast && <AdminToast message={toast.message} type={toast.type} onDismiss={dismiss} />}
    </div>
  );
}
