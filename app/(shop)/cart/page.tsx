'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/lib/stores/cart-store';
import { usePrice } from '@/lib/hooks/usePrice';
import { products } from '@/data/products';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const totalPrice = useCartStore((s) => s.items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const { formatPrice } = usePrice();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <main className="pt-36 md:pt-40 pb-20" ref={containerRef}>
      <div className="section-container max-w-4xl">
        <div className="mb-10">
          <span className="overline-label block mb-3">Shopping</span>
          <h1 className="font-display text-display-lg font-bold text-bone">
            Your Cart ({totalItems})
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-graphite border border-smoke rounded-lg">
            <p className="font-display text-body-lg text-pearl mb-4">Your cart is empty</p>
            <Link
              href="/products/all"
              className="font-mono text-caption text-cobalt uppercase tracking-widest hover:underline"
            >
              Start Shopping →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {items.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                const variant = product?.variants.find((v) => v.id === item.variantId);
                const displayName = product?.name ?? item.productId.replace(/-/g, ' ');
                const displayVariant = variant?.name ?? item.variantId.replace(/-/g, ' ');
                const displayImage =
                  item.customization?.imageUrl ??
                  variant?.images[0] ??
                  product?.variants[0]?.images[0];
                return (
                  <div
                    key={`${item.productId}-${item.variantId}-${item.size ?? ''}`}
                    className="flex gap-4 bg-graphite border border-smoke rounded-lg p-4"
                  >
                    <div className="w-24 h-24 bg-smoke rounded flex-shrink-0 relative overflow-hidden">
                      {displayImage ? (
                        <Image src={displayImage} alt={displayName} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-mono text-caption text-ash">
                          —
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-display text-body-md text-bone capitalize">
                        {displayName}
                      </p>
                      <p className="font-mono text-caption text-ash capitalize">
                        {displayVariant}
                        {item.size ? ` · Size: ${item.size}` : ''}
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.variantId,
                              Math.max(1, item.quantity - 1),
                              item.size,
                            )
                          }
                          aria-label="Decrease quantity"
                          aria-disabled={item.quantity <= 1}
                          title={
                            item.quantity <= 1 ? 'Minimum quantity reached' : 'Decrease quantity'
                          }
                          className={`w-7 h-7 border border-smoke text-pearl flex items-center justify-center transition-opacity ${
                            item.quantity <= 1
                              ? 'opacity-30 cursor-not-allowed'
                              : 'hover:border-cobalt cursor-pointer'
                          }`}
                        >
                          −
                        </button>
                        <span className="font-mono text-body-sm text-bone">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.variantId,
                              item.quantity + 1,
                              item.size,
                            )
                          }
                          aria-label="Increase quantity"
                          className="w-7 h-7 border border-smoke text-pearl flex items-center justify-center hover:border-cobalt"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.productId, item.variantId, item.size)}
                          className="ml-auto font-mono text-caption text-ember hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="font-mono text-body-sm text-bone whitespace-nowrap">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                );
              })}
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
                    {formatPrice(totalPrice)}
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
                  {formatPrice(totalPrice)}
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
