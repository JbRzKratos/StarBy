'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';
import { useCustomizerStore } from '@/store/customizer';
import { validateImage, fileToDataUrl } from './CustomizerHub.shared';
import { templates } from '@/data/customizationTemplates';
import { products } from '@/data/products';
import { generateCompositePreview } from '@/lib/utils/compositeCanvas';

export function CustomizerPanelMobile() {
  const { uploadedImage, setUploadedImage, composites, setComposite } = useCustomizerStore();

  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    const validation = validateImage(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setUploadedImage(dataUrl);

      // Kick off composite generation asynchronously but sequentially to not block UI thread completely
      const productIds = Object.keys(templates).filter((pid) => {
        const product = products.find((p) => p.id === templates[pid]?.productId);
        return product?.customizable;
      });
      for (const pid of productIds) {
        await new Promise((r) => setTimeout(r, 50)); // Yield
        try {
          const template = templates[pid];
          if (!template) continue;
          const comp = await generateCompositePreview(dataUrl, template);
          setComposite(pid, comp);
        } catch {
          console.error(`Failed to composite ${pid}`);
        }
      }
    } catch {
      setError('Failed to process image. Please try another.');
    }
  };

  // Animate new tiles in as they are generated
  useGSAP(() => {
    if (carouselRef.current) {
      const newTiles = carouselRef.current.querySelectorAll('.composite-tile:not(.revealed)');
      if (newTiles.length > 0) {
        gsap.to(newTiles, {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: 'power2.out',
          onComplete: () => {
            newTiles.forEach((t) => t.classList.add('revealed'));
          },
        });
      }
    }
  }, [composites]);

  return (
    <div className="w-full flex flex-col">
      {/* Header */}
      <div className="mb-12">
        <h1 className="font-display text-[3.5rem] text-bone leading-[0.9] uppercase tracking-tight mb-4">
          Drop your photo. <br /> <span className="text-pearl/60">See it everywhere.</span>
        </h1>
        <p className="font-mono text-caption text-pearl">
          Upload a design once and instantly preview it across our catalog.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="mb-12">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg, image/png, image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />

        {uploadedImage ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-3 border border-smoke text-bone font-mono text-caption uppercase py-4 active:bg-smoke/20"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Change Image
          </button>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-bone text-charcoal flex flex-col items-center justify-center gap-4 py-12 rounded-sm active:scale-[0.98] transition-transform"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span className="font-mono text-caption uppercase tracking-widest font-bold">
              Choose from Photo Library
            </span>
          </button>
        )}
        {error && <p className="font-mono text-red-400 text-[10px] mt-4">{error}</p>}
      </div>

      {/* Comparison Carousel */}
      {uploadedImage && (
        <div className="relative -mx-5 px-5">
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-8"
          >
            {Object.entries(templates).map(([pid, template]) => {
              const product = products.find((p) => p.id === template.productId);
              if (!product?.customizable) return null;

              const compUrl = composites[pid];

              return (
                <div
                  key={pid}
                  className="composite-tile opacity-0 scale-95 shrink-0 w-[85vw] snap-center flex flex-col gap-4"
                >
                  <div className="relative aspect-[4/5] bg-smoke/5 rounded-md overflow-hidden">
                    {compUrl ? (
                      <Image src={compUrl} alt="Preview" fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-graphite animate-pulse">
                        <div className="w-6 h-6 border-2 border-smoke border-t-bone rounded-full animate-spin mb-3" />
                        <span className="font-mono text-[9px] text-pearl uppercase tracking-widest">
                          Generating...
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="font-mono text-body-sm text-bone">
                      {products.find((p) => p.id === template.productId)?.name || 'Custom Product'}
                    </h3>
                    {compUrl && (
                      <Link
                        href={`/customize/${template.productId}`}
                        className="bg-bone text-charcoal font-mono text-[10px] uppercase tracking-widest px-4 py-2"
                      >
                        Customize
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2 mt-4 text-pearl font-mono text-[10px] uppercase">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H6M12 5l-7 7 7 7" />
            </svg>
            Swipe to compare
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h13M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
