import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { products } from '@/data/products';

export const dynamic = 'force-dynamic';

/** Format a number as Indian Rupees */
const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

export default async function AccountOrdersPage() {
  let orders: Prisma.OrderGetPayload<{
    include: {
      items: {
        include: {
          orderCustomization: true;
        };
      };
      statusHistory: true;
    };
  }>[] = [];

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
        items: {
          include: {
            orderCustomization: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('Error fetching account orders:', err);
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#F5F1EA] pt-36 md:pt-44 pb-24">
      <div className="section-container max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/account"
            className="font-mono text-xs text-[#F5F1EA]/70 hover:text-[#ED9518] uppercase tracking-widest transition-colors"
          >
            ← Account Dashboard
          </Link>
        </div>

        <div className="mb-10 pb-6 border-b border-[#F5F1EA]/10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs text-[#ED9518] uppercase tracking-[0.25em] font-bold block mb-2">
              Purchase History · Fregoro Studios
            </span>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-[#F5F1EA]">
              Your Orders ({orders.length})
            </h1>
          </div>
          <Link
            href="/products/all"
            className="font-mono text-xs uppercase tracking-widest text-[#0057FF] hover:underline font-bold"
          >
            Browse Products →
          </Link>
        </div>

        {/* Orders List */}
        {orders.length > 0 ? (
          <div className="flex flex-col gap-6">
            {orders.map((order) => {
              const estDate = order.estimatedDeliveryDate
                ? new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Pending';

              const orderNumber = order.publicOrderId || order.id;

              return (
                <div
                  key={order.id}
                  className="bg-[#121214] border border-[#F5F1EA]/10 p-6 sm:p-8 rounded-2xl flex flex-col gap-6 shadow-xl"
                >
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pb-6 border-b border-[#F5F1EA]/10">
                    <div>
                      <span className="font-mono text-[10px] text-[#F5F1EA]/50 uppercase tracking-wider block">
                        Order ID
                      </span>
                      <p className="font-mono text-sm text-[#F5F1EA] font-bold mt-1 tracking-wider">
                        {orderNumber}
                      </p>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-[#F5F1EA]/50 uppercase tracking-wider block">
                        Date Placed
                      </span>
                      <p className="font-mono text-sm text-[#F5F1EA] mt-1">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-[#F5F1EA]/50 uppercase tracking-wider block">
                        Est. Delivery
                      </span>
                      <p className="font-mono text-sm text-emerald-400 font-semibold mt-1">
                        {estDate}
                      </p>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-[#F5F1EA]/50 uppercase tracking-wider block">
                        Status
                      </span>
                      <p className="font-mono text-xs text-[#0057FF] uppercase font-bold mt-1 bg-[#0057FF]/10 border border-[#0057FF]/30 inline-block px-2.5 py-1 rounded">
                        {order.status.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-[#F5F1EA]/50 uppercase tracking-wider block">
                        Total Amount
                      </span>
                      <p className="font-display text-xl font-bold text-[#ED9518] mt-1">
                        {formatINR(order.total)}
                      </p>
                      {order.discount ? (
                        <p className="font-mono text-[10px] text-emerald-400">
                          (Saved {formatINR(order.discount)})
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="flex flex-col gap-3">
                    {order.items.map((item) => {
                      const product = products.find((p) => p.id === item.productId);
                      const variant = product?.variants.find((v) => v.id === item.variantId);
                      const displayName =
                        item.productNameSnapshot || product?.name || `Product ${item.productId}`;
                      const displayVariant = variant?.name || item.variantId;
                      const itemPrice = item.unitPrice ?? item.totalPrice / item.quantity;

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between font-mono text-xs text-[#F5F1EA]/80 border-b border-[#F5F1EA]/5 pb-3 last:border-none"
                        >
                          <div>
                            <span className="text-[#F5F1EA] font-semibold">
                              {displayName}
                              {displayVariant && displayVariant !== 'default'
                                ? ` — ${displayVariant}`
                                : ''}
                              {item.size ? ` (${item.size})` : ''}
                            </span>
                            <span className="text-[#F5F1EA]/50 ml-2">× {item.quantity}</span>
                            {item.orderCustomization?.designFileName && (
                              <span className="block text-[11px] text-[#0057FF] mt-0.5 font-bold">
                                Customized Artwork: {item.orderCustomization.designFileName}
                              </span>
                            )}
                          </div>
                          <span className="text-[#F5F1EA] font-bold mt-1 sm:mt-0">
                            {formatINR(itemPrice * item.quantity)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-2 pt-4 border-t border-[#F5F1EA]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {order.trackingNumber ? (
                      <div className="flex-1 bg-[#1A1A1E] p-3.5 border border-[#F5F1EA]/10 rounded-lg">
                        <span className="font-mono text-[10px] text-[#F5F1EA]/50 uppercase tracking-widest block mb-1">
                          Tracking Information
                        </span>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <p className="font-mono text-xs text-[#F5F1EA]">
                            {order.carrier} —{' '}
                            <span className="font-bold text-[#0057FF]">{order.trackingNumber}</span>
                          </p>
                          {order.trackingUrl && (
                            <a
                              href={order.trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#0057FF] text-xs hover:underline uppercase tracking-wider font-mono font-bold"
                            >
                              Track Live ↗
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <span className="font-mono text-xs text-[#F5F1EA]/50 italic">
                          Order received. Tracking details will update once dispatched by Fregoro
                          Studios.
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-center">
                      <Link
                        href={`/account/orders/${order.id}/track`}
                        className="bg-[#1A1A1E] border border-[#F5F1EA]/10 text-[#F5F1EA] hover:bg-[#222228] px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap text-center"
                      >
                        Track Status
                      </Link>
                      <Link
                        href={`/account/orders/${order.id}/invoice`}
                        target="_blank"
                        className="bg-[#0057FF] hover:bg-[#0046CC] text-[#F5F1EA] px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap text-center"
                      >
                        View Tax Invoice
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center border border-dashed border-[#F5F1EA]/10 rounded-2xl p-12 bg-[#121214] max-w-xl mx-auto space-y-4">
            <h2 className="font-display text-2xl font-bold uppercase text-[#F5F1EA]">
              No Orders Found Yet
            </h2>
            <p className="font-mono text-xs text-[#F5F1EA]/60 leading-relaxed">
              When you place an order, it will appear here with live tracking, custom artwork files,
              and printable tax invoices.
            </p>
            <Link
              href="/products/all"
              className="inline-block bg-[#ED9518] text-[#0A0A0A] hover:bg-[#F5F1EA] font-mono text-xs font-bold uppercase tracking-[0.2em] px-8 py-4 rounded-lg transition-all"
            >
              Explore Catalog →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
