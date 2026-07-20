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
  {
    ssr: false,
    loading: () => <div className="w-full h-[700px] bg-graphite animate-pulse rounded-lg" />,
  },
);

export function CustomizerDesktop({ productId }: { productId: string }) {
  const { uploadedImage, setUploadedImage, selectedDeviceId, setSelectedDevice } = useCustomizerStore();
  const product = products.find((p) => p.id === productId) || getProductBySlug(productId);
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setCartOpen);

  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>(product?.sizes?.[0] || 'M');
  const [selectedColor, setSelectedColor] = useState<string>('#0E0E0F');
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
    <div className="pt-36 md:pt-40 pb-20 section-container">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <span className="font-mono text-caption text-cobalt uppercase tracking-widest block mb-2">
            Live Customizer
          </span>
          <h1 className="font-display text-[4rem] font-bold text-bone leading-none uppercase">
            {product?.name || 'Design Studio'}
          </h1>
        </div>
        {product && <p className="font-mono text-pearl text-body-lg">From ₹{product.basePrice}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Canvas Area (left) */}
        <div className="lg:col-span-8 bg-charcoal/50 rounded-xl overflow-hidden relative">
          {!uploadedImage && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-graphite/90 backdrop-blur-sm border-2 border-dashed border-smoke m-4 rounded-lg">
              <h3 className="font-display text-2xl text-bone mb-2">Start Designing</h3>
              <p className="font-mono text-pearl mb-6">
                Upload an image to place it on the {product?.name}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-bone text-charcoal font-mono text-caption uppercase px-8 py-3 hover:bg-cobalt hover:text-bone transition-colors"
              >
                Upload Image
              </button>
              {error && <p className="text-red-400 mt-4 font-mono text-sm">{error}</p>}
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

        {/* Tools Area (right) */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Device Selector (Skins Only) */}
          {product?.categorySlug === 'skins' && (
            <DeviceSelector 
              selectedDeviceId={selectedDeviceId} 
              onSelectDevice={setSelectedDevice} 
            />
          )}



          {/* Sizing (if applicable) */}
          {product?.sizes && product.sizes.length > 0 && (
            <div className="bg-graphite border border-smoke/30 p-6 rounded-lg">
              <h3 className="font-mono text-caption text-bone uppercase tracking-widest mb-4">
                Size
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 flex items-center justify-center border font-mono text-sm transition-colors ${
                      selectedSize === size
                        ? 'border-cobalt text-cobalt'
                        : 'border-smoke text-bone hover:border-cobalt hover:text-cobalt'
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
            <div className="bg-graphite border border-smoke/30 p-6 rounded-lg flex flex-col gap-5">
              <h3 className="font-mono text-caption text-bone uppercase tracking-widest">
                Split Configuration
              </h3>
              
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] text-ash uppercase tracking-wider">Style</span>
                <div className="flex border border-smoke rounded-sm overflow-hidden">
                  {['classic', 'stepped', 'grid'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSplitStyle(s as any)}
                      className={`flex-1 px-2 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
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
                  <div className="flex flex-col gap-2">
                    <span className="font-mono text-[10px] text-ash uppercase tracking-wider">Orientation</span>
                    <div className="flex border border-smoke rounded-sm overflow-hidden">
                      <button
                        onClick={() => setSplitOrientation('vertical')}
                        className={`flex-1 px-2 py-2 font-mono text-xs uppercase tracking-wider transition-colors border-r border-smoke ${
                          splitOrientation === 'vertical' ? 'bg-cobalt text-bone' : 'bg-charcoal text-ash'
                        }`}
                      >
                        Side-by-Side
                      </button>
                      <button
                        onClick={() => setSplitOrientation('horizontal')}
                        className={`flex-1 px-2 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                          splitOrientation === 'horizontal' ? 'bg-cobalt text-bone' : 'bg-charcoal text-ash'
                        }`}
                      >
                        Top-to-Bottom
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="font-mono text-[10px] text-ash uppercase tracking-wider">Panels</span>
                    <div className="flex gap-2">
                      {[3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setSplitPanels(n)}
                          className={`w-10 h-10 border font-mono text-sm flex items-center justify-center transition-colors rounded-sm ${
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
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] text-ash uppercase tracking-wider">Panels</span>
                  <div className="flex gap-2">
                    {[3, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setSplitPanels(n)}
                        className={`w-10 h-10 border font-mono text-sm flex items-center justify-center transition-colors rounded-sm ${
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
                <div className="flex flex-col gap-2">
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
                          className={`flex-1 px-2 py-2 font-mono text-xs uppercase tracking-wider transition-colors border-l first:border-l-0 border-smoke ${
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

          {/* Design Controls */}
          {uploadedImage && (
            <div className="bg-graphite border border-smoke/30 p-6 rounded-lg">
              <h3 className="font-mono text-caption text-bone uppercase tracking-widest mb-4">
                Design Adjustments
              </h3>
              <p className="font-mono text-caption text-pearl mb-4 leading-relaxed">
                Use your mouse to drag the image within the print area. Drag the corners to scale or
                rotate your design.
              </p>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 border border-smoke text-bone py-3 font-mono text-caption uppercase hover:bg-smoke/20 transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Replace Image
              </button>
            </div>
          )}

          {/* Add to Cart */}
          <div className="mt-auto">
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
              className={`w-full font-mono text-caption uppercase py-5 tracking-widest transition-colors flex justify-between px-6 ${
                uploadedImage
                  ? 'bg-cobalt text-bone hover:bg-cobalt/90'
                  : 'bg-smoke/20 text-bone/50 cursor-not-allowed'
              }`}
            >
              <span>Add to Cart</span>
              <span>₹{product?.basePrice || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
