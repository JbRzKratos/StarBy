'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';

const panelColors = ['#C45D3E', '#3B5EFF', '#D8D0C8', '#1A1A1E', '#F5F1EA', '#2A2A2F'];

export function SplitPosterTeaser() {
  const sectionRef = useRef<HTMLElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const [panelCount, setPanelCount] = useState(3);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      gsap.fromTo(
        sectionRef.current,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            once: true,
          },
        },
      );
    },
    { scope: sectionRef },
  );

  /* Animate panel separation on hover */
  useGSAP(
    () => {
      if (!panelsRef.current) return;
      const panels = panelsRef.current.children;

      const tl = gsap.timeline({ paused: true });

      Array.from(panels).forEach((panel, i) => {
        const offset = (i - (panels.length - 1) / 2) * 12;
        tl.to(panel, { x: offset, y: -4, duration: 0.4, ease: 'power2.out' }, 0);
      });

      const container = panelsRef.current;
      const onEnter = () => tl.play();
      const onLeave = () => tl.reverse();

      container.addEventListener('mouseenter', onEnter);
      container.addEventListener('mouseleave', onLeave);

      return () => {
        container.removeEventListener('mouseenter', onEnter);
        container.removeEventListener('mouseleave', onLeave);
      };
    },
    { scope: panelsRef, dependencies: [panelCount] },
  );

  return (
    <section ref={sectionRef} className="py-20 md:py-32 grain-overlay overflow-hidden">
      <div className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Visual */}
          <div className="flex justify-center">
            <div ref={panelsRef} className="flex gap-2 cursor-pointer" data-cursor-hover>
              {Array.from({ length: panelCount }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-sm shadow-elevated transition-shadow hover:shadow-glow"
                  style={{
                    width: `${240 / panelCount}px`,
                    height: '280px',
                    background: `linear-gradient(180deg, ${panelColors[i % panelColors.length]}, ${panelColors[(i + 1) % panelColors.length]})`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Copy */}
          <div>
            <span className="overline-label block mb-3">Signature Feature</span>
            <h2 className="font-display text-display-md md:text-display-lg font-bold text-bone mb-4">
              Split Poster
            </h2>
            <p className="text-pearl text-body-lg max-w-md mb-6 leading-relaxed">
              One image. Multiple panels. Transform any photo into a stunning multi-panel wall art
              installation. Hover over the panels to see the effect.
            </p>

            {/* Panel count selector */}
            <div className="flex items-center gap-3 mb-8">
              <span className="font-mono text-caption text-ash uppercase">Panels:</span>
              {[2, 3, 4, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => setPanelCount(n)}
                  className={`w-8 h-8 border rounded-md font-mono text-caption flex items-center justify-center transition-colors ${
                    panelCount === n
                      ? 'border-cobalt text-cobalt bg-cobalt/10'
                      : 'border-smoke text-ash hover:border-pearl'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <Link
              href="/split-poster"
              className="inline-block px-8 py-3.5 bg-cobalt text-bone font-mono text-caption uppercase tracking-widest rounded-lg hover:bg-cobalt/90 transition-colors shadow-md"
            >
              Try the Visualizer →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
