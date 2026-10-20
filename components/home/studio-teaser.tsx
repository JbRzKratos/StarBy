'use client';

import Link from 'next/link';

export function StudioTeaser() {
  return (
    <section
      className="relative py-[clamp(5rem,4rem+6vw,10rem)] grain-overlay overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0E0E0F 0%, #1A1A1E 40%, #2d1b69 100%)',
      }}
    >
      <div className="section-container relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <span className="overline-label block mb-6">The Studio</span>
          <h2 className="font-display text-display-lg md:text-display-xl font-bold text-bone mb-6 text-balance">
            We Don&apos;t Sell Products.
            <br />
            <span className="text-gradient">We Sell Self-Expression.</span>
          </h2>
          <p className="text-pearl text-body-lg max-w-lg mx-auto mb-10 leading-relaxed">
            Go behind the scenes. Discover how every Fregoro Studios product is engineered to carry
            your story — from concept to your doorstep.
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
