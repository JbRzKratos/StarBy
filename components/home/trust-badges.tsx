'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap-config';

const BADGES = [
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    title: 'Free Shipping',
    description: 'On all orders above ₹999 across India.',
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Museum-Grade Quality',
    description: '300GSM Giclée prints & 240GSM cotton fabrics.',
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: 'Made On Demand',
    description: 'Crafted & dispatched within 3-5 business days.',
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    ),
    title: 'Hassle-Free Returns',
    description: '7-day easy replacement policy for damaged items.',
  },
];

export function TrustBadges() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      ScrollTrigger.batch(containerRef.current.children, {
        onEnter: (elements) => {
          gsap.fromTo(
            elements,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' },
          );
        },
        start: 'top 85%',
        once: true,
      });
    },
    { scope: containerRef },
  );

  return (
    <section className="py-12 bg-graphite border-y border-smoke/30">
      <div className="section-container">
        <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {BADGES.map((badge, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-5 rounded-xl bg-smoke/5 border border-smoke/10 hover:border-cobalt/40 transition-colors"
            >
              <div className="p-3 bg-cobalt/10 text-cobalt rounded-lg shrink-0">{badge.icon}</div>
              <div>
                <h3 className="font-mono text-caption text-bone uppercase tracking-widest font-semibold mb-1">
                  {badge.title}
                </h3>
                <p className="font-sans text-xs text-pearl leading-relaxed">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
