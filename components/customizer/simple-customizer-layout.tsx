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

export function SimpleCustomizerLayout({
  productType: _productType,
  productId,
  mockupImageSrc,
  price,
  variantId = 'default',
  productName,
}: SimpleCustomizerLayoutProps) {
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [instructions, setInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useCartStore((state) => state.setCartOpen);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setUploadedImage(url);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!uploadedImage || !productId) return;
    setIsSaving(true);

    addItem({
      productId,
      variantId,
      quantity: 1,
      price,
      customization: {
        designFileUrl: uploadedImage,
        previewFileUrl: null, // No preview for simple mode
        instructions: instructions || 'No special instructions',
      },
    });

    setCartOpen(true);
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen pt-[80px] lg:pt-[100px] bg-[#0A0A0B] text-[#F5F1EA]">
      {/* Left: Product Image */}
      <div className="flex-1 relative flex items-center justify-center p-4 lg:p-8 border-b lg:border-b-0 lg:border-r border-[#F5F1EA]/10">
        <div className="relative w-full max-w-2xl aspect-square bg-[#121214] rounded-2xl overflow-hidden shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mockupImageSrc}
            alt={`Customize ${productName}`}
            className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
          />
        </div>
      </div>

      {/* Right: Simple Control Panel */}
      <div className="w-full lg:w-[450px] xl:w-[500px] flex flex-col bg-[#121214]">
        <div className="flex flex-col h-full p-6 space-y-8">
          <div>
            <h2 className="text-2xl font-bold font-display tracking-tight text-bone mb-2">
              Customize Your {productName}
            </h2>
            <p className="text-sm text-ash">
              Upload your image and tell us exactly how you want it printed.
            </p>
          </div>

          {/* Upload Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-pearl">1. Upload Image</label>

            {!uploadedImage ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-[#F5F1EA]/20 rounded-xl flex flex-col items-center justify-center gap-3 text-ash hover:text-bone hover:border-bone/50 hover:bg-[#F5F1EA]/5 transition-all"
              >
                <Camera className="w-8 h-8" />
                <span className="text-sm font-medium">Click to upload image</span>
                <span className="text-xs opacity-70">PNG, JPG up to 20MB</span>
              </button>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="relative w-full aspect-video bg-[#1A1A1E] rounded-xl overflow-hidden border border-[#F5F1EA]/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => setUploadedImage('')}
                    className="absolute top-2 right-2 px-3 py-1.5 bg-black/50 hover:bg-black/80 rounded-md text-xs font-medium backdrop-blur-sm transition-colors text-white"
                  >
                    Change Image
                  </button>
                </div>
                <div className="p-3 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-sm flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span className="font-medium">Image uploaded successfully</span>
                </div>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
            />
          </div>

          {/* Instructions Section */}
          <div className="space-y-4 flex-1">
            <label className="block text-sm font-medium text-pearl">
              2. Print Instructions (Optional)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="E.g., Please print it centered on the front, make it as large as possible, wrap it around the mug, etc."
              className="w-full h-32 bg-[#1A1A1E] border border-[#F5F1EA]/10 rounded-xl p-4 text-sm text-bone placeholder:text-ash/50 focus:outline-none focus:border-cobalt/50 focus:ring-1 focus:ring-cobalt/50 transition-all resize-none"
            />
          </div>

          <div className="mt-auto pt-8 flex gap-3">
            <button
              onClick={() => {
                setUploadedImage('');
                setInstructions('');
              }}
              className="flex-1 py-3.5 bg-transparent border border-[#F5F1EA]/20 text-[#F5F1EA] font-mono text-sm uppercase tracking-widest rounded-lg hover:bg-[#F5F1EA]/5 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleSave}
              disabled={!uploadedImage || isSaving}
              className="flex-[2] py-3.5 bg-cobalt text-bone font-mono text-sm uppercase tracking-widest rounded-lg hover:bg-cobalt/90 disabled:opacity-50 transition-colors shadow-[0_0_20px_rgba(0,87,255,0.3)] flex justify-center items-center gap-2"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
