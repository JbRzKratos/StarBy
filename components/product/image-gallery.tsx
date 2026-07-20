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

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        ref={mainRef}
        className="w-full aspect-[3/4] rounded-lg overflow-hidden relative"
        style={{ background: `linear-gradient(145deg, ${colorHex}66, ${colorHex})` }}
      >
        {images?.[activeIndex] ? (
          <Image
            src={images[activeIndex]}
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

      {/* Thumbnail strip — only render if more than one image */}
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

