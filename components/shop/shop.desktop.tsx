'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Product } from '@/data/products';
import { SHOP_CATEGORIES } from './shop.shared';
import { CustomizerPanelDesktop } from '../customizer-hub/CustomizerHub.desktop';
import { usePrice } from '@/lib/hooks/usePrice';

function DesktopProductCard({ product }: { product: Product }) {
  const { formatPrice } = usePrice();
  return (
    <Link
      href={`/products/${product.categorySlug}/${product.slug || product.id}`}
      className="group flex flex-col gap-0"
      style={{ perspective: '1000px' }}
    >
      {/* 3D flip wrapper */}
      <div
        className="relative aspect-[3/4] overflow-visible [&:hover]:![transform:rotateY(180deg)]"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Front face */}
        <div
          className="absolute inset-0 overflow-hidden bg-smoke/5 rounded-xl"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <Image
            src={product.variants[0]?.images?.[0] || '/images/hero/hoodies.webp'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 1024px) 33vw, 25vw"
          />
          {product.customizable && (
            <div className="absolute top-4 left-4 bg-charcoal text-bone px-3 py-1 text-[10px] uppercase font-mono tracking-widest z-[1] rounded-md">
              Customizable
            </div>
          )}
        </div>

        {/* Back face */}
        <div
          className="absolute inset-0 bg-graphite border border-smoke/40 rounded-xl flex flex-col items-center justify-center gap-4 px-6"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <h3 className="font-mono text-sm text-bone uppercase tracking-widest text-center">
            {product.name}
          </h3>
          <p className="font-display text-2xl text-bone">{formatPrice(product.basePrice)}</p>
          <span className="mt-2 w-full text-center bg-cobalt text-bone font-mono text-[10px] uppercase tracking-widest py-3 rounded-lg">
            {product.customizable ? 'Customize' : 'View Product'}
          </span>
        </div>
      </div>

      {/* Name / price below card */}
      <div className="flex flex-col gap-1 mt-4">
        <h3 className="font-mono text-sm text-bone uppercase tracking-widest group-hover:text-cobalt transition-colors">
          {product.name}
        </h3>
        <p className="font-display text-lg text-pearl">
          {product.customizable ? 'from ' : ''}
          {formatPrice(product.basePrice)}
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
  const [filterType, setFilterType] = useState(searchParams.get('type') || 'all');
  const [sortMethod, setSortMethod] = useState(searchParams.get('sort') || 'featured');
  const [visibleCount, setVisibleCount] = useState(16);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId !== 'diy') {
      router.push(`/products/${tabId}`, { scroll: false });
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const type = e.target.value;
    setFilterType(type);
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', type);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sort = e.target.value;
    setSortMethod(sort);
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sort);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
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
    <main className="min-h-screen bg-charcoal text-bone pt-40 pb-24">
      {activeTab === 'diy' ? (
        <div className="pt-12 px-12">
          <button
            onClick={() => handleTabClick('all')}
            className="mb-8 text-pearl hover:text-bone font-mono text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            ← Back to Shop
          </button>
          <CustomizerPanelDesktop />
        </div>
      ) : (
        <div className="section-container">
          {/* Header & Categories */}
          <div className="flex flex-col gap-12 mb-16">
            <h1 className="font-display text-7xl uppercase tracking-tighter">
              {activeTab === 'all' ? 'The Catalog' : activeTab}
            </h1>

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
              <button
                onClick={() => handleTabClick('diy')}
                className="font-mono text-[11px] uppercase tracking-widest pb-4 border-b-2 border-transparent text-cobalt hover:text-bone whitespace-nowrap transition-colors ml-auto"
              >
                ✦ Design It Yourself
              </button>
            </div>
          </div>

          {/* Filters & Grid */}
          <div className="flex items-start gap-12">
            {/* Sidebar Filters */}
            <aside className="w-64 flex-shrink-0 sticky top-32">
              <div className="flex flex-col gap-10">
                <div>
                  <h4 className="font-mono text-[10px] text-pearl uppercase tracking-widest mb-4">
                    Identity
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
                        value="original"
                        checked={filterType === 'original'}
                        onChange={handleFilterChange}
                        className="accent-bone"
                      />
                      <span
                        className={`font-mono text-xs uppercase tracking-widest ${filterType === 'original' ? 'text-bone' : 'text-ash group-hover:text-pearl'}`}
                      >
                        Designed by Us
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="filterType"
                        value="customizable"
                        checked={filterType === 'customizable'}
                        onChange={handleFilterChange}
                        className="accent-bone"
                      />
                      <span
                        className={`font-mono text-xs uppercase tracking-widest ${filterType === 'customizable' ? 'text-bone' : 'text-ash group-hover:text-pearl'}`}
                      >
                        Made to be Yours
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
              <div className="flex justify-between items-center mb-8">
                <span className="font-mono text-[10px] text-pearl uppercase tracking-widest">
                  Showing {displayProducts.length} of {filteredProducts.length} Results
                </span>
              </div>

              {displayProducts.length > 0 ? (
                <div className="grid grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-16">
                  {displayProducts.map((product) => (
                    <DesktopProductCard key={`prod-${product.id}`} product={product} />
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
    </main>
  );
}
