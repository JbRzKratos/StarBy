'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  date: string; // 'YYYY-MM-DD'
  revenue: number;
}

interface RevenueChartProps {
  data: DataPoint[];
}

type Range = '7d' | '30d' | '90d';

function aggregateByDay(points: DataPoint[]) {
  const map = new Map<string, number>();
  for (const p of points) {
    map.set(p.date, (map.get(p.date) || 0) + p.revenue);
  }
  return Array.from(map.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [range, setRange] = useState<Range>('30d');

  const filtered = useMemo(() => {
    const now = new Date();
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const cutoffStr = cutoff.toISOString().split('T')[0] ?? '';
    const sliced = data.filter((d) => d.date >= cutoffStr);
    return aggregateByDay(sliced);
  }, [data, range]);

  const total = filtered.reduce((sum, d) => sum + d.revenue, 0);

  const customTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: readonly { value?: number | string }[];
    label?: string | number;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
          <p className="text-xs text-gray-500">{formatDateLabel(String(label || ''))}</p>
          <p className="text-sm font-semibold text-gray-900">
            ₹{Number(payload[0]?.value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-500">
          Total:{' '}
          <span className="font-semibold text-gray-900">
            ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </p>
        <div className="flex gap-1">
          {(['7d', '30d', '90d'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                range === r
                  ? 'bg-[#3B5EFF] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {filtered.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-gray-400">
          No revenue data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={filtered} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={customTooltip} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3B5EFF"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3B5EFF' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
