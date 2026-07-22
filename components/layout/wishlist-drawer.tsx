'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';
import { useWishlistStore } from '@/lib/stores/wishlist-store';
import { usePrice } from '@/lib/hooks/usePrice';
import Link from 'next/link';
import Image from 'next/image';
import { products } from '@/data/products';

export function WishlistDrawer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);

  const isOpen = useWishlistStore((s) => s.isOpen);
  const items = useWishlistStore((s) => s.items);
  const setWishlistOpen = useWishlistStore((s) => s.setWishlistOpen);
  const toggleItem = useWishlistStore((s) => s.toggleItem);
  const { formatPrice } = usePrice();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useWishlistStore.getState().isOpen) {
        useWishlistStore.getState().setWishlistOpen(false);
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
          const listItems = rightColRef.current.querySelectorAll('.wishlist-item');
          if (listItems.length > 0) {
            tl.fromTo(
              listItems,
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
          const listItems = rightColRef.current.querySelectorAll('.wishlist-item');
          if (listItems.length > 0) {
            tl.to(listItems, {
              x: 50,
              opacity: 0,
              duration: 0.2,
              stagger: -0.05,
              ease: 'power2.in',
            });
          }
        }

        if (leftColRef.current) {
          tl.to(leftColRef.current, { y: 20, opacity: 0, duration: 0.2, ease: 'power2.in' }, 0);
        }

        tl.to(bgRef.current, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.1);
      }
    },
    { dependencies: [isOpen], scope: containerRef },
  );

  if (!mounted) return null;

  const savedProducts = items
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as typeof products;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[150] hidden flex-col lg:flex-row">
      <div
        ref={bgRef}
        className="absolute inset-0 bg-charcoal/80 backdrop-blur-2xl -z-10"
        onClick={() => setWishlistOpen(false)}
      />

      <button
        onClick={() => setWishlistOpen(false)}
        className="absolute top-6 right-6 lg:top-10 lg:right-10 z-[160] w-12 h-12 flex items-center justify-center rounded-full bg-graphite/50 border border-smoke text-pearl hover:bg-ember hover:border-ember hover:text-bone transition-all duration-300"
      >
        <span className="sr-only">Close Wishlist</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M1 13L13 1M1 1L13 13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        ref={leftColRef}
        className="w-full lg:w-5/12 flex-shrink-0 pt-24 pb-8 px-8 lg:p-20 flex flex-col lg:justify-between border-b lg:border-b-0 lg:border-r border-smoke/30 relative"
      >
        <div className="hidden lg:block">
          <h2 className="font-mono text-caption text-ash uppercase tracking-widest mb-2">
            Saved Items
          </h2>
          <div className="w-12 h-px bg-ember" />
        </div>

        <div>
          <h1 className="font-display text-display-lg lg:text-[6rem] font-bold text-bone leading-none mb-4 lg:mb-8 tracking-tight">
            Your
            <br />
            Wishlist.
          </h1>

          <div className="flex items-baseline gap-4 mb-8">
            <span className="font-mono text-body-lg text-pearl uppercase">Total</span>
            <span className="font-mono text-caption text-ash uppercase ml-2">
              ({savedProducts.length} items)
            </span>
          </div>
        </div>
      </div>

      <div
        ref={rightColRef}
        className="w-full lg:w-7/12 flex-1 lg:h-full overflow-y-auto p-4 md:p-8 lg:p-20 custom-scrollbar"
      >
        {savedProducts.length === 0 ? (
          <div className="empty-state h-full flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full border border-smoke/50 flex items-center justify-center mb-6">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-smoke"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </div>
            <h3 className="font-display text-h3 text-pearl mb-4">No saved items.</h3>
            <p className="font-mono text-body-sm text-ash mb-8 max-w-sm">
              Keep track of products you love by adding them to your wishlist.
            </p>
            <Link
              href="/products/all"
              onClick={() => setWishlistOpen(false)}
              className="font-mono text-caption uppercase text-bone hover:text-ember transition-colors underline underline-offset-4 decoration-smoke hover:decoration-ember"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
            {savedProducts.map((product) => {
              const variant = product.variants[0];
              const displayImage = variant?.images[0];

              return (
                <div
                  key={product.id}
                  className="wishlist-item group relative flex flex-col gap-4 p-4 lg:p-6 bg-graphite/40 border border-smoke/50 hover:border-ember/50 hover:bg-graphite/80 transition-all duration-300 rounded-lg"
                >
                  <Link
                    href={`/products/${product.categorySlug}/${product.slug}`}
                    onClick={() => setWishlistOpen(false)}
                    className="block relative aspect-square w-full rounded overflow-hidden"
                  >
                    {displayImage && (
                      <Image
                        src={displayImage}
                        alt={product.name}
                        fill
                        className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    )}
                  </Link>

                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-display text-h4 text-bone truncate capitalize">
                        {product.name}
                      </h3>
                      <p className="font-mono text-body-sm text-pearl mt-1">
                        {formatPrice(product.basePrice)}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleItem(product.id)}
                      className="p-2 rounded-full bg-ember/20 border border-ember text-ember hover:bg-charcoal hover:border-smoke hover:text-ash transition-colors shrink-0"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
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
