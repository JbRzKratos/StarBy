import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../lib/auth';
import { SettingsClient } from '@/components/admin/settings/settings-client';

export default async function AdminSettingsPage() {
  await requireAdmin(); // Settings should be admin-only

  const [settings, shippingZones] = await Promise.all([
    prisma.storeSettings.findFirst(),
    prisma.shippingZone.findMany(),
  ]);

  return (
    <SettingsClient
      settings={settings ? {
        id: settings.id,
        storeName: settings.storeName,
        contactEmail: settings.contactEmail,
        currency: settings.currency,
        taxRate: settings.taxRate,
        maintenanceMode: settings.maintenanceMode,
      } : {
        id: 'new',
        storeName: 'StarBy',
        contactEmail: 'contact@starby.in',
        currency: 'INR',
        taxRate: 18,
        maintenanceMode: false,
      }}
      shippingZones={shippingZones.map((z) => ({
        id: z.id,
        name: z.name,
        countries: z.countries,
        rate: z.rate,
        freeShippingThreshold: z.freeShippingThreshold,
      }))}
    />
  );
}
