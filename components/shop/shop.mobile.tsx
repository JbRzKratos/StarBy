'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Product } from '@/data/products';
import { SHOP_CATEGORIES } from './shop.shared';
import { CategoryComingSoonPage } from './category-coming-soon-page';
import { getR2AssetUrl } from '@/lib/r2';
import { usePrice } from '@/lib/hooks/usePrice';
import { isProductComingSoon, isCategoryComingSoon } from '@/data/categories';
import { ClothingDesignsGallery } from './clothing-designs-gallery';
import { ClothingProductModal } from './clothing-product-modal';
import type { ClothingDesignEntry } from '@/lib/clothing-designs/types';
import {
  classifyProduct,
  sortCatalogProducts,
  matchesProductSearch,
  filterByPreset,
  QUICK_FILTER_PRESETS,
} from '@/lib/shop/product-classifier';

function MobileProductCard({
  product,
  index,
  onSelectDesign,
}: {
  product: Product;
  index: number;
  onSelectDesign?: (designId: string) => void;
}) {
  const { formatPrice } = usePrice();
  const isComingSoon = isProductComingSoon(product);
  const productType = classifyProduct(product);
  const isClothingDesign = productType === 'tees-designs';
  const isPlainApparel = productType === 'plain-tees';
  const isSplitPoster = productType === 'split-posters';
  const [imgError, setImgError] = useState(false);

  const fallbackImg = getR2AssetUrl('images/hero/posters.webp');
  const primaryImg = product.variants[0]?.images?.[0] || fallbackImg;
  const imgSrc = imgError ? fallbackImg : primaryImg;

  if (isClothingDesign) {
    return (
      <div
        onClick={() => onSelectDesign?.(product.id)}
        className="group flex flex-col gap-0 col-span-1 cursor-pointer"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-[#16161A] rounded-xl border border-white/5 active:border-emerald-500/40 transition-colors">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            unoptimized
            priority={index < 6}
            className="object-contain p-3 transition-transform duration-500 active:scale-105"
            sizes="(max-width: 768px) 50vw"
            onError={() => setImgError(true)}
          />
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[8px] font-mono text-emerald-400 uppercase tracking-wider backdrop-blur-sm flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            3D Studio
          </div>
        </div>

        <div className="flex flex-col gap-0.5 mt-3">
          <div className="flex items-center justify-between gap-1">
            <h3 className="font-mono text-[11px] text-bone uppercase tracking-widest truncate group-hover:text-emerald-400">
              {product.name}
            </h3>
            <span className="font-mono text-[8px] text-emerald-400/80 uppercase px-1 rounded bg-emerald-500/10 flex-shrink-0">
              3D
            </span>
          </div>
          <p className="font-display text-sm text-pearl">{formatPrice(product.basePrice)}</p>
        </div>
      </div>
    );
  }

  const productHref =
    product.categorySlug === 'skins'
      ? '/products/skins'
      : isSplitPoster
        ? `/products/split-posters/${product.slug || product.id}`
        : `/products/${product.categorySlug}/${product.slug || product.id}`;

  return (
    <Link
      href={productHref}
      prefetch={true}
      className="group flex flex-col gap-0 col-span-1"
    >
      {/* Standard Hover Image wrapper */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#16161A] rounded-xl border border-white/5 active:border-smoke/40 transition-colors">
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          unoptimized
          priority={index < 6}
          className={`${isComingSoon ? 'object-contain p-3' : 'object-cover'} transition-transform duration-500 active:scale-105`}
          sizes="(max-width: 768px) 50vw"
          onError={() => setImgError(true)}
        />
        {isComingSoon ? (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[8px] font-mono font-medium text-amber-300 uppercase tracking-wider backdrop-blur-sm flex items-center gap-1 shadow-lg">
            <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
            Coming Soon
          </div>
        ) : isPlainApparel ? (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/60 border border-white/20 text-[8px] font-mono text-bone uppercase tracking-wider backdrop-blur-sm flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-blue-400" />
            Blank
          </div>
        ) : isSplitPoster ? (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-[8px] font-mono text-purple-300 uppercase tracking-wider backdrop-blur-sm flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-purple-400" />
            Split
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-0.5 mt-3">
        <div className="flex items-center justify-between gap-1">
          <h3 className="font-mono text-[11px] text-bone uppercase tracking-widest truncate">
            {product.name}
          </h3>
          {isPlainApparel && (
            <span className="font-mono text-[8px] text-ash/80 uppercase px-1 rounded bg-white/5 flex-shrink-0">
              Plain
            </span>
          )}
        </div>
        <p className="font-display text-sm text-pearl">
          {isComingSoon ? (
            <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400/90 font-medium">
              Coming Soon
            </span>
          ) : (
            formatPrice(product.basePrice)
          )}
        </p>
      </div>
    </Link>
  );
}

export function ShopMobile({ category, products }: { category: string; products: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(category || 'all');
  const [filterType, setFilterType] = useState('all');
  const [quickPreset, setQuickPreset] = useState('all');
  const [sortMethod, setSortMethod] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);
  const [selectedClothingDesign, setSelectedClothingDesign] = useState<ClothingDesignEntry | null>(null);

  const handleSelectDesign = async (designId: string) => {
    try {
      const res = await fetch(`/api/clothing-designs?id=${designId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.designs && data.designs.length > 0) {
          setSelectedClothingDesign(data.designs[0]);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    router.push(`/customize/clothing-mockup?designId=${designId}`);
  };

  useEffect(() => {
    setActiveTab(category || 'all');
  }, [category]);

  useEffect(() => {
    setFilterType(searchParams.get('type') || 'all');
    setQuickPreset(searchParams.get('preset') || 'all');
    setSortMethod(searchParams.get('sort') || 'featured');
    setSearchQuery(searchParams.get('q') || '');
    setMinPrice(searchParams.get('min') || '');
    setMaxPrice(searchParams.get('max') || '');
  }, [searchParams]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setQuickPreset('all');
    router.push(`/products/${tabId}`, { scroll: false });
  };

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', type);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setIsFilterOpen(false);
  };

  const handlePresetClick = (presetId: string) => {
    const next = quickPreset === presetId ? 'all' : presetId;
    setQuickPreset(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next !== 'all') params.set('preset', next);
    else params.delete('preset');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sort = e.target.value;
    setSortMethod(sort);
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sort);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setIsFilterOpen(false);
  };

  const baseProducts = useMemo(() => {
    if (activeTab !== 'all') {
      const filtered = products.filter((p) => p.categorySlug === activeTab && !isProductComingSoon(p));
      return sortCatalogProducts(filtered, sortMethod);
    }

    // Catalog view (All Designs):
    // Prioritize in strict requested sequence:
    // 1. Plain Tees & Hoodies (Blank essentials)
    // 2. Tees Designs (Curated graphic artworks)
    // 3. Posters (Single art posters)
    // 4. Split Posters (Multi-panel wall art)
    // 5. Other Active Products
    const activeSelling = products.filter((p) => !isProductComingSoon(p));
    return sortCatalogProducts(activeSelling, sortMethod);
  }, [products, activeTab, sortMethod]);

  let filteredProducts = baseProducts;

  // Identity / Category filter
  if (filterType === 'plain') {
    filteredProducts = filteredProducts.filter((p) => classifyProduct(p) === 'plain-tees');
  } else if (filterType === 'designs') {
    filteredProducts = filteredProducts.filter((p) => classifyProduct(p) === 'tees-designs');
  } else if (filterType === 'wall-art') {
    filteredProducts = filteredProducts.filter(
      (p) => classifyProduct(p) === 'posters' || classifyProduct(p) === 'split-posters',
    );
  } else if (filterType === 'customizable') {
    filteredProducts = filteredProducts.filter((p) => p.customizable);
  } else if (filterType === 'original') {
    filteredProducts = filteredProducts.filter((p) => !p.customizable);
  }

  // Quick preset keyword filter
  if (quickPreset !== 'all') {
    filteredProducts = filterByPreset(filteredProducts, quickPreset);
  }

  // Enhanced semantic keyword search (matches query tokens & everyday synonyms)
  if (searchQuery) {
    filteredProducts = filteredProducts.filter((p) => matchesProductSearch(p, searchQuery));
  }

  if (minPrice) {
    filteredProducts = filteredProducts.filter((p) => p.basePrice >= Number(minPrice));
  }
  if (maxPrice) {
    filteredProducts = filteredProducts.filter((p) => p.basePrice <= Number(maxPrice));
  }

  const displayProducts = filteredProducts.slice(0, visibleCount);

  return (
    <main className="min-h-screen bg-charcoal text-bone relative pb-36">
      {/* Sticky Header with Categories */}
      <header className="sticky top-0 left-0 w-full z-10 bg-charcoal/95 backdrop-blur-md border-b border-smoke/20 pt-28">
        <div className="px-5 pb-4 flex items-center justify-between">
          <h1 className="font-display text-4xl tracking-tighter uppercase">
            {activeTab === 'all'
              ? 'Catalog'
              : activeTab === 'skins'
                ? 'Device Skins'
                : activeTab === 'mugs-cups'
                  ? 'Cups & Mugs'
                  : activeTab === 'stationery'
                    ? 'Stationery'
                    : activeTab === 'accessories'
                      ? 'Accessories'
                      : activeTab}
          </h1>
          {activeTab !== 'diy' && !isCategoryComingSoon(activeTab) && (
            <button
              onClick={() => setIsFilterOpen(true)}
              className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 border border-smoke/30 rounded-full px-4 py-3 min-h-[44px]"
              aria-label="Open filters"
              aria-expanded={isFilterOpen}
            >
              Filter
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="4" y1="21" x2="4" y2="14"></line>
                <line x1="4" y1="10" x2="4" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="3"></line>
                <line x1="20" y1="21" x2="20" y2="16"></line>
                <line x1="20" y1="12" x2="20" y2="3"></line>
                <line x1="1" y1="14" x2="7" y2="14"></line>
                <line x1="9" y1="8" x2="15" y2="8"></line>
                <line x1="17" y1="16" x2="23" y2="16"></line>
              </svg>
            </button>
          )}
        </div>

        {/* Scrollable Category Tabs with Edge Fade Scroll Affordance */}
        <div className="relative">
          <div className="px-5 pb-2 flex items-center gap-5 overflow-x-auto hide-scrollbar snap-x snap-proximity scroll-smooth scroll-px-5 pr-12">
            {SHOP_CATEGORIES.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`font-mono text-[11px] uppercase tracking-wider whitespace-nowrap snap-start transition-colors min-h-[40px] flex items-center ${
                  activeTab === tab.id
                    ? 'text-bone border-b-2 border-bone font-bold'
                    : 'text-pearl/70 hover:text-bone border-b-2 border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Subtle right-edge fade gradient cue */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-charcoal to-transparent" />
        </div>

        {/* Quick Filter Keyword Pills on Mobile */}
        <div className="relative">
          <div className="px-5 pb-3 pt-1 flex items-center gap-1.5 overflow-x-auto hide-scrollbar snap-x scroll-smooth pr-10">
            {QUICK_FILTER_PRESETS.map((preset) => {
              const isActive = quickPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetClick(preset.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider whitespace-nowrap snap-start transition-all active:scale-95 ${
                    isActive
                      ? 'bg-bone text-charcoal font-bold shadow-md shadow-white/10'
                      : 'bg-white/5 text-bone/70 border border-white/5 active:bg-white/10'
                  }`}
                >
                  {preset.icon && <span className="opacity-80 text-[11px]">{preset.icon}</span>}
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
          {/* Subtle right-edge fade gradient cue */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-10 bg-gradient-to-l from-charcoal to-transparent" />
        </div>
      </header>

      {/* Content Area */}
      <div className="px-5 pt-6">
        {activeTab !== 'all' && isCategoryComingSoon(activeTab) ? (
          <CategoryComingSoonPage category={activeTab} />
        ) : activeTab === 'tees' || activeTab === 'hoodies' ? (
          <ClothingDesignsGallery
            category={activeTab as 'tees' | 'hoodies'}
            searchQuery={searchQuery}
            products={products}
          />
        ) : (
          <div className="flex flex-col">
            {isCategoryComingSoon(activeTab) && activeTab !== 'skins' && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 backdrop-blur-sm flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-400 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-amber-400">
                      Upcoming Drop
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[8px] uppercase tracking-wider">
                      Coming Soon
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-bone/70 leading-relaxed">
                    Preview the upcoming collection below. Tap any product to join the drop waitlist.
                  </p>
                </div>
              </div>
            )}

            <p className="font-mono text-[9px] text-pearl uppercase tracking-widest mb-6">
              Showing {displayProducts.length} Results
            </p>

            {displayProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                {displayProducts.map((product, index) => (
                  <MobileProductCard
                    key={`prod-${product.id}`}
                    product={product}
                    index={index}
                    onSelectDesign={handleSelectDesign}
                  />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center border border-dashed border-smoke/20 rounded-lg">
                <h3 className="font-display text-2xl text-bone mb-3">No results.</h3>
                <button
                  onClick={() => {
                    setFilterType('all');
                    setSortMethod('featured');
                    setSearchQuery('');
                    setMinPrice('');
                    setMaxPrice('');
                    router.replace(pathname, { scroll: false });
                  }}
                  className="bg-bone text-charcoal font-mono text-[9px] uppercase tracking-widest px-6 py-3"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {visibleCount < filteredProducts.length && (
              <div className="mt-16 mb-8 flex justify-center">
                <button
                  onClick={() => setVisibleCount((p) => p + 12)}
                  className="border-b border-smoke text-bone font-mono text-[10px] uppercase tracking-widest pb-1 active:border-bone transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Drawer (CSS-based animation using classes) */}
      <div
        className={`fixed inset-0 bg-charcoal/80 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsFilterOpen(false)}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 max-h-[85vh] max-h-[85dvh] overflow-y-auto hide-scrollbar bg-graphite border-t border-smoke/20 z-50 rounded-t-3xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] transition-transform duration-400 ease-out ${
          isFilterOpen
            ? 'translate-y-0 pointer-events-auto'
            : 'translate-y-full pointer-events-none'
        }`}
      >
        <div className="w-12 h-1 bg-smoke/30 rounded-full mx-auto mb-8 sticky top-0" />
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl">Filter & Sort</h2>
          <button
            onClick={() => setIsFilterOpen(false)}
            className="w-11 h-11 rounded-full bg-smoke flex items-center justify-center text-bone hover:bg-ash transition-colors"
            aria-label="Close filters"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-mono text-[9px] text-pearl uppercase tracking-widest">Search</h3>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                const params = new URLSearchParams(searchParams.toString());
                params.delete('q');
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
              }}
              className="font-mono text-[9px] text-ash hover:text-bone uppercase"
            >
              Clear
            </button>
          )}
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            const params = new URLSearchParams(searchParams.toString());
            if (e.target.value) params.set('q', e.target.value);
            else params.delete('q');
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
          }}
          placeholder="Search tees, blanks, posters, anime..."
          className="w-full bg-smoke/10 border border-smoke/20 text-bone font-mono text-[11px] p-4 rounded-md mb-2 outline-none focus:border-bone placeholder-smoke"
        />
        <p className="font-mono text-[9px] text-pearl/40 mb-6">
          Try &ldquo;oversized&rdquo;, &ldquo;blank&rdquo;, &ldquo;anime&rdquo;, &ldquo;jdm&rdquo;
        </p>

        {/* Quick Filter Keyword Presets */}
        <h3 className="font-mono text-[9px] text-pearl uppercase tracking-widest mb-3">
          Quick Keyword Filter
        </h3>
        <div className="flex flex-wrap gap-1.5 mb-8">
          {QUICK_FILTER_PRESETS.map((preset) => {
            const isActive = quickPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all active:scale-95 ${
                  isActive
                    ? 'bg-bone text-charcoal font-bold shadow-md shadow-white/10'
                    : 'bg-smoke/15 text-bone/70 border border-smoke/20'
                }`}
              >
                {preset.icon && <span>{preset.icon}</span>}
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* Category / Type Filter */}
        <h3 className="font-mono text-[9px] text-pearl uppercase tracking-widest mb-4">
          Category Filter
        </h3>
        <div className="flex flex-col gap-2 mb-8">
          <button
            onClick={() => handleFilterChange('all')}
            className={`text-left font-mono text-[11px] uppercase tracking-widest py-3 px-4 rounded-md transition-colors ${filterType === 'all' ? 'bg-bone text-charcoal font-bold' : 'bg-smoke/10 text-bone/70'}`}
          >
            All Products
          </button>
          <button
            onClick={() => handleFilterChange('plain')}
            className={`text-left font-mono text-[11px] uppercase tracking-widest py-3 px-4 rounded-md transition-colors ${filterType === 'plain' ? 'bg-bone text-charcoal font-bold' : 'bg-smoke/10 text-bone/70'}`}
          >
            Plain Essentials (Blanks)
          </button>
          <button
            onClick={() => handleFilterChange('designs')}
            className={`text-left font-mono text-[11px] uppercase tracking-widest py-3 px-4 rounded-md transition-colors ${filterType === 'designs' ? 'bg-bone text-charcoal font-bold' : 'bg-smoke/10 text-bone/70'}`}
          >
            3D Graphic Canvases
          </button>
          <button
            onClick={() => handleFilterChange('wall-art')}
            className={`text-left font-mono text-[11px] uppercase tracking-widest py-3 px-4 rounded-md transition-colors ${filterType === 'wall-art' ? 'bg-bone text-charcoal font-bold' : 'bg-smoke/10 text-bone/70'}`}
          >
            Wall Art (Posters)
          </button>
        </div>

        <h3 className="font-mono text-[9px] text-pearl uppercase tracking-widest mb-4">Sort By</h3>
        <select
          value={sortMethod}
          onChange={handleSortChange}
          className="w-full bg-smoke/10 text-bone font-mono text-[11px] uppercase tracking-widest p-4 rounded-md outline-none"
        >
          <option value="featured" className="bg-graphite">
            Featured
          </option>
          <option value="new" className="bg-graphite">
            Newest
          </option>
          <option value="price-asc" className="bg-graphite">
            Price: Low-High
          </option>
          <option value="price-desc" className="bg-graphite">
            Price: High-Low
          </option>
        </select>
      </div>

      {/* Interactive Clothing Design Customization Modal */}
      {selectedClothingDesign && (
        <ClothingProductModal
          design={selectedClothingDesign}
          onClose={() => setSelectedClothingDesign(null)}
          defaultCategory={activeTab === 'hoodies' ? 'hoodies' : 'tees'}
        />
      )}
    </main>
  );
}
