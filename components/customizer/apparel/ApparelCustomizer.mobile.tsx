'use client';

/**
 * ApparelCustomizer.mobile.tsx
 *
 * Mobile layout for the 2D apparel customizer.
 * Layout: full-width canvas stacked above a collapsible bottom-sheet controls panel.
 *
 * fabric.js 5.x natively supports touch events (drag, pinch-to-scale, two-finger rotate)
 * on mobile — no Hammer.js needed. We enable these via canvas touch gesture options.
 *
 * Device-isolated: this file is mobile-only. Desktop lives in ApparelCustomizer.desktop.tsx.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  useApparelCustomizerStore,
  type GarmentType,
  type DesignTransform,
} from '@/lib/stores/apparel-customizer-store';
import { useApparelHistoryStore } from '@/lib/stores/apparel-history-store';
import {
  GARMENT_COLORS,
  type GarmentView,
  type GarmentColor,
  getPrintAreaConfig,
} from '@/data/printAreaConfig';
import { useCartStore } from '@/lib/stores/cart-store';
import { useCustomizerStore } from '@/store/customizer';
import { usePrice } from '@/lib/hooks/usePrice';
import { products, getProductBySlug } from '@/data/products';
import { validateImage, fileToDataUrl } from '@/components/customizer-hub/CustomizerHub.shared';
import { ApparelCanvas, type ApparelCanvasHandle } from '../apparel-canvas';
import { UVPlacementEditor } from './UVPlacementEditor';

// ── 3D viewer — dynamically imported to avoid SSR/WebGL issues ───────────────
const TShirt3DViewer = dynamic(() => import('./TShirt3DViewer').then((m) => m.TShirt3DViewer), {
  ssr: false,
});

// Garments that support the 3D preview mode
const SUPPORTS_3D: GarmentType[] = ['tee', 'oversized-tee'];

const GARMENT_LABELS: Record<GarmentType, string> = {
  tee: 'Regular Tee',
  'oversized-tee': 'Oversized Tee',
  hoodie: 'Hoodie',
};

function categoryToGarment(categorySlug?: string): GarmentType | null {
  if (categorySlug === 'tees') return 'tee';
  if (categorySlug === 'oversized-tees') return 'oversized-tee';
  if (categorySlug === 'hoodies') return 'hoodie';
  return null;
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
const MAX_FILE_MB = 20;

type SheetTab = 'color' | 'design' | 'controls';

interface Props {
  productId: string;
}

export function ApparelCustomizerMobile({ productId }: Props) {
  const product = products.find((p) => p.id === productId) || getProductBySlug(productId);
  const garmentFromCategory = categoryToGarment(product?.categorySlug) ?? 'tee';

  const {
    garment,
    color,
    view,
    setGarment,
    setColor,
    setView,
    setDesignImage,
    updateTransform,
    clearDesign,
    designsByView,
  } = useApparelCustomizerStore();

  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useCartStore((s) => s.setCartOpen);
  const { formatPrice } = usePrice();

  const studioImage = useCustomizerStore((s) => s.uploadedImage);

  useEffect(() => {
    setGarment(garmentFromCategory);
    if (studioImage && !designsByView?.front?.imageUrl) {
      const img = new Image();
      img.src = studioImage;
      img.onload = () => {
        setDesignImage('front', studioImage, img.width, img.height);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garmentFromCategory, studioImage]);

  const [selectedSize, setSelectedSize] = useState<string>(product?.sizes?.[0] ?? 'M');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isTransparentWarning, setIsTransparentWarning] = useState(false);
  const [activeTab, setActiveTab] = useState<SheetTab>('color');
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  // ── 3D / 2D preview mode (only available for tee / oversized-tee) ────────
  const supports3D = SUPPORTS_3D.includes(garment);
  const [previewMode, setPreviewMode] = useState<'2d' | '3d'>('2d');
  useEffect(() => {
    if (!supports3D) setPreviewMode('2d');
  }, [supports3D]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<ApparelCanvasHandle>(null);

  // ── Undo / Redo ──────────────────────────────────────────────────────────
  const { undo, redo, canUndo, canRedo } = useApparelHistoryStore();

  const handleUndo = useCallback(async () => {
    const snapshot = undo();
    if (snapshot) await canvasRef.current?.loadFromSnapshot(snapshot);
  }, [undo]);

  const handleRedo = useCallback(async () => {
    const snapshot = redo();
    if (snapshot) await canvasRef.current?.loadFromSnapshot(snapshot);
  }, [redo]);

  const currentDesign = designsByView?.[view] ?? { imageUrl: null, transform: null };
  const colorOptions: GarmentColor[] = useMemo(
    () => GARMENT_COLORS[garment]?.[view] ?? [],
    [garment, view],
  );
  const activeColor: GarmentColor = useMemo(
    () =>
      colorOptions.find((c) => c.id === color) ??
      colorOptions[0] ?? {
        id: 'black',
        label: 'Black',
        hex: '#000000',
        mockupImage: `/images/mockups/tee-black-${view}.png`,
      },
    [colorOptions, color, view],
  );
  const transform = currentDesign?.transform;
  const opacity = transform?.opacity ?? 1;
  const angle = transform?.angle ?? 0;

  // Local opacity for display — avoids Zustand writes during drag
  const [localOpacity, setLocalOpacity] = useState(opacity);
  useEffect(() => {
    setLocalOpacity(opacity);
  }, [opacity]);

  // Stable onTransformChange — must be memoised to prevent infinite design-reload loop
  const handleTransformChange = useCallback(
    (t: DesignTransform) => updateTransform(view, t),
    [view, updateTransform],
  );

  // ── File upload ──────────────────────────────────────────────────────────
  const processFile = useCallback(
    async (file: File) => {
      setUploadError(null);
      setIsTransparentWarning(false);
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError('Only PNG, JPG, or SVG files are accepted.');
        return;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setUploadError(`File must be under ${MAX_FILE_MB}MB.`);
        return;
      }
      const validation = validateImage(file);
      if (!validation.valid) {
        setUploadError(validation.error ?? 'Invalid file.');
        return;
      }
      if (file.type !== 'image/png' && file.type !== 'image/svg+xml') {
        setIsTransparentWarning(true);
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        setDesignImage(view, dataUrl);
        setActiveTab('controls');
        setSheetExpanded(true);
      } catch {
        setUploadError('Failed to read file. Please try again.');
      }
    },
    [view, setDesignImage],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Target object helper ──────────────────────────────────────────────────
  const getTargetObject = useCallback(() => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const active = (canvas as any).getActiveObject();
    if (active) return { canvas, obj: active };
    const designObj = canvasRef.current?.getDesignObject();
    if (designObj) return { canvas, obj: designObj };
    return null;
  }, []);

  // ── Scale control ────────────────────────────────────────────────────────
  const scaleX = currentDesign.transform?.scaleX ?? 1;
  const [localScale, setLocalScale] = useState(scaleX);
  useEffect(() => {
    setLocalScale(scaleX);
  }, [scaleX]);

  const handleScaleChange = (val: number) => {
    setLocalScale(val);
    const target = getTargetObject();
    if (target) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      target.obj.set({ scaleX: val, scaleY: val });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      (target.canvas as any).renderAll();
    }
  };

  const handleScaleCommit = (val: number) => {
    const target = getTargetObject();
    if (target) {
      updateTransform(view, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        x: target.obj.left as number,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        y: target.obj.top as number,
        scaleX: val,
        scaleY: val,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        angle: target.obj.angle as number,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        opacity: target.obj.opacity as number,
      });
    } else {
      updateTransform(view, { scaleX: val, scaleY: val });
    }
  };

  // ── Opacity control ──────────────────────────────────────────────────────
  const handleOpacityChange = (val: number) => {
    setLocalOpacity(val);
    const target = getTargetObject();
    if (target) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      target.obj.set({ opacity: val });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      (target.canvas as any).renderAll();
    }
  };

  const handleOpacityCommit = (val: number) => {
    const target = getTargetObject();
    if (target) {
      updateTransform(view, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        x: target.obj.left as number,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        y: target.obj.top as number,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        scaleX: target.obj.scaleX as number,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        scaleY: target.obj.scaleY as number,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        angle: target.obj.angle as number,
        opacity: val,
      });
    } else {
      updateTransform(view, { opacity: val });
    }
  };

  // ── Rotate control ───────────────────────────────────────────────────────
  const handleRotate = (delta: number) => {
    const target = getTargetObject();
    if (!target) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const currentAngle = (target.obj.angle as number) || 0;
    const newAngle = Math.round((currentAngle + delta + 360) % 360);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    target.obj.set({ angle: newAngle });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (target.canvas as any).renderAll();
    updateTransform(view, {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      x: target.obj.left as number,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      y: target.obj.top as number,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      scaleX: target.obj.scaleX as number,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      scaleY: target.obj.scaleY as number,
      angle: newAngle,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      opacity: target.obj.opacity as number,
    });
  };

  const handleRotateReset = () => {
    const target = getTargetObject();
    if (!target) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    target.obj.set({ angle: 0 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (target.canvas as any).renderAll();
    updateTransform(view, {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      x: target.obj.left as number,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      y: target.obj.top as number,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      scaleX: target.obj.scaleX as number,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      scaleY: target.obj.scaleY as number,
      angle: 0,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      opacity: target.obj.opacity as number,
    });
  };

  // ── Center control ───────────────────────────────────────────────────────
  const handleCenter = () => {
    const target = getTargetObject();
    if (!target) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const containerW = (target.canvas.width as number) || 480;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const containerH = (target.canvas.height as number) || 576;
    const centerX = containerW / 2;
    const centerY = containerH / 2;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    target.obj.set({ left: centerX, top: centerY });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (target.canvas as any).renderAll();
    updateTransform(view, {
      x: centerX,
      y: centerY,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      scaleX: target.obj.scaleX as number,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      scaleY: target.obj.scaleY as number,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      angle: target.obj.angle as number,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      opacity: target.obj.opacity as number,
    });
  };

  // ── UV Placement & Reposition handler (3D mode sync) ───────────────────────
  const handleUVTransformChange = useCallback(
    (t: Partial<DesignTransform>) => {
      updateTransform(view, t);
      const target = getTargetObject();
      if (target) {
        if (t.scaleX !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          target.obj.set({ scaleX: t.scaleX, scaleY: t.scaleX });
        }
        if (t.angle !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          target.obj.set({ angle: t.angle });
        }
        if (t.opacity !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          target.obj.set({ opacity: t.opacity });
        }
        if (t.normX !== undefined || t.normY !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const containerW = (target.canvas.width as number) || 480;
          const scaleFactor = containerW / 1000;
          const config = getPrintAreaConfig(garment, view);
          const paCenterX = (config.printArea.x + config.printArea.width / 2) * scaleFactor;
          const paCenterY = (config.printArea.y + config.printArea.height / 2) * scaleFactor;
          const paHalfW = (config.printArea.width / 2) * scaleFactor;
          const paHalfH = (config.printArea.height / 2) * scaleFactor;
          const nX = t.normX ?? currentDesign.transform?.normX ?? 0;
          const nY = t.normY ?? currentDesign.transform?.normY ?? 0;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          target.obj.set({
            left: paCenterX + nX * paHalfW,
            top: paCenterY + nY * paHalfH,
          });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        (target.canvas as any).renderAll();
      }
    },
    [view, updateTransform, getTargetObject, garment, currentDesign.transform],
  );

  // ── Add to cart ──────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(async () => {
    if (!product) return;
    const thumbnail = canvasRef.current?.exportThumbnail() ?? '';
    const variant = product.variants[0];
    addItem({
      productId: product.id,
      variantId: variant?.id ?? '',
      name: product.name,
      variant: `${activeColor.label} / ${selectedSize}`,
      price: variant?.price ?? product.basePrice,
      quantity: 1,
      image: thumbnail || product.variants[0]?.images?.[0] || '',
      size: selectedSize,
      customization: {
        // Required CartCustomization base fields
        color,
        text: '',
        textFont: '',
        imageUrl: currentDesign?.imageUrl ?? null,
        // Apparel-specific fields
        thumbnail,
        garment,
        view,
        designFront: designsByView?.front?.imageUrl ?? undefined,
        designBack: designsByView?.back?.imageUrl ?? undefined,
      },
    });
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
      setCartOpen(true);
    }, 800);
  }, [
    product,
    garment,
    color,
    view,
    selectedSize,
    activeColor,
    designsByView,
    addItem,
    setCartOpen,
    currentDesign?.imageUrl,
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-charcoal pt-20 pb-4">
      {/* Root unconditionally mounted file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".png,.jpg,.jpeg,.svg"
        onChange={handleFileInput}
      />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <span className="font-mono text-[9px] text-cobalt uppercase tracking-widest block">
            {previewMode === '3d' ? '3D Preview' : 'Customizer'}
          </span>
          <h1 className="font-display text-xl font-bold text-bone leading-tight">
            {product?.name ?? GARMENT_LABELS[garment]}
          </h1>
        </div>
        {product && (
          <p className="font-mono text-pearl text-sm">{formatPrice(product.basePrice)}</p>
        )}
      </div>

      {/* ── Front / Back toggle ─────────────────────────────────────────────── */}
      <div className="px-4 mb-2 flex">
        {(['front', 'back'] as GarmentView[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-2 font-mono text-xs uppercase tracking-widest border transition-colors ${
              v === 'front' ? 'rounded-l-sm border-r-0' : 'rounded-r-sm'
            } ${
              view === v
                ? 'bg-[#ED9518] border-[#ED9518] text-charcoal font-semibold'
                : 'bg-charcoal border-smoke text-ash'
            }`}
          >
            {v === 'front' ? 'Front' : 'Back'}
            {designsByView?.[v]?.imageUrl && (
              <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-[#ED9518] align-middle" />
            )}
          </button>
        ))}
      </div>

      {/* ── Canvas ─────────────────────────────────────────────────────────── */}
      <div className="px-4">
        {/* 2D / 3D toggle pill (tee & oversized-tee only) */}
        {supports3D && (
          <div className="flex mb-2 border border-smoke rounded-sm overflow-hidden">
            <button
              id="mobile-apparel-toggle-2d"
              onClick={() => setPreviewMode('2d')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors border-r border-smoke ${
                previewMode === '2d'
                  ? 'bg-cobalt/20 text-cobalt font-semibold'
                  : 'bg-charcoal text-ash'
              }`}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              2D Edit
            </button>
            <button
              id="mobile-apparel-toggle-3d"
              onClick={() => setPreviewMode('3d')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                previewMode === '3d'
                  ? 'bg-[#ED9518]/20 text-[#ED9518] font-semibold'
                  : 'bg-charcoal text-ash'
              }`}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              3D Preview
            </button>
          </div>
        )}

        <div
          className="bg-[#1A1A1E] rounded-xl overflow-hidden border border-smoke/20 relative"
          style={{ minHeight: 340 }}
        >
          {/* 2D canvas — keep alive with visibility, not display:none, so fabric.js
              always has valid pixel dimensions (prevents black canvas on view switch) */}
          <div
            style={
              previewMode === '3d'
                ? {
                    visibility: 'hidden',
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                  }
                : {}
            }
          >
            <ApparelCanvas
              ref={canvasRef}
              garment={garment}
              view={view}
              color={activeColor}
              designImageUrl={currentDesign?.imageUrl ?? null}
              onTransformChange={handleTransformChange}
            />
          </div>

          {/* 3D preview */}
          {previewMode === '3d' && supports3D && (
            <div className="absolute inset-0">
              <TShirt3DViewer colorHex={activeColor.hex} view={view} />
            </div>
          )}
        </div>

        {previewMode === '2d' && !currentDesign?.imageUrl && (
          <button
            onClick={() => {
              setActiveTab('design');
              setSheetExpanded(true);
              fileInputRef.current?.click();
            }}
            className="mt-3 w-full py-3 border-2 border-dashed border-smoke/50 rounded-lg font-mono text-xs text-ash text-center"
          >
            ↑ Tap to upload your design
          </button>
        )}
        {previewMode === '2d' && !activeColor.mockupImage && (
          <p className="mt-1.5 font-mono text-[9px] text-amber-400/70 italic text-center">
            ⚠ Color preview is approximate
          </p>
        )}
        {previewMode === '3d' && (
          <p className="mt-1.5 font-mono text-[9px] text-cobalt/70 italic text-center">
            Switch to 2D Edit to adjust your design placement.
          </p>
        )}
      </div>

      {/* ── Bottom sheet ───────────────────────────────────────────────────── */}
      <div
        className={`mt-4 mx-4 bg-graphite border border-smoke/30 rounded-xl overflow-hidden transition-all duration-300 ${
          sheetExpanded ? 'max-h-[600px]' : 'max-h-[52px]'
        }`}
      >
        {/* Tab bar */}
        <div className="flex border-b border-smoke/20">
          {(['color', 'design', 'controls'] as SheetTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSheetExpanded(true);
              }}
              className={`flex-1 py-3 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                activeTab === tab && sheetExpanded
                  ? 'text-[#ED9518] border-b-2 border-[#ED9518]'
                  : 'text-ash'
              }`}
            >
              {tab === 'color' ? '🎨 Color' : tab === 'design' ? '📤 Design' : '⚙ Controls'}
            </button>
          ))}
          <button
            onClick={() => setSheetExpanded(!sheetExpanded)}
            className="px-4 text-ash"
            aria-label={sheetExpanded ? 'Collapse controls' : 'Expand controls'}
          >
            {sheetExpanded ? '▾' : '▸'}
          </button>
        </div>

        {/* Sheet content */}
        <div className="p-4 overflow-y-auto max-h-[540px]">
          {/* Color tab */}
          {activeTab === 'color' && (
            <div>
              <p className="font-mono text-[10px] text-ash mb-3 uppercase tracking-wider">
                Selected: <span className="text-[#ED9518]">{activeColor.label}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                {colorOptions.map((c) => (
                  <button
                    key={c.id}
                    title={c.label}
                    onClick={() => setColor(c.id)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      color === c.id
                        ? 'border-[#ED9518] scale-110 shadow-[0_0_0_3px_rgba(237,149,24,0.3)]'
                        : 'border-smoke/40'
                    }`}
                    style={{ background: c.hex }}
                    aria-label={c.label}
                    aria-pressed={color === c.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Design tab */}
          {activeTab === 'design' && (
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-smoke/50 rounded-lg font-mono text-xs text-pearl mb-3 hover:border-[#ED9518]/50 transition-colors"
              >
                {currentDesign?.imageUrl ? '📁 Replace Design' : '📤 Upload PNG / SVG / JPG'}
              </button>
              {uploadError && (
                <p className="font-mono text-xs text-red-400 mb-2">⚠ {uploadError}</p>
              )}
              {isTransparentWarning && !uploadError && (
                <p className="font-mono text-[10px] text-amber-400/80 mb-2">
                  Tip: PNG with transparent background gives the best print result.
                </p>
              )}
              {currentDesign?.imageUrl && (
                <button
                  onClick={() => {
                    clearDesign(view);
                    setUploadError(null);
                    setIsTransparentWarning(false);
                  }}
                  className="w-full py-2 border border-smoke rounded-sm font-mono text-xs text-red-400"
                >
                  Remove Design
                </button>
              )}

              {/* Size selector */}
              {product?.sizes && product.sizes.length > 0 && (
                <div className="mt-4">
                  <p className="font-mono text-[10px] text-ash uppercase tracking-wider mb-2">
                    Size — <span className="text-[#ED9518]">{selectedSize}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`px-4 py-2 border font-mono text-sm rounded-sm transition-colors ${
                          selectedSize === s
                            ? 'border-[#ED9518] text-[#ED9518] bg-[#ED9518]/10'
                            : 'border-smoke text-bone'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Controls tab */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              {!currentDesign.imageUrl ? (
                <p className="font-mono text-xs text-ash italic text-center py-4">
                  Upload a design to access controls.
                </p>
              ) : previewMode === '3d' ? (
                <UVPlacementEditor
                  view={view}
                  colorHex={activeColor.hex}
                  imageUrl={currentDesign.imageUrl}
                  transform={currentDesign.transform}
                  onChange={handleUVTransformChange}
                />
              ) : (
                <>
                  {/* Opacity */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-mono text-[10px] text-ash uppercase tracking-wider">
                        Opacity
                      </span>
                      <span className="font-mono text-[10px] text-pearl">
                        {Math.round(localOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.01}
                      value={localOpacity}
                      onChange={(e) => handleOpacityChange(Number(e.target.value))}
                      onMouseUp={(e) =>
                        handleOpacityCommit(Number((e.target as HTMLInputElement).value))
                      }
                      onTouchEnd={(e) =>
                        handleOpacityCommit(Number((e.target as HTMLInputElement).value))
                      }
                      className="w-full accent-[#ED9518] h-2 rounded-full"
                    />
                  </div>

                  {/* Scale */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-mono text-[10px] text-ash uppercase tracking-wider">
                        Scale
                      </span>
                      <span className="font-mono text-[10px] text-pearl">
                        {Math.round(localScale * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={1.5}
                      step={0.01}
                      value={localScale}
                      onChange={(e) => handleScaleChange(Number(e.target.value))}
                      onMouseUp={(e) =>
                        handleScaleCommit(Number((e.target as HTMLInputElement).value))
                      }
                      onTouchEnd={(e) =>
                        handleScaleCommit(Number((e.target as HTMLInputElement).value))
                      }
                      className="w-full accent-[#ED9518] h-2 rounded-full"
                    />
                  </div>

                  {/* Rotate */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-mono text-[10px] text-ash uppercase tracking-wider">
                        Rotate
                      </span>
                      <span className="font-mono text-[10px] text-pearl">{Math.round(angle)}°</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRotate(-15)}
                        className="flex-1 py-2.5 border border-smoke rounded-sm font-mono text-sm text-pearl"
                      >
                        ↺ -15°
                      </button>
                      <button
                        onClick={() => handleRotate(15)}
                        className="flex-1 py-2.5 border border-smoke rounded-sm font-mono text-sm text-pearl"
                      >
                        ↻ +15°
                      </button>
                      <button
                        onClick={handleRotateReset}
                        className="px-3 py-2.5 border border-smoke rounded-sm font-mono text-sm text-ash"
                      >
                        0°
                      </button>
                    </div>
                  </div>

                  {/* Center button */}
                  <div>
                    <button
                      onClick={handleCenter}
                      className="w-full py-2.5 border border-smoke/60 rounded-sm font-mono text-xs text-pearl"
                    >
                      🎯 Center Design
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => {
                      clearDesign(view);
                      setActiveTab('design');
                    }}
                    className="w-full py-2 border border-smoke rounded-sm font-mono text-xs text-red-400"
                  >
                    Remove Design
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Undo / Redo ─────────────────────────────────────────────── */}
      <div className="px-4 mt-3 flex gap-2">
        <button
          onClick={() => void handleUndo()}
          disabled={!canUndo()}
          className="flex-1 py-3 border border-smoke rounded-sm font-mono text-xs text-pearl flex items-center justify-center gap-1.5 hover:border-[#ED9518] hover:text-[#ED9518] transition-colors active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
          Undo
        </button>
        <button
          onClick={() => void handleRedo()}
          disabled={!canRedo()}
          className="flex-1 py-3 border border-smoke rounded-sm font-mono text-xs text-pearl flex items-center justify-center gap-1.5 hover:border-[#ED9518] hover:text-[#ED9518] transition-colors active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
          </svg>
          Redo
        </button>
      </div>

      {/* ── Add to cart (sticky bottom) ─────────────────────────────────── */}
      <div className="px-4 mt-4">
        <button
          onClick={() => void handleAddToCart()}
          disabled={!currentDesign.imageUrl}
          className={`w-full py-4 font-mono text-sm uppercase tracking-widest rounded-sm transition-all ${
            currentDesign.imageUrl
              ? addedToCart
                ? 'bg-green-500 text-charcoal'
                : 'bg-[#ED9518] text-charcoal'
              : 'bg-graphite text-ash border border-smoke/30 cursor-not-allowed'
          }`}
        >
          {addedToCart
            ? '✓ Added to Cart'
            : currentDesign.imageUrl
              ? 'Add to Cart'
              : 'Upload Design First'}
        </button>
      </div>
    </div>
  );
}
