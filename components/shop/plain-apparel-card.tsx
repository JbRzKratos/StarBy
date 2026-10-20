'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/data/products';
import { usePrice } from '@/lib/hooks/usePrice';

interface PlainApparelCardProps {
  product: Product;
  priority?: boolean;
}

export function PlainApparelCard({ product, priority = false }: PlainApparelCardProps) {
  const { formatPrice } = usePrice();
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const currentVariant = product.variants[selectedVariantIndex] || product.variants[0];
  const currentImage = currentVariant?.images?.[0] || '';

  // Extract GSM badge if present in tagline or name
  const gsmMatch = product.tagline.match(/(\d+\s*GSM)/i) || product.name.match(/(\d+\s*GSM)/i);
  const gsmBadge = gsmMatch ? gsmMatch[1].toUpperCase() : null;

  return (
    <Link
      href={`/products/${product.categorySlug}/${product.slug}`}
      className="group relative flex flex-col bg-[#111216] border border-white/10 hover:border-white/30 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-black/70 hover:-translate-y-1"
      aria-label={`View ${product.name}`}
    >
      {/* Visual Image Area */}
      <div className="relative aspect-[3/4] w-full bg-[#181A20] overflow-hidden flex items-center justify-center p-4">
        {/* Skeleton while loading */}
        {!isLoaded && !imageError && (
          <div className="absolute inset-0 bg-[#14161C] animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
          </div>
        )}

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* GSM Badge top-left */}
        {gsmBadge && (
          <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-mono font-medium text-white tracking-widest flex items-center gap-1.5 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {gsmBadge}
          </div>
        )}

        {/* 10 Angles badge top-right (desktop only to prevent collision on mobile) */}
        <div className="hidden sm:block absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-mono text-white/70 tracking-widest uppercase">
          10 Views
        </div>

        {/* Mockup Image from R2 */}
        {currentImage && !imageError ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={currentImage}
              alt={`${product.name} - ${currentVariant.name}`}
              fill
              priority={priority}
              onLoad={() => setIsLoaded(true)}
              onError={() => setImageError(true)}
              className={`object-contain transition-transform duration-500 ease-out group-hover:scale-105 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-white/40 text-xs text-center p-4">
            <span className="font-mono text-[10px] uppercase tracking-wider">Preview unavailable</span>
          </div>
        )}

        {/* Hover Overlay Button */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
          <span className="bg-white text-black font-mono text-[11px] font-semibold tracking-widest uppercase px-6 py-2.5 rounded-full shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            View & Buy
          </span>
        </div>
      </div>

      {/* Info & Swatches Footer */}
      <div className="p-4 flex flex-col gap-2 bg-[#111216] border-t border-white/5 flex-grow justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-emerald-400 font-medium uppercase tracking-widest">
              Plain Essential
            </span>
            <span className="font-mono text-[10px] text-white/40">
              {product.variants.length} Colors
            </span>
          </div>

          <h3 className="font-mono text-sm text-white/95 group-hover:text-white font-medium uppercase tracking-wider line-clamp-1">
            {product.name}
          </h3>

          <p className="font-mono text-[11px] text-white/50 line-clamp-1">
            {product.tagline}
          </p>
        </div>

        {/* Color Swatches */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
          <div
            className="flex items-center gap-1.5 overflow-x-auto py-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {product.variants.map((v, idx) => {
              const isSelected = idx === selectedVariantIndex;
              return (
                <button
                  key={v.id}
                  type="button"
                  title={v.name}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsLoaded(false);
                    setSelectedVariantIndex(idx);
                  }}
                  className={`w-5 h-5 rounded-full border transition-all duration-150 flex items-center justify-center ${
                    isSelected
                      ? 'scale-110 ring-2 ring-white ring-offset-1 ring-offset-[#111216] border-white'
                      : 'border-white/20 hover:scale-105'
                  }`}
                  style={{ backgroundColor: v.colorHex }}
                  aria-label={`Select ${v.name}`}
                >
                  {isSelected && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        v.colorHex === '#FFFFFF' || v.color === 'white' ? 'bg-black' : 'bg-white'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <span className="font-mono text-sm font-semibold text-white/90">
            {formatPrice(currentVariant.price || product.basePrice)}
          </span>
        </div>
      </div>
    </Link>
  );
}
