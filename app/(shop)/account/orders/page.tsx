import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
              const estDate = order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toLocaleDateString() : 'TBD';
              return (
                <div
                  key={order.id}
                  className="bg-graphite border border-smoke/40 p-6 md:p-8 rounded-lg flex flex-col gap-6"
                >
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pb-6 border-b border-smoke/20">
                    <div>
                      <span className="font-mono text-caption text-ash uppercase">Order ID</span>
                      <p className="font-mono text-body-sm text-bone font-bold mt-1">
                        {order.id}
                      </p>
                    </div>
                    <div>
                      <span className="font-mono text-caption text-ash uppercase">Date</span>
                      <p className="font-mono text-body-sm text-bone mt-1">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-mono text-caption text-ash uppercase">Est. Delivery</span>
                      <p className="font-mono text-body-sm text-emerald-400 mt-1">
                        {estDate}
                      </p>
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
                      <p className="font-display text-xl text-bone mt-1">₹{order.total}</p>
                      {order.discount ? (
                        <p className="font-mono text-caption text-emerald-400">
                          (Saved ₹{order.discount})
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between font-mono text-body-sm text-pearl"
                      >
                        <span>
                          Product #{item.productId} (Variant {item.variantId}) ×{' '}
                          {item.quantity}
                        </span>
                        <span className="text-bone">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
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
