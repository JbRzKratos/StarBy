'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';

/**
 * Register all GSAP plugins once.
 * ScrollSmoother is a Club plugin — uncomment if you have a GSAP Club license.
 */
gsap.registerPlugin(ScrollTrigger, Flip);
// gsap.registerPlugin(ScrollSmoother); // Uncomment with Club license

/**
 * Global reduced-motion configuration.
 * Disables all GSAP animations for users who prefer reduced motion.
 */
const mm = typeof window !== 'undefined' ? gsap.matchMedia() : null;

if (mm) {
  mm.add('(prefers-reduced-motion: reduce)', () => {
    gsap.globalTimeline.timeScale(Infinity);
    gsap.defaults({ duration: 0 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ScrollTrigger.defaults({ animation: undefined as any });
  });

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.defaults({
      duration: 0.8,
      ease: 'power3.out',
    });
  });
}

export { gsap, ScrollTrigger, Flip, mm };
