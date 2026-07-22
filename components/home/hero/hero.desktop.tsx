'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from '@/lib/gsap-config';
import { useGSAP } from '@gsap/react';
import { HERO_DESIGNS_IMAGES, HERO_PERSONALIZED_IMAGES } from './hero.shared';
import { ScrollTriggerWrapper } from '@/components/animations/scroll-trigger-wrapper';

export function HeroDesktop() {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftHeadRef = useRef<HTMLHeadingElement>(null);
  const rightHeadRef = useRef<HTMLHeadingElement>(null);
  const leftCTARef = useRef<HTMLAnchorElement>(null);
  const rightCTARef = useRef<HTMLAnchorElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const leftImagesRef = useRef<HTMLDivElement>(null);
  const rightImagesRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // 1. Initial Staggered Entry
      const tl = gsap.timeline();

      tl.fromTo(
        leftHeadRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
      )
        .fromTo(
          dividerRef.current,
          { scaleY: 0 },
          { scaleY: 1, duration: 0.6, ease: 'power2.inOut' },
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
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
          '-=0.6',
        )
        .fromTo(
          [leftCTARef.current, rightCTARef.current],
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.15 },
          '-=0.4',
        );

      // 2. Crossfade Logic (Left Side)
      const leftImgs = gsap.utils.toArray<HTMLImageElement>(leftImagesRef.current?.children || []);
      const leftTl = gsap.timeline({ repeat: -1 });

      leftImgs.forEach((img, i) => {
        gsap.set(img, { opacity: i === 0 ? 1 : 0 });
      });

      leftImgs.forEach((img, i) => {
        const nextImg = leftImgs[(i + 1) % leftImgs.length] as HTMLImageElement;
        leftTl
          .to({}, { duration: 3.5 })
          .to(img, { opacity: 0, duration: 1.2, ease: 'power2.inOut' })
          .to(nextImg, { opacity: 1, duration: 1.2, ease: 'power2.inOut' }, '<');
      });

      // 3. Crossfade Logic (Right Side)
      const rightImgs = gsap.utils.toArray<HTMLImageElement>(
        rightImagesRef.current?.children || [],
      );
      const rightTl = gsap.timeline({ repeat: -1 });

      rightImgs.forEach((img, i) => {
        gsap.set(img, { opacity: i === 0 ? 1 : 0 });
      });

      rightImgs.forEach((img, i) => {
        const nextImg = rightImgs[(i + 1) % rightImgs.length] as HTMLImageElement;
        rightTl
          .to({}, { duration: 4.0 })
          .to(img, { opacity: 0, duration: 1.2, ease: 'power2.inOut' })
          .to(nextImg, { opacity: 1, duration: 1.2, ease: 'power2.inOut' }, '<');
      });

      // 4. Page Visibility Pause/Play
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
    },
    { scope: containerRef },
  );

  return (
    <ScrollTriggerWrapper>
      <section
        ref={containerRef}
        className="relative w-full h-[calc(100vh-100px)] flex overflow-hidden bg-charcoal"
      >
        {/* LEFT HALF */}
        <div className="w-1/2 h-full relative flex flex-col items-center justify-center pt-20 pb-12 z-10">
          <div
            ref={leftImagesRef}
            className="absolute inset-0 w-full h-full -z-10 opacity-60 mix-blend-screen"
          >
            {HERO_DESIGNS_IMAGES.map((src, idx) => (
              <Image
                key={src}
                src={src}
                alt={`StarBy Original Design ${idx + 1}`}
                fill
                priority={idx === 0}
                className="object-contain p-20"
                sizes="50vw"
              />
            ))}
          </div>

          <div className="flex flex-col items-center mt-auto mb-16 gap-8">
            <h2
              ref={leftHeadRef}
              className="font-display text-6xl xl:text-7xl 2xl:text-8xl text-bone uppercase tracking-tighter text-center"
            >
              Designed
              <br />
              By Us
            </h2>
            <Link
              href="/products/all"
              ref={leftCTARef}
              className="bg-bone text-charcoal font-mono text-xs uppercase tracking-widest px-8 py-4 transition-transform hover:scale-105"
            >
              Shop Designs
            </Link>
          </div>
        </div>

        {/* CENTER DIVIDER */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-full z-20 flex items-center justify-center">
          <div ref={dividerRef} className="absolute inset-0 bg-smoke/20 origin-top" />
          <div
            ref={badgeRef}
            className="w-16 h-16 rounded-full bg-cobalt flex items-center justify-center relative shadow-lg shadow-cobalt/20"
          >
            <span className="font-display text-bone text-xl uppercase tracking-tighter absolute mt-1">
              SB
            </span>
          </div>
        </div>

        {/* RIGHT HALF */}
        <div className="w-1/2 h-full relative flex flex-col items-center justify-center pt-20 pb-12 z-10 bg-cobalt/5">
          <div
            ref={rightImagesRef}
            className="absolute inset-0 w-full h-full -z-10 opacity-70 mix-blend-screen"
          >
            {HERO_PERSONALIZED_IMAGES.map((src, idx) => (
              <Image
                key={src}
                src={src}
                alt={`Personalized Example ${idx + 1}`}
                fill
                priority={idx === 0}
                className="object-contain p-20"
                sizes="50vw"
              />
            ))}
          </div>

          <div className="flex flex-col items-center mt-auto mb-16 gap-8">
            <h2
              ref={rightHeadRef}
              className="font-display text-6xl xl:text-7xl 2xl:text-8xl text-bone uppercase tracking-tighter text-center"
            >
              Personalized
              <br />
              By You
            </h2>
            <Link
              href="/customize"
              ref={rightCTARef}
              className="bg-cobalt text-bone font-mono text-xs uppercase tracking-widest px-8 py-4 transition-transform hover:scale-105"
            >
              Customize Yours
            </Link>
          </div>
        </div>
      </section>
    </ScrollTriggerWrapper>
  );
}
