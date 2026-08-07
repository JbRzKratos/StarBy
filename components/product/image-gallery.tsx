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
  const [activeIndex, setActiveIndex] = useState(0);

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

  const hasMultipleImages = images && images.length > 1;

  const handleThumbnailClick = (i: number) => {
    if (i === activeIndex) return;

    if (mainRef.current) {
      gsap.fromTo(
        mainRef.current,
        { opacity: 0.5, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' },
      );
    }
    setActiveIndex(i);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div
        className="relative overflow-hidden rounded-xl group aspect-[3/4] bg-graphite"
        style={{
          background: `linear-gradient(145deg, ${colorHex}22, ${colorHex}44)`,
        }}
      >
        <div ref={mainRef} className="w-full h-full relative">
          {images?.[activeIndex] ? (
            <Image
              src={images[activeIndex] ?? ''}
              alt={productName}
              fill
              className="object-contain transition-transform duration-[800ms] ease-out group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-display-lg text-bone/10 font-bold select-none text-center px-4">
                {productName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail strip */}
      {hasMultipleImages && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {images.map((src, i) => (
            <button
              key={i}
              aria-label={`View ${productName} image ${i + 1}`}
              aria-pressed={i === activeIndex}
              onClick={() => handleThumbnailClick(i)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                i === activeIndex
                  ? 'border-cobalt opacity-100 ring-2 ring-cobalt/20 ring-offset-2 ring-offset-graphite'
                  : 'border-transparent opacity-60 hover:opacity-100 hover:border-smoke/50'
              }`}
              style={{ background: `linear-gradient(145deg, ${colorHex}11, ${colorHex}33)` }}
            >
              <Image
                src={src}
                alt={`${productName} view ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
