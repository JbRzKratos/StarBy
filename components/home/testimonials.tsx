'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap-config';
import { testimonials } from '@/data/testimonials';

export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!trackRef.current) return;

      // Set items invisible initially so the reveal animation works correctly.
      // overwrite: 'auto' lets the marquee co-exist without fighting over opacity.
      gsap.set(trackRef.current.children, { y: 40, opacity: 0 });

      // Reveal cards when the section scrolls into view.
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          if (!trackRef.current) return;
          gsap.to(trackRef.current.children, {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power3.out',
            overwrite: 'auto',
            onComplete: () => {
              // Start the endless marquee only after cards are revealed.
              gsap.to(trackRef.current, {
                xPercent: -50,
                ease: 'none',
                duration: 40,
                repeat: -1,
              });
            },
          });
        },
      });
    },
    { scope: sectionRef },
  );

  const handleMouseEnter = () => {
    gsap.getTweensOf(trackRef.current).forEach((t) => t.pause());
  };

  const handleMouseLeave = () => {
    gsap.getTweensOf(trackRef.current).forEach((t) => t.play());
  };

  return (
    <section ref={sectionRef} className="py-20 md:py-32 overflow-hidden bg-charcoal">
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
          ref={trackRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="flex gap-4 md:gap-6 px-4 md:px-8 w-max"
        >
          {[...testimonials, ...testimonials].map((t, idx) => (
            <div
              key={`${t.id}-${idx}`}
              className="flex-shrink-0 w-[320px] md:w-[380px] h-[250px] md:h-[270px] flex flex-col justify-between bg-graphite border border-smoke/60 rounded-xl p-6 md:p-8 hover:border-cobalt/40 transition-colors"
            >
              {/* Header inside card */}
              <div className="flex items-center justify-between">
                <div className="flex text-cobalt text-sm">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <span className="font-mono text-[10px] text-cobalt bg-cobalt/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                  ✓ Verified Buyer
                </span>
              </div>

              {/* Quote - Centered vertically */}
              <div className="my-auto py-2">
                <p className="font-display text-body-md text-bone leading-relaxed line-clamp-3">
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
