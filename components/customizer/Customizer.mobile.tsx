'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCustomizerStore } from '@/store/customizer';
import { getProductBySlug, products } from '@/data/products';
import { useCartStore } from '@/lib/stores/cart-store';
import { validateImage, fileToDataUrl } from '@/components/customizer-hub/CustomizerHub.shared';
import { usePrice } from '@/lib/hooks/usePrice';
import { DeviceSelector } from './DeviceSelector';
import { PrintStyleSelector } from './print-style-selector';
import { copyShareUrl } from '@/lib/utils/share-config';

// Dynamically import the canvas to avoid SSR issues
const CustomizerCanvas = dynamic(
  () => import('./customizer-canvas').then((m) => m.CustomizerCanvas),
  { ssr: false, loading: () => <div className="w-full h-[60vh] bg-graphite animate-pulse" /> },
);

const SIZE_DIMENSIONS: Record<string, string> = {
  A6: '10.5 × 14.8 cm (4.1" × 5.8")',
  A5: '14.8 × 21.0 cm (5.8" × 8.3")',
  A4: '21.0 × 29.7 cm (8.3" × 11.7")',
  A3: '29.7 × 42.0 cm (11.7" × 16.5")',
  '13x19': '33.0 × 48.3 cm (13.0" × 19.0")',
};

const getUploadInstructions = (categorySlug?: string) => {
  switch (categorySlug) {
    case 'split-posters':
      return {
        title: 'Upload Landscape Image for Split Poster *',
        note: 'Note: Upload only Landscape image for best split. Use the editing tool after upload to adjust.',
        subtext:
          '*For best results, upload a high-resolution horizontal (landscape) image. Low-quality images may affect print clarity.*',
      };
    case 'posters':
      return {
        title: 'Upload Image for Poster *',
        note: 'Note: Upload an image matching your poster orientation for best results.',
        subtext:
          '*For best results, upload a high-resolution image. Low-quality images may affect print clarity.*',
      };
    case 'skins':
      return {
        title: 'Upload Image for Device Skin *',
        note: 'Note: Ensure important subjects are centered. Edges may be cropped to fit the device shape.',
        subtext:
          '*For best results, upload a high-resolution image. Low-quality images may affect print clarity.*',
      };
    case 'hoodies':
    case 'tees':
      return {
        title: 'Upload Design for Apparel *',
        note: 'Note: For best results, use a high-resolution PNG with a transparent background.',
        subtext:
          '*For best results, upload a high-resolution image. Low-quality images may affect print clarity.*',
      };
    default:
      return {
        title: 'Upload Your Image *',
        note: 'Note: Use the editing tool after upload to adjust your design.',
        subtext:
          '*For best results, upload a high-resolution image. Low-quality images may affect print clarity.*',
      };
  }
};

