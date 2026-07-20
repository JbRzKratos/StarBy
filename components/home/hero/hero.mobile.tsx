'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { HERO_DESIGNS_IMAGES, HERO_PERSONALIZED_IMAGES } from './hero.shared';
import { ScrollTriggerWrapper } from '@/components/animations/scroll-trigger-wrapper';

export function HeroMobile() {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftHeadRef = useRef<HTMLHeadingElement>(null);
  const rightHeadRef = useRef<HTMLHeadingElement>(null);
  const leftCTARef = useRef<HTMLAnchorElement>(null);
  const rightCTARef = useRef<HTMLAnchorElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const leftImagesRef = useRef<HTMLDivElement>(null);
  const rightImagesRef = useRef<HTMLDivElement>(null);

  // We slice to 3 images to save memory/processing on mobile
  const designsImages = HERO_DESIGNS_IMAGES.slice(0, 3);
  const personalizedImages = HERO_PERSONALIZED_IMAGES.slice(0, 3);

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // 1. Initial Staggered Entry
      const tl = gsap.timeline();

      tl.fromTo(
        leftHeadRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
      )
        .fromTo(
          dividerRef.current,
          { scaleX: 0 },
          { scaleX: 1, duration: 0.6, ease: 'power2.inOut' },
          '-=0.4',
        )
        .fromTo(
          badgeRef.current,
          { scale: 0, opacity: 0, rotation: -45 },
          { scale: 1, opacity: 1, rotation: 0, duration: 0.5, ease: 'back.out(1.5)' },
          '-=0.2',
        )
        .fromTo(
          rightHeadRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
          '-=0.6',
        )
        .fromTo(
          [leftCTARef.current, rightCTARef.current],
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.15 },
          '-=0.4',
        );

      if (!prefersReducedMotion) {
        // 2. Crossfade Logic (Top Block)
        const leftImgs = gsap.utils.toArray<HTMLImageElement>(
          leftImagesRef.current?.children || [],
        );
        const leftTl = gsap.timeline({ repeat: -1 });

        leftImgs.forEach((img, i) => {
          if (i > 0) gsap.set(img, { opacity: 0 });
        });

        leftImgs.forEach((img, i) => {
          const nextImg = leftImgs[(i + 1) % leftImgs.length] as HTMLImageElement;
          leftTl
            .to({}, { duration: 4.0 }) // Slower on mobile
            .to(img, { opacity: 0, duration: 1.2, ease: 'power2.inOut' }, 'crossfade')
            .to(nextImg, { opacity: 1, duration: 1.2, ease: 'power2.inOut' }, 'crossfade');
        });

        // 3. Crossfade Logic (Bottom Block)
        const rightImgs = gsap.utils.toArray<HTMLImageElement>(
          rightImagesRef.current?.children || [],
        );
        const rightTl = gsap.timeline({ repeat: -1 });

        rightImgs.forEach((img, i) => {
          if (i > 0) gsap.set(img, { opacity: 0 });
        });

        rightImgs.forEach((img, i) => {
          const nextImg = rightImgs[(i + 1) % rightImgs.length] as HTMLImageElement;
          rightTl
            .to({}, { duration: 4.8 }) // Slower, desynced
            .to(img, { opacity: 0, duration: 1.2, ease: 'power2.inOut' }, 'crossfadeRight')
            .to(nextImg, { opacity: 1, duration: 1.2, ease: 'power2.inOut' }, 'crossfadeRight');
        });

        // 4. Page Visibility
        const handleVisibilityChange = () => {
          if (document.hidden) {
            leftTl.pause();
            rightTl.pause();
          } else {
            leftTl.play();
            rightTl.play();
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      }
    },
    { scope: containerRef },
  );

  return (
    <ScrollTriggerWrapper>
      <section
        ref={containerRef}
        className="relative w-full h-[calc(100vh-80px)] flex flex-col overflow-hidden bg-charcoal pt-16"
      >
        {/* TOP BLOCK (OUR DESIGNS) */}
        <div className="flex-1 w-full relative flex flex-col items-center justify-end pb-8 z-10">
          <div
            ref={leftImagesRef}
            className="absolute inset-0 w-full h-full -z-10 opacity-70 mix-blend-screen pointer-events-none"
          >
            {designsImages.map((src, idx) => (
              <Image
                key={src}
                src={src}
                alt={`StarBy Original Design ${idx + 1}`}
                fill
                priority={idx === 0}
                className="object-contain p-8"
                sizes="100vw"
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 px-6 w-full max-w-sm">
            <h1
              ref={leftHeadRef}
              className="font-display text-4xl text-bone uppercase tracking-tighter text-center"
            >
              Designed
              <br />
              By Us
            </h1>
            <Link
              href="/products/all"
              ref={leftCTARef}
              className="w-full text-center bg-bone text-charcoal font-mono text-[10px] uppercase tracking-widest px-6 py-4"
            >
              Shop Designs
            </Link>
          </div>
        </div>

        {/* HORIZONTAL DIVIDER */}
        <div className="relative w-full h-[1px] z-20 flex items-center justify-center my-4">
          <div ref={dividerRef} className="absolute inset-0 bg-smoke/20 origin-left" />
          <div
            ref={badgeRef}
            className="w-10 h-10 rounded-full bg-cobalt flex items-center justify-center relative shadow-lg shadow-cobalt/20 z-30"
          >
            <span className="font-display text-bone text-sm uppercase tracking-tighter absolute mt-[2px]">
              SB
            </span>
          </div>
        </div>

        {/* BOTTOM BLOCK (YOUR DESIGN) */}
        <div className="flex-1 w-full relative flex flex-col items-center justify-start pt-8 z-10 bg-cobalt/5">
          <div
            ref={rightImagesRef}
            className="absolute inset-0 w-full h-full -z-10 opacity-80 mix-blend-screen pointer-events-none"
          >
            {personalizedImages.map((src, idx) => (
              <Image
                key={src}
                src={src}
                alt={`Personalized Example ${idx + 1}`}
                fill
                priority={idx === 0}
                className="object-contain p-8"
                sizes="100vw"
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 px-6 w-full max-w-sm mt-auto mb-10">
            <h1
              ref={rightHeadRef}
              className="font-display text-4xl text-bone uppercase tracking-tighter text-center drop-shadow-md"
            >
              Personalized
              <br />
              By You
            </h1>
            <Link
              href="/customize"
              ref={rightCTARef}
              className="w-full text-center bg-cobalt text-bone font-mono text-[10px] uppercase tracking-widest px-6 py-4"
            >
              Customize Yours
            </Link>
          </div>
        </div>
      </section>
    </ScrollTriggerWrapper>
  );
}
