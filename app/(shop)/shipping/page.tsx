import type { Metadata } from 'next';
import { ShippingTiersTable } from '@/components/shop/shipping-tiers-table';

export const metadata: Metadata = {
  title: 'Shipping & Delivery | Fregoro Studios',
  description:
    'Every Fregoro Studios product is made on demand, packed with care, and shipped to your door. Review our domestic and global shipping timelines and rates.',
  openGraph: {
    title: 'Shipping & Delivery | Fregoro Studios',
    description:
      'Learn about Fregoro Studios production times, domestic express delivery, and worldwide shipping.',
  },
};

export default function ShippingPage() {
  return (
    <main className="pt-36 md:pt-40 pb-20">
      <div className="section-container max-w-4xl">
        <div className="mb-12">
          <span className="overline-label block mb-3">Info</span>
          <h1 className="font-display text-display-lg md:text-display-xl font-bold text-bone mb-4">
            Shipping & Delivery
          </h1>
          <p className="text-pearl text-body-lg max-w-2xl">
            Every Fregoro Studios product is made on demand, packed with care, and shipped to your
            door.
          </p>
        </div>

        {/* Shipping table client component with dynamic currency support */}
        <ShippingTiersTable />

        {/* Policies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-graphite border border-smoke rounded-lg p-8">
            <h2 className="font-display text-display-sm font-bold text-bone mb-3">
              Production Time
            </h2>
            <p className="text-pearl text-body-sm leading-relaxed">
              All products are made on demand. Standard production takes 3-5 business days. Rush
              production (1-2 days) is available for select items.
            </p>
          </div>
          <div className="bg-graphite border border-smoke rounded-lg p-8">
            <h2 className="font-display text-display-sm font-bold text-bone mb-3">Tracking</h2>
            <p className="text-pearl text-body-sm leading-relaxed">
              You&apos;ll receive a tracking number via email once your order ships. Track your
              package in real time through our order status page.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
