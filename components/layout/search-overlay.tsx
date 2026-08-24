'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';
import { useSearchStore } from '@/lib/stores/search-store';
import { products, type Product } from '@/data/products';
import { usePrice } from '@/lib/hooks/usePrice';
import Link from 'next/link';
import Image from 'next/image';

const CATEGORY_LABELS: Record<string, string> = {
  tees: 'Tees',
  hoodies: 'Hoodies',
  posters: 'Posters',
  'split-posters': 'Split Posters',
  skins: 'Skins',
  mugs: 'Mugs',
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS);

function scoreProduct(p: Product, q: string): number {
  const lq = q.toLowerCase();
  if (p.name.toLowerCase().startsWith(lq)) return 4;
  if (p.name.toLowerCase().includes(lq)) return 3;
  if (p.categorySlug.includes(lq)) return 2;
  if (p.tags.some((t) => t.toLowerCase().includes(lq))) return 1;
  return 0;
}

export function SearchOverlay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOpen = useSearchStore((s) => s.isOpen);
  const setSearchOpen = useSearchStore((s) => s.setSearchOpen);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { formatPrice } = usePrice();

  // Debounce the query by 250ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      if (isOpen) {
        document.body.style.overflow = 'hidden';
        gsap.set(containerRef.current, { display: 'flex' });
        gsap.fromTo(
          containerRef.current,
          { opacity: 0, y: -20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: () => inputRef.current?.focus(),
          },
        );
      } else {
        gsap.to(containerRef.current, {
          opacity: 0,
          y: -20,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => {
            gsap.set(containerRef.current, { display: 'none' });
            document.body.style.overflow = '';
            setQuery('');
            setDebouncedQuery('');
            setSelectedCategory(null);
          },
        });
      }
    },
    { dependencies: [isOpen], scope: containerRef },
  );

  const results = useMemo(() => {
    const q = debouncedQuery.trim();
    let filtered = products;

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.categorySlug === selectedCategory);
    }

    // Text search — score + rank
    if (q) {
      filtered = filtered
        .map((p) => ({ p, score: scoreProduct(p, q) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ p }) => p);
    }

    return filtered;
  }, [debouncedQuery, selectedCategory]);

  const hasFilters = !!selectedCategory || debouncedQuery.trim() !== '';
  const isEmpty = debouncedQuery.trim() !== '' && results.length === 0;

  // Top 6 for compact view, full list when scrolling
  const displayResults = results.slice(0, 18);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
      className="fixed inset-0 z-[160] hidden flex-col bg-charcoal/97 backdrop-blur-xl"
    >
      <div className="w-full max-w-4xl mx-auto p-6 md:p-12 flex flex-col h-full">
        {/* Search input row */}
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <svg
            className="w-6 h-6 text-pearl shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            id="search-input"
            type="search"
            placeholder="Search products, styles, collections…"
            aria-label="Search products, styles, and collections"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSearchOpen(false);
            }}
            className="flex-1 bg-transparent border-none text-display-sm md:text-display-md font-display text-bone focus:outline-none placeholder:text-smoke"
          />
          <button
            onClick={() => setSearchOpen(false)}
            aria-label="Close search"
            className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full border border-smoke text-pearl hover:text-bone hover:border-bone transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory((prev) => (prev === cat ? null : cat))}
              className={`px-3 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-widest border transition-all ${
                selectedCategory === cat
                  ? 'bg-cobalt border-cobalt text-bone'
                  : 'bg-transparent border-smoke/40 text-pearl hover:border-pearl hover:text-bone'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
          {hasFilters && (
            <button
              onClick={() => {
                setQuery('');
                setDebouncedQuery('');
                setSelectedCategory(null);
              }}
              className="px-3 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-widest border border-ember/50 text-ember hover:bg-ember/10 transition-all"
            >
              ✕ Clear all
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {isEmpty ? (
            <div className="flex flex-col items-center py-20 gap-4 text-center">
              <svg
                className="w-10 h-10 text-smoke"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <p className="font-mono text-body-md text-ash">
                No results for <span className="text-bone">&ldquo;{debouncedQuery}&rdquo;</span>
              </p>
              <p className="font-mono text-caption text-smoke">
                Try different keywords or remove filters
              </p>
            </div>
          ) : !debouncedQuery && !selectedCategory ? (
            // Default state: show category browse
            <div>
              <p className="font-mono text-caption text-ash uppercase tracking-widest mb-4">
                Browse Categories
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className="group p-4 bg-graphite border border-smoke/30 rounded-xl text-left hover:border-cobalt/50 hover:bg-graphite/80 transition-all"
                  >
                    <span className="font-display text-bone text-lg group-hover:text-cobalt transition-colors">
                      {CATEGORY_LABELS[cat]}
                    </span>
                    <p className="font-mono text-[11px] text-pearl mt-1">
                      {products.filter((p) => p.categorySlug === cat).length} products
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="font-mono text-caption text-ash uppercase tracking-widest mb-4">
                {displayResults.length} result{displayResults.length !== 1 ? 's' : ''}
                {selectedCategory
                  ? ` in ${CATEGORY_LABELS[selectedCategory] ?? selectedCategory}`
                  : ''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {displayResults.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.categorySlug}/${product.slug}`}
                    onClick={() => setSearchOpen(false)}
                    className="group flex flex-col gap-3"
                  >
                    <div className="aspect-[4/5] relative rounded-xl overflow-hidden bg-graphite border border-smoke/30">
                      {product.variants[0]?.images[0] ? (
                        <Image
                          src={product.variants[0].images[0]}
                          alt={product.name}
                          fill
                          sizes="(max-width: 424px) 100vw, (max-width: 1023px) 50vw, 33vw"
                          className="object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-display text-2xl text-smoke font-bold">
                            {product.name[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-display text-lg text-bone group-hover:text-cobalt transition-colors">
                        {product.name}
                      </span>
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-caption text-ash capitalize">
                          {CATEGORY_LABELS[product.categorySlug] ?? product.categorySlug}
                        </p>
                        <span className="font-mono text-caption text-pearl">
                          {formatPrice(product.basePrice)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
