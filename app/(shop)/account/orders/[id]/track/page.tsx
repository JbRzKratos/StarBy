import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

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

  const visualSteps = ['Order Placed', 'Confirmed', 'Crafting & QC', 'Dispatched', 'Delivered'];

  const orderRef = order.publicOrderId || order.id;

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#F5F1EA] pt-36 md:pt-44 pb-24">
      <div className="section-container max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/account/orders"
            className="text-[#F5F1EA]/70 hover:text-[#ED9518] text-xs font-mono uppercase tracking-widest transition-colors"
          >
            ← Back to All Orders
          </Link>
          <Link
            href={`/account/orders/${order.id}/invoice`}
            className="text-[#0057FF] hover:underline text-xs font-mono uppercase tracking-widest font-bold"
          >
            View Tax Invoice ↗
          </Link>
        </div>

        <div className="bg-[#121214] border border-[#F5F1EA]/10 rounded-2xl p-6 sm:p-10 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F5F1EA]/10 pb-6 mb-8">
            <div>
              <span className="font-mono text-xs text-[#ED9518] uppercase tracking-[0.25em] font-bold block mb-1">
                Fulfillment Status · Fregoro Studios
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#F5F1EA]">
                Tracking: {orderRef}
              </h1>
              <p className="font-mono text-xs text-[#F5F1EA]/60 mt-1">
                Placed on{' '}
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="font-mono text-[10px] text-[#F5F1EA]/50 uppercase tracking-widest block">
                Current State
              </span>
              <span className="font-mono text-xs font-bold text-[#0057FF] bg-[#0057FF]/10 border border-[#0057FF]/30 px-3 py-1 rounded inline-block mt-1 uppercase">
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {isCancelled ? (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-8 text-center space-y-2">
              <h2 className="text-rose-400 font-display text-xl font-bold uppercase">
                Order Cancelled
              </h2>
              <p className="text-[#F5F1EA]/70 font-mono text-xs">
                This order was cancelled or payment could not be processed.
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
                        flex items-center justify-center w-10 h-10 rounded-full z-10 shrink-0 font-mono text-xs font-bold
                        ${
                          isActive
                            ? 'bg-[#0057FF] text-[#F5F1EA] shadow-lg shadow-[#0057FF]/30 border-2 border-[#0057FF]'
                            : 'bg-[#1A1A1E] text-[#F5F1EA]/40 border-2 border-[#F5F1EA]/10'
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
                        <h3
                          className={`font-mono text-xs uppercase tracking-wider font-bold ${
                            isActive ? 'text-[#F5F1EA]' : 'text-[#F5F1EA]/40'
                          }`}
                        >
                          {step}
                        </h3>
                        {isCurrent && (
                          <p className="font-mono text-[10px] text-[#ED9518] mt-0.5 uppercase tracking-widest font-bold">
                            Active Stage
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress track for desktop */}
              <div className="hidden sm:block absolute top-11 left-10 right-10 h-0.5 bg-[#F5F1EA]/10 -z-0"></div>
              <div
                className="hidden sm:block absolute top-11 left-10 h-0.5 bg-[#0057FF] -z-0 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, (currentIndex / 4) * 85))}%` }}
              ></div>
            </div>
          )}

          {/* Tracking Details Card */}
          {order.carrier || order.trackingNumber ? (
            <div className="mt-8 bg-[#1A1A1E] border border-[#F5F1EA]/10 rounded-xl p-6">
              <h3 className="font-display text-lg font-bold uppercase text-[#F5F1EA] mb-4">
                Courier & Logistics Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                <div>
                  <p className="text-[#F5F1EA]/50 uppercase tracking-wider mb-1">Courier Partner</p>
                  <p className="font-bold text-[#F5F1EA] text-sm">
                    {order.carrier || 'Express Courier'}
                  </p>
                </div>
                <div>
                  <p className="text-[#F5F1EA]/50 uppercase tracking-wider mb-1">
                    AWB / Waybill Tracking No.
                  </p>
                  <p className="font-bold text-[#0057FF] text-sm tracking-wider">
                    {order.trackingNumber || 'Pending AWB Generation'}
                  </p>
                </div>
              </div>

              {order.trackingUrl && (
                <div className="mt-6">
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3.5 bg-[#0057FF] hover:bg-[#0046CC] text-[#F5F1EA] font-mono text-xs font-bold uppercase tracking-[0.2em] rounded-lg transition-colors shadow-lg shadow-[#0057FF]/20"
                  >
                    Track on Courier Portal ↗
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-8 bg-[#1A1A1E]/50 border border-dashed border-[#F5F1EA]/10 rounded-xl p-6 text-center font-mono text-xs text-[#F5F1EA]/50">
              Your customized order is currently in production. Real-time carrier tracking will
              appear here once the parcel is handed to our shipping partner.
            </div>
          )}

          {/* Activity Log */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="mt-10 border-t border-[#F5F1EA]/10 pt-6">
              <h3 className="font-display text-lg font-bold uppercase text-[#F5F1EA] mb-4">
                Milestone Activity Log
              </h3>
              <div className="space-y-3 font-mono text-xs">
                {order.statusHistory.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 text-[#F5F1EA]/70">
                    <span className="text-[#ED9518] font-bold">•</span>
                    <div className="flex-1">
                      <p className="text-[#F5F1EA] font-medium">
                        {item.note || `Status updated to ${item.newStatus}`}
                      </p>
                      <span className="text-[#F5F1EA]/40 text-[10px]">
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
