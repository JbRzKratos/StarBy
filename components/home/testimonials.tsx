'use client';

import { testimonials } from '@/data/testimonials';

export function Testimonials() {
  return (
    <section className="py-[var(--section-py)] overflow-hidden bg-charcoal">
      <div className="section-container mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="overline-label block mb-3 text-cobalt">Customer Reviews</span>
          <h2 className="font-display text-display-md font-bold text-bone">
            What People Create & Say
          </h2>
        </div>
        <div className="flex items-center gap-3 bg-graphite px-4 py-2 rounded-full border border-smoke/40 w-fit">
          <div className="flex text-cobalt text-sm">★★★★★</div>
          <span className="font-mono text-caption text-bone">4.9/5</span>
          <span className="font-mono text-caption text-pearl border-l border-smoke/50 pl-3">
            10,000+ Verified Buyers
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden group py-4">
        <div
          className="animate-marquee flex gap-4 md:gap-6 px-4 md:px-8 w-max"
        >
          {[
            ...testimonials.map((t) => ({ ...t, _key: `orig-${t.id}` })),
            ...testimonials.map((t) => ({ ...t, _key: `copy-${t.id}` })),
          ].map((t) => (
            <div
              key={t._key}
              className="flex-shrink-0 w-[320px] md:w-[380px] h-[250px] md:h-[270px] flex flex-col justify-between bg-graphite border border-smoke/60 rounded-2xl p-6 md:p-8 hover:border-cobalt/40 transition-colors"
            >
              {/* Header inside card */}
              <div className="flex items-center justify-between shrink-0">
                <div className="flex text-cobalt text-sm">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <span className="font-mono text-[10px] text-cobalt bg-cobalt/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                  ✓ Verified Buyer
                </span>
              </div>

              {/* Quote - Top aligned for uniformity */}
              <div className="flex-1 mt-6 mb-4">
                <p className="font-display text-body-md text-bone leading-relaxed line-clamp-3 text-left">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              {/* Author - Always aligned at bottom */}
              <div className="flex items-center gap-3 pt-4 border-t border-smoke/40 mt-auto">
                <div className="w-8 h-8 rounded-full bg-cobalt/20 text-cobalt flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  {t.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-body-sm text-bone truncate">{t.name}</p>
                  <p className="font-mono text-caption text-ash truncate">{t.handle}</p>
                </div>
                <span className="font-mono text-caption text-pearl shrink-0">{t.product}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
