'use client';

import { useState } from 'react';

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

export function CustomersClient({ customers }: { customers: CustomerRow[] }) {
  const [search, setSearch] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-sm font-bold text-bone mb-2">Customers</h1>
          <p className="font-mono text-body-sm text-pearl">{customers.length} registered customers</p>
        </div>
      </div>

      <div className="bg-charcoal rounded-sm border border-smoke p-4">
        <div className="relative max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ash"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search customer name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-smoke bg-graphite text-bone rounded-sm focus:outline-none focus:border-cobalt"
          />
        </div>
      </div>

      <div className="bg-charcoal rounded-sm border border-smoke overflow-x-auto">
        <table className="w-full text-left font-mono text-body-sm text-bone">
          <thead className="bg-graphite border-b border-smoke">
            <tr>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">
                Customer
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption text-center">
                Orders
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption text-right">
                Total Spent
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-smoke">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-smoke/10">
                <td className="px-6 py-4">
                  <p className="font-medium text-bone">{c.name}</p>
                  <p className="text-caption text-ash mt-1">{c.email}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  {c.orderCount}
                </td>
                <td className="px-6 py-4 text-right">
                  ₹{c.totalSpent.toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 text-pearl">
                  {new Date(c.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-ash">
                  No customers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
