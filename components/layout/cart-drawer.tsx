'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';
import { useCartStore } from '@/lib/stores/cart-store';
import { usePrice } from '@/lib/hooks/usePrice';
import Link from 'next/link';
import { products } from '@/data/products';

export function CartDrawer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);

  const isOpen = useCartStore((s) => s.isOpen);
  const items = useCartStore((s) => s.items);
  const setCartOpen = useCartStore((s) => s.setCartOpen);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const totalItems = useCartStore((s) => s.totalItems());
  const { formatPrice } = usePrice();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useCartStore.getState().isOpen) {
        useCartStore.getState().setCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useGSAP(
    () => {
      if (!containerRef.current || !bgRef.current) return;

      if (isOpen) {
        document.body.style.overflow = 'hidden';
        gsap.set(containerRef.current, { display: 'flex' });

        const tl = gsap.timeline();

        // Background blur/fade in
        tl.fromTo(bgRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });

        // Left Column entrance (slide up)
        if (leftColRef.current) {
          tl.fromTo(
            leftColRef.current,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' },
            '-=0.2',
          );
        }

        // Stagger items in right column
        if (rightColRef.current) {
          const cartItems = rightColRef.current.querySelectorAll('.cart-item');
          if (cartItems.length > 0) {
            tl.fromTo(
              cartItems,
              { x: 50, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out' },
              '-=0.4',
            );
          } else {
            // Empty state animation
            const emptyState = rightColRef.current.querySelector('.empty-state');
            if (emptyState) {
              tl.fromTo(
                emptyState,
                { opacity: 0, scale: 0.95 },
                { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' },
                '-=0.4',
              );
            }
          }
        }
      } else {
        const tl = gsap.timeline({
          onComplete: () => {
            if (containerRef.current) gsap.set(containerRef.current, { display: 'none' });
            document.body.style.overflow = '';
          },
        });

        // Animate out items
        if (rightColRef.current) {
          const cartItems = rightColRef.current.querySelectorAll('.cart-item');
          if (cartItems.length > 0) {
            tl.to(cartItems, {
              x: 50,
              opacity: 0,
              duration: 0.2,
              stagger: -0.05,
              ease: 'power2.in',
            });
          }
        }

        // Animate out left col
        if (leftColRef.current) {
          tl.to(leftColRef.current, { y: 20, opacity: 0, duration: 0.2, ease: 'power2.in' }, 0);
        }

        // Fade out bg
        tl.to(bgRef.current, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.1);
      }
    },
    { dependencies: [isOpen], scope: containerRef },
  );

  if (!mounted) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[99990] hidden flex-col lg:flex-row">
      {/* Background Overlay */}
      <div
        ref={bgRef}
        className="absolute inset-0 bg-charcoal/80 backdrop-blur-2xl -z-10"
        onClick={() => setCartOpen(false)}
      />

      {/* Close Button (Global) */}
      <button
        onClick={() => setCartOpen(false)}
        className="absolute top-6 right-6 lg:top-10 lg:right-10 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-graphite/50 border border-smoke text-pearl hover:bg-cobalt hover:border-cobalt hover:text-bone transition-all duration-300"
      >
        <span className="sr-only">Close Cart</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 13L13 1M1 1L13 13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Left Column: Summary & CTA */}
      <div
        ref={leftColRef}
        className="w-full lg:w-5/12 flex-shrink-0 pt-24 pb-8 px-8 lg:p-20 flex flex-col lg:justify-between border-b lg:border-b-0 lg:border-r border-smoke/30 relative"
      >
        <div className="hidden lg:block">
          <h2 className="font-mono text-caption text-ash uppercase tracking-widest mb-2">
            Command Center
          </h2>
          <div className="w-12 h-px bg-cobalt" />
        </div>

        <div>
          <h1 className="font-display text-display-lg lg:text-[6rem] font-bold text-bone leading-none mb-4 lg:mb-8 tracking-tight">
            Your
            <br />
            Bag.
          </h1>

          <div className="flex items-baseline gap-4 mb-8">
            <span className="font-mono text-body-lg text-pearl uppercase">Total</span>
            <span className="font-mono text-display-md text-bone tracking-normal">
              {formatPrice(totalPrice())}
            </span>
            <span className="font-mono text-caption text-ash uppercase ml-2">
              ({totalItems} items)
            </span>
          </div>

          <Link
            href="/checkout"
            onClick={(e) => {
              if (items.length === 0) e.preventDefault();
              else setCartOpen(false);
            }}
            className={`group relative flex items-center justify-between w-full p-6 lg:p-8 overflow-hidden rounded-lg transition-colors duration-300 ${
              items.length > 0
                ? 'bg-bone hover:bg-cobalt text-charcoal hover:text-bone cursor-pointer'
                : 'bg-smoke text-ash cursor-not-allowed'
            }`}
            data-cursor-hover
          >
            <span className="relative z-10 font-mono text-body-sm lg:text-body-md uppercase tracking-widest font-bold">
              Proceed to Checkout
            </span>
            <span className="relative z-10 transform group-hover:translate-x-2 transition-transform duration-300">
              →
            </span>
          </Link>
        </div>
      </div>

      {/* Right Column: Items */}
      <div
        ref={rightColRef}
        className="w-full lg:w-7/12 flex-1 lg:h-full overflow-y-auto p-4 md:p-8 lg:p-20 custom-scrollbar"
      >
        {items.length === 0 ? (
          <div className="empty-state h-full flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full border border-smoke/50 flex items-center justify-center mb-6">
              <span className="font-mono text-h4 text-smoke">0</span>
            </div>
            <h3 className="font-display text-h3 text-pearl mb-4">Your bag is empty.</h3>
            <p className="font-mono text-body-sm text-ash mb-8 max-w-sm">
              You haven't added any products to your cart yet. Discover something unique.
            </p>
            <Link
              href="/products/all"
              onClick={() => setCartOpen(false)}
              className="font-mono text-caption uppercase text-bone hover:text-cobalt transition-colors underline underline-offset-4 decoration-smoke hover:decoration-cobalt"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4 lg:gap-6">
            <div className="flex justify-between items-end mb-4 border-b border-smoke/30 pb-4">
              <span className="font-mono text-caption text-ash uppercase tracking-widest">
                Item Details
              </span>
              <span className="font-mono text-caption text-ash uppercase tracking-widest hidden sm:block">
                Action
              </span>
            </div>

            {items.map((item, index) => {
              const product = products.find((p) => p.id === item.productId);
              const variant = product?.variants.find((v) => v.id === item.variantId);
              const displayName = product ? product.name : item.productId.replace('-', ' ');
              const displayVariantName = variant ? variant.name : item.variantId.replace('-', ' ');
              const displayImage =
                item.customization?.imageUrl ||
                variant?.images[0] ||
                product?.variants[0]?.images[0];

              return (
                <div
                  key={`${item.productId}-${item.variantId}-${index}`}
                  className="cart-item group relative flex flex-row gap-4 sm:gap-6 p-4 lg:p-6 bg-graphite/40 border border-smoke/50 hover:border-cobalt/50 hover:bg-graphite/80 transition-all duration-300 rounded-xl"
                >
                  {/* Image Placeholder / Visual */}
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-charcoal rounded-lg flex-shrink-0 relative overflow-hidden border border-smoke/30 flex items-center justify-center">
                    {displayImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={displayImage}
                        alt={displayName}
                        className="w-full h-full object-cover opacity-80"
                      />
                    ) : (
                      <span className="font-mono text-caption text-smoke uppercase rotate-45">
                        Preview
                      </span>
                    )}
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-cobalt/20 to-transparent mix-blend-overlay pointer-events-none" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-display text-h4 text-bone truncate pr-4 capitalize">
                          {displayName}
                        </h3>
                        <span className="font-mono text-body-sm text-pearl">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-mono text-[10px] sm:text-caption text-ash mb-4">
                        <span className="uppercase tracking-wider">{displayVariantName}</span>
                        {item.customization && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-smoke" />
                            <span>Customized</span>
                          </>
                        )}
                        {item.size && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-smoke" />
                            <span>Size: {item.size}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center bg-charcoal border border-smoke/50 rounded-md">
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
                          className="w-11 h-11 flex items-center justify-center text-pearl hover:text-bone hover:bg-smoke/20 transition-colors"
                        >
                          −
                        </button>
                        <span className="w-10 text-center font-mono text-caption text-bone">
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
                          className="w-11 h-11 flex items-center justify-center text-pearl hover:text-bone hover:bg-smoke/20 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.productId, item.variantId, item.size)}
                        className="font-mono text-caption text-pearl/70 hover:text-ember uppercase tracking-widest transition-colors flex items-center gap-2 underline decoration-smoke/50 hover:decoration-ember underline-offset-4"
                      >
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
