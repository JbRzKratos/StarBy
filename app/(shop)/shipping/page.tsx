import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping',
  description: 'StarBy shipping information, delivery times, and policies.',
};

const shippingTiers = [
  { region: 'Domestic (India)', standard: '3-5 days', express: '1-2 days', free: '₹999+' },
  { region: 'Asia Pacific', standard: '7-10 days', express: '3-5 days', free: '₹2499+' },
  { region: 'Europe & Americas', standard: '10-14 days', express: '5-7 days', free: '₹3999+' },
  { region: 'Rest of World', standard: '12-18 days', express: '7-10 days', free: '₹4999+' },
];

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
            Every StarBy product is made on demand, packed with care, and shipped to your door.
          </p>
        </div>

        {/* Shipping table */}
        <div className="overflow-x-auto mb-12">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-smoke">
                <th className="text-left py-4 font-mono text-caption text-ash uppercase tracking-widest">
                  Region
                </th>
                <th className="text-left py-4 font-mono text-caption text-ash uppercase tracking-widest">
                  Standard
                </th>
                <th className="text-left py-4 font-mono text-caption text-ash uppercase tracking-widest">
                  Express
                </th>
                <th className="text-left py-4 font-mono text-caption text-ash uppercase tracking-widest">
                  Free Above
                </th>
              </tr>
            </thead>
            <tbody>
              {shippingTiers.map((tier) => (
                <tr key={tier.region} className="border-b border-smoke/50">
                  <td className="py-4 font-display text-body-md text-bone">{tier.region}</td>
                  <td className="py-4 font-mono text-body-sm text-pearl">{tier.standard}</td>
                  <td className="py-4 font-mono text-body-sm text-pearl">{tier.express}</td>
                  <td className="py-4 font-mono text-body-sm text-cobalt">{tier.free}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
