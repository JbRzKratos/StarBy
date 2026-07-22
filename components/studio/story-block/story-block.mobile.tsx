'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';
import type { StoryBlock as StoryBlockType } from '@/data/studio';

interface StoryBlockProps {
  block: StoryBlockType;
  index: number;
}

export function StoryBlockMobile({ block, index }: StoryBlockProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const accentRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current || !textRef.current || !accentRef.current) return;

      /* Mobile: Simple fade-in without pin or scrub */
      gsap.fromTo(
        [textRef.current, accentRef.current],
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
            once: true,
          },
        },
      );
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center overflow-hidden py-24"
      style={{
        background:
          index % 2 === 0
            ? 'linear-gradient(135deg, #0E0E0F, #1A1A1E)'
            : 'linear-gradient(135deg, #1A1A1E, #0E0E0F)',
      }}
    >
      <div className="section-container flex flex-col gap-12 items-center">
        {/* Visual side */}
        <div
          className="w-full aspect-square rounded-xl"
          style={{
            background: `linear-gradient(${135 + index * 45}deg, #3B5EFF22, #C45D3E22, #2d1b6922)`,
          }}
        />

        {/* Text side */}
        <div className="w-full">
          <div ref={textRef}>
            <span className="overline-label block mb-4">{String(index + 1).padStart(2, '0')}</span>
            <h2 className="font-display text-display-md font-bold text-bone mb-6">
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
