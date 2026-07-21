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

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[1] ?? 'M');
  const [sizeFinder, setSizeFinder] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setCartOpen);

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
            <div>
              <span className="overline-label block mb-2">{product.categorySlug}</span>
              <h1 className="font-display text-display-md md:text-display-lg font-bold text-bone">
                {product.name}
              </h1>
              <p className="font-display text-body-lg text-pearl mt-1">{product.tagline}</p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-display-sm text-bone">
                ₹{variant?.price ?? product.basePrice}
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
                  <button
                    onClick={() => setSizeFinder(true)}
                    className="font-mono text-[10px] text-cobalt uppercase tracking-widest underline underline-offset-4 hover:text-bone transition-colors"
                  >
                    Find My Size →
                  </button>
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
    </>
  );
}
