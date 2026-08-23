'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/lib/stores/cart-store';

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
    <main className="min-h-screen bg-charcoal text-bone pt-36 pb-24 flex items-center justify-center">
      <div className="section-container max-w-xl w-full">
        {status === 'verifying' && (
          <div className="bg-graphite border border-smoke/40 p-10 rounded-xl text-center space-y-6 animate-pulse">
            <div className="w-16 h-16 border-4 border-cobalt border-t-transparent rounded-full animate-spin mx-auto" />
            <div>
              <h2 className="font-display text-2xl uppercase tracking-tight">Verifying Payment</h2>
              <p className="font-mono text-body-sm text-pearl mt-2">
                Securing confirmation from Cashfree gateway…
              </p>
            </div>
            <p className="font-mono text-caption text-ash">
              Please do not refresh or close this window.
            </p>
          </div>
        )}

        {status === 'paid' && (
          <div className="bg-graphite border border-emerald-500/40 p-10 rounded-xl text-center space-y-6 shadow-2xl shadow-emerald-500/5">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <span className="font-mono text-caption text-emerald-400 uppercase tracking-widest block mb-1">
                Payment Confirmed
              </span>
              <h2 className="font-display text-3xl md:text-4xl uppercase tracking-tight">
                Order Received!
              </h2>
              <p className="font-mono text-body-sm text-pearl mt-3">
                Thank you for your purchase. We&apos;ve sent a confirmation email with all details.
              </p>
            </div>

            {orderDetails?.publicOrderId && (
              <div className="bg-charcoal/80 border border-smoke/30 p-4 rounded-lg">
                <span className="font-mono text-caption text-ash uppercase tracking-widest block">
                  Order Number
                </span>
                <span className="font-mono text-xl font-bold text-bone tracking-wider mt-1 block">
                  {orderDetails.publicOrderId}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link
                href="/account/orders"
                className="flex-1 bg-cobalt hover:bg-cobalt/90 text-bone font-mono text-caption uppercase tracking-widest py-3.5 rounded transition-all text-center"
              >
                View Order History
              </Link>
              <Link
                href="/products/all"
                className="flex-1 bg-smoke/20 hover:bg-smoke/40 text-bone border border-smoke/40 font-mono text-caption uppercase tracking-widest py-3.5 rounded transition-colors text-center"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}

        {status === 'pending' && (
          <div className="bg-graphite border border-amber-500/40 p-10 rounded-xl text-center space-y-6">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400">
              <svg
                width="32"
                height="32"
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
              <span className="font-mono text-caption text-amber-400 uppercase tracking-widest block mb-1">
                Processing
              </span>
              <h2 className="font-display text-3xl uppercase tracking-tight">Payment Pending</h2>
              <p className="font-mono text-body-sm text-pearl mt-3">
                Your bank or payment provider is still confirming the transaction. Your order will
                be automatically updated as soon as Cashfree confirms settlement.
              </p>
            </div>

            {orderDetails?.publicOrderId && (
              <div className="bg-charcoal/80 border border-smoke/30 p-4 rounded-lg">
                <span className="font-mono text-caption text-ash uppercase tracking-widest block">
                  Order Reference
                </span>
                <span className="font-mono text-xl font-bold text-bone tracking-wider mt-1 block">
                  {orderDetails.publicOrderId}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link
                href="/account/orders"
                className="flex-1 bg-cobalt hover:bg-cobalt/90 text-bone font-mono text-caption uppercase tracking-widest py-3.5 rounded transition-all text-center"
              >
                Check Orders
              </Link>
              <Link
                href="/"
                className="flex-1 bg-smoke/20 hover:bg-smoke/40 text-bone border border-smoke/40 font-mono text-caption uppercase tracking-widest py-3.5 rounded transition-colors text-center"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="bg-graphite border border-rose-500/40 p-10 rounded-xl text-center space-y-6 shadow-2xl shadow-rose-500/5">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto text-rose-400">
              <svg
                width="32"
                height="32"
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
              <span className="font-mono text-caption text-rose-400 uppercase tracking-widest block mb-1">
                Transaction Unsuccessful
              </span>
              <h2 className="font-display text-3xl uppercase tracking-tight">Payment Failed</h2>
              <p className="font-mono text-body-sm text-pearl mt-3">
                {errorMessage ||
                  'The payment was cancelled or declined by your bank. No money was deducted.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => router.push('/checkout')}
                className="flex-1 bg-cobalt hover:bg-cobalt/90 text-bone font-mono text-caption uppercase tracking-widest py-3.5 rounded transition-all text-center"
              >
                Retry Checkout
              </button>
              <Link
                href="/cart"
                className="flex-1 bg-smoke/20 hover:bg-smoke/40 text-bone border border-smoke/40 font-mono text-caption uppercase tracking-widest py-3.5 rounded transition-colors text-center"
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
        <main className="min-h-screen bg-charcoal text-bone pt-36 pb-24 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-cobalt border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  );
}
