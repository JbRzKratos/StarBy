'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap-config';
import { products, type Product } from '@/data/products';
import { ProductCard } from '@/components/product/product-card';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Featured' },
  { id: 'posters', label: 'Posters' },
  { id: 'split-posters', label: 'Split Posters' },
  { id: 'hoodies', label: 'Hoodies & Tees' },
  { id: 'skins', label: 'Device Skins' },
];

export function FeaturedProducts() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('all');

  useGSAP(
    () => {
      if (!gridRef.current) return;

      ScrollTrigger.batch(gridRef.current.children, {
        onEnter: (elements) => {
          gsap.fromTo(
            elements,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out' },
          );
        },
        start: 'top 85%',
        once: true,
      });
    },
    { scope: sectionRef, dependencies: [activeTab] },
  );

  let filtered: Product[] = [];
  if (activeTab === 'all') {
    filtered = products.filter((p) => p.featured).slice(0, 8);
  } else if (activeTab === 'hoodies') {
    filtered = products
      .filter((p) => p.categorySlug === 'hoodies' || p.categorySlug === 'tees')
      .slice(0, 8);
  } else {
    filtered = products.filter((p) => p.categorySlug === activeTab).slice(0, 8);
  }

  // Fallback if empty
  if (filtered.length === 0) {
    filtered = products.slice(0, 8);
  }

  return (
    <section ref={sectionRef} className="py-20 md:py-32 bg-charcoal relative">
      <div className="section-container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="overline-label block mb-3 text-cobalt">Curated Collection</span>
            <h2 className="font-display text-display-md md:text-display-lg font-bold text-bone">
              Trending Wall Art & Essentials
            </h2>
          </div>
          <Link
            href="/products/all"
            className="hidden md:flex items-center gap-2 font-mono text-caption text-pearl uppercase tracking-widest hover:text-cobalt transition-colors"
          >
            <span>Explore Catalog</span>
            <span>→</span>
          </Link>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar pb-6 mb-8 border-b border-smoke/30">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`font-mono text-caption uppercase tracking-widest px-4 py-2.5 rounded-full whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-bone text-charcoal font-bold shadow-md'
                  : 'bg-smoke/10 text-pearl hover:text-bone hover:bg-smoke/20 border border-smoke/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Explore More Products CTA Button */}
        <div className="mt-14 flex justify-center">
          <Link
            href="/products/all"
            className="group inline-flex items-center gap-3 bg-cobalt hover:bg-cobalt/90 text-bone font-mono text-caption uppercase tracking-widest px-8 py-4 rounded-sm transition-all hover:scale-105 shadow-lg shadow-cobalt/20"
          >
            <span>Explore More Products</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
