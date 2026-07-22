'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';

export function StudioTeaser() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current || !textRef.current) return;

      gsap.fromTo(
        textRef.current.children,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.12,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            once: true,
          },
        },
      );
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="relative py-32 md:py-44 grain-overlay overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0E0E0F 0%, #1A1A1E 40%, #2d1b69 100%)',
      }}
    >
      <div className="section-container relative z-10">
        <div ref={textRef} className="max-w-2xl mx-auto text-center">
          <span className="overline-label block mb-6">The Studio</span>
          <h2 className="font-display text-display-lg md:text-display-xl font-bold text-bone mb-6 text-balance">
            We Don&apos;t Sell Products.
            <br />
            <span className="text-gradient">We Sell Self-Expression.</span>
          </h2>
          <p className="text-pearl text-body-lg max-w-lg mx-auto mb-10 leading-relaxed">
            Go behind the scenes. Discover how every StarBy product is engineered to carry your
            story — from concept to your doorstep.
          </p>
          <Link
            href="/studio"
            className="inline-block px-10 py-4 border border-bone/20 text-bone font-mono text-caption uppercase tracking-widest rounded-lg hover:bg-bone/5 transition-colors"
          >
            Enter the Studio →
          </Link>
        </div>
      </div>
    </section>
  );
}
