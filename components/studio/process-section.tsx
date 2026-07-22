'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap-config';
import { processSteps } from '@/data/studio';

export function ProcessSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!stepsRef.current) return;

      ScrollTrigger.batch(stepsRef.current.children, {
        onEnter: (elements) => {
          gsap.fromTo(
            elements,
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: 'power3.out' },
          );
        },
        start: 'top 85%',
        once: true,
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="py-20 md:py-32 bg-graphite">
      <div className="section-container">
        <div className="text-center mb-16">
          <span className="overline-label block mb-3">How It Works</span>
          <h2 className="font-display text-display-md md:text-display-lg font-bold text-bone">
            Our Process
          </h2>
        </div>

        <div
          ref={stepsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
        >
          {processSteps.map((step) => (
            <div
              key={step.step}
              className="text-center md:text-left bg-charcoal/60 border border-smoke/50 rounded-xl p-6 md:p-8 hover:border-cobalt/50 transition-colors"
            >
              <span className="font-mono text-display-lg text-cobalt font-extrabold block mb-4">
                {step.step}
              </span>
              <h3 className="font-display text-display-sm font-bold text-bone mb-2">
                {step.title}
              </h3>
              <p className="text-pearl text-body-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
