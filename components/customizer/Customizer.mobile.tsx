'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useCustomizerStore } from '@/store/customizer';
import { getProductBySlug } from '@/data/products';
import { useCartStore } from '@/lib/stores/cart-store';
import { validateImage, fileToDataUrl } from '@/components/customizer-hub/CustomizerHub.shared';

// Dynamically import the canvas to avoid SSR issues
const CustomizerCanvas = dynamic(
  () => import('./customizer-canvas').then((m) => m.CustomizerCanvas),
  { ssr: false, loading: () => <div className="w-full h-[60vh] bg-graphite animate-pulse" /> },
);

export function CustomizerMobile({ productId }: { productId: string }) {
  const { uploadedImage, setUploadedImage } = useCustomizerStore();
  const product = getProductBySlug(productId.replace('prod_', ''));
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setCartOpen);

  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>(product?.sizes?.[0] || 'M');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInlineUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const validation = validateImage(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setUploadedImage(dataUrl);
    } catch {
      setError('Failed to upload. Try again.');
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-charcoal pb-24 pt-20">
      {/* Canvas Area (Top) */}
      <div className="relative w-full h-[50vh] bg-graphite shrink-0">
        {!uploadedImage && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-graphite/90 p-6">
            <h3 className="font-display text-2xl text-bone mb-2">Upload Image</h3>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-bone text-charcoal font-mono text-caption uppercase px-6 py-3 rounded-sm active:scale-95 transition-transform"
            >
              Choose Photo
            </button>
            {error && (
              <p className="text-red-400 mt-4 font-mono text-[10px] text-center">{error}</p>
            )}
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg, image/png, image/webp"
          onChange={handleInlineUpload}
        />

        <CustomizerCanvas productId={productId} initialImage={uploadedImage} />
      </div>

      {/* Tools Area (Scrollable Bottom) */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-8">
        <div className="flex justify-between items-end">
          <h1 className="font-display text-3xl font-bold text-bone uppercase">{product?.name}</h1>
          <p className="font-mono text-pearl">₹{product?.basePrice}</p>
        </div>

        {/* Colors */}
        <div>
          <h3 className="font-mono text-[10px] text-bone uppercase tracking-widest mb-3">Color</h3>
          <div className="flex gap-3">
            {['#0E0E0F', '#F5F1EA', '#2A2A2F', '#C45D3E', '#3B5EFF'].map((c) => (
              <button
                key={c}
                className="w-12 h-12 rounded-full border-2 border-smoke hover:border-bone transition-colors"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Sizing */}
        {product?.sizes && (
          <div>
            <h3 className="font-mono text-[10px] text-bone uppercase tracking-widest mb-3">Size</h3>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-14 h-12 flex items-center justify-center border font-mono text-sm transition-colors ${
                    selectedSize === size
                      ? 'border-cobalt text-cobalt'
                      : 'border-smoke text-bone hover:border-cobalt hover:text-cobalt active:bg-smoke/20'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {uploadedImage && (
          <p className="font-mono text-[10px] text-pearl bg-graphite p-4 border border-smoke/30 rounded-sm">
            Pinch to scale. Use two fingers to rotate. Drag to move.
          </p>
        )}
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-charcoal/90 backdrop-blur-md border-t border-smoke/20 z-50">
        <button
          onClick={() => {
            if (!product || !uploadedImage || !product.variants[0]) return;
            addItem({
              productId: product.id,
              variantId: product.variants[0].id,
              quantity: 1,
              price: product.basePrice,
              ...(product.sizes && { size: selectedSize }),
              customization: {
                color: 'charcoal',
                text: '',
                textFont: '',
                imageUrl: uploadedImage,
              },
            });
            setCartOpen(true);
          }}
          disabled={!uploadedImage}
          className={`w-full font-mono text-caption uppercase py-4 tracking-widest ${
            uploadedImage
              ? 'bg-cobalt text-bone active:bg-cobalt/90'
              : 'bg-smoke/20 text-bone/50 cursor-not-allowed'
          }`}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
