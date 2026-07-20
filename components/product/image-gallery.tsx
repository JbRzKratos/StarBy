'use client';

import { useRef } from 'react';
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

  return (
    <div className="flex flex-col gap-3">
      {/* Main image placeholder */}
      <div
        ref={mainRef}
        className="w-full aspect-[3/4] rounded-lg overflow-hidden relative"
        style={{ background: `linear-gradient(145deg, ${colorHex}66, ${colorHex})` }}
      >
        {images?.[0] ? (
          <Image
            src={images[0]}
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

      {/* Thumbnail strip */}
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            className={`flex-1 aspect-square rounded overflow-hidden border-2 transition-colors relative ${
              i === 0 ? 'border-cobalt' : 'border-smoke hover:border-pearl'
            }`}
            style={{ background: `linear-gradient(145deg, ${colorHex}44, ${colorHex})` }}
          >
            {images?.[i] && (
              <Image
                src={images[i]}
                alt={`${productName} view ${i + 1}`}
                fill
                className="object-cover"
                sizes="25vw"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
