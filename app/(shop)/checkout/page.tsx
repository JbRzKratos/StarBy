'use client';

import { useState } from 'react';
import { useCartStore } from '@/lib/stores/cart-store';
import { usePrice } from '@/lib/hooks/usePrice';

type Step = 'shipping' | 'payment' | 'review';

export default function CheckoutPage() {
  const [step, setStep] = useState<Step>('shipping');
  const totalPrice = useCartStore((s) => s.totalPrice);
  const { formatPrice } = usePrice();

  const steps: Step[] = ['shipping', 'payment', 'review'];

  return (
    <main className="pt-36 md:pt-40 pb-20">
      <div className="section-container max-w-4xl">
        <h1 className="font-display text-display-lg font-bold text-bone mb-8">Checkout</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-12">
          {steps.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`flex items-center gap-2 ${step === s ? 'text-cobalt' : 'text-ash'}`}
            >
              <span
                className={`w-8 h-8 rounded-full border font-mono text-caption flex items-center justify-center ${
                  step === s ? 'border-cobalt bg-cobalt/10 text-cobalt' : 'border-smoke text-ash'
                }`}
              >
                {i + 1}
              </span>
              <span className="font-mono text-caption uppercase tracking-wider hidden sm:block">
                {s}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form area */}
          <div className="lg:col-span-2">
            {step === 'shipping' && (
              <div className="bg-graphite border border-smoke rounded-lg p-6 md:p-8">
                <h2 className="font-display text-display-sm font-bold text-bone mb-6">
                  Shipping Address
                </h2>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      placeholder="First name"
                      className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                    />
                    <input
                      placeholder="Last name"
                      className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                    />
                  </div>
                  <input
                    placeholder="Address line 1"
                    className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                  />
                  <input
                    placeholder="Address line 2 (optional)"
                    className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <input
                      placeholder="City"
                      className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                    />
                    <input
                      placeholder="State"
                      className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                    />
                    <input
                      placeholder="PIN Code"
                      className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                    />
                  </div>
                  <input
                    placeholder="Phone number"
                    className="bg-charcoal border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                  />
                  <button
                    onClick={() => setStep('payment')}
                    className="self-end px-8 py-3 bg-cobalt text-bone font-mono text-caption uppercase tracking-widest mt-4 hover:bg-cobalt/90 transition-colors"
                  >
                    Continue to Payment →
                  </button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="bg-graphite border border-smoke rounded-lg p-6 md:p-8">
                <h2 className="font-display text-display-sm font-bold text-bone mb-6">
                  Payment Method
                </h2>
                <div className="flex flex-col gap-4">
                  {['Credit / Debit Card', 'UPI', 'Net Banking', 'Cash on Delivery'].map(
                    (method) => (
                      <label
                        key={method}
                        className="flex items-center gap-3 p-4 border border-smoke rounded-sm cursor-pointer hover:border-cobalt transition-colors"
                      >
                        <div className="w-4 h-4 border border-pearl rounded-full" />
                        <span className="font-mono text-body-sm text-bone">{method}</span>
                      </label>
                    ),
                  )}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setStep('shipping')}
                      className="px-6 py-3 border border-smoke text-pearl font-mono text-caption uppercase tracking-widest hover:border-pearl transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setStep('review')}
                      className="px-8 py-3 bg-cobalt text-bone font-mono text-caption uppercase tracking-widest hover:bg-cobalt/90 transition-colors"
                    >
                      Review Order →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 'review' && (
              <div className="bg-graphite border border-smoke rounded-lg p-6 md:p-8">
                <h2 className="font-display text-display-sm font-bold text-bone mb-6">
                  Review Order
                </h2>
                <p className="text-pearl text-body-md mb-6">Confirm your order details below.</p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setStep('payment')}
                    className="px-6 py-3 border border-smoke text-pearl font-mono text-caption uppercase tracking-widest hover:border-pearl transition-colors"
                  >
                    ← Back
                  </button>
                  <button className="px-8 py-3 bg-cobalt text-bone font-mono text-caption uppercase tracking-widest hover:bg-cobalt/90 transition-colors">
                    Place Order →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-graphite border border-smoke rounded-lg p-6 h-fit sticky top-24">
            <h2 className="font-display text-body-lg text-bone mb-4">Summary</h2>
            <div className="flex justify-between items-center pb-4 border-b border-smoke/30">
              <span className="font-mono text-caption uppercase tracking-widest text-ash">
                Subtotal
              </span>
              <span className="font-mono text-body-sm text-bone">{formatPrice(totalPrice())}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-smoke/30">
              <span className="font-mono text-caption uppercase tracking-widest text-ash">
                Shipping
              </span>
              <span className="font-mono text-body-sm text-bone">{formatPrice(0)}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="font-mono text-body-md uppercase tracking-widest text-bone">
                Total
              </span>
              <span className="font-mono text-display-sm text-bone">
                {formatPrice(totalPrice())}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
