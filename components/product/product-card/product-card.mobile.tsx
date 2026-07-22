import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/data/products';
import { useWishlistStore } from '@/lib/stores/wishlist-store';
import { usePrice } from '@/lib/hooks/usePrice';

interface ProductCardProps {
  product: Product;
}

export function ProductCardMobile({ product }: ProductCardProps) {
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const isWishlisted = useWishlistStore((state) => state.hasItem(product.id));
  const { formatPrice } = usePrice();

  const variant = product.variants[0];
  const href = `/products/${product.categorySlug}/${product.slug}`;

  return (
    <div className="group block relative" data-cursor-hover>
      <Link href={href} className="block">
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
            {variant?.images?.[0] && (
              <Image
                src={variant.images[0]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 424px) 100vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
              />
            )}
          </div>

          {/* Tags */}
          <div className="absolute top-3 left-3 flex gap-2">
            {product.customizable && (
              <span className="px-2 py-1 bg-cobalt/90 text-bone font-mono text-[10px] uppercase tracking-wider rounded-md">
                Customizable
              </span>
            )}
            {product.tags.includes('new') && (
              <span className="px-2 py-1 bg-ember/90 text-bone font-mono text-[10px] uppercase tracking-wider rounded-md">
                New
              </span>
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
            {formatPrice(product.basePrice)}
          </span>
        </div>
      </Link>

      {/* Wishlist Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(product.id);
        }}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md border transition-all duration-300 ${
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
}
