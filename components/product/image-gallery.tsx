'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';

interface ImageGalleryProps {
  colorHex: string;
  productName: string;
  images?: string[] | undefined;
}

export function ImageGallery({ colorHex, productName, images }: ImageGalleryProps) {
  const mainRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const spinTweenRef = useRef<gsap.core.Tween | null>(null);

  useGSAP(
    () => {
      if (!mainRef.current) return;
      gsap.fromTo(
        mainRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.7, ease: 'power3.out' },
      );
    },
    { scope: mainRef },
  );

  const handle360 = () => {
    if (!mainRef.current) return;

    if (isSpinning) {
      // Stop
      spinTweenRef.current?.kill();
      gsap.to(mainRef.current, { rotateY: 0, duration: 0.5, ease: 'power2.out' });
      setIsSpinning(false);
    } else {
      // Play full spin once then stop
      setIsSpinning(true);
      gsap.set(mainRef.current, { rotateY: 0, transformPerspective: 1200 });
      spinTweenRef.current = gsap.to(mainRef.current, {
        rotateY: 360,
        duration: 1.4,
        ease: 'power1.inOut',
        onComplete: () => {
          gsap.set(mainRef.current, { rotateY: 0 });
          setIsSpinning(false);
        },
      });
    }
  };

  const hasMultipleImages = images && images.length > 1;

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative">
        <div
          ref={mainRef}
          className="w-full aspect-[3/4] rounded-lg overflow-hidden relative"
          style={{ background: `linear-gradient(145deg, ${colorHex}66, ${colorHex})` }}
        >
          {images?.[activeIndex] ? (
            <Image
              ref={imageRef as React.Ref<HTMLImageElement>}
              src={images[activeIndex] ?? ''}
              alt={productName}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-display-lg text-bone/10 font-bold select-none text-center px-4">
                {productName}
              </span>
            </div>
          )}
        </div>

        {/* 360° Spin button */}
        <button
          onClick={handle360}
          aria-label="360 degree spin view"
          className={`absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors border ${
            isSpinning
              ? 'bg-cobalt border-cobalt text-bone'
              : 'bg-charcoal/70 border-smoke text-pearl hover:border-cobalt hover:text-cobalt'
          }`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isSpinning ? 'animate-spin' : ''}
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
          </svg>
          {isSpinning ? 'Stop' : '360°'}
        </button>
      </div>

      {/* Thumbnail strip */}
      {hasMultipleImages && (
        <div className="flex gap-2">
          {images.map((src, i) => (
            <button
              key={i}
              aria-label={`View ${productName} image ${i + 1}`}
              aria-pressed={i === activeIndex}
              onClick={() => setActiveIndex(i)}
              className={`flex-1 aspect-square rounded overflow-hidden border-2 transition-colors relative ${
                i === activeIndex ? 'border-cobalt' : 'border-smoke hover:border-pearl'
              }`}
              style={{ background: `linear-gradient(145deg, ${colorHex}44, ${colorHex})` }}
            >
              <Image
                src={src}
                alt={`${productName} view ${i + 1}`}
                fill
                className="object-cover"
                sizes="25vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
