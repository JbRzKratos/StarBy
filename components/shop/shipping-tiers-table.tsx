'use client';

import React from 'react';
import { usePrice } from '@/lib/hooks/usePrice';

interface TierData {
  region: string;
  standard: string;
  express: string;
  freeThreshold: number;
}

const TIERS: TierData[] = [
  {
    region: 'Domestic (India)',
    standard: '3-5 days',
    express: '1-2 days',
    freeThreshold: 999,
  },
  {
    region: 'Asia Pacific',
    standard: '7-10 days',
    express: '3-5 days',
    freeThreshold: 2499,
  },
  {
    region: 'Europe & Americas',
    standard: '10-14 days',
    express: '5-7 days',
    freeThreshold: 3999,
  },
  {
    region: 'Rest of World',
    standard: '12-18 days',
    express: '7-10 days',
    freeThreshold: 4999,
  },
];

export function ShippingTiersTable() {
  const { formatPrice } = usePrice();

  return (
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
          {TIERS.map((tier) => (
            <tr key={tier.region} className="border-b border-smoke/50">
              <td className="py-4 font-display text-body-md text-bone">{tier.region}</td>
              <td className="py-4 font-mono text-body-sm text-pearl">{tier.standard}</td>
              <td className="py-4 font-mono text-body-sm text-pearl">{tier.express}</td>
              <td className="py-4 font-mono text-body-sm text-cobalt">
                {formatPrice(tier.freeThreshold)}+
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
