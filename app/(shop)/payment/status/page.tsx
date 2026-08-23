'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/lib/stores/cart-store';
import { FregoroLogo } from '@/components/ui/fregoro-logo';

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clearCart);

  const orderId = searchParams.get('order_id');
  const [status, setStatus] = useState<'verifying' | 'paid' | 'pending' | 'failed'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [orderDetails, setOrderDetails] = useState<{
    orderId?: string;
    publicOrderId?: string;
    amount?: number;
  } | null>(null);

  useEffect(() => {
    if (!orderId) {
      setStatus('failed');
      setErrorMessage('No order reference found in payment response.');
      return;
    }

    let isMounted = true;
    let pollCount = 0;
    const maxPolls = 5;

    async function checkPayment() {
      try {
        const res = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cashfreeOrderId: orderId }),
        });

        const data = await res.json();

        if (!isMounted) return;

        if (data.success && data.status === 'paid') {
          setStatus('paid');
          setOrderDetails({
            orderId: data.orderId,
            publicOrderId: data.publicOrderId,
            amount: data.amount,
          });
          // Clear cart on successful payment
          clearCart();
        } else if (data.status === 'pending') {
          if (pollCount < maxPolls) {
            pollCount++;
            setTimeout(checkPayment, 3000);
          } else {
            setStatus('pending');
            setOrderDetails({
              orderId: data.orderId,
              publicOrderId: data.publicOrderId,
              amount: data.amount,
            });
            clearCart();
          }
        } else {
          setStatus('failed');
          setErrorMessage(data.message || 'Payment could not be completed.');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Payment verification error:', err);
        setStatus('failed');
        setErrorMessage('Network error while verifying payment status.');
      }
    }

    checkPayment();

    return () => {
      isMounted = false;
    };
  }, [orderId, clearCart]);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#F5F1EA] pt-36 md:pt-44 pb-24 flex items-center justify-center px-4 sm:px-6">
      <div className="max-w-xl w-full">
        {/* Brand mark header */}
        <div className="flex justify-center mb-8">
          <FregoroLogo size="md" />
        </div>

        {status === 'verifying' && (
          <div className="bg-[#121214] border border-[#F5F1EA]/10 p-8 sm:p-10 rounded-2xl text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 border-4 border-[#0057FF] border-t-transparent rounded-full animate-spin mx-auto" />
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#F5F1EA]">
                Verifying Payment
              </h1>
              <p className="font-mono text-sm text-[#F5F1EA]/60 mt-2">
                Securing live confirmation from Cashfree gateway…
              </p>
            </div>
            <p className="font-mono text-xs text-[#F5F1EA]/40">
              Please do not refresh or close this window.
            </p>
          </div>
        )}

        {status === 'paid' && (
          <div className="bg-[#121214] border border-emerald-500/30 p-8 sm:p-10 rounded-2xl text-center space-y-6 shadow-2xl shadow-emerald-500/5">
            <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div>
              <span className="font-mono text-xs text-emerald-400 font-bold uppercase tracking-[0.25em] block mb-2">
                Payment Confirmed
              </span>
              <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#F5F1EA]">
                Order Received!
              </h1>
              <p className="font-mono text-sm text-[#F5F1EA]/70 mt-3 leading-relaxed">
                Thank you for choosing <strong className="text-[#F5F1EA]">Fregoro Studios</strong>.
                We&apos;ve sent your order confirmation and invoice to your email.
              </p>
            </div>

            {orderDetails?.publicOrderId && (
              <div className="bg-[#1A1A1E] border border-[#F5F1EA]/10 p-5 rounded-xl text-left space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs text-[#F5F1EA]/50 uppercase tracking-widest">
                    Order Number
                  </span>
                  <span className="font-mono text-sm font-bold text-[#ED9518]">
                    {orderDetails.publicOrderId}
                  </span>
                </div>
                {orderDetails.orderId && (
                  <div className="flex justify-between items-center pt-2 border-t border-[#F5F1EA]/5">
                    <span className="font-mono text-xs text-[#F5F1EA]/50 uppercase tracking-widest">
                      Actions
                    </span>
                    <div className="flex gap-3">
                      <Link
                        href={`/account/orders/${orderDetails.orderId}/invoice`}
                        className="font-mono text-xs text-[#0057FF] hover:underline uppercase tracking-wider font-bold"
                      >
                        Tax Invoice ↗
                      </Link>
                      <Link
                        href={`/account/orders/${orderDetails.orderId}/track`}
                        className="font-mono text-xs text-emerald-400 hover:underline uppercase tracking-wider font-bold"
                      >
                        Track Order ↗
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/account/orders"
                className="flex-1 bg-[#0057FF] hover:bg-[#0046CC] text-[#F5F1EA] font-mono text-xs font-bold uppercase tracking-[0.2em] py-4 rounded-lg transition-all text-center shadow-lg shadow-[#0057FF]/20"
              >
                View Orders
              </Link>
              <Link
                href="/products/all"
                className="flex-1 bg-[#1A1A1E] hover:bg-[#222228] text-[#F5F1EA] border border-[#F5F1EA]/10 font-mono text-xs font-bold uppercase tracking-[0.2em] py-4 rounded-lg transition-colors text-center"
              >
                Shop More
              </Link>
            </div>
          </div>
        )}

        {status === 'pending' && (
          <div className="bg-[#121214] border border-amber-500/30 p-8 sm:p-10 rounded-2xl text-center space-y-6">
            <div className="w-20 h-20 bg-amber-500/10 border-2 border-amber-500/40 rounded-full flex items-center justify-center mx-auto text-amber-400">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <span className="font-mono text-xs text-amber-400 font-bold uppercase tracking-[0.25em] block mb-2">
                Processing Settlement
              </span>
              <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[#F5F1EA]">
                Payment Pending
              </h1>
              <p className="font-mono text-sm text-[#F5F1EA]/70 mt-3 leading-relaxed">
                Your bank or payment provider is confirming the transaction. Your order status will
                update automatically once verified by Cashfree.
              </p>
            </div>

            {orderDetails?.publicOrderId && (
              <div className="bg-[#1A1A1E] border border-[#F5F1EA]/10 p-4 rounded-xl">
                <span className="font-mono text-xs text-[#F5F1EA]/50 uppercase tracking-widest block">
                  Order Reference
                </span>
                <span className="font-mono text-lg font-bold text-[#ED9518] mt-1 block">
                  {orderDetails.publicOrderId}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/account/orders"
                className="flex-1 bg-[#0057FF] hover:bg-[#0046CC] text-[#F5F1EA] font-mono text-xs font-bold uppercase tracking-[0.2em] py-4 rounded-lg transition-all text-center"
              >
                My Account
              </Link>
              <Link
                href="/"
                className="flex-1 bg-[#1A1A1E] hover:bg-[#222228] text-[#F5F1EA] border border-[#F5F1EA]/10 font-mono text-xs font-bold uppercase tracking-[0.2em] py-4 rounded-lg transition-colors text-center"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="bg-[#121214] border border-rose-500/30 p-8 sm:p-10 rounded-2xl text-center space-y-6 shadow-2xl shadow-rose-500/5">
            <div className="w-20 h-20 bg-rose-500/10 border-2 border-rose-500/40 rounded-full flex items-center justify-center mx-auto text-rose-400">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <span className="font-mono text-xs text-rose-400 font-bold uppercase tracking-[0.25em] block mb-2">
                Transaction Incomplete
              </span>
              <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[#F5F1EA]">
                Payment Failed
              </h1>
              <p className="font-mono text-sm text-[#F5F1EA]/70 mt-3 leading-relaxed">
                {errorMessage ||
                  'The payment was cancelled or declined by your bank. If amount was debited, it will be refunded within 3-5 days.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => router.push('/checkout')}
                className="flex-1 bg-[#0057FF] hover:bg-[#0046CC] text-[#F5F1EA] font-mono text-xs font-bold uppercase tracking-[0.2em] py-4 rounded-lg transition-all text-center"
              >
                Retry Payment
              </button>
              <Link
                href="/cart"
                className="flex-1 bg-[#1A1A1E] hover:bg-[#222228] text-[#F5F1EA] border border-[#F5F1EA]/10 font-mono text-xs font-bold uppercase tracking-[0.2em] py-4 rounded-lg transition-colors text-center"
              >
                Review Cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0A0A0A] text-[#F5F1EA] pt-36 md:pt-44 pb-24 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#0057FF] border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  );
}
