import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

function getStatusIndex(status: string) {
  const s = status.toLowerCase();
  if (['pending_payment'].includes(s)) return 0;
  if (['placed'].includes(s)) return 1;
  if (['processing', 'printing', 'packed'].includes(s)) return 2;
  if (['shipped', 'out_for_delivery'].includes(s)) return 3;
  if (['delivered', 'completed'].includes(s)) return 4;
  return -1;
}

export default async function OrderTrackingPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order || order.userId !== user.id) {
    redirect('/account/orders');
  }

  const currentIndex = getStatusIndex(order.status);
  const isCancelled =
    order.status.toLowerCase() === 'cancelled' || order.status.toLowerCase() === 'failed';

  const visualSteps = [
    'Order Created',
    'Confirmed',
    'Processing & Crafting',
    'Shipped',
    'Delivered',
  ];

  const orderRef = order.publicOrderId || order.id;

  return (
    <main className="min-h-screen bg-charcoal text-bone pt-36 pb-24">
      <div className="section-container max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Link
            href="/account/orders"
            className="text-cobalt hover:underline text-caption font-mono uppercase tracking-widest"
          >
            ← Back to All Orders
          </Link>
        </div>

        <div className="bg-graphite border border-smoke/40 rounded-xl p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-smoke/20 pb-6 mb-8">
            <div>
              <span className="font-mono text-caption text-cobalt uppercase tracking-widest block mb-1">
                Fulfillment Status
              </span>
              <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
                Track Order: {orderRef}
              </h1>
              <p className="font-mono text-body-sm text-pearl mt-1">
                Placed on{' '}
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="text-right sm:text-right">
              <span className="font-mono text-caption text-ash uppercase block">Status</span>
              <span className="font-mono text-caption font-bold text-cobalt bg-cobalt/10 px-3 py-1 rounded inline-block mt-1 uppercase">
                {order.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {isCancelled ? (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-6 text-center">
              <h3 className="text-rose-400 font-display text-xl font-bold uppercase mb-2">
                Order Cancelled
              </h3>
              <p className="text-pearl font-mono text-body-sm">
                This order was cancelled or payment was not completed.
              </p>
            </div>
          ) : (
            <div className="relative pt-6 pb-12">
              <div className="space-y-8 sm:space-y-0 sm:flex sm:justify-between sm:items-start relative z-10">
                {visualSteps.map((step, idx) => {
                  const isActive = currentIndex >= idx;
                  const isCurrent = currentIndex === idx;

                  return (
                    <div
                      key={step}
                      className="relative flex items-center sm:flex-col sm:items-center sm:w-1/5"
                    >
                      <div
                        className={`
                        flex items-center justify-center w-9 h-9 rounded-full z-10 shrink-0 font-mono text-caption
                        ${
                          isActive
                            ? 'bg-cobalt text-bone shadow-lg shadow-cobalt/30 border-2 border-cobalt'
                            : 'bg-charcoal text-ash border-2 border-smoke'
                        }
                      `}
                      >
                        {isActive ? (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>

                      <div className="ml-4 sm:ml-0 sm:mt-3 sm:text-center">
                        <h4
                          className={`font-mono text-caption uppercase tracking-wider font-bold ${
                            isActive ? 'text-bone' : 'text-ash'
                          }`}
                        >
                          {step}
                        </h4>
                        {isCurrent && (
                          <p className="font-mono text-[10px] text-cobalt mt-0.5 uppercase tracking-widest font-semibold">
                            Current
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress track for desktop */}
              <div className="hidden sm:block absolute top-10 left-10 right-10 h-0.5 bg-smoke/40 -z-0"></div>
              <div
                className="hidden sm:block absolute top-10 left-10 h-0.5 bg-cobalt -z-0 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, (currentIndex / 4) * 85))}%` }}
              ></div>
            </div>
          )}

          {/* Tracking Details Card */}
          {order.carrier || order.trackingNumber ? (
            <div className="mt-8 bg-charcoal/80 border border-smoke/30 rounded-xl p-6">
              <h3 className="font-display text-lg font-bold uppercase text-bone mb-4">
                Courier & Tracking Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
                <div>
                  <p className="text-caption text-ash uppercase tracking-wider mb-1">
                    Courier Partner
                  </p>
                  <p className="text-body-sm font-bold text-bone">
                    {order.carrier || 'Standard Shipping'}
                  </p>
                </div>
                <div>
                  <p className="text-caption text-ash uppercase tracking-wider mb-1">
                    Waybill / Tracking No.
                  </p>
                  <p className="text-body-sm font-bold text-cobalt">
                    {order.trackingNumber || 'N/A'}
                  </p>
                </div>
              </div>

              {order.trackingUrl && (
                <div className="mt-6">
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 bg-cobalt hover:bg-cobalt/90 text-bone font-mono text-caption uppercase tracking-widest rounded transition-colors"
                  >
                    Track on Courier Website ↗
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-8 bg-charcoal/40 border border-dashed border-smoke/30 rounded-lg p-6 text-center font-mono text-caption text-ash">
              Your order is being prepared. Tracking details will be updated here as soon as the
              courier scans your package.
            </div>
          )}

          {/* Activity Log / Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="mt-10 border-t border-smoke/20 pt-6">
              <h3 className="font-display text-lg font-bold uppercase text-bone mb-4">
                Activity Timeline
              </h3>
              <div className="space-y-3 font-mono text-caption">
                {order.statusHistory.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 text-pearl">
                    <span className="text-cobalt font-bold">•</span>
                    <div className="flex-1">
                      <p className="text-bone font-medium">
                        {item.note || `Status updated to ${item.newStatus}`}
                      </p>
                      <span className="text-ash text-[10px]">
                        {new Date(item.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
