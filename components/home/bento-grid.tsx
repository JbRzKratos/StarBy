'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap-config';
import { getFeaturedCategories } from '@/data/categories';
import { BentoTile } from './bento-tile';

/* Bento layout sizes: 'large' = 2×2, 'wide' = 2×1, 'tall' = 1×2, 'small' = 1×1 */
const bentoSizes: Array<'large' | 'wide' | 'tall' | 'small'> = [
  'large',
  'small',
  'tall',
  'wide',
  'small',
  'small',
];

export function BentoGrid() {
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!gridRef.current) return;

      ScrollTrigger.batch(gridRef.current.children, {
        onEnter: (elements) => {
          gsap.fromTo(
            elements,
            { y: 60, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.1, ease: 'power3.out' },
          );
        },
        start: 'top 85%',
        once: true,
      });
    },
    { scope: gridRef },
  );

  const categories = getFeaturedCategories();

  return (
    <section className="py-20 md:py-32">
      <div className="section-container">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="overline-label block mb-3">Categories</span>
            <h2 className="font-display text-display-md md:text-display-lg font-bold text-bone">
              Find Your Canvas
            </h2>
          </div>
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] md:auto-rows-[240px] gap-3 md:gap-4"
        >
          {categories.map((cat, i) => (
            <BentoTile
              key={cat.slug}
              category={cat}
              size={bentoSizes[i % bentoSizes.length] ?? 'small'}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
