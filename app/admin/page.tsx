import { prisma } from '@/lib/prisma';

export default async function AdminDashboardPage() {
  const [totalOrders, totalRevenueData, outOfStockVariants] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: {
        total: true,
      },
    }),
    prisma.productVariant.findMany({
      where: {
        inStock: false,
      },
      include: {
        product: true,
      },
    }),
  ]);

  const totalRevenue = totalRevenueData._sum.total || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-display-sm font-bold text-bone mb-2">Dashboard</h1>
        <p className="font-mono text-body-sm text-pearl">Overview of your store's performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-charcoal border border-smoke p-6 rounded-sm">
          <h3 className="font-mono text-caption uppercase tracking-widest text-ash mb-2">Total Revenue</h3>
          <p className="font-display text-display-sm text-emerald-400">₹{totalRevenue.toLocaleString()}</p>
        </div>
        
        <div className="bg-charcoal border border-smoke p-6 rounded-sm">
          <h3 className="font-mono text-caption uppercase tracking-widest text-ash mb-2">Total Orders</h3>
          <p className="font-display text-display-sm text-cobalt">{totalOrders}</p>
        </div>
        
        <div className="bg-charcoal border border-smoke p-6 rounded-sm">
          <h3 className="font-mono text-caption uppercase tracking-widest text-ash mb-2">Out of Stock Variants</h3>
          <p className="font-display text-display-sm text-ember">{outOfStockVariants.length}</p>
        </div>
      </div>

      <div>
        <h2 className="font-display text-body-lg font-bold text-bone mb-4 border-b border-smoke pb-2">Low-Stock Alerts</h2>
        {outOfStockVariants.length === 0 ? (
          <p className="font-mono text-body-sm text-pearl">All variants are currently in stock.</p>
        ) : (
          <div className="bg-charcoal border border-smoke rounded-sm overflow-hidden">
            <table className="w-full text-left font-mono text-body-sm text-bone">
              <thead className="bg-graphite border-b border-smoke">
                <tr>
                  <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">Product</th>
                  <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption">Variant</th>
                  <th className="px-6 py-4 font-normal text-ash uppercase tracking-widest text-caption text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-smoke">
                {outOfStockVariants.map(variant => (
                  <tr key={variant.id} className="hover:bg-smoke/10 transition-colors">
                    <td className="px-6 py-4">{variant.product.name}</td>
                    <td className="px-6 py-4">{variant.name} ({variant.color})</td>
                    <td className="px-6 py-4 text-right">
                      <span className="bg-ember/20 text-ember px-3 py-1 rounded-full text-caption">Out of Stock</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
