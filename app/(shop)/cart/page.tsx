'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/stores/cart-store';
import { usePrice } from '@/lib/hooks/usePrice';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const totalItems = useCartStore((s) => s.totalItems);
  const { formatPrice } = usePrice();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <main className="pt-36 md:pt-40 pb-20" ref={containerRef}>
      <div className="section-container max-w-4xl">
        <div className="mb-10">
          <span className="overline-label block mb-3">Shopping</span>
          <h1 className="font-display text-display-lg font-bold text-bone">
            Your Cart ({totalItems()})
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-graphite border border-smoke rounded-lg">
            <p className="font-display text-body-lg text-pearl mb-4">Your cart is empty</p>
            <Link
              href="/products/tees"
              className="font-mono text-caption text-cobalt uppercase tracking-widest hover:underline"
            >
              Start Shopping →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex gap-4 bg-graphite border border-smoke rounded-lg p-4"
                >
                  <div className="w-24 h-24 bg-smoke rounded flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-display text-body-md text-bone">{item.productId}</p>
                    <p className="font-mono text-caption text-ash">{item.variantId}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variantId,
                            Math.max(1, item.quantity - 1),
                          )
                        }
                        className="w-7 h-7 border border-smoke text-pearl flex items-center justify-center hover:border-cobalt"
                      >
                        −
                      </button>
                      <span className="font-mono text-body-sm text-bone">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.variantId, item.quantity + 1)
                        }
                        className="w-7 h-7 border border-smoke text-pearl flex items-center justify-center hover:border-cobalt"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="ml-auto font-mono text-caption text-ember hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="font-mono text-body-sm text-bone">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-graphite border border-smoke rounded-lg p-6 h-fit sticky top-24">
              <h2 className="font-display text-body-lg text-bone mb-6">Order Summary</h2>
              <div className="flex flex-col gap-3 mb-6 pb-6 border-b border-smoke">
                <div className="flex justify-between items-center pb-4 border-b border-smoke/30">
                  <span className="font-mono text-caption uppercase tracking-widest text-ash">
                    Subtotal
                  </span>
                  <span className="font-mono text-body-sm text-bone">
                    {formatPrice(totalPrice())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-caption text-pearl">Shipping</span>
                  <span className="font-mono text-body-sm text-bone">Calculated at checkout</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 mb-6">
                <span className="font-mono text-body-md uppercase tracking-widest text-bone">
                  Total
                </span>
                <span className="font-mono text-display-sm text-bone">
                  {formatPrice(totalPrice())}
                </span>
              </div>
              <Link
                href="/checkout"
                className="block w-full py-3.5 bg-cobalt text-bone font-mono text-caption uppercase tracking-widest text-center hover:bg-cobalt/90 transition-colors"
              >
                Proceed to Checkout →
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
