import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../lib/auth';
import { SettingsClient } from '@/components/admin/settings/settings-client';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  await requireAdmin(); // Settings should be admin-only

  let settingsData = {
    id: 'new',
    storeName: 'Fregoro Studios',
    contactEmail: 'fregorostudios@gmail.com',
    taxRate: 18,
  };

  let zonesData: Array<{
    id: string;
    name: string;
    states: string[];
    rateType: string;
    rateValue: number;
  }> = [];

  try {
    const [settings, shippingZones] = await Promise.all([
      prisma.storeSettings
        .findFirst({ orderBy: { updatedAt: 'desc' } })
        .catch(() => null),
      prisma.shippingZone.findMany().catch(() => []),
    ]);

    if (settings) {
      settingsData = {
        id: settings.id,
        storeName: settings.storeName || 'Fregoro Studios',
        contactEmail: settings.contactEmail || 'fregorostudios@gmail.com',
        taxRate: typeof settings.taxRate === 'number' ? settings.taxRate : 18,
      };
    }

    if (Array.isArray(shippingZones)) {
      zonesData = shippingZones.map((z) => ({
        id: z.id,
        name: z.name || 'Default Zone',
        states: Array.isArray(z.states) ? z.states : [],
        rateType: z.rateType || 'FLAT',
        rateValue: typeof z.rateValue === 'number' ? z.rateValue : 0,
      }));
    }
  } catch (err) {
    console.error('[AdminSettingsPage] Error loading settings/shipping zones:', err);
  }

  return <SettingsClient settings={settingsData} shippingZones={zonesData} />;
}
