'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';
import type { StoryBlock as StoryBlockType } from '@/data/studio';

interface StoryBlockProps {
  block: StoryBlockType;
  index: number;
}

export function StoryBlockDesktop({ block, index }: StoryBlockProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const accentRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current || !textRef.current || !accentRef.current) return;

      /* Desktop: Pin section and scrub text in/out */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=150%',
          pin: true,
          scrub: 1,
        },
      });

      tl.fromTo(textRef.current, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 });
      tl.fromTo(
        accentRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3 },
        '-=0.2',
      );
      tl.to({}, { duration: 0.3 }); /* Hold */
      tl.to(textRef.current, { y: -40, opacity: 0, duration: 0.3 });
      tl.to(accentRef.current, { y: -20, opacity: 0, duration: 0.2 }, '-=0.2');
    },
    { scope: sectionRef },
  );

  const isReversed = index % 2 === 1;

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{
        background:
          index % 2 === 0
            ? 'linear-gradient(135deg, #0E0E0F, #1A1A1E)'
            : 'linear-gradient(135deg, #1A1A1E, #0E0E0F)',
      }}
    >
      <div
        className={`section-container grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${isReversed ? 'md:direction-rtl' : ''}`}
      >
        {/* Visual side */}
        <div
          className={`aspect-square rounded-lg ${isReversed ? 'md:order-2' : ''}`}
          style={{
            background: `linear-gradient(${135 + index * 45}deg, #3B5EFF22, #C45D3E22, #2d1b6922)`,
          }}
        />

        {/* Text side */}
        <div className={isReversed ? 'md:order-1' : ''}>
          <div ref={textRef}>
            <span className="overline-label block mb-4">{String(index + 1).padStart(2, '0')}</span>
            <h2 className="font-display text-display-md md:text-display-lg font-bold text-bone mb-6">
              {block.heading}
            </h2>
            <p className="text-pearl text-body-lg leading-relaxed">{block.body}</p>
          </div>
          <div ref={accentRef} className="mt-8 pl-6 border-l-2 border-cobalt">
            <p className="font-display text-body-lg text-cobalt italic">{block.accent}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
