'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap-config';
import { getFeaturedProducts } from '@/data/products';
import { ProductCard } from '@/components/product/product-card';

export function FeaturedProducts() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!gridRef.current) return;

      ScrollTrigger.batch(gridRef.current.children, {
        onEnter: (elements) => {
          gsap.fromTo(
            elements,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' },
          );
        },
        start: 'top 85%',
        once: true,
      });
    },
    { scope: sectionRef },
  );

  const featured = getFeaturedProducts().slice(0, 4);

  return (
    <section ref={sectionRef} className="py-20 md:py-32">
      <div className="section-container">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="overline-label block mb-3">Featured</span>
            <h2 className="font-display text-display-md md:text-display-lg font-bold text-bone">
              Editor&apos;s Picks
            </h2>
          </div>
          <Link
            href="/products/tees"
            className="hidden md:block font-mono text-caption text-cobalt uppercase tracking-widest hover:underline"
          >
            View All →
          </Link>
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
