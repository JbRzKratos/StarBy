'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';
import type { Product } from '@/data/products';

interface ProductCardProps {
  product: Product;
}

export function ProductCardDesktop({ product }: ProductCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!cardRef.current || !mockupRef.current) return;

      const tl = gsap.timeline({ paused: true });
      tl.to(
        mockupRef.current,
        {
          scale: 1.05,
          rotateY: 5,
          rotateX: -2,
          duration: 0.5,
          ease: 'power2.out',
        },
        0,
      );

      const card = cardRef.current;
      const onEnter = () => tl.play();
      const onLeave = () => tl.reverse();

      card.addEventListener('mouseenter', onEnter);
      card.addEventListener('mouseleave', onLeave);

      return () => {
        card.removeEventListener('mouseenter', onEnter);
        card.removeEventListener('mouseleave', onLeave);
      };
    },
    { scope: cardRef },
  );

  const variant = product.variants[0];
  const href = `/products/${product.categorySlug}/${product.slug}`;

  return (
    <Link ref={cardRef} href={href} className="group block" data-cursor-hover>
      {/* Image area */}
      <div
        className="relative overflow-hidden rounded-lg mb-4 aspect-[3/4]"
        style={{ perspective: '600px' }}
      >
        <div
          ref={mockupRef}
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
            <span className="px-2 py-1 bg-cobalt/90 text-bone font-mono text-[10px] uppercase tracking-wider">
              Customizable
            </span>
          )}
          {product.tags.includes('new') && (
            <span className="px-2 py-1 bg-ember/90 text-bone font-mono text-[10px] uppercase tracking-wider">
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
          ₹{product.basePrice}
        </span>
      </div>
    </Link>
  );
}
