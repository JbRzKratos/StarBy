import type { Metadata } from 'next';
import { BulkOrderLanding } from '@/components/bulk-orders/bulk-order-landing';

export const metadata: Metadata = {
  title: 'Custom Bulk T-Shirts, Hoodies & Apparel | Fregoro Studios',
  description:
    'Dedicated custom bulk apparel and merchandise manufacturing for corporate teams, college festivals, sports jerseys, creator brands, startups, and community events. Premium fabrics (180–280 GSM), industrial DTF and screen printing with size-specific quantity allocation.',
  keywords: [
    'custom bulk t-shirts',
    'corporate merchandise',
    'event apparel',
    'college fest t-shirts',
    'sports jerseys bulk',
    'custom oversized hoodies',
    'Fregoro bulk apparel',
    'screen printing India',
    'DTF printing bulk',
    'teamwear manufacturing',
  ],
  openGraph: {
    title: 'Custom Bulk T-Shirts, Hoodies & Apparel | Fregoro Studios',
    description:
      'Order custom bulk apparel for teams, companies, colleges, and events. Upload your designs, choose fabrics and colors, and receive a dedicated production quote.',
    type: 'website',
  },
};

export default function BulkOrdersPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <BulkOrderLanding />
    </main>
  );
}
