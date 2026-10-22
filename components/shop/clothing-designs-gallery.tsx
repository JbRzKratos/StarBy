'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { ClothingDesignEntry } from '@/lib/clothing-designs/types';
import type { CatalogDesignEntry } from '@/lib/clothing-designs/catalog-page';
import { ClothingDesignCard } from './clothing-design-card';
import { ClothingProductModalLoading } from './clothing-product-modal-loading';
import { prefetchClothingProductModal } from './clothing-product-modal-prefetch';
// ClothingProductModal (~51 kB) — lazy loaded, only shown when a design card is clicked
const ClothingProductModal = dynamic(
  () => import('./clothing-product-modal').then((m) => m.ClothingProductModal),
  {
    ssr: false,
    loading: () => <ClothingProductModalLoading />,
  },
);
import Link from 'next/link';
import { PlainApparelCard } from './plain-apparel-card';
import { plainApparelProducts } from '@/data/plain-apparel-products';

import type { Product } from '@/data/products';

interface ClothingDesignsGalleryProps {
  category: 'tees' | 'hoodies';
  searchQuery?: string;
  products?: Product[];
  /** First page of designs, rendered on the server so images load immediately. */
  initialDesigns?: CatalogDesignEntry[];
  initialTotal?: number;
  initialTotalPages?: number;
}

