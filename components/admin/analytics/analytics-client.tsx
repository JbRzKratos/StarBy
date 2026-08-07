'use client';

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

interface AnalyticsClientProps {
  chartData: { date: string; revenue: number }[];
  totalRevenue30d: number;
  totalOrders30d: number;
  topSellers: { id: string; name: string; category: string; unitsSold: number }[];
}

export function AnalyticsClient({
  chartData,
  totalRevenue30d,
  totalOrders30d,
  topSellers,
}: AnalyticsClientProps) {
  const avgOrderValue = totalOrders30d > 0 ? totalRevenue30d / totalOrders30d : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display-sm font-bold text-bone mb-2">Analytics</h1>
        <p className="font-mono text-body-sm text-pearl">Performance over the last 30 days</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <div className="bg-charcoal rounded-sm border border-smoke p-5">
          <p className="text-caption uppercase tracking-widest text-ash mb-2">Total Revenue (30d)</p>
          <p className="text-2xl font-bold text-bone">
            ₹{totalRevenue30d.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-charcoal rounded-sm border border-smoke p-5">
          <p className="text-caption uppercase tracking-widest text-ash mb-2">Total Orders (30d)</p>
          <p className="text-2xl font-bold text-bone">{totalOrders30d}</p>
        </div>
        <div className="bg-charcoal rounded-sm border border-smoke p-5">
          <p className="text-caption uppercase tracking-widest text-ash mb-2">Average Order Value</p>
          <p className="text-2xl font-bold text-bone">
            ₹{Math.round(avgOrderValue).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-charcoal rounded-sm border border-smoke p-5">
          <h2 className="font-mono text-caption uppercase tracking-widest text-pearl mb-6">Revenue Trend (30 Days)</h2>
          <div className="h-72 w-full font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B5EFF" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B5EFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333333" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#808080' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#808080' }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '2px',
                    border: '1px solid #333333',
                    backgroundColor: '#1C1C1C',
                    color: '#F5F1EA',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)',
                  }}
                  itemStyle={{ color: '#F5F1EA' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [
                    `₹${Number(value || 0).toLocaleString('en-IN')}`,
                    'Revenue',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B5EFF"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-charcoal rounded-sm border border-smoke p-5">
          <h2 className="font-mono text-caption uppercase tracking-widest text-pearl mb-6">Top Selling Products</h2>
          <div className="h-72 w-full font-mono">
            {topSellers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topSellers}
                  layout="vertical"
                  margin={{ top: 0, right: 0, left: -30, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333333" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#808080' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#F5F1EA', width: 100 }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '2px', border: '1px solid #333333', backgroundColor: '#1C1C1C', color: '#F5F1EA' }}
                    itemStyle={{ color: '#F5F1EA' }}
                    cursor={{ fill: '#222222' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [value, 'Units Sold']}
                  />
                  <Bar dataKey="unitsSold" fill="#3B5EFF" radius={[0, 2, 2, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-mono text-ash">
                No sales data yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
