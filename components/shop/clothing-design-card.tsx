'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { ClothingDesignEntry } from '@/lib/clothing-designs/types';

interface ClothingDesignCardProps {
  design: ClothingDesignEntry;
  onSelect: (design: ClothingDesignEntry) => void;
  priority?: boolean;
}

export function ClothingDesignCard({ design, onSelect, priority = false }: ClothingDesignCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSurface, setActiveSurface] = useState<'front' | 'back' | 'sleeve'>(design.defaultSurface);

  const previewSrc = `/api/clothing-designs/${design.id}/preview?type=thumbnail&surface=${activeSurface}`;

  return (
    <div
      onClick={() => onSelect(design)}
      className="group relative flex flex-col bg-[#111216] border border-white/5 hover:border-white/20 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-black/50"
      style={{ perspective: '1000px' }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(design);
        }
      }}
      aria-label={`Select design ${design.name}`}
    >
      {/* Visual Canvas Area */}
      <div className="relative aspect-[3/4] w-full bg-[#181A20] overflow-hidden flex items-center justify-center p-6">
        {/* Skeleton while loading */}
        {!isLoaded && !imageError && (
          <div className="absolute inset-0 bg-[#14161C] animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
          </div>
        )}

        {/* Background Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* Subtle Streetwear Tee Wireframe Silhouette on Hover */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3 z-0">
          <svg viewBox="0 0 100 100" className="w-[88%] h-[88%] stroke-white/20 fill-white/[0.02] stroke-[1.2] transition-transform duration-500 group-hover:scale-105">
            <path d="M 33 20 C 40 24 60 24 67 20 L 86 32 L 78 44 L 70 40 L 70 82 C 70 83 69 84 68 84 L 32 84 C 31 84 30 83 30 82 L 30 40 L 22 44 L 14 32 Z" />
          </svg>
        </div>

        {/* Apparel Design Type Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-1 z-10 pointer-events-none">
          <span className="text-[10px]">👕</span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-white/90 font-semibold">Tee &amp; Hoodie Canvas</span>
        </div>

        {/* The Protected Preview Image */}
        {!imageError ? (
          <div className="relative w-full h-full flex items-center justify-center z-10">
            <Image
              src={previewSrc}
              alt={design.name}
              fill
              unoptimized
              priority={priority}
              onLoad={() => setIsLoaded(true)}
              onError={() => setImageError(true)}
              className={`object-contain transition-all duration-500 ease-out group-hover:scale-105 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-white/40 text-xs text-center p-4 z-10">
            <span className="font-mono text-[10px] uppercase tracking-wider">Preview unavailable</span>
          </div>
        )}

        {/* Multi-surface Pills if both Front & Back exist */}
        {design.availableSurfaces.length > 1 && (
          <div
            className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-1 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {design.availableSurfaces.map((s) => (
              <button
                key={s}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSurface(s);
                }}
                className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded-full transition-colors ${
                  activeSurface === s
                    ? 'bg-white text-black font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Hover Overlay Button */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-4 z-20">
          <span className="bg-white text-black font-mono text-[11px] font-bold tracking-widest uppercase px-5 py-2.5 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)] transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-1.5 group-hover:bg-[#ED9518] group-hover:text-black">
            <span>FIT ON 3D TEE</span>
            <span className="text-xs">→</span>
          </span>
          <span className="text-[9.5px] font-mono text-white/70 uppercase tracking-widest text-center">
            360° Studio • Oversized &amp; Hoodie
          </span>
        </div>
      </div>

      {/* Info Bar */}
      <div className="p-4 flex flex-col gap-1.5 bg-[#111216] border-t border-white/5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">
            {design.id.toUpperCase()}
          </span>
          <div className="flex items-center gap-1.5">
            {design.artworks && design.artworks.length > 1 && (
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                {design.artworks.length} Artworks
              </span>
            )}
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              3D Canvas
            </span>
          </div>
        </div>

        <h3 className="font-mono text-sm text-white/90 group-hover:text-white font-medium uppercase tracking-wider truncate">
          {design.name}
        </h3>

        <p className="font-mono text-[11px] text-white/50">
          {typeof design.basePrice === 'number' ? (
            <span className={design.basePrice === 1 ? 'text-emerald-400 font-bold' : 'text-white/90 font-medium'}>
              {design.basePrice === 1 ? '₹1' : `From ₹${design.basePrice.toLocaleString()}`}
            </span>
          ) : design.id === 'design-001' ? (
            <span className="text-emerald-400 font-bold">₹1</span>
          ) : (
            'From ₹799'
          )}{' '}
          <span className="text-white/30">• Heavyweight Tee / Hoodie</span>
        </p>
      </div>
    </div>
  );
}
