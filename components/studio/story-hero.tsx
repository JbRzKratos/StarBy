'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';

export function StoryHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      if (!headingRef.current || !subRef.current) return;

      const tl = gsap.timeline({ delay: 0.3 });
      tl.fromTo(
        headingRef.current,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
      );
      tl.fromTo(
        subRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
        '-=0.4',
      );
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center grain-overlay overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0E0E0F 0%, #1A1A1E 50%, #0E0E0F 100%)' }}
    >
      <div className="relative z-10 text-center px-5 max-w-4xl">
        <span className="overline-label block mb-8">The Studio</span>
        <h1
          ref={headingRef}
          className="font-display text-display-lg md:text-display-xl font-bold text-bone mb-6 text-balance"
        >
          We Build the Tools.
          <br />
          <span className="text-gradient">You Create the Meaning.</span>
        </h1>
        <p
          ref={subRef}
          className="text-pearl text-body-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
        >
          StarBy is a design studio that happens to sell products. Every item is a blank canvas
          waiting for your story.
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-px h-12 bg-gradient-to-b from-cobalt to-transparent mx-auto mb-2" />
        <span className="font-mono text-caption text-ash uppercase tracking-widest">Scroll</span>
      </div>
    </section>
  );
}