export function CustomizerMobile({ productId }: { productId: string }) {
  const { uploadedImage, setUploadedImage, selectedDeviceId, setSelectedDevice } =
    useCustomizerStore();
  const { printStyle, setPrintStyle } = useCustomizerStore();
  const product = products.find((p) => p.id === productId) || getProductBySlug(productId);
  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setCartOpen);
  const { formatPrice } = usePrice();

  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>(product?.sizes?.[0] || 'M');
  const [selectedColor] = useState<string>('#0E0E0F');
  const [shareCopied, setShareCopied] = useState(false);
  const { loadFromShareHash } = useCustomizerStore();
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

  useEffect(() => {
    loadFromShareHash();
  }, [loadFromShareHash]);

  const handleShare = async () => {
    const copied = await copyShareUrl({
      splitStyle,
      splitOrientation,
      splitPanels,
      splitGridCols,
      splitGridRows,
      printStyle,
    });
    if (copied) {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

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
      {/* Canvas Area (Top) — height must match CustomizerCanvas h-[60vh] */}
      <div className="relative w-full h-[60vh] bg-graphite shrink-0">
        {!uploadedImage &&
          (() => {
            const instructions = getUploadInstructions(product?.categorySlug);
            return (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-graphite/90 backdrop-blur-sm border-2 border-dashed border-smoke m-4 rounded-lg p-4 text-center">
                <h3 className="font-display text-xl text-bone mb-2">Start Designing</h3>

                <div className="my-4 flex flex-col items-center max-w-sm">
                  <span className="text-[#FF4D4D] font-mono text-[11px] mb-3">
                    {instructions.title}
                  </span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-bone text-charcoal font-mono text-[10px] uppercase px-6 py-2.5 rounded-sm active:scale-95 transition-transform mb-4 w-full max-w-[200px]"
                  >
                    Upload Your Image
                  </button>
                  <p className="font-mono text-[9px] text-pearl mb-2 leading-relaxed">
                    {instructions.note}
                  </p>
                  <p className="font-mono text-[8px] text-ash italic leading-relaxed">
                    {instructions.subtext}
                  </p>
                </div>

                {error && <p className="text-[#FF4D4D] mt-2 font-mono text-[10px]">{error}</p>}
              </div>
            );
          })()}

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
          <div className="flex items-center gap-3">
            <p className="font-mono text-pearl">{formatPrice(product?.basePrice || 0)}</p>
            <button
              onClick={() => void handleShare()}
              className={`flex items-center gap-1.5 px-3 py-1.5 border font-mono text-[9px] uppercase tracking-widest transition-colors rounded-sm ${
                shareCopied ? 'border-cobalt bg-cobalt/10 text-cobalt' : 'border-smoke text-pearl'
              }`}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              {shareCopied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>

        {/* Sizing (if applicable) */}
        {product?.sizes && product.sizes.length > 0 && (
          <div>
            <h3 className="font-mono text-[10px] text-bone uppercase tracking-widest mb-3 flex items-center justify-between flex-wrap gap-1">
              <span>
                {product?.categorySlug === 'split-posters'
                  ? 'Each Panel Size'
                  : product?.categorySlug === 'posters'
                    ? 'Poster Size'
                    : 'Size'}{' '}
                — {selectedSize}
              </span>
              {SIZE_DIMENSIONS[selectedSize] && (
                <span className="text-[10px] text-pearl font-mono font-normal tracking-normal">
                  {SIZE_DIMENSIONS[selectedSize]}
                </span>
              )}
            </h3>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-[48px] px-3 py-2.5 h-11 flex items-center justify-center border font-mono text-sm transition-colors rounded-sm ${
                    selectedSize === size
                      ? 'border-cobalt text-cobalt bg-cobalt/10'
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
                    onClick={() => setSplitStyle(s as 'classic' | 'stepped' | 'grid')}
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
                  <span className="font-mono text-[10px] text-ash uppercase tracking-wider">
                    Orientation
                  </span>
                  <div className="flex border border-smoke rounded-sm overflow-hidden">
                    <button
                      onClick={() => setSplitOrientation('vertical')}
                      className={`flex-1 px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors border-r border-smoke ${
                        splitOrientation === 'vertical'
                          ? 'bg-cobalt text-bone'
                          : 'bg-charcoal text-ash'
                      }`}
                    >
                      Side-by-Side
                    </button>
                    <button
                      onClick={() => setSplitOrientation('horizontal')}
                      className={`flex-1 px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                        splitOrientation === 'horizontal'
                          ? 'bg-cobalt text-bone'
                          : 'bg-charcoal text-ash'
                      }`}
                    >
                      Top-to-Bottom
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] text-ash uppercase tracking-wider">
                    Panels
                  </span>
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
                <span className="font-mono text-[10px] text-ash uppercase tracking-wider">
                  Panels
                </span>
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
                <span className="font-mono text-[10px] text-ash uppercase tracking-wider">
                  Format
                </span>
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

        {/* Print Style Selector */}
        {uploadedImage && (
          <div className="px-4">
            <PrintStyleSelector value={printStyle} onChange={setPrintStyle} />
          </div>
        )}

        {/* Device Selector (Skins Only) */}
        {product?.categorySlug === 'skins' && (
          <DeviceSelector selectedDeviceId={selectedDeviceId} onSelectDevice={setSelectedDevice} />
        )}

        {/* Instructions */}
        {uploadedImage && (
          <p className="font-mono text-[10px] text-pearl bg-graphite p-4 border border-smoke/30 rounded-sm">
            Pinch to scale. Use two fingers to rotate. Drag to move.
          </p>
        )}
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pt-5 pb-[max(20px,env(safe-area-inset-bottom))] bg-charcoal/90 backdrop-blur-md border-t border-smoke/20 z-50">
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
