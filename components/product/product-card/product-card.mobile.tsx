'use client';

import { useState, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/data/products';
import { useWishlistStore } from '@/lib/stores/wishlist-store';
import { usePrice } from '@/lib/hooks/usePrice';
import { getR2AssetUrl } from '@/lib/r2-public';
import { isProductComingSoon } from '@/data/categories';

interface ProductCardProps {
  product: Product;
  onCardClick?: (e: React.MouseEvent) => void;
  onPrefetch?: () => void;
}

export const ProductCardMobile = memo(function ProductCardMobile({
  product,
  onCardClick,
  onPrefetch,
}: ProductCardProps) {
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const isWishlisted = useWishlistStore((state) => state.items.includes(product.id));
  const { formatPrice } = usePrice();
  const [imgError, setImgError] = useState(false);

  const fallbackImg = getR2AssetUrl('images/hero/posters.webp');
  const isComingSoon = isProductComingSoon(product);
  const variant = product.variants[0];
  const primaryImg = variant?.images?.[0] || fallbackImg;
  const imgSrc = imgError ? fallbackImg : primaryImg;
  const href = `/products/${product.categorySlug}/${product.slug || product.id}`;

  return (
    <div
      className="group block relative"
      data-cursor-hover
      onPointerEnter={onPrefetch}
      onTouchStart={onPrefetch}
      onFocus={onPrefetch}
    >
      <Link
        href={href}
        onClick={(e) => {
          if (onCardClick) {
            onCardClick(e);
          }
        }}
        className="block cursor-pointer"
      >
        {/* Image area */}
        <div className="relative overflow-hidden rounded-2xl mb-4 aspect-[3/4]">
          <div
            className="w-full h-full relative"
            style={{
              background: variant
                ? `linear-gradient(145deg, ${variant.colorHex}88, ${variant.colorHex})`
                : 'linear-gradient(145deg, #1A1A1E, #2A2A2F)',
            }}
          >
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              onError={() => setImgError(true)}
              className="object-cover"
              sizes="(max-width: 639px) 90vw, (max-width: 1023px) 46vw, 23vw"
            />
          </div>

          {/* Tags */}
          <div className="absolute top-3 left-3 flex gap-2">
            {isComingSoon ? (
              <span className="px-2.5 py-1 bg-[#1A1A1E]/95 border border-[#ED9518]/60 text-[#ED9518] font-mono text-[9px] uppercase tracking-wider rounded-md font-bold shadow-lg flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ED9518] animate-pulse" />
                <span>Coming Soon</span>
              </span>
            ) : (
              <>
                {product.id.startsWith('design-') || product.tags.includes('clothing-design') ? (
                  <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] uppercase tracking-wider rounded-md backdrop-blur-sm">
                    3D Studio
                  </span>
                ) : product.tags.includes('new') ? (
                  <span className="px-2 py-1 bg-ember/90 text-bone font-mono text-[10px] uppercase tracking-wider rounded-md">
                    New
                  </span>
                ) : null}
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-body-md text-bone group-hover:text-cobalt transition-colors">
              {product.name}
            </h3>
            <p className="font-display text-body-sm text-pearl mt-0.5">{product.tagline}</p>
          </div>
          <span className="font-mono text-caption text-bone whitespace-nowrap mt-0.5">
            {isComingSoon ? (
              <span className="text-[#ED9518] font-mono text-xs uppercase tracking-wider font-bold">
                Coming Soon
              </span>
            ) : (
              formatPrice(product.basePrice)
            )}
          </span>
        </div>
      </Link>

      {/* Wishlist Button (44x44px touch target) */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(product.id);
        }}
        className={`absolute top-2 right-2 z-10 w-11 h-11 flex items-center justify-center rounded-full backdrop-blur-md border transition-colors duration-300 ${
          isWishlisted
            ? 'bg-ember/20 border-ember text-ember shadow-[0_0_15px_rgba(255,51,51,0.3)]'
            : 'bg-charcoal/40 border-smoke/50 text-pearl'
        }`}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <svg
          width="16"
          height="16"
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
  );
});
