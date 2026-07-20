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

export function CustomizerPanelDesktop() {
  const { uploadedImage, setUploadedImage, composites, setComposite } = useCustomizerStore();

  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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
        // Yield to main thread briefly between generations
        await new Promise((r) => setTimeout(r, 50));
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) {
        void handleFile(file);
      }
    }
  };

  // Animate new tiles in as they are generated
  useGSAP(() => {
    if (gridRef.current) {
      const newTiles = gridRef.current.querySelectorAll('.composite-tile:not(.revealed)');
      if (newTiles.length > 0) {
        gsap.to(newTiles, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          onComplete: () => {
            newTiles.forEach((t) => t.classList.add('revealed'));
          },
        });
      }
    }
  }, [composites]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="font-display text-[5rem] text-bone leading-none uppercase tracking-tight mb-4">
          Drop your photo. <br /> <span className="text-pearl/60">See it everywhere.</span>
        </h1>
        <p className="font-mono text-pearl max-w-2xl mx-auto">
          Upload a design once and instantly preview it across our entire premium catalog. JPG, PNG,
          WebP up to 15MB.
        </p>
      </div>

      {/* Upload Zone (Visible if no image OR as a small bar if image exists) */}
      <div
        className={`relative border-2 border-dashed rounded-xl transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
          isDragging
            ? 'border-cobalt bg-cobalt/10 scale-[1.02]'
            : 'border-smoke hover:border-pearl bg-graphite'
        } ${uploadedImage ? 'h-24 mb-16' : 'h-96'}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
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
          <div className="flex items-center gap-4 text-bone">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span className="font-mono text-caption uppercase tracking-widest">
              Upload a different image
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center px-6">
            <svg
              className={`w-12 h-12 mb-6 transition-colors ${isDragging ? 'text-cobalt' : 'text-smoke'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <h3 className="font-display text-3xl text-bone mb-2">Drag & Drop</h3>
            <p className="font-mono text-pearl mb-6">or click to browse your files</p>
            {error && (
              <p className="font-mono text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded">
                {error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Comparison Grid */}
      {uploadedImage && (
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-16"
        >
          {Object.entries(templates).map(([pid, template]) => {
            const product = products.find((p) => p.id === template.productId);
            if (!product?.customizable) return null;

            const compUrl = composites[pid];

            return (
              <div
                key={pid}
                className="composite-tile opacity-0 translate-y-8 scale-95 flex flex-col gap-4 group"
              >
                <div className="relative aspect-[4/5] bg-smoke/5 rounded-md overflow-hidden">
                  {compUrl ? (
                    <>
                      <Image
                        src={compUrl}
                        alt="Preview"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/20 transition-colors duration-300" />
                      <Link
                        href={`/customize/${template.productId}`}
                        className="absolute inset-x-8 bottom-8 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 bg-bone text-charcoal font-mono text-caption uppercase text-center py-4 hover:bg-cobalt hover:text-bone transition-all duration-300"
                      >
                        Customize This
                      </Link>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-graphite animate-pulse">
                      <div className="w-8 h-8 border-2 border-smoke border-t-bone rounded-full animate-spin mb-4" />
                      <span className="font-mono text-[10px] text-pearl uppercase tracking-widest">
                        Generating...
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-mono text-body-sm text-bone">
                    {products.find((p) => p.id === template.productId)?.name || 'Custom Product'}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
