'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Product } from '@/data/products';
import { SHOP_CATEGORIES } from './shop.shared';
import { CategoryComingSoonPage } from './category-coming-soon-page';
import { usePrice } from '@/lib/hooks/usePrice';
import { getR2AssetUrl } from '@/lib/r2';
import { isProductComingSoon, isCategoryComingSoon } from '@/data/categories';

import { ClothingDesignsGallery } from './clothing-designs-gallery';
// ClothingProductModal (~51 kB) — lazy loaded, only shown when a design is selected
const ClothingProductModal = dynamic(
  () => import('./clothing-product-modal').then((m) => m.ClothingProductModal),
  { ssr: false },
);
import type { ClothingDesignEntry } from '@/lib/clothing-designs/types';

import {
  classifyProduct,
  sortCatalogProducts,
  matchesProductSearch,
  filterByPreset,
  QUICK_FILTER_PRESETS,
} from '@/lib/shop/product-classifier';

function DesktopProductCard({
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
        className="group flex flex-col gap-0 cursor-pointer"
        style={{ perspective: '1000px' }}
      >
        {/* Design Thumbnail Image wrapper */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#16161A] rounded-xl border border-white/5 group-hover:border-emerald-500/40 transition-colors duration-300">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            unoptimized
            priority={index < 8}
            className="object-contain p-4 transition-transform duration-[600ms] ease-out group-hover:scale-105"
            sizes="(max-width: 1024px) 33vw, 25vw"
            onError={() => setImgError(true)}
          />

          {/* 3D Studio Badge */}
          <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-mono text-emerald-400 uppercase tracking-wider backdrop-blur-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            3D Studio
          </div>

          {/* Hover overlay with button */}
          <div className="absolute inset-0 bg-charcoal/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
            <span className="bg-white text-black font-mono text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-lg shadow-xl translate-y-3 group-hover:translate-y-0 transition-all duration-300">
              Customize in 3D
            </span>
          </div>
        </div>

        {/* Name / price below card */}
        <div className="flex flex-col gap-1 mt-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-mono text-sm text-bone uppercase tracking-widest group-hover:text-emerald-400 transition-colors truncate">
              {product.name}
            </h3>
            <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400/80 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0">
              3D Graphic
            </span>
          </div>
          <p className="font-display text-lg text-pearl">{formatPrice(product.basePrice)}</p>
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
      className="group flex flex-col gap-0"
      style={{ perspective: '1000px' }}
    >
      {/* Standard Hover Image wrapper */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#16161A] rounded-xl border border-white/5 group-hover:border-smoke/40 transition-colors duration-300">
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          unoptimized
          priority={index < 8}
          className={`${isComingSoon ? 'object-contain p-4' : 'object-cover'} transition-transform duration-[600ms] ease-out group-hover:scale-105`}
          sizes="(max-width: 1024px) 33vw, 25vw"
          onError={() => setImgError(true)}
        />

        {/* Badges */}
        {isComingSoon ? (
          <div className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-[9px] font-mono font-medium text-amber-300 uppercase tracking-widest backdrop-blur-md flex items-center gap-1.5 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Coming Soon
          </div>
        ) : isPlainApparel ? (
          <div className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-full bg-black/60 border border-white/20 text-[9px] font-mono text-bone uppercase tracking-wider backdrop-blur-md flex items-center gap-1 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Blank Essential
          </div>
        ) : isSplitPoster ? (
          <div className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-[9px] font-mono text-purple-300 uppercase tracking-wider backdrop-blur-md flex items-center gap-1 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Multi-Panel Split
          </div>
        ) : null}

        {/* Hover overlay with button */}
        <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <span
            className={`font-mono text-[10px] uppercase tracking-widest px-6 py-3 rounded-lg shadow-xl translate-y-4 group-hover:translate-y-0 transition-all duration-300 ${
              isComingSoon
                ? 'bg-amber-500 text-black font-semibold'
                : isPlainApparel
                  ? 'bg-white text-black font-bold'
                  : 'bg-cobalt text-bone'
            }`}
          >
            {isComingSoon ? 'Drop Alert' : isPlainApparel ? 'View Fit & Colors' : isSplitPoster ? 'View Split Art' : 'View Product'}
          </span>
        </div>
      </div>

      {/* Name / price below card */}
      <div className="flex flex-col gap-1 mt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-mono text-sm text-bone uppercase tracking-widest group-hover:text-cobalt transition-colors truncate">
            {product.name}
          </h3>
          {isPlainApparel && (
            <span className="font-mono text-[9px] uppercase tracking-wider text-ash/90 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 flex-shrink-0">
              Plain
            </span>
          )}
        </div>
        <p className="font-display text-lg text-pearl">
          {isComingSoon ? (
            <span className="font-mono text-xs uppercase tracking-widest text-amber-400/90 font-medium">
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

export function ShopDesktop({ category, products }: { category: string; products: Product[] }) {
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
  const [visibleCount, setVisibleCount] = useState(16);
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

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setQuickPreset('all');
    router.push(`/products/${tabId}`, { scroll: false });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const type = e.target.value;
    setFilterType(type);
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', type);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
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

  // Identity / Category Type filter
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
    <main className="min-h-screen bg-charcoal text-bone pt-40 pb-24">
      <div className="section-container">
        {/* Header & Categories */}
        <div className="flex flex-col gap-12 mb-16">
          <h1 className="font-display text-7xl uppercase tracking-tighter">
            {activeTab === 'all'
              ? 'The Catalog'
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

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar pb-4 border-b border-smoke/20">
              {SHOP_CATEGORIES.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`font-mono text-[11px] uppercase tracking-widest pb-4 border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-bone text-bone'
                      : 'border-transparent text-pearl hover:text-bone'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Quick Filter Keyword Pills */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 pt-1">
              <span className="font-mono text-[10px] text-pearl/50 uppercase tracking-widest mr-2 flex-shrink-0 flex items-center gap-1">
                <span>Filter:</span>
              </span>
              {QUICK_FILTER_PRESETS.map((preset) => {
                const isActive = quickPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetClick(preset.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 ${
                      isActive
                        ? 'bg-bone text-charcoal font-bold shadow-md shadow-white/10'
                        : 'bg-white/5 text-bone/70 hover:text-bone hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    {preset.icon && <span>{preset.icon}</span>}
                    <span>{preset.label}</span>
                    {preset.badge && (
                      <span
                        className={`text-[8px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                          isActive ? 'bg-charcoal text-bone' : 'bg-white/10 text-bone/60'
                        }`}
                      >
                        {preset.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {activeTab !== 'all' && isCategoryComingSoon(activeTab) ? (
          <CategoryComingSoonPage category={activeTab} />
        ) : activeTab === 'tees' || activeTab === 'hoodies' ? (
          <ClothingDesignsGallery
            category={activeTab as 'tees' | 'hoodies'}
            searchQuery={searchQuery}
            products={products}
          />
        ) : (
          /* Filters & Grid */
          <div className="flex flex-col gap-8">
            <div className="flex items-start gap-12">
            {/* Sidebar Filters */}
            <aside className="w-64 flex-shrink-0 sticky top-32">
              <div className="flex flex-col gap-10">
                {/* Search */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-mono text-[10px] text-pearl uppercase tracking-widest">
                      Search
                    </h4>
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
                    placeholder="Search tees, blanks, posters..."
                    className="w-full bg-transparent border-b border-smoke/30 text-bone font-mono text-xs pb-2 outline-none focus:border-bone placeholder-smoke"
                  />
                  <p className="font-mono text-[9px] text-pearl/40 mt-1.5">
                    Try &ldquo;oversized&rdquo;, &ldquo;blank&rdquo;, &ldquo;anime&rdquo;, &ldquo;jdm&rdquo;
                  </p>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="font-mono text-[10px] text-pearl uppercase tracking-widest mb-4">
                    Price Range
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => {
                        setMinPrice(e.target.value);
                        const params = new URLSearchParams(searchParams.toString());
                        if (e.target.value) params.set('min', e.target.value);
                        else params.delete('min');
                        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                      }}
                      placeholder="Min"
                      className="w-full bg-transparent border-b border-smoke/30 text-bone font-mono text-xs pb-2 outline-none focus:border-bone placeholder-smoke text-center"
                    />
                    <span className="text-pearl">-</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => {
                        setMaxPrice(e.target.value);
                        const params = new URLSearchParams(searchParams.toString());
                        if (e.target.value) params.set('max', e.target.value);
                        else params.delete('max');
                        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                      }}
                      placeholder="Max"
                      className="w-full bg-transparent border-b border-smoke/30 text-bone font-mono text-xs pb-2 outline-none focus:border-bone placeholder-smoke text-center"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-mono text-[10px] text-pearl uppercase tracking-widest mb-4">
                    Category Filter
                  </h4>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="filterType"
                        value="all"
                        checked={filterType === 'all'}
                        onChange={handleFilterChange}
                        className="accent-bone"
                      />
                      <span
                        className={`font-mono text-xs uppercase tracking-widest ${filterType === 'all' ? 'text-bone' : 'text-ash group-hover:text-pearl'}`}
                      >
                        All Products
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="filterType"
                        value="plain"
                        checked={filterType === 'plain'}
                        onChange={handleFilterChange}
                        className="accent-bone"
                      />
                      <span
                        className={`font-mono text-xs uppercase tracking-widest ${filterType === 'plain' ? 'text-bone' : 'text-ash group-hover:text-pearl'}`}
                      >
                        Plain Essentials (Blanks)
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="filterType"
                        value="designs"
                        checked={filterType === 'designs'}
                        onChange={handleFilterChange}
                        className="accent-bone"
                      />
                      <span
                        className={`font-mono text-xs uppercase tracking-widest ${filterType === 'designs' ? 'text-bone' : 'text-ash group-hover:text-pearl'}`}
                      >
                        3D Graphic Canvases
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="filterType"
                        value="wall-art"
                        checked={filterType === 'wall-art'}
                        onChange={handleFilterChange}
                        className="accent-bone"
                      />
                      <span
                        className={`font-mono text-xs uppercase tracking-widest ${filterType === 'wall-art' ? 'text-bone' : 'text-ash group-hover:text-pearl'}`}
                      >
                        Wall Art (Posters)
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="font-mono text-[10px] text-pearl uppercase tracking-widest mb-4">
                    Sort By
                  </h4>
                  <select
                    value={sortMethod}
                    onChange={handleSortChange}
                    className="w-full bg-transparent border-b border-smoke/30 text-bone font-mono text-xs uppercase tracking-widest pb-2 outline-none cursor-pointer"
                  >
                    <option value="featured" className="bg-charcoal">
                      Featured
                    </option>
                    <option value="new" className="bg-charcoal">
                      New Arrivals
                    </option>
                    <option value="price-asc" className="bg-charcoal">
                      Price: Low to High
                    </option>
                    <option value="price-desc" className="bg-charcoal">
                      Price: High to Low
                    </option>
                  </select>
                </div>
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-grow flex flex-col min-h-[50vh]">
              {isCategoryComingSoon(activeTab) && activeTab !== 'skins' && (
                <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 backdrop-blur-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-400 mt-0.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold uppercase tracking-widest text-amber-400">
                        Upcoming Studio Drop
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-[9px] uppercase tracking-wider font-semibold">
                        Pre-Production
                      </span>
                    </div>
                    <p className="font-mono text-xs text-bone/70 max-w-2xl leading-relaxed">
                      This collection is currently in development. Explore the preview line below and select any product to join the drop waitlist for priority access when released.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center mb-8">
                <span className="font-mono text-[10px] text-pearl uppercase tracking-widest">
                  Showing {displayProducts.length} of {filteredProducts.length} Results
                </span>
              </div>

              {displayProducts.length > 0 ? (
                <div className="grid grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-16">
                  {displayProducts.map((product, index) => (
                    <DesktopProductCard
                      key={`prod-${product.id}`}
                      product={product}
                      index={index}
                      onSelectDesign={handleSelectDesign}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 border border-dashed border-smoke/20 rounded-lg">
                  <h3 className="font-display text-4xl text-bone mb-4">No results found</h3>
                  <p className="font-mono text-sm text-pearl mb-8">
                    Try adjusting your filters or search criteria.
                  </p>
                  <button
                    onClick={() => {
                      setFilterType('all');
                      setSortMethod('featured');
                      setSearchQuery('');
                      setMinPrice('');
                      setMaxPrice('');
                      router.replace(pathname, { scroll: false });
                    }}
                    className="bg-bone text-charcoal font-mono text-[11px] uppercase tracking-widest px-8 py-4 transition-transform hover:scale-105"
                  >
                    Clear Filters
                  </button>
                </div>
              )}

              {visibleCount < filteredProducts.length && (
                <div className="mt-24 flex justify-center">
                  <button
                    onClick={() => setVisibleCount((p) => p + 16)}
                    className="border-b border-smoke text-bone font-mono text-[11px] uppercase tracking-widest pb-1 hover:border-bone transition-colors"
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          </div>
          </div>
        )}

        {/* Interactive Clothing Design Customization Modal */}
        {selectedClothingDesign && (
          <ClothingProductModal
            design={selectedClothingDesign}
            onClose={() => setSelectedClothingDesign(null)}
            defaultCategory={activeTab === 'hoodies' ? 'hoodies' : 'tees'}
          />
        )}
      </div>
    </main>
  );
}
