import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { STATUS_LABELS } from '@/lib/bulk-orders/types';
import { getWhatsappLink } from '@/lib/whatsapp';
import { Layers, ArrowRight, MessageCircle, Plus, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Bulk Orders & Quotations | Fregoro Studios',
};

export default async function AccountBulkOrdersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/account/bulk-orders');
  }

  // Fetch all bulk requests created by this user or matching their email
  const requests = await prisma.bulkOrderRequest.findMany({
    where: {
      OR: [{ userId: user.id }, { email: user.email }],
    },
    include: {
      items: true,
      quotes: {
        orderBy: { version: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#F5F1EA] pt-36 md:pt-44 pb-24">
      <div className="section-container max-w-6xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-pearl uppercase tracking-wider mb-6">
          <Link href="/account" className="hover:text-white transition-colors">
            Account
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-white">Bulk & Custom Orders</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-white/10 mb-8">
          <div>
            <span className="font-mono text-xs text-[#3B5EFF] uppercase tracking-widest block mb-2 font-bold">
              B2B & Custom Studio
            </span>
            <h1 className="font-display text-3xl sm:text-5xl uppercase tracking-tighter text-white font-black">
              Bulk Orders & Quotes
            </h1>
            <p className="font-mono text-xs text-pearl mt-2">
              Track manufacturing progress, review quotations, and request repeat runs.
            </p>
          </div>

          <Link
            href="/bulk-orders"
            className="px-6 py-3 bg-[#3B5EFF] hover:bg-[#2b4be6] text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#3B5EFF]/20 inline-flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Bulk Request</span>
          </Link>
        </div>

        {/* List of Requests */}
        {requests.length === 0 ? (
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-12 text-center space-y-5">
            <Layers className="w-12 h-12 text-pearl mx-auto opacity-40" />
            <h2 className="font-display text-xl font-bold uppercase text-white">
              No Bulk Requests Yet
            </h2>
            <p className="text-sm text-pearl max-w-md mx-auto">
              Planning custom apparel for your corporate team, college fest, sports club, or brand?
              Submit your specifications and get a tailored manufacturing quote.
            </p>
            <div className="pt-2">
              <Link
                href="/bulk-orders"
                className="px-6 py-3 bg-[#3B5EFF] hover:bg-[#2b4be6] text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-colors inline-block"
              >
                Request a Bulk Quote
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const latestQuote = req.quotes[0] || null;
              const apparelSummary =
                Array.from(new Set(req.items.map((i) => i.apparelType))).join(', ') ||
                'Custom Apparel';
              const whatsappUrl = getWhatsappLink(
                `Hi Fregoro Studios, I am following up on bulk order request ${req.requestNumber}.`,
              );

              return (
                <div
                  key={req.id}
                  className="bg-[#141414] border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all space-y-4 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/bulk-orders/request/${req.requestNumber}`}
                          className="font-display text-xl font-bold uppercase tracking-tight text-white hover:text-[#3B5EFF] transition-colors"
                        >
                          {req.requestNumber}
                        </Link>
                        <span className="font-mono text-[10px] uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-white font-bold">
                          {req.orderType}
                        </span>
                        {req.isUrgent && (
                          <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                            Rush
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-pearl">
                        {req.eventName || req.companyName || 'Custom Apparel'} • {req.totalQuantity}{' '}
                        units ({apparelSummary})
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`font-mono text-xs uppercase px-3 py-1 rounded-full border font-bold ${
                          req.status === 'new'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : req.status === 'quote_sent'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : req.status === 'approved' || req.status === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-white/10 text-pearl border-white/15'
                        }`}
                      >
                        {STATUS_LABELS[req.status]?.label || req.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 text-xs font-mono">
                    <div className="space-y-1">
                      <span className="text-pearl block">
                        Target Delivery:{' '}
                        <strong className="text-white">
                          {new Date(req.requiredDeliveryDate || Date.now()).toLocaleDateString(
                            'en-IN',
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            },
                          )}
                        </strong>
                      </span>
                      {latestQuote ? (
                        <span className="text-pearl block">
                          Quotation Total:{' '}
                          <strong className="text-[#3B5EFF] text-sm">
                            ₹{latestQuote.total.toLocaleString('en-IN')}
                          </strong>{' '}
                          (v{latestQuote.version})
                        </span>
                      ) : (
                        <span className="text-amber-400 block">Quote under preparation</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-pearl hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                        <span>WhatsApp</span>
                      </a>

                      <Link
                        href={`/bulk-orders/request/${req.requestNumber}`}
                        className="px-5 py-2.5 rounded-xl bg-[#3B5EFF] hover:bg-[#2b4be6] text-white font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                      >
                        <span>View Quote & Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
