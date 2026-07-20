'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';
import { testimonials } from '@/data/testimonials';

export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!trackRef.current) return;

      gsap.fromTo(
        trackRef.current.children,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            once: true,
          },
        },
      );
      // Endless scroll marquee
      gsap.to(trackRef.current, {
        xPercent: -50,
        ease: 'none',
        duration: 40,
        repeat: -1,
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
    <section ref={sectionRef} className="py-20 md:py-32 overflow-hidden">
      <div className="section-container mb-10">
        <span className="overline-label block mb-3">Voices</span>
        <h2 className="font-display text-display-md font-bold text-bone">What People Create</h2>
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
              className="flex-shrink-0 w-[320px] md:w-[380px] bg-graphite border border-smoke rounded-lg p-6 md:p-8"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} className="text-cobalt text-sm">
                    ★
                  </span>
                ))}
              </div>

              {/* Quote */}
              <p className="font-display text-body-md text-bone mb-6 leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-smoke">
                <div className="w-8 h-8 rounded-full bg-smoke flex-shrink-0" />
                <div>
                  <p className="font-display text-body-sm text-bone">{t.name}</p>
                  <p className="font-mono text-caption text-ash">{t.handle}</p>
                </div>
                <span className="ml-auto font-mono text-caption text-pearl">{t.product}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
