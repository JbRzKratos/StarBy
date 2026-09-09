'use client';

/**
 * ApparelCustomizer.desktop.tsx
 *
 * Desktop layout for the 2D apparel customizer (Regular Tee, Oversized Tee, Hoodie).
 * Layout: canvas (left 8 cols) + controls panel (right 4 cols).
 *
 * Device-isolated: this file is desktop-only. Mobile lives in ApparelCustomizer.mobile.tsx.
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
const TShirt3DViewer = dynamic(
  () => import('./TShirt3DViewer').then((m) => ({ default: m.TShirt3DViewer })),
  { ssr: false },
);

// Garments that support the 3D preview mode
const SUPPORTS_3D: GarmentType[] = ['tee', 'oversized-tee'];

// ── Garment type display labels ──────────────────────────────────────────────
const GARMENT_LABELS: Record<GarmentType, string> = {
  tee: 'Regular Tee',
  'oversized-tee': 'Oversized Tee',
  hoodie: 'Acid Wash Hoodie',
};

// ── Category slug → garment type mapping ────────────────────────────────────
function categoryToGarment(categorySlug?: string): GarmentType | null {
  if (!categorySlug) return null;
  if (categorySlug === 'tees') return 'tee';
  if (categorySlug === 'oversized-tees') return 'oversized-tee';
  if (categorySlug === 'hoodies') return 'hoodie';
  return null;
}

// ── Upload validation ────────────────────────────────────────────────────────
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
const MAX_FILE_MB = 20;

interface Props {
  productId: string;
}

export function ApparelCustomizerDesktop({ productId }: Props) {
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

  // Sync garment type from product category on mount
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
  const [isDragging, setIsDragging] = useState(false);
  const [isTransparentWarning, setIsTransparentWarning] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  // ── 3D / 2D preview mode (only available for tee / oversized-tee) ────────
  const supports3D = SUPPORTS_3D.includes(garment);
  const [previewMode, setPreviewMode] = useState<'2d' | '3d'>('2d');
  // If garment changes to one that doesn't support 3D, fall back to 2D
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

  // Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          void handleRedo();
        } else {
          void handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        void handleRedo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleUndo, handleRedo]);

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

  // ── Design controls from active transform ────────────────────────────────
  const transform = currentDesign?.transform;
  const opacity = transform?.opacity ?? 1;
  const scaleX = transform?.scaleX ?? 1;
  const angle = transform?.angle ?? 0;

  // Local opacity for the slider display — avoids Zustand writes during drag.
  // Zustand is only flushed on mouse-up via handleOpacityCommit.
  const [localOpacity, setLocalOpacity] = useState(opacity);
  // Keep localOpacity in sync when the store changes externally (e.g. switching views)
  useEffect(() => {
    setLocalOpacity(opacity);
  }, [opacity]);

  // Stable onTransformChange passed to ApparelCanvas.
  // MUST be memoised — an inline () => fn() creates a new reference every render,
  // which destabilises onFlushStore in the canvas and triggers an infinite
  // placeDesignImage loop (design gets removed + reloaded on every re-render).
  const handleTransformChange = useCallback(
    (t: DesignTransform) => updateTransform(view, t),
    [view, updateTransform],
  );

  // ── File upload handler ──────────────────────────────────────────────────
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

      // Warn if not PNG (transparency)
      if (file.type !== 'image/png' && file.type !== 'image/svg+xml') {
        setIsTransparentWarning(true);
      }

      try {
        const dataUrl = await fileToDataUrl(file);
        setDesignImage(view, dataUrl);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="pt-36 md:pt-40 pb-20 section-container">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <span className="font-mono text-caption text-cobalt uppercase tracking-widest block mb-2">
            {previewMode === '3d' ? '3D Preview' : 'Apparel Customizer'}
          </span>
          <h1 className="font-display text-[3.5rem] font-bold text-bone leading-none uppercase">
            {product?.name ?? GARMENT_LABELS[garment]}
          </h1>
        </div>
        {product && (
          <p className="font-mono text-pearl text-body-lg">From {formatPrice(product.basePrice)}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Canvas area ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-8">
          {/* ── Toolbar row: Front/Back toggle + 2D/3D mode toggle ─────────── */}
          <div className="flex items-center justify-between mb-3">
            {/* Front / Back (only relevant in 2D mode) */}
            <div className="flex border border-smoke rounded-sm overflow-hidden">
              {(['front', 'back'] as GarmentView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-6 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
                    view === v
                      ? 'bg-[#ED9518] text-charcoal font-semibold'
                      : 'bg-charcoal text-ash hover:text-pearl'
                  }`}
                >
                  {v === 'front' ? 'Front' : 'Back'}
                  {designsByView?.[v]?.imageUrl && (
                    <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[#ED9518] align-middle" />
                  )}
                </button>
              ))}
            </div>

            {/* 2D / 3D mode toggle (tee & oversized-tee only) */}
            {supports3D && (
              <div className="flex border border-smoke rounded-sm overflow-hidden">
                <button
                  id="apparel-toggle-2d"
                  onClick={() => setPreviewMode('2d')}
                  className={`flex items-center gap-1.5 px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
                    previewMode === '2d'
                      ? 'bg-cobalt/20 text-cobalt font-semibold border-r border-smoke'
                      : 'bg-charcoal text-ash hover:text-pearl border-r border-smoke'
                  }`}
                >
                  <svg
                    width="13"
                    height="13"
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
                  id="apparel-toggle-3d"
                  onClick={() => setPreviewMode('3d')}
                  className={`flex items-center gap-1.5 px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
                    previewMode === '3d'
                      ? 'bg-[#ED9518]/20 text-[#ED9518] font-semibold'
                      : 'bg-charcoal text-ash hover:text-pearl'
                  }`}
                >
                  <svg
                    width="13"
                    height="13"
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
          </div>

          {/* ── Canvas / 3D viewer ─────────────────────────────────────────── */}
          <div
            className="bg-[#1A1A1E] rounded-xl overflow-hidden border border-smoke/20 relative"
            style={{ minHeight: 480 }}
          >
            {/* 2D fabric.js canvas:
                Keep VISIBLE (not display:none) so fabric.js always has valid
                pixel dimensions. Hide with visibility+clip to prevent layout clash. */}
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

            {/* 3D preview — only mounted when mode is '3d' and garment supports it */}
            {previewMode === '3d' && supports3D && (
              <div className="absolute inset-0" style={{ height: 560 }}>
                <TShirt3DViewer colorHex={activeColor.hex} view={view} />
              </div>
            )}
          </div>

          {/* Placeholder asset notice (2D mode only) */}
          {previewMode === '2d' && !activeColor.mockupImage && (
            <p className="mt-2 font-mono text-[10px] text-amber-400/70 italic">
              ⚠ Color preview is approximate — final product matches your selection exactly.
            </p>
          )}

          {/* 3D mode hint */}
          {previewMode === '3d' && (
            <p className="mt-2 font-mono text-[10px] text-cobalt/70 italic">
              3D preview reflects your design and color — switch to 2D Edit to adjust placement.
            </p>
          )}
        </div>

        {/* ── Controls panel ───────────────────────────────────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Garment type selector (only show if product covers multiple types) */}
          {!product && (
            <div className="bg-graphite border border-smoke/30 p-5 rounded-lg">
              <h3 className="font-mono text-caption text-bone uppercase tracking-widest mb-3">
                Garment
              </h3>
              <div className="flex flex-col gap-2">
                {(Object.keys(GARMENT_LABELS) as GarmentType[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGarment(g)}
                    className={`px-4 py-2.5 text-left font-mono text-sm rounded-sm border transition-colors ${
                      garment === g
                        ? 'border-[#ED9518] text-[#ED9518] bg-[#ED9518]/10'
                        : 'border-smoke text-pearl hover:border-[#ED9518]/50'
                    }`}
                  >
                    {GARMENT_LABELS[g]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color swatches */}
          <div className="bg-graphite border border-smoke/30 p-5 rounded-lg">
            <h3 className="font-mono text-caption text-bone uppercase tracking-widest mb-3">
              Color — <span className="text-[#ED9518]">{activeColor.label}</span>
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {colorOptions.map((c) => (
                <button
                  key={c.id}
                  title={c.label}
                  onClick={() => setColor(c.id)}
                  className={`w-9 h-9 rounded-full border-2 transition-all ${
                    color === c.id
                      ? 'border-[#ED9518] scale-110 shadow-[0_0_0_2px_rgba(237,149,24,0.3)]'
                      : 'border-smoke/50 hover:border-smoke'
                  }`}
                  style={{ background: c.hex }}
                  aria-label={c.label}
                  aria-pressed={color === c.id}
                />
              ))}
            </div>
          </div>

          {/* Upload zone */}
          <div className="bg-graphite border border-smoke/30 p-5 rounded-lg">
            <h3 className="font-mono text-caption text-bone uppercase tracking-widest mb-3">
              Design
            </h3>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-[#ED9518] bg-[#ED9518]/5'
                  : 'border-smoke/50 hover:border-smoke'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handleFileInput}
              />
              <svg
                className="mx-auto mb-3 text-ash"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="font-mono text-xs text-pearl mb-1">
                {currentDesign?.imageUrl
                  ? 'Click to replace design'
                  : 'Drag & drop or click to upload'}
              </p>
              <p className="font-mono text-[10px] text-ash">PNG, SVG, JPG · Max {MAX_FILE_MB}MB</p>
            </div>

            {/* Inline errors & warnings — shown next to upload zone per spec */}
            {uploadError && (
              <p className="mt-2 font-mono text-xs text-red-400 flex items-start gap-1.5">
                <span>⚠</span>
                {uploadError}
              </p>
            )}
            {isTransparentWarning && !uploadError && (
              <p className="mt-2 font-mono text-[10px] text-amber-400/80">
                Tip: PNG with transparent background gives the best print result.
              </p>
            )}

            {/* Quick actions on existing design */}
            {currentDesign?.imageUrl && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-1.5 border border-smoke text-xs font-mono text-pearl hover:border-[#ED9518] hover:text-[#ED9518] rounded-sm transition-colors"
                >
                  Replace
                </button>
                <button
                  onClick={() => {
                    clearDesign(view);
                    setUploadError(null);
                    setIsTransparentWarning(false);
                  }}
                  className="flex-1 py-1.5 border border-smoke text-xs font-mono text-red-400 hover:border-red-400/60 rounded-sm transition-colors"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Design controls & UV Placement (only shown when a design is loaded) */}
          {currentDesign.imageUrl &&
            (previewMode === '3d' ? (
              <UVPlacementEditor
                view={view}
                colorHex={activeColor.hex}
                imageUrl={currentDesign.imageUrl}
                transform={currentDesign.transform}
                onChange={handleUVTransformChange}
              />
            ) : (
              <div className="bg-graphite border border-smoke/30 p-5 rounded-lg space-y-4">
                <h3 className="font-mono text-caption text-bone uppercase tracking-widest">
                  Controls
                </h3>

                {/* Opacity */}
                <div>
                  <div className="flex justify-between mb-1.5">
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
                    className="w-full accent-[#ED9518] h-1.5 rounded-full"
                  />
                </div>

                {/* Scale */}
                <div>
                  <div className="flex justify-between mb-1.5">
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
                    className="w-full accent-[#ED9518] h-1.5 rounded-full"
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
                      className="flex-1 py-1.5 border border-smoke rounded-sm font-mono text-xs text-pearl hover:border-[#ED9518] hover:text-[#ED9518] transition-colors"
                    >
                      ↺ -15°
                    </button>
                    <button
                      onClick={() => handleRotate(15)}
                      className="flex-1 py-1.5 border border-smoke rounded-sm font-mono text-xs text-pearl hover:border-[#ED9518] hover:text-[#ED9518] transition-colors"
                    >
                      ↻ +15°
                    </button>
                    <button
                      onClick={handleRotateReset}
                      className="px-3 py-1.5 border border-smoke rounded-sm font-mono text-xs text-ash hover:text-pearl transition-colors"
                      title="Reset rotation to 0°"
                    >
                      0°
                    </button>
                  </div>
                </div>

                {/* Position Quick Actions */}
                <div className="pt-1">
                  <button
                    onClick={handleCenter}
                    className="w-full py-1.5 border border-smoke/60 rounded-sm font-mono text-xs text-pearl hover:border-[#ED9518] hover:text-[#ED9518] transition-colors"
                  >
                    🎯 Center Design
                  </button>
                </div>
              </div>
            ))}

          {/* 3D mode: friendly empty state when no design is uploaded for active view */}
          {previewMode === '3d' && !currentDesign.imageUrl && (
            <div className="bg-graphite/80 border border-smoke/30 rounded-lg p-5 text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-smoke/20 flex items-center justify-center text-ash">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
              <p className="font-mono text-xs text-pearl mb-1">
                No design on {view === 'front' ? 'Front' : 'Back'} yet
              </p>
              <p className="font-mono text-[10px] text-ash/70 mb-3">
                Upload artwork to customize the {view} of the garment.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-[#ED9518]/20 hover:bg-[#ED9518]/30 border border-[#ED9518]/40 rounded font-mono text-xs text-[#ED9518] transition-colors"
              >
                Upload {view === 'front' ? 'Front' : 'Back'} Artwork
              </button>
            </div>
          )}

          {/* Size selector */}
          {product?.sizes && product.sizes.length > 0 && (
            <div className="bg-graphite border border-smoke/30 p-5 rounded-lg">
              <h3 className="font-mono text-caption text-bone uppercase tracking-widest mb-3">
                Size — <span className="text-[#ED9518]">{selectedSize}</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-[48px] px-3 py-2 border font-mono text-sm rounded-sm transition-colors ${
                      selectedSize === s
                        ? 'border-[#ED9518] text-[#ED9518] bg-[#ED9518]/10'
                        : 'border-smoke text-bone hover:border-[#ED9518]/50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Undo / Redo */}
          <div className="flex gap-2">
            <button
              onClick={() => void handleUndo()}
              disabled={!canUndo()}
              title="Undo (Ctrl+Z)"
              className="flex-1 py-2 border border-smoke rounded-sm font-mono text-xs text-pearl flex items-center justify-center gap-1.5 hover:border-[#ED9518] hover:text-[#ED9518] transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-smoke disabled:hover:text-pearl"
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
              title="Redo (Ctrl+Shift+Z)"
              className="flex-1 py-2 border border-smoke rounded-sm font-mono text-xs text-pearl flex items-center justify-center gap-1.5 hover:border-[#ED9518] hover:text-[#ED9518] transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-smoke disabled:hover:text-pearl"
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

          {/* Add to cart */}
          <button
            onClick={() => void handleAddToCart()}
            disabled={!currentDesign.imageUrl}
            className={`w-full py-4 font-mono text-sm uppercase tracking-widest rounded-sm transition-all ${
              currentDesign.imageUrl
                ? addedToCart
                  ? 'bg-green-500 text-charcoal'
                  : 'bg-[#ED9518] text-charcoal hover:bg-[#d4840f]'
                : 'bg-graphite text-ash border border-smoke/30 cursor-not-allowed'
            }`}
          >
            {addedToCart
              ? '✓ Added to Cart'
              : currentDesign.imageUrl
                ? 'Add to Cart'
                : 'Upload a Design First'}
          </button>

          {/* Print-ready export info */}
          <p className="font-mono text-[9px] text-ash/60 text-center leading-relaxed">
            Your design will be exported at 300 DPI for fulfillment. Both front and back designs are
            captured independently.
          </p>
        </div>
      </div>
    </div>
  );
}