export function ClothingDesignsGallery({
  category,
  searchQuery = '',
  products,
  initialDesigns,
  initialTotal,
  initialTotalPages,
}: ClothingDesignsGalleryProps) {
  const [designs, setDesigns] = useState<ClothingDesignEntry[]>(
    (initialDesigns as ClothingDesignEntry[] | undefined) || []
  );
  const [activeTheme, setActiveTheme] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages ?? 1);
  const [totalCount, setTotalCount] = useState(initialTotal ?? 0);
  const [isLoading, setIsLoading] = useState(!initialDesigns || initialDesigns.length === 0);
  const [selectedDesign, setSelectedDesign] = useState<ClothingDesignEntry | null>(null);
  const [openingDesignId, setOpeningDesignId] = useState<string | null>(null);

  // Warm the modal chunk during idle time so the first tap on a phone does not
  // have to wait for a JavaScript download. It is a small chunk and is shared
  // by every card on the page.
  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (win.requestIdleCallback) {
      const handle = win.requestIdleCallback(() => prefetchClothingProductModal(), { timeout: 2500 });
      return () => win.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(prefetchClothingProductModal, 2500);
    return () => window.clearTimeout(timer);
  }, []);

  // The server already sent the first page for the default view, so the very
  // first effect run must not trigger a duplicate round trip.
  const skipInitialFetchRef = React.useRef(
    Boolean(initialDesigns && initialDesigns.length > 0)
  );

  const plainProductsForCategory = React.useMemo(() => {
    if (products && products.length > 0) {
      const dbPlain = products.filter(
        (p) =>
          p.categorySlug === category &&
          (p.tags?.includes('plain') || p.id.startsWith('plain_') || p.slug.startsWith('plain-')),
      );
      if (dbPlain.length > 0) return dbPlain;
    }
    return plainApparelProducts.filter((p) => p.categorySlug === category);
  }, [products, category]);

  const THEME_CATEGORIES = [
    { id: 'all', label: 'All Graphics', icon: '✦' },
    { id: 'plain', label: 'Plain Essentials (Blanks)', icon: '◻' },
    { id: 'anime', label: 'Anime & Manga', icon: '✧' },
    { id: 'automotive', label: 'Automotive & JDM', icon: '⚙' },
    { id: 'marvel', label: 'Marvel & Comics', icon: '🛡' },
    { id: 'streetwear', label: 'Streetwear & Urban', icon: '▲' },
    { id: 'typography', label: 'Typography & Quotes', icon: 'Aa' },
    { id: 'gaming', label: 'Gaming & Tech', icon: '⌗' },
    { id: 'indian-cinema', label: 'Cinema & Stars', icon: '▶' },
    { id: 'humor', label: 'Humor & Sarcasm', icon: '☺' },
    { id: 'aesthetic', label: 'Aesthetic & Nature', icon: '✿' },
  ];

  const fetchDesigns = useCallback(
    async (targetPage: number, resetList = false, themeOverride?: string) => {
      const currentTheme = themeOverride !== undefined ? themeOverride : activeTheme;
      if (currentTheme === 'plain') {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const garmentFilter = category === 'hoodies' ? 'hoodie' : '';
        const params = new URLSearchParams({
          page: targetPage.toString(),
          limit: '24',
        });
        if (garmentFilter) params.set('garment', garmentFilter);
        if (searchQuery) params.set('q', searchQuery);
        if (currentTheme && currentTheme !== 'all') params.set('theme', currentTheme);

        const res = await fetch(`/api/clothing-designs?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setDesigns((prev) => (resetList ? data.designs : [...prev, ...data.designs]));
            setTotalPages(data.totalPages);
            setTotalCount(data.total);
            setPage(targetPage);
          }
        }
      } catch (err) {
        console.error('[ClothingDesignsGallery] Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [category, searchQuery, activeTheme],
  );

  // Initial and category/search change load
  useEffect(() => {
    // The first page is already rendered on the server for the default view.
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      return;
    }
    fetchDesigns(1, true);
  }, [fetchDesigns]);

  const handleSelectTheme = (themeId: string) => {
    if (themeId === activeTheme) return;
    setActiveTheme(themeId);
    fetchDesigns(1, true, themeId);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !isLoading) {
      fetchDesigns(page + 1, false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 sm:gap-8">
      {/* 3D Studio Creation Process Ribbon */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#16181E] via-[#121318] to-[#16181E] border border-white/10 p-4 sm:p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest bg-[#ED9518]/15 text-[#ED9518] border border-[#ED9518]/30 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ED9518] animate-pulse" />
                Interactive 3D Apparel Lab
              </span>
              <span className="text-[11px] font-mono text-white/50 uppercase hidden sm:inline">• Curated Graphics For Tees &amp; Hoodies</span>
            </div>
            <h3 className="text-base sm:text-lg font-mono font-bold text-white tracking-wide uppercase">
              Every Garment Is Your Canvas. Pick Any Graphic → Fit On 3D Apparel.
            </h3>
            <p className="font-mono text-xs text-white/60 leading-relaxed">
              No flat static mockups. Click any design below to inspect in 360° 3D, switch between Tee &amp; Hoodie cuts, and preview approved fabric colors in real-time.
            </p>
          </div>

          <Link
            href="/customize/clothing-mockup"
            className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black font-mono text-xs font-bold uppercase tracking-widest hover:bg-[#ED9518] hover:text-black transition-all active:scale-95 shadow-lg shadow-black/40"
          >
            <span>Launch Blank 3D Studio</span>
            <span className="text-sm">→</span>
          </Link>
        </div>

        {/* 3-Step Flow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 mt-4 border-t border-white/10">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center font-mono text-xs font-bold text-white flex-shrink-0">
              01
            </span>
            <div className="flex flex-col">
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                1. Choose Design
              </span>
              <span className="text-[11px] text-white/50 leading-relaxed">
                Browse curated drops (Anime, Automotive, Streetwear, Marvel) or tap &apos;Blank Studio&apos; to upload your own artwork.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="w-7 h-7 rounded-lg bg-[#ED9518]/20 text-[#ED9518] flex items-center justify-center font-mono text-xs font-bold flex-shrink-0">
              02
            </span>
            <div className="flex flex-col">
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                2. Preview In 360° 3D
              </span>
              <span className="text-[11px] text-white/50 leading-relaxed">
                Fit on Heavyweight Tee, Acid Wash, or Hoodie. Spin 360°, test fabric colorways, and inspect motion simulation.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold flex-shrink-0">
              03
            </span>
            <div className="flex flex-col">
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                3. Crafted &amp; Delivered
              </span>
              <span className="text-[11px] text-white/50 leading-relaxed">
                Industrial high-definition DTF printing on luxury 240–400 GSM heavyweight combed cotton &amp; fleece.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Header Bar */}
      <div className="flex flex-col gap-4 pb-4 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="font-mono text-sm uppercase tracking-widest text-white/90">
              {activeTheme === 'plain'
                ? category === 'hoodies'
                  ? 'Plain Hoodie Essentials'
                  : 'Plain Tees Essentials'
                : category === 'hoodies'
                  ? 'Hoodie Graphic Library'
                  : 'Tees Graphic Library'}
            </h2>
            <span className="font-mono text-xs text-white/40 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
              {activeTheme === 'plain'
                ? `${plainProductsForCategory.length} Styles`
                : `${totalCount} Designs`}
            </span>
          </div>

          <p className="font-mono text-xs text-white/50">
            {activeTheme === 'plain'
              ? 'Premium heavy GSM combed cotton blanks with 10 studio photo angles per color'
              : 'Select any design to choose garment, color & customize in 3D'}
          </p>
        </div>

        {/* Category Pills Filter Bar */}
        <div className="relative">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 hide-scrollbar scroll-smooth pr-10">
            {THEME_CATEGORIES.map((cat) => {
              const isActive = activeTheme === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectTheme(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono transition-all duration-200 active:scale-95 ${
                    isActive
                      ? 'bg-white text-black font-semibold shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                      : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.09] border border-white/5'
                  }`}
                >
                  <span className="opacity-80">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
          {/* Subtle right-edge fade gradient cue */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-[#0E0E10] to-transparent" />
        </div>
      </div>

      {/* Quick link banner to Plain Essentials when in graphics mode */}
      {activeTheme !== 'plain' && plainProductsForCategory.length > 0 && (
        <div
          onClick={() => handleSelectTheme('plain')}
          className="group flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-white/[0.06] via-white/[0.03] to-transparent border border-white/10 hover:border-white/20 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">👕</span>
            <div>
              <p className="font-mono text-xs text-white/90 font-medium group-hover:text-white">
                Looking for clean, unprinted plain blanks?
              </p>
              <p className="font-mono text-[11px] text-white/50">
                {category === 'hoodies'
                  ? 'Explore 300 GSM Heavyweight Hoodies in Black & White.'
                  : 'Explore 180 GSM Regular, 240 GSM French Terry & Acid Wash Blanks.'}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-xs text-white/70 group-hover:text-white bg-white/5 group-hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition-colors">
            Explore Plain Essentials &rarr;
          </span>
        </div>
      )}

      {/* Grid: Plain Essentials Mode */}
      {activeTheme === 'plain' ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {plainProductsForCategory.map((product, idx) => (
              <PlainApparelCard key={product.id} product={product} priority={idx === 0} />
            ))}
          </div>
        </div>
      ) : designs.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {designs.map((design, idx) => (
            <ClothingDesignCard
              key={design.id}
              design={design}
              onSelect={(selected) => {
                setOpeningDesignId(selected.id);
                setSelectedDesign(selected);
              }}
              isOpening={openingDesignId === design.id}
              priority={idx < 4}
            />
          ))}
        </div>
      ) : (
        !isLoading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
            <span className="text-3xl text-white/20">⚲</span>
            <p className="font-mono text-sm text-white/60 uppercase tracking-wider">
              No matching designs found
            </p>
            <p className="font-mono text-xs text-white/40">
              Try a different keyword or reset your filters.
            </p>
          </div>
        )
      )}

      {/* Loading Indicator / Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`skel-${i}`}
              className="aspect-[3/4] bg-[#14161C] rounded-2xl animate-pulse border border-white/5"
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {activeTheme !== 'plain' && page < totalPages && !isLoading && (
        <div className="flex justify-center pt-8">
          <button
            onClick={handleLoadMore}
            className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-mono text-xs uppercase tracking-widest rounded-full border border-white/10 hover:border-white/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <span>Load More Designs</span>
            <span className="text-white/40">
              ({designs.length} of {totalCount})
            </span>
          </button>
        </div>
      )}

      {/* Configuration Modal */}
      {selectedDesign && (
        <ClothingProductModal
          design={selectedDesign}
          onClose={() => {
            setSelectedDesign(null);
            setOpeningDesignId(null);
          }}
          defaultCategory={category}
        />
      )}
    </div>
  );
}
