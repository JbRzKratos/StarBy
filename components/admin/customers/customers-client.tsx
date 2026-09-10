'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

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
  const router = useRouter();

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
          <p className="font-mono text-sm text-ash">{customers.length} registered customers</p>
        </div>
      </div>

      <div className="bg-[#1A1A1E]/80 backdrop-blur-md rounded-xl border border-[#F5F1EA]/10 p-5 shadow-lg">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ash w-4 h-4" />
          <input
            type="text"
            placeholder="Search customer name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm font-mono border border-[#F5F1EA]/10 bg-black/20 text-bone rounded-lg focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt transition-all"
          />
        </div>
      </div>

      <div className="bg-[#1A1A1E]/80 backdrop-blur-md rounded-xl border border-[#F5F1EA]/10 overflow-x-auto shadow-lg">
        <table className="w-full text-left font-mono text-sm text-bone">
          <thead className="bg-black/20 border-b border-[#F5F1EA]/10">
            <tr>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-xs">
                Customer
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-xs text-center">
                Orders
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-xs text-right">
                Total Spent
              </th>
              <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-xs text-right">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F1EA]/5">
            {filtered.map((c) => (
              <tr
                key={c.id}
                onClick={() => router.push(`/admin/customers/${c.id}`)}
                className="hover:bg-[#F5F1EA]/5 cursor-pointer transition-colors group"
              >
                <td className="px-6 py-4">
                  <p className="font-medium text-bone group-hover:text-cobalt transition-colors">
                    {c.name}
                  </p>
                  <p className="text-xs text-ash mt-1">{c.email}</p>
                </td>
                <td className="px-6 py-4 text-center font-semibold text-pearl">
                  <span className="bg-smoke/20 px-2.5 py-1 rounded-md">{c.orderCount}</span>
                </td>
                <td className="px-6 py-4 text-right font-medium">
                  ₹{c.totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </td>
                <td className="px-6 py-4 text-ash text-right">
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
                <td colSpan={4} className="px-6 py-12 text-center text-ash text-sm">
                  No customers found matching "{search}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
