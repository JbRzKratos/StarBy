'use client';

import React, { useRef, useState } from 'react';
import { useCustomizerStore } from '@/lib/stores/customizer-store';
import { useCartStore } from '@/lib/stores/cart-store';
import { Camera, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export function ControlPanel() {
  const {
    designs,
    setUploadedImage,
    productId,
    activeVariant,
    productType,
    selectedColor,
    setSelectedColor,
    selectedSide,
    setSelectedSide,
    exportPreviewFns,
  } = useCustomizerStore();

  const currentDesign = designs[selectedSide];
  const uploadedImage = currentDesign.url;
  const { dpiStatus, effectiveDpi } = currentDesign;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [instructions, setInstructions] = useState('');
  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useCartStore((state) => state.setCartOpen);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setUploadedImage(url, img.width, img.height, selectedSide);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    // Check if we have at least one design
    if (!designs.front.url && !designs.back.url) return;
    if (!productId) return;
    setIsSaving(true);

    const frontPreviewUrl = exportPreviewFns.front ? exportPreviewFns.front() : null;
    const backPreviewUrl = exportPreviewFns.back ? exportPreviewFns.back() : null;

    addItem({
      productId,
      variantId: activeVariant?.id || 'default', // Fallback if no variant logic yet
      quantity: 1,
      price: activeVariant?.price || 0,
      customization: {
        frontDesignFileUrl: designs.front.url,
        frontPreviewFileUrl: frontPreviewUrl,
        backDesignFileUrl: designs.back.url,
        backPreviewFileUrl: backPreviewUrl,
        designFileUrl: designs.front.url || designs.back.url,
        previewFileUrl: frontPreviewUrl || backPreviewUrl,
        color: selectedColor,
        printInstructions: instructions || 'No special instructions',
      },
    });

    setCartOpen(true);
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold font-display tracking-tight text-bone mb-2">
          Design Tools
        </h2>
        <p className="text-sm text-ash">
          Upload your artwork and adjust its placement on the product.
        </p>
      </div>

      {(productType === 't-shirt' || productType === 'hoodie') && (
        <div className="space-y-6 border-b border-[#F5F1EA]/10 pb-6">
          {/* Side Toggle */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-pearl">Side</label>
            <div className="flex bg-[#1A1A1E] rounded-lg p-1">
              <button
                onClick={() => setSelectedSide('front')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${selectedSide === 'front' ? 'bg-[#2A2A30] text-bone shadow-sm' : 'text-ash hover:text-pearl'}`}
              >
                Front
              </button>
              <button
                onClick={() => setSelectedSide('back')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${selectedSide === 'back' ? 'bg-[#2A2A30] text-bone shadow-sm' : 'text-ash hover:text-pearl'}`}
              >
                Back
              </button>
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-pearl">Color</label>
            <div className="flex gap-3 flex-wrap">
              {[
                { name: 'Black', hex: '#000000' },
                { name: 'White', hex: '#FFFFFF' },
                { name: 'Cornflower Blue', hex: '#6495ED' },
                { name: 'Light Pink', hex: '#FFB6C1' },
                { name: 'Olive Green', hex: '#556B2F' },
              ].map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === color.name ? 'border-cobalt scale-110' : 'border-[#F5F1EA]/20 hover:border-[#F5F1EA]/50'}`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <label className="block text-sm font-medium text-pearl">Artwork Upload</label>

        {!uploadedImage ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-[#F5F1EA]/20 rounded-xl flex flex-col items-center justify-center gap-3 text-ash hover:text-bone hover:border-bone/50 hover:bg-[#F5F1EA]/5 transition-all"
          >
            <Camera className="w-6 h-6" />
            <span className="text-sm font-medium">Click to upload image</span>
            <span className="text-xs opacity-70">PNG, JPG up to 20MB</span>
          </button>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="relative w-full aspect-video bg-[#1A1A1E] rounded-xl overflow-hidden border border-[#F5F1EA]/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-contain" />
              <button
                onClick={() => setUploadedImage('', 0, 0, selectedSide)}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/80 rounded-md text-xs backdrop-blur-sm transition-colors"
              >
                Change
              </button>
            </div>

            {/* DPI Status Indicator */}
            {dpiStatus && (
              <div
                className={`p-3 rounded-lg border text-sm flex items-start gap-3 ${
                  dpiStatus === 'excellent'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : dpiStatus === 'good'
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                      : dpiStatus === 'poor'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                {dpiStatus === 'excellent' || dpiStatus === 'good' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0" />
                )}
                <div className="flex flex-col">
                  <span className="font-semibold capitalize">Print Quality: {dpiStatus}</span>
                  <span className="text-xs opacity-80">
                    {effectiveDpi ? `${Math.round(effectiveDpi)} DPI. ` : ''}
                    {dpiStatus === 'poor' && 'Image may appear slightly blurry when printed.'}
                    {dpiStatus === 'unusable' && 'Image resolution is too low for printing.'}
                  </span>
                </div>
              </div>
            )}
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
      <div className="space-y-4">
        <label className="block text-sm font-medium text-pearl">
          Print Instructions (Optional)
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="E.g., Please make the design larger, position it higher, etc."
          className="w-full h-24 bg-[#1A1A1E] border border-[#F5F1EA]/10 rounded-xl p-4 text-sm text-bone placeholder:text-ash/50 focus:outline-none focus:border-cobalt/50 focus:ring-1 focus:ring-cobalt/50 transition-all resize-none"
        />
      </div>

      <div className="mt-auto pt-8 flex gap-3">
        <button
          onClick={() => {
            setUploadedImage('', 0, 0, selectedSide);
            setInstructions('');
          }}
          className="flex-1 py-3.5 bg-transparent border border-[#F5F1EA]/20 text-[#F5F1EA] font-mono text-sm uppercase tracking-widest rounded-lg hover:bg-[#F5F1EA]/5 transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={(!designs.front.url && !designs.back.url) || isSaving}
          className="flex-1 py-3.5 bg-cobalt text-bone font-mono text-sm uppercase tracking-widest rounded-lg hover:bg-cobalt/90 disabled:opacity-50 transition-colors shadow-[0_0_20px_rgba(0,87,255,0.3)] flex justify-center items-center gap-2"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save & Continue'}
        </button>
      </div>
    </div>
  );
}
