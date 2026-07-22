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
      settings={
        settings
          ? {
              id: settings.id,
              storeName: settings.storeName,
              contactEmail: settings.contactEmail,
              taxRate: settings.taxRate,
            }
          : {
              id: 'new',
              storeName: 'StarBy',
              contactEmail: 'contact@starby.in',
              taxRate: 18,
            }
      }
      shippingZones={shippingZones.map((z) => ({
        id: z.id,
        name: z.name,
        states: z.states,
        rateType: z.rateType,
        rateValue: z.rateValue,
      }))}
    />
  );
}
