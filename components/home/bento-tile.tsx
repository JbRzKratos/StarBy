'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import type { Category } from '@/data/categories';
import { getR2AssetUrl } from '@/lib/r2';

export const CATEGORY_TAGLINES: Record<string, string> = {
  tees: 'Heavyweight custom essentials.',
  hoodies: 'Structured oversized warmth.',
  magazine: 'Bespoke editorial print.',
  'split-posters': 'One image. Multiple panels.',
  'wall-studio': 'Curated gallery compositions.',
  posters: 'Museum-scale fine art.',
  skins: 'Precision tech wraps.',
  stationery: 'Archival journals & notebooks.',
  'mugs-cups': 'Studio ceramics & tumblers.',
};

export const CATEGORY_HREFS: Record<string, string> = {
  tees: '/products/tees',
  hoodies: '/products/hoodies',
  magazine: '/magazine',
  'split-posters': '/split-poster',
  'wall-studio': '/wall-studio',
  posters: '/products/posters',
  skins: '/products/skins',
  stationery: '/products/stationery',
  'mugs-cups': '/products/mugs-cups',
};

export const CATEGORY_IMAGE_OVERRIDES: Record<string, string> = {
  tees: 'plain-tees/Oversized-French-Terry-240GSM/Black/Plain_Oversized-French-Terry-240GSM_Black_01_Model-Front.jpg',
  hoodies: 'plain-tees/Hoodie-Brushed-Fleece-300GSM/Black/Plain_Hoodie-Brushed-Fleece-300GSM_Black_01_Model-Front.jpg',
  'split-posters':
    'posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_2097d66e-d042-46a0-a7ac-2fa51c635caf_3.webp',
  posters:
    'posters/Fregoro_Studios_Batman_standing_alone_on_a_rain_soaked_gothic_r_c46d574d-e4ce-4dea-abdd-eb59f01017eb.webp',
  'wall-studio':
    'posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp',
  magazine: 'templates/canva/fashion-1/thumbnail.webp',
  skins: 'images/products/phantom-skin.webp',
  stationery: 'images/products/chronicle-diary.webp',
  'mugs-cups': 'images/products/classic_mug_11oz.webp',
};

export const CATEGORY_GROUPS: Record<string, 'wearables' | 'wall' | 'editorial'> = {
  tees: 'wearables',
  hoodies: 'wearables',
  'split-posters': 'wall',
  'wall-studio': 'wall',
  posters: 'wall',
  magazine: 'editorial',
  skins: 'editorial',
  stationery: 'editorial',
  'mugs-cups': 'editorial',
};

interface BentoTileProps {
  category: Category;
  className?: string;
  sizeVariant?: 'hero' | 'wide' | 'compact';
}

export function BentoTile({
  category,
  className = '',
  sizeVariant = 'wide',
}: BentoTileProps) {
  const href = CATEGORY_HREFS[category.slug] || `/products/${category.slug}`;
  const rawSrc = CATEGORY_IMAGE_OVERRIDES[category.slug] || category.image;
  const imageSrc = rawSrc ? getR2AssetUrl(rawSrc) : '';
  const tagline = CATEGORY_TAGLINES[category.slug] || category.tagline;

  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] hover:border-white/30 bg-[#121215] flex flex-col justify-between transition-[border-color,box-shadow] duration-500 ease-out-expo hover:shadow-[0_0_30px_rgba(59,94,255,0.15)] ${className}`}
    >
      {/* Background Image — our authentic mockups and artworks */}
      {imageSrc && (
        <Image
          src={imageSrc}
          alt={category.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="absolute inset-0 object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-[transform,opacity] duration-700 ease-out pointer-events-none"
        />
      )}

      {/* Subtle vignettes to keep typography clean and legible */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#0E0E0F]/70 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#0E0E0F]/90 via-[#0E0E0F]/45 to-transparent pointer-events-none" />

      {/* ── Top Bar: Minimal Status & Clean Arrow ── */}
      <div className="relative z-10 flex items-center justify-between p-4 md:p-5">
        <div>
          {category.comingSoon && (
            <span className="font-mono text-[10px] tracking-wider uppercase text-pearl/70 bg-charcoal/80 border border-white/10 px-2.5 py-0.5 rounded-full">
              Coming Soon
            </span>
          )}
        </div>

        <span className="w-7 h-7 rounded-full bg-charcoal/80 border border-white/10 flex items-center justify-center text-pearl/70 group-hover:text-bone group-hover:bg-cobalt group-hover:border-cobalt transition-colors duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shadow-sm">
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>

      {/* ── Bottom Content: Clean Minimalist Typography ── */}
      <div className="relative z-10 p-5 md:p-6">
        <h3
          className={`font-display font-bold text-bone tracking-tight ${
            sizeVariant === 'hero'
              ? 'text-2xl sm:text-3xl lg:text-4xl'
              : sizeVariant === 'wide'
                ? 'text-xl sm:text-2xl'
                : 'text-lg sm:text-xl'
          }`}
        >
          {category.name}
        </h3>
        <p className="font-sans text-body-sm text-ash/80 group-hover:text-pearl transition-colors line-clamp-1 mt-1">
          {tagline}
        </p>
      </div>
    </Link>
  );
}
