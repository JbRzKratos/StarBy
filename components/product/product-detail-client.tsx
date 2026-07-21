'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';
import type { Product } from '@/data/products';
import { useCartStore } from '@/lib/stores/cart-store';
import { ImageGallery } from './image-gallery';
import { VariantSelector } from './variant-selector';
import { SizeSelector } from './size-selector';
import { SizeFinderModal } from './size-finder-modal';
import { SizeChartModal } from './size-chart-modal';
import { useWishlistStore } from '@/lib/stores/wishlist-store';
import { usePrice } from '@/lib/hooks/usePrice';

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[1] ?? 'M');
  const [sizeFinder, setSizeFinder] = useState(false);
  const [sizeChart, setSizeChart] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { formatPrice } = usePrice();

  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useCartStore((state) => state.setCartOpen);

  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const isWishlisted = useWishlistStore((state) => state.hasItem(product.id));

  useGSAP(
    () => {
      if (!containerRef.current) return;

      gsap.fromTo(
        containerRef.current.children,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: 'power3.out' },
      );
    },
    { scope: containerRef },
  );

  const variant = product.variants[selectedVariant];

  const handleAddToCart = () => {
    if (!variant) return;
    addItem({
      productId: product.id,
      variantId: variant.id,
      quantity: 1,
      price: variant.price,
      ...(product.sizes && { size: selectedSize }),
      customization: null,
    });
    setCartOpen(true);
  };

  return (
    <>
      <main className="pt-36 md:pt-40 pb-20">
        <div
          ref={containerRef}
          className="section-container grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16"
        >
          {/* Left: Gallery */}
          <ImageGallery
            colorHex={variant?.colorHex ?? '#1A1A1E'}
            productName={product.name}
            images={variant?.images}
          />

          {/* Right: Info */}
          <div className="flex flex-col gap-6 md:pt-8">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="overline-label block mb-2">{product.categorySlug}</span>
                <h1 className="font-display text-display-md md:text-display-lg font-bold text-bone">
                  {product.name}
                </h1>
                <p className="font-display text-body-lg text-pearl mt-1">{product.tagline}</p>
              </div>
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3 rounded-full border transition-all duration-300 flex-shrink-0 mt-6 ${
                  isWishlisted
                    ? 'bg-ember/20 border-ember text-ember shadow-[0_0_15px_rgba(255,51,51,0.3)]'
                    : 'bg-transparent border-smoke text-ash hover:text-bone hover:border-bone/50'
                }`}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={isWishlisted ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-display-sm text-bone">
                {formatPrice(variant?.price ?? product.basePrice)}
              </span>
              <span className="font-mono text-caption text-ash">Incl. taxes</span>
            </div>

            {/* Variants */}
            {product.variants.length > 1 && (
              <VariantSelector
                variants={product.variants}
                selectedIndex={selectedVariant}
                onSelect={setSelectedVariant}
              />
            )}

            {/* Sizes */}
            {product.sizes && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-caption text-ash uppercase tracking-widest">
                    Size
                  </span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSizeChart(true)}
                      className="font-mono text-[10px] text-pearl uppercase tracking-widest underline underline-offset-4 hover:text-bone transition-colors"
                    >
                      Size Guide
                    </button>
                    <button
                      onClick={() => setSizeFinder(true)}
                      className="font-mono text-[10px] text-cobalt uppercase tracking-widest underline underline-offset-4 hover:text-bone transition-colors"
                    >
                      Find My Size →
                    </button>
                  </div>
                </div>
                <SizeSelector
                  sizes={product.sizes}
                  selected={selectedSize}
                  onSelect={setSelectedSize}
                />
              </div>
            )}

            {/* Description */}
            <p className="text-pearl text-body-md leading-relaxed border-t border-smoke pt-6">
              {product.description}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3.5 bg-cobalt text-bone font-mono text-caption uppercase tracking-widest hover:bg-cobalt/90 transition-colors"
              >
                Add to Cart
              </button>
              {product.customizable && (
                <Link
                  href={`/customize/${product.id}`}
                  className="flex-1 py-3.5 border border-bone/20 text-bone font-mono text-caption uppercase tracking-widest text-center hover:bg-bone/5 transition-colors"
                >
                  Customize This →
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>

      <SizeFinderModal
        isOpen={sizeFinder}
        onClose={() => setSizeFinder(false)}
        onSizeSelect={(size) => setSelectedSize(size)}
      />
      <SizeChartModal
        isOpen={sizeChart}
        onClose={() => setSizeChart(false)}
        category={product.categorySlug}
      />
    </>
  );
}
