'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';
import { useSearchStore } from '@/lib/stores/search-store';
import { products } from '@/data/products';
import { usePrice } from '@/lib/hooks/usePrice';
import Link from 'next/link';
import Image from 'next/image';

export function SearchOverlay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOpen = useSearchStore((s) => s.isOpen);
  const setSearchOpen = useSearchStore((s) => s.setSearchOpen);

  const [query, setQuery] = useState('');
  const { formatPrice } = usePrice();

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
          },
        });
      }
    },
    { dependencies: [isOpen], scope: containerRef },
  );

  const results =
    query.trim() === ''
      ? []
      : products.filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())),
        );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[160] hidden flex-col bg-charcoal/95 backdrop-blur-xl"
    >
      <div className="w-full max-w-4xl mx-auto p-6 md:p-12 lg:p-24 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search products, styles, collections..."
            aria-label="Search products, styles, and collections"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSearchOpen(false);
            }}
            className="w-full bg-transparent border-none text-display-sm md:text-display-md font-display text-bone focus:outline-none placeholder:text-smoke"
          />
          <button
            onClick={() => setSearchOpen(false)}
            className="ml-4 w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full border border-smoke text-pearl hover:text-bone hover:border-bone transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
          {query.length > 0 && results.length === 0 ? (
            <p className="font-mono text-body-md text-ash">No results found for "{query}".</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.categorySlug}/${product.slug}`}
                  onClick={() => setSearchOpen(false)}
                  className="group flex flex-col gap-3"
                >
                  <div className="aspect-[4/5] relative rounded-xl overflow-hidden bg-graphite border border-smoke/30">
                    {product.variants[0]?.images[0] && (
                      <Image
                        src={product.variants[0].images[0]}
                        alt={product.name}
                        fill
                        className="object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                      />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-display text-lg text-bone group-hover:text-cobalt transition-colors">
                      {product.name}
                    </span>
                    <p className="font-mono text-caption text-pearl">
                      {formatPrice(product.basePrice)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
