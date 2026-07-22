'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';
import type { Category } from '@/data/categories';

interface BentoTileProps {
  category: Category;
  size: 'large' | 'wide' | 'tall' | 'small';
}

const sizeClasses = {
  large: 'col-span-2 row-span-2',
  wide: 'col-span-2 row-span-1',
  tall: 'col-span-1 row-span-2',
  small: 'col-span-1 row-span-1',
};

export function BentoTile({ category, size }: BentoTileProps) {
  const tileRef = useRef<HTMLAnchorElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!tileRef.current || !overlayRef.current) return;

      const tl = gsap.timeline({ paused: true });
      tl.to(overlayRef.current, { opacity: 0.7, duration: 0.3 }, 0);

      const tile = tileRef.current;
      const onEnter = () => tl.play();
      const onLeave = () => tl.reverse();

      tile.addEventListener('mouseenter', onEnter);
      tile.addEventListener('mouseleave', onLeave);

      return () => {
        tile.removeEventListener('mouseenter', onEnter);
        tile.removeEventListener('mouseleave', onLeave);
      };
    },
    { scope: tileRef },
  );

  return (
    <Link
      ref={tileRef}
      href={`/products/${category.slug}`}
      className={`${sizeClasses[size]} relative overflow-hidden rounded-xl group`}
      style={{ background: category.gradient }}
    >
      {/* Background Image */}
      {category.image && (
        <Image
          src={category.image}
          alt={category.name}
          fill
          sizes="(max-width: 767px) 50vw, 25vw"
          className="absolute inset-0 object-cover opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-[opacity,transform] duration-700 ease-out mix-blend-luminosity"
        />
      )}

      {/* Dark gradient for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/20 to-transparent" />

      {/* Hover overlay */}
      <div ref={overlayRef} className="absolute inset-0 bg-cobalt opacity-0 mix-blend-color" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6">
        <span className="font-mono text-caption text-pearl/70 uppercase tracking-widest mb-1">
          {category.productCount} items
        </span>
        <h3
          className={`font-display font-bold text-bone ${size === 'large' ? 'text-display-md' : 'text-display-sm'}`}
        >
          {category.name}
        </h3>
        {(size === 'large' || size === 'wide') && (
          <p className="font-display text-body-sm text-pearl mt-1 max-w-xs">{category.tagline}</p>
        )}
      </div>
    </Link>
  );
}
