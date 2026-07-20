'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Product } from '@/data/products';
import { SHOP_CATEGORIES } from './shop.shared';
import { CustomizerPanelMobile } from '../customizer-hub/CustomizerHub.mobile';

function MobileProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.categorySlug}/${product.slug || product.id}`}
      className="group flex flex-col gap-3 col-span-1"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-smoke/5 rounded-sm">
        <Image
          src={product.variants[0]?.images?.[0] || '/images/hero/hoodies.png'}
          alt={product.name}
          fill
          className="object-cover"
          sizes="50vw"
        />
        {product.customizable && (
          <div className="absolute top-2 left-2 bg-charcoal text-bone px-2 py-0.5 text-[8px] uppercase font-mono tracking-widest z-10">
            Custom
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <h3 className="font-mono text-[11px] text-bone uppercase tracking-widest truncate">
          {product.name}
        </h3>
        <p className="font-display text-sm text-pearl">
          {product.customizable ? 'from ' : ''}₹{product.basePrice}
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
  const [filterType, setFilterType] = useState(searchParams.get('type') || 'all');
  const [sortMethod, setSortMethod] = useState(searchParams.get('sort') || 'featured');
  const [visibleCount, setVisibleCount] = useState(12);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId !== 'diy') {
      router.push(`/products/${tabId}`, { scroll: false });
    }
  };

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', type);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setIsFilterOpen(false);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sort = e.target.value;
    setSortMethod(sort);
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sort);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setIsFilterOpen(false);
  };

  const baseProducts =
    activeTab === 'all' ? products : products.filter((p) => p.categorySlug === activeTab);
  let filteredProducts = baseProducts;
  if (filterType === 'customizable')
    filteredProducts = filteredProducts.filter((p) => p.customizable);
  else if (filterType === 'original')
    filteredProducts = filteredProducts.filter((p) => !p.customizable);

  if (sortMethod === 'price-asc') filteredProducts.sort((a, b) => a.basePrice - b.basePrice);
  if (sortMethod === 'price-desc') filteredProducts.sort((a, b) => b.basePrice - a.basePrice);

  const displayProducts = filteredProducts.slice(0, visibleCount);

  return (
    <main className="min-h-screen bg-charcoal text-bone relative pb-24">
      {/* Sticky Header with Categories */}
      <header className="sticky top-0 left-0 w-full z-40 bg-charcoal/95 backdrop-blur-md border-b border-smoke/20 pt-28">
        <div className="px-5 pb-4 flex items-center justify-between">
          <h1 className="font-display text-4xl tracking-tighter uppercase">
            {activeTab === 'all' ? 'Catalog' : activeTab}
          </h1>
          {activeTab !== 'diy' && (
            <button
              onClick={() => setIsFilterOpen(true)}
              className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 border border-smoke/30 rounded-full px-4 py-2"
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

        {/* Scrollable Category Tabs */}
        <div className="px-5 pb-3 flex items-center gap-6 overflow-x-auto hide-scrollbar snap-x">
          {SHOP_CATEGORIES.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`font-mono text-[10px] uppercase tracking-widest whitespace-nowrap snap-start transition-colors ${
                activeTab === tab.id
                  ? 'text-bone border-b border-bone pb-1'
                  : 'text-ash pb-1 border-b border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => handleTabClick('diy')}
            className={`font-mono text-[10px] uppercase tracking-widest whitespace-nowrap snap-start transition-colors ml-4 ${
              activeTab === 'diy'
                ? 'text-bone border-b border-bone pb-1'
                : 'text-cobalt pb-1 border-b border-transparent'
            }`}
          >
            ✦ Design It Yourself
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div className="px-5 pt-6">
        {activeTab === 'diy' ? (
          <CustomizerPanelMobile />
        ) : (
          <div className="flex flex-col">
            <p className="font-mono text-[9px] text-pearl uppercase tracking-widest mb-6">
              Showing {displayProducts.length} Results
            </p>

            {displayProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10">
                {displayProducts.map((product) => (
                  <MobileProductCard key={`prod-${product.id}`} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center border border-dashed border-smoke/20 rounded-lg">
                <h3 className="font-display text-2xl text-bone mb-3">No results.</h3>
                <button
                  onClick={() => {
                    setFilterType('all');
                    setSortMethod('featured');
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
        className={`fixed bottom-0 left-0 right-0 bg-graphite border-t border-smoke/20 z-50 rounded-t-3xl p-6 pb-12 transition-transform duration-400 ease-out ${
          isFilterOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="w-12 h-1 bg-smoke/30 rounded-full mx-auto mb-8" />
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl">Filter & Sort</h2>
          <button onClick={() => setIsFilterOpen(false)} className="p-2 text-ash hover:text-bone">
            ✕
          </button>
        </div>

        <h3 className="font-mono text-[9px] text-pearl uppercase tracking-widest mb-4">Identity</h3>
        <div className="flex flex-col gap-2 mb-8">
          <button
            onClick={() => handleFilterChange('all')}
            className={`text-left font-mono text-[11px] uppercase tracking-widest py-3 px-4 rounded-md ${filterType === 'all' ? 'bg-smoke/20 text-bone' : 'text-ash'}`}
          >
            All Products
          </button>
          <button
            onClick={() => handleFilterChange('original')}
            className={`text-left font-mono text-[11px] uppercase tracking-widest py-3 px-4 rounded-md ${filterType === 'original' ? 'bg-smoke/20 text-bone' : 'text-ash'}`}
          >
            Designed by Us
          </button>
          <button
            onClick={() => handleFilterChange('customizable')}
            className={`text-left font-mono text-[11px] uppercase tracking-widest py-3 px-4 rounded-md ${filterType === 'customizable' ? 'bg-smoke/20 text-bone' : 'text-ash'}`}
          >
            Made to be Yours
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
    </main>
  );
}
