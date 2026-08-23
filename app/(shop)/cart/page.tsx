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
    <main
      className="min-h-screen bg-[#0A0A0A] text-[#F5F1EA] pt-36 md:pt-44 pb-24"
      ref={containerRef}
    >
      <div className="section-container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 sm:mb-14 border-b border-[#F5F1EA]/10 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs text-[#ED9518] uppercase tracking-[0.25em] font-bold block mb-2">
              Shopping Cart
            </span>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-[#F5F1EA]">
              Your Cart <span className="text-[#ED9518]">({totalItems})</span>
            </h1>
          </div>
          {items.length > 0 && (
            <Link
              href="/products/all"
              className="font-mono text-xs uppercase tracking-widest text-[#F5F1EA]/70 hover:text-[#ED9518] transition-colors"
            >
              ← Continue Shopping
            </Link>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24 px-6 bg-[#121214] border border-[#F5F1EA]/10 rounded-2xl max-w-xl mx-auto space-y-6">
            <div className="w-16 h-16 bg-[#F5F1EA]/5 border border-[#F5F1EA]/10 rounded-full flex items-center justify-center mx-auto text-[#F5F1EA]/50">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold uppercase text-[#F5F1EA]">
                Your Cart is Empty
              </h2>
              <p className="font-mono text-sm text-[#F5F1EA]/60 mt-2">
                Discover our customizable streetwear, split posters, and device skins.
              </p>
            </div>
            <Link
              href="/products/all"
              className="inline-block px-8 py-4 bg-[#ED9518] text-[#0A0A0A] font-mono text-xs uppercase tracking-[0.2em] font-bold rounded hover:bg-[#F5F1EA] transition-all duration-300"
            >
              Explore Products →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Items List */}
            <div className="lg:col-span-8 space-y-4">
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
                    className="flex flex-col sm:flex-row gap-5 bg-[#121214] border border-[#F5F1EA]/10 hover:border-[#F5F1EA]/20 transition-colors rounded-xl p-5 sm:p-6"
                  >
                    {/* Item Thumbnail */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#1A1A1E] rounded-lg flex-shrink-0 relative overflow-hidden border border-[#F5F1EA]/10">
                      {displayImage ? (
                        <Image src={displayImage} alt={displayName} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-mono text-xs text-[#F5F1EA]/40">
                          Custom
                        </div>
                      )}
                      {item.customization && (
                        <span className="absolute top-1.5 left-1.5 bg-[#ED9518] text-[#0A0A0A] text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase">
                          Customized
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="font-display text-lg sm:text-xl font-bold uppercase tracking-tight text-[#F5F1EA]">
                            {displayName}
                          </h3>
                          <p className="font-mono text-xs text-[#F5F1EA]/60 uppercase tracking-wider mt-1">
                            {displayVariant}
                            {item.size ? ` · Size: ${item.size}` : ''}
                          </p>
                        </div>
                        <div className="font-mono text-lg sm:text-xl font-bold text-[#ED9518] whitespace-nowrap">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>

                      {/* Controls Row */}
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#F5F1EA]/5">
                        <div className="flex items-center gap-3 bg-[#1A1A1E] border border-[#F5F1EA]/10 rounded-md p-1">
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
                            disabled={item.quantity <= 1}
                            className={`w-7 h-7 flex items-center justify-center font-mono text-sm text-[#F5F1EA] rounded transition-colors ${
                              item.quantity <= 1
                                ? 'opacity-30 cursor-not-allowed'
                                : 'hover:bg-[#F5F1EA]/10'
                            }`}
                          >
                            −
                          </button>
                          <span className="font-mono text-sm font-bold text-[#F5F1EA] px-2 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
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
                            className="w-7 h-7 flex items-center justify-center font-mono text-sm text-[#F5F1EA] rounded hover:bg-[#F5F1EA]/10 transition-colors"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.productId, item.variantId, item.size)}
                          className="font-mono text-xs uppercase tracking-widest text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1.5"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary Card */}
            <div className="lg:col-span-4 bg-[#121214] border border-[#F5F1EA]/10 rounded-xl p-6 sm:p-8 sticky top-28 space-y-6">
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-[#F5F1EA] border-b border-[#F5F1EA]/10 pb-4">
                Order Summary
              </h2>

              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between text-[#F5F1EA]/70">
                  <span>Subtotal</span>
                  <span className="text-[#F5F1EA] font-semibold">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-[#F5F1EA]/70">
                  <span>Shipping</span>
                  <span className="text-emerald-400 text-xs">Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-[#F5F1EA]/70">
                  <span>GST / Taxes</span>
                  <span className="text-emerald-400 text-xs">Included in price</span>
                </div>
              </div>

              <div className="border-t border-[#F5F1EA]/10 pt-4 flex justify-between items-baseline">
                <div>
                  <span className="font-mono text-xs text-[#F5F1EA]/50 uppercase tracking-widest block">
                    Estimated Total
                  </span>
                  <span className="font-display text-3xl font-black text-[#F5F1EA] tracking-tight">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full py-4 px-6 bg-[#0057FF] hover:bg-[#0046CC] text-[#F5F1EA] font-mono text-xs font-bold uppercase tracking-[0.2em] rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-[#0057FF]/20 hover:shadow-[#0057FF]/40 transition-all duration-300 text-center"
              >
                PROCEED TO CHECKOUT →
              </Link>

              <div className="flex items-center justify-center gap-4 text-center font-mono text-[11px] text-[#F5F1EA]/40 pt-2">
                <span>🔒 256-Bit Encrypted</span>
                <span>•</span>
                <span>⚡ Instant Processing</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
