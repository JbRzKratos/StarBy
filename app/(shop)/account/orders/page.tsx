import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { products } from '@/data/products';

/** Format a number as Indian Rupees — used here because this is a server component */
const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

export default async function AccountOrdersPage() {
  let orders: Prisma.OrderGetPayload<{ include: { items: true } }>[] = [];

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    // Fetch real orders from database
    orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    // Fallback if DB not configured yet
  }

  return (
    <main className="min-h-screen bg-charcoal text-bone pt-36 pb-24">
      <div className="section-container">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/account"
            className="font-mono text-caption text-pearl hover:text-bone transition-colors"
          >
            ← Account Dashboard
          </Link>
        </div>

        <div className="mb-12 pb-6 border-b border-smoke/20">
          <span className="font-mono text-caption text-cobalt uppercase tracking-widest block mb-2">
            History
          </span>
          <h1 className="font-display text-4xl md:text-5xl uppercase tracking-tighter">
            Your Orders
          </h1>
        </div>

        {/* Orders List */}
        {orders.length > 0 ? (
          <div className="flex flex-col gap-6">
            {orders.map((order) => {
              const estDate = order.estimatedDeliveryDate
                ? new Date(order.estimatedDeliveryDate).toLocaleDateString()
                : 'TBD';
              return (
                <div
                  key={order.id}
                  className="bg-graphite border border-smoke/40 p-6 md:p-8 rounded-lg flex flex-col gap-6"
                >
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pb-6 border-b border-smoke/20">
                    <div>
                      <span className="font-mono text-caption text-ash uppercase">Order ID</span>
                      <p className="font-mono text-body-sm text-bone font-bold mt-1">{order.id}</p>
                    </div>
                    <div>
                      <span className="font-mono text-caption text-ash uppercase">Date</span>
                      <p className="font-mono text-body-sm text-bone mt-1">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-mono text-caption text-ash uppercase">
                        Est. Delivery
                      </span>
                      <p className="font-mono text-body-sm text-emerald-400 mt-1">{estDate}</p>
                    </div>
                    <div>
                      <span className="font-mono text-caption text-ash uppercase">Status</span>
                      <p className="font-mono text-caption text-cobalt uppercase font-bold mt-1 bg-cobalt/10 inline-block px-2 py-1 rounded">
                        {order.status.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <span className="font-mono text-caption text-ash uppercase">
                        Total Amount
                      </span>
                      <p className="font-display text-xl text-bone mt-1">
                        {formatINR(order.total)}
                      </p>
                      {order.discount ? (
                        <p className="font-mono text-caption text-emerald-400">
                          (Saved {formatINR(order.discount)})
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {order.items.map((item) => {
                      const product = products.find((p) => p.id === item.productId);
                      const variant = product?.variants.find((v) => v.id === item.variantId);
                      const displayName = product?.name ?? `Product ${item.productId}`;
                      const displayVariant = variant?.name ?? item.variantId;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between font-mono text-body-sm text-pearl"
                        >
                          <span>
                            {displayName}
                            {variant ? ` — ${displayVariant}` : ''}
                            {item.size ? ` (${item.size})` : ''} × {item.quantity}
                          </span>
                          <span className="text-bone">{formatINR(item.price * item.quantity)}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-smoke/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {order.trackingNumber ? (
                      <div className="flex-1 bg-graphite/50 p-3 border border-smoke/20 rounded">
                        <span className="font-mono text-[10px] text-ash uppercase tracking-widest block mb-1">
                          Tracking Information
                        </span>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <p className="font-mono text-body-sm text-bone">
                            {order.carrier} —{' '}
                            <span className="font-bold text-cobalt">{order.trackingNumber}</span>
                          </p>
                          {order.trackingUrl && (
                            <a
                              href={order.trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#3B5EFF] text-xs hover:underline uppercase tracking-wider font-mono font-bold"
                            >
                              Track Package ↗
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <span className="font-mono text-caption text-ash italic">
                          Tracking info will appear here once shipped.
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-center">
                      <Link
                        href={`/account/orders/${order.id}/track`}
                        className="bg-charcoal border border-smoke text-bone hover:bg-smoke/20 px-4 py-2 font-mono text-[10px] uppercase tracking-widest rounded transition-colors whitespace-nowrap text-center"
                      >
                        Track Timeline
                      </Link>
                      <Link
                        href={`/api/orders/${order.id}/invoice`}
                        target="_blank"
                        className="bg-bone text-charcoal hover:bg-pearl px-4 py-2 font-mono text-[10px] uppercase tracking-widest rounded transition-colors whitespace-nowrap text-center"
                      >
                        Print Invoice
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center border border-dashed border-smoke/30 rounded-lg p-12">
            <h3 className="font-display text-3xl text-bone mb-3">No orders found yet</h3>
            <p className="font-mono text-caption text-pearl mb-8">
              When you place an order, it will appear right here with live status updates.
            </p>
            <Link
              href="/products/all"
              className="inline-block bg-cobalt hover:bg-cobalt/90 text-bone font-mono text-caption uppercase tracking-widest px-8 py-4 rounded transition-all hover:scale-105"
            >
              Explore Catalog →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
