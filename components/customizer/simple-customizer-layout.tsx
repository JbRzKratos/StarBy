'use client';

import React, { useRef, useState } from 'react';
import { useCartStore } from '@/lib/stores/cart-store';
import { Camera, CheckCircle2, Loader2 } from 'lucide-react';
import type { ProductType } from '@/lib/config/printSpecs';

interface SimpleCustomizerLayoutProps {
  productType: ProductType;
  productId: string;
  mockupImageSrc: string;
  price: number;
  variantId?: string;
  productName: string;
}

interface UploadedArtwork {
  name: string;
  url: string;
  dataUrl: string;
}

export function SimpleCustomizerLayout({
  productType: _productType,
  productId,
  mockupImageSrc,
  price,
  variantId = 'default',
  productName,
}: SimpleCustomizerLayoutProps) {
  const [artworks, setArtworks] = useState<UploadedArtwork[]>([]);
  const [instructions, setInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useCartStore((state) => state.setCartOpen);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setArtworks((prev) => [
          ...prev,
          {
            name: file.name,
            url,
            dataUrl: url,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveArtwork = (index: number) => {
    setArtworks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (artworks.length === 0 || !productId) return;
    setIsSaving(true);

    try {
      // 1. Upload high-res original artworks to Cloudflare R2
      // This prevents multi-megabyte base64 strings in localStorage.
      let uploadResult = {
        frontPreviewUrl: mockupImageSrc,
        previewFileUrl: mockupImageSrc,
        designFileUrl: artworks[0]?.url || null,
        uploadedArtworks: artworks.map((a, i) => ({
          name: a.name || `Artwork #${i + 1}`,
          url: a.url,
          dataUrl: a.dataUrl,
          side: 'front',
        })),
      };

      try {
        const uploadRes = await fetch('/api/customizer/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frontSnapshot: mockupImageSrc,
            uploadedArtworks: artworks.map((a, i) => ({
              name: a.name || `Artwork #${i + 1}`,
              url: a.url,
              dataUrl: a.dataUrl,
              side: 'front',
            })),
            garmentId: productId,
          }),
        });

        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          if (uploadJson.success) {
            uploadResult = {
              frontPreviewUrl: uploadJson.frontPreviewUrl || mockupImageSrc,
              previewFileUrl: uploadJson.previewFileUrl || mockupImageSrc,
              designFileUrl: uploadJson.designFileUrl || uploadResult.designFileUrl,
              uploadedArtworks: uploadJson.uploadedArtworks || uploadResult.uploadedArtworks,
            };
          }
        }
      } catch (uploadErr) {
        console.warn('[SimpleCustomizer] R2 upload notice (fallback applied):', uploadErr);
      }

      addItem({
        productId,
        variantId,
        quantity: 1,
        price,
        image: uploadResult.previewFileUrl || mockupImageSrc,
        customization: {
          designFileUrl: uploadResult.designFileUrl,
          previewFileUrl: uploadResult.previewFileUrl,
          frontPreviewFileUrl: uploadResult.previewFileUrl,
          printInstructions: instructions || 'Custom Placement Request',
          customerNotes: instructions || null,
          uploadedArtworks: uploadResult.uploadedArtworks,
          is2dMockup: true,
          mode: '2d',
        },
      });

      setCartOpen(true);
    } catch (err) {
      console.error('[SimpleCustomizer] Failed to add item to bag:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const primaryPreview = artworks[artworks.length - 1]?.url || '';

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen pt-[80px] lg:pt-[100px] bg-[#0A0A0B] text-[#F5F1EA]">
      {/* Left: Product Mockup with Overlay */}
      <div className="flex-1 relative flex items-center justify-center p-4 lg:p-8 border-b lg:border-b-0 lg:border-r border-[#F5F1EA]/10">
        <div className="relative w-full max-w-2xl aspect-square bg-[#121214] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center p-6">
          {/* Base Product Mockup */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mockupImageSrc}
            alt={`Customize ${productName}`}
            className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
          />

          {/* Live Overlay of User's Artwork */}
          {primaryPreview && (
            <div className="relative z-10 w-2/5 aspect-square flex items-center justify-center pointer-events-none shadow-lg rounded-lg overflow-hidden bg-black/10 backdrop-blur-[1px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={primaryPreview}
                alt="Your Artwork Preview"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
          )}
        </div>
      </div>

      {/* Right: 2D Customizer Control Panel */}
      <div className="w-full lg:w-[450px] xl:w-[500px] flex flex-col bg-[#121214]">
        <div className="flex flex-col h-full p-6 space-y-6">
          <div>
            <div className="inline-block px-2.5 py-1 mb-2 bg-[#3B5EFF]/20 border border-[#3B5EFF]/40 rounded text-[11px] font-mono font-bold text-[#A5B4FC] uppercase tracking-wider">
              2D Custom Studio
            </div>
            <h2 className="text-2xl font-bold font-display tracking-tight text-bone mb-1">
              Customize Your {productName}
            </h2>
            <p className="text-xs text-ash">
              Upload single or multiple artworks and describe how you want them positioned.
            </p>
          </div>

          {/* Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-pearl">
                1. Upload Artwork Files {artworks.length > 0 && `(${artworks.length})`}
              </label>
              {artworks.length > 0 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-[#3B5EFF] hover:underline font-mono"
                >
                  + Add More Files
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-28 border-2 border-dashed border-[#F5F1EA]/20 rounded-xl flex flex-col items-center justify-center gap-2 text-ash hover:text-bone hover:border-bone/50 hover:bg-[#F5F1EA]/5 transition-all"
            >
              <Camera className="w-6 h-6 text-[#3B5EFF]" />
              <span className="text-xs font-medium">Click to upload original artwork(s)</span>
              <span className="text-[10px] opacity-70">PNG, JPG, SVG, WebP • Multi-file support</span>
            </button>

            {/* List of Uploaded Artworks */}
            {artworks.length > 0 && (
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-1">
                {artworks.map((art, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#1A1A1E] border border-[#F5F1EA]/10 text-xs"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={art.url}
                        alt={art.name}
                        className="w-8 h-8 rounded object-contain bg-black/40 border border-white/10 shrink-0"
                      />
                      <span className="truncate text-bone font-mono text-[11px]">{art.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveArtwork(idx)}
                      className="text-red-400 hover:text-red-300 text-[11px] font-mono px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="p-2 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{artworks.length} artwork file{artworks.length > 1 ? 's' : ''} ready</span>
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              accept="image/png, image/jpeg, image/webp, image/svg+xml"
              onChange={handleFileChange}
            />
          </div>

          {/* Instructions Section */}
          <div className="space-y-2 flex-1">
            <label className="block text-sm font-medium text-pearl">
              2. Placement &amp; Print Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="E.g., Please center the first graphic in the middle. Place the logo at the top right corner. Make it as large as possible without cropping."
              className="w-full h-28 bg-[#1A1A1E] border border-[#F5F1EA]/10 rounded-xl p-3 text-xs text-bone placeholder:text-ash/50 focus:outline-none focus:border-[#3B5EFF] focus:ring-1 focus:ring-[#3B5EFF] transition-all resize-none font-sans"
            />
          </div>

          <div className="mt-auto pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setArtworks([]);
                setInstructions('');
              }}
              className="flex-1 py-3 bg-transparent border border-[#F5F1EA]/20 text-[#F5F1EA] font-mono text-xs uppercase tracking-widest rounded-lg hover:bg-[#F5F1EA]/5 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={artworks.length === 0 || isSaving}
              className="flex-[2] py-3 bg-[#3B5EFF] text-white font-mono text-xs uppercase tracking-widest rounded-lg hover:bg-[#3B5EFF]/90 disabled:opacity-50 transition-colors shadow-[0_0_20px_rgba(59,94,255,0.3)] flex justify-center items-center gap-2 font-bold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding to Bag...</span>
                </>
              ) : (
                'Add to Bag'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
