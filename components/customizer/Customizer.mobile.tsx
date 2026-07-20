'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useCustomizerStore } from '@/store/customizer';
import { getProductBySlug, products } from '@/data/products';
import { useCartStore } from '@/lib/stores/cart-store';
import { validateImage, fileToDataUrl } from '@/components/customizer-hub/CustomizerHub.shared';
import { DeviceSelector } from './DeviceSelector';

// Dynamically import the canvas to avoid SSR issues
const CustomizerCanvas = dynamic(
  () => import('./customizer-canvas').then((m) => m.CustomizerCanvas),
  { ssr: false, loading: () => <div className="w-full h-[60vh] bg-graphite animate-pulse" /> },
);

export function CustomizerMobile({ productId }: { productId: string }) {
  const { uploadedImage, setUploadedImage, selectedDeviceId, setSelectedDevice } = useCustomizerStore();
  const product = products.find((p) => p.id === productId) || getProductBySlug(productId);
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setCartOpen);

  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>(product?.sizes?.[0] || 'M');
  const [selectedColor] = useState<string>('#0E0E0F');
  const {
    splitStyle,
    splitOrientation,
    splitPanels,
    splitGridCols,
    splitGridRows,
    setSplitStyle,
    setSplitOrientation,
    setSplitPanels,
    setSplitGrid,
  } = useCustomizerStore();
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

        <CustomizerCanvas 
          productId={productId} 
          initialImage={uploadedImage} 
          selectedColor={selectedColor} 
          selectedDeviceId={selectedDeviceId}
          selectedSize={selectedSize}
        />
      </div>

      {/* Tools Area (Scrollable Bottom) */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-8">
        <div className="flex justify-between items-end">
          <h1 className="font-display text-3xl font-bold text-bone uppercase">{product?.name}</h1>
          <p className="font-mono text-pearl">₹{product?.basePrice}</p>
        </div>



        {/* Sizing (if applicable) */}
        {product?.sizes && product.sizes.length > 0 && (
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

        {/* Split Poster Configuration */}
        {product?.categorySlug === 'split-posters' && (
          <div className="bg-graphite border border-smoke/30 p-4 rounded-lg flex flex-col gap-4">
            <h3 className="font-mono text-[10px] text-bone uppercase tracking-widest">
              Split Config
            </h3>
            
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] text-ash uppercase tracking-wider">Style</span>
              <div className="flex border border-smoke rounded-sm overflow-hidden">
                {['classic', 'stepped', 'grid'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSplitStyle(s as any)}
                    className={`flex-1 px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                      splitStyle === s
                        ? 'bg-cobalt text-bone'
                        : 'bg-charcoal text-ash hover:text-pearl border-l first:border-l-0 border-smoke'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {splitStyle === 'classic' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] text-ash uppercase tracking-wider">Orientation</span>
                  <div className="flex border border-smoke rounded-sm overflow-hidden">
                    <button
                      onClick={() => setSplitOrientation('vertical')}
                      className={`flex-1 px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors border-r border-smoke ${
                        splitOrientation === 'vertical' ? 'bg-cobalt text-bone' : 'bg-charcoal text-ash'
                      }`}
                    >
                      Side-by-Side
                    </button>
                    <button
                      onClick={() => setSplitOrientation('horizontal')}
                      className={`flex-1 px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                        splitOrientation === 'horizontal' ? 'bg-cobalt text-bone' : 'bg-charcoal text-ash'
                      }`}
                    >
                      Top-to-Bottom
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] text-ash uppercase tracking-wider">Panels</span>
                  <div className="flex gap-2">
                    {[3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setSplitPanels(n)}
                        className={`flex-1 h-8 border font-mono text-xs flex items-center justify-center transition-colors rounded-sm ${
                          splitPanels === n
                            ? 'border-cobalt text-cobalt bg-cobalt/10'
                            : 'border-smoke text-ash hover:text-pearl'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {splitStyle === 'stepped' && (
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] text-ash uppercase tracking-wider">Panels</span>
                <div className="flex gap-2">
                  {[3, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setSplitPanels(n)}
                      className={`flex-1 h-8 border font-mono text-xs flex items-center justify-center transition-colors rounded-sm ${
                        (splitPanels === 5 ? 5 : 3) === n
                          ? 'border-cobalt text-cobalt bg-cobalt/10'
                          : 'border-smoke text-ash hover:text-pearl'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {splitStyle === 'grid' && (
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] text-ash uppercase tracking-wider">Format</span>
                <div className="flex border border-smoke rounded-sm overflow-hidden">
                  {[
                    { label: '2x2', cols: 2, rows: 2 },
                    { label: '3x2', cols: 3, rows: 2 },
                    { label: '3x3', cols: 3, rows: 3 },
                  ].map((opt) => {
                    const isActive = splitGridCols === opt.cols && splitGridRows === opt.rows;
                    return (
                      <button
                        key={opt.label}
                        onClick={() => setSplitGrid(opt.cols, opt.rows)}
                        className={`flex-1 px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors border-l first:border-l-0 border-smoke ${
                          isActive ? 'bg-cobalt text-bone' : 'bg-charcoal text-ash hover:text-pearl'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Device Selector (Skins Only) */}
        {product?.categorySlug === 'skins' && (
          <DeviceSelector 
            selectedDeviceId={selectedDeviceId} 
            onSelectDevice={setSelectedDevice} 
          />
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
