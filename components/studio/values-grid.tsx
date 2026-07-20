'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap-config';
import { brandValues } from '@/data/studio';

export function ValuesGrid() {
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!gridRef.current) return;

      ScrollTrigger.batch(gridRef.current.children, {
        onEnter: (elements) => {
          gsap.fromTo(
            elements,
            { y: 40, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' },
          );
        },
        start: 'top 85%',
        once: true,
      });
    },
    { scope: gridRef },
  );

  return (
    <section className="py-20 md:py-32">
      <div className="section-container">
        <div className="text-center mb-16">
          <span className="overline-label block mb-3">What We Stand For</span>
          <h2 className="font-display text-display-md md:text-display-lg font-bold text-bone">
            Our Values
          </h2>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {brandValues.map((value, i) => (
            <div
              key={value.title}
              className="bg-graphite border border-smoke rounded-lg p-8 hover:border-cobalt/30 transition-colors"
            >
              <span className="font-mono text-caption text-cobalt uppercase tracking-widest block mb-3">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="font-display text-display-sm font-bold text-bone mb-2">
                {value.title}
              </h3>
              <p className="text-pearl text-body-sm leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
