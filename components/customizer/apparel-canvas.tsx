'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/**
 * apparel-canvas.tsx
 *
 * 2D garment customizer canvas using fabric.js 5.x (CDN loaded, SSR disabled).
 *
 * ROOT CAUSE FIXES (2026-08):
 *
 *  1. BASE64 / DATA URL — crossOrigin BUG
 *     fabric.Image.fromURL(url, cb, { crossOrigin: 'anonymous' }) causes silent
 *     failure for data: URLs in Chrome/Firefox. crossOrigin MUST be omitted for
 *     data: URLs. We now detect the URL scheme and only pass crossOrigin for
 *     actual http(s) remote URLs.
 *     Reference: https://github.com/fabricjs/fabric.js/issues/6965
 *
 *  2. COLOR TINTING — wrong base mockup
 *     Colors without a real flat-shot image were falling back to the BLACK
 *     garment base, which cannot be tinted (black × any color = black via
 *     CSS multiply). Fix: NEUTRAL_BASE_MOCKUP (used as tinting base) now
 *     always points to the WHITE garment mockup. The white shirt tints
 *     correctly: white × color = color.
 *
 *  3. TIMING RACE — async canvas init vs design upload
 *     Canvas init (loadFabric → new fabric.Canvas) is async. If the user
 *     uploads an image before init completes, fabricRef.current is null and
 *     the design image effect bails out silently. Fix: after init, immediately
 *     check for any pending designImageUrl and load it inside the init callback.
 *
 *  4. STUTTER — transform sync to Zustand at 60fps
 *     Moving/scaling events fired updateTransform() (Zustand set()) on every
 *     animation frame, causing 60 full re-renders per second. Fix: local ref
 *     accumulates during drag, Zustand flushed once on 'modified' (mouse-up).
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { getPrintAreaConfig } from '@/data/printAreaConfig';
import type { GarmentType, GarmentView, GarmentColor } from '@/data/printAreaConfig';
import { useApparelCustomizerStore } from '@/lib/stores/apparel-customizer-store';
import type { DesignTransform } from '@/lib/stores/apparel-customizer-store';
import { useApparelHistoryStore } from '@/lib/stores/apparel-history-store';

export const CANVAS_REF_WIDTH = 1000;
export const CANVAS_REF_HEIGHT = 1200;

export interface ApparelCanvasHandle {
  getCanvas: () => any;
  getDesignObject: () => any;
  exportThumbnail: () => string;
  /** Restore canvas from a JSON snapshot (used by undo/redo) */
  loadFromSnapshot: (json: string) => Promise<void>;
}

export interface ApparelCanvasProps {
  garment: GarmentType;
  view: GarmentView;
  color: GarmentColor;
  designImageUrl: string | null;
  onTransformChange?: (t: DesignTransform) => void;
}

// ── White-base mockup for CSS multiply colour tinting ────────────────────────
// WHITE is the tinting base: white × color.hex = color.hex (via mix-blend-mode multiply).
// Black × any color = black, so the black shirt cannot be used as a tinting base.
const WHITE_BASE_MOCKUP: Record<GarmentType, Record<GarmentView, string>> = {
  tee: {
    front: '/images/mockups/tee-white-front.png',
    back: '/images/mockups/tee-white-back.png',
  },
  'oversized-tee': {
    front: '/images/mockups/oversized-tee-white-front.png',
    // back not yet available — fall back to front (print area is similar)
    back: '/images/mockups/oversized-tee-white-front.png',
  },
  hoodie: {
    front: '/images/mockups/hoodie-white-front.png',
    // back not yet available — fall back to white front for correct tinting
    back: '/images/mockups/hoodie-white-front.png',
  },
};

// ── Fabric.js CDN loader (singleton promise) ─────────────────────────────────
let _fabricPromise: Promise<any> | null = null;

const loadFabric = (): Promise<any> => {
  if (_fabricPromise) return _fabricPromise;
  _fabricPromise = new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }
    if ((window as any).fabric) {
      resolve((window as any).fabric);
      return;
    }

    const existing = document.getElementById('fabric-js-cdn');
    if (existing) {
      // Script already in DOM but not yet ready — poll
      const poll = setInterval(() => {
        if ((window as any).fabric) {
          clearInterval(poll);
          resolve((window as any).fabric);
        }
      }, 50);
      return;
    }

    const script = document.createElement('script');
    script.id = 'fabric-js-cdn';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve((window as any).fabric);
    script.onerror = () => {
      _fabricPromise = null; // allow retry
      resolve(null);
    };
    document.head.appendChild(script);
  });
  return _fabricPromise;
};

// ── Image URL options: NEVER set crossOrigin on data: or blob: URLs ───────────
// Setting crossOrigin on a data: or blob: URI causes silent load failures / CORS errors
// in Chrome and Firefox.
const imgOptions = (url: string): Record<string, string> =>
  url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')
    ? {}
    : { crossOrigin: 'anonymous' };

// ── Place design image on an existing fabric canvas ──────────────────────────
function placeDesignImage(opts: {
  fabric: any;
  fc: any;
  garment: GarmentType;
  view: GarmentView;
  designImageUrl: string;
  containerW: number;
  designObjRef: React.MutableRefObject<any>;
  guideRectRef: React.MutableRefObject<any>;
  containerRef?: React.MutableRefObject<HTMLDivElement | null>;
  onLocalSync: (obj: any) => void;
  onFlushStore: (obj: any) => void;
  destroyed: boolean;
}) {
  const {
    fabric,
    fc,
    garment,
    view,
    designImageUrl,
    containerW,
    designObjRef,
    guideRectRef,
    onLocalSync,
    onFlushStore,
    destroyed,
  } = opts;

  // Remove previous design object
  if (designObjRef.current) {
    fc.remove(designObjRef.current);
    designObjRef.current = null;
  }

  const scaleFactor = containerW / CANVAS_REF_WIDTH;
  const config = getPrintAreaConfig(garment, view);
  const pa = {
    x: config.printArea.x * scaleFactor,
    y: config.printArea.y * scaleFactor,
    w: config.printArea.width * scaleFactor,
    h: config.printArea.height * scaleFactor,
  };

  // Clip region — constrains image render to print area
  const clip = new fabric.Rect({
    left: pa.x,
    top: pa.y,
    width: pa.w,
    height: pa.h,
    absolutePositioned: true,
  });

  // KEY FIX: do NOT pass crossOrigin for data: URLs
  fabric.Image.fromURL(
    designImageUrl,
    (img: any) => {
      if (destroyed || !img) {
        console.warn('[ApparelCanvas] Image failed to load or component destroyed');
        return;
      }

      const targetW = pa.w * config.defaultDesignScale;
      const baseDesignScale = targetW / Math.max(img.width || 1, 1);

      const existing = useApparelCustomizerStore.getState().designsByView[view]?.transform;
      const initNormX = existing?.normX ?? 0;
      const initNormY = existing?.normY ?? 0;
      const initialLeft = pa.x + pa.w / 2 + initNormX * (pa.w / 2);
      const initialTop = pa.y + pa.h / 2 + initNormY * (pa.h / 2);

      // Preserve existing user scale factor if already set
      const userScaleX = existing?.scaleX ?? 1;
      const userScaleY = existing?.scaleY ?? userScaleX;
      const finalScaleX = baseDesignScale * userScaleX;
      const finalScaleY = baseDesignScale * userScaleY;

      img.set({
        left: initialLeft,
        top: initialTop,
        originX: 'center',
        originY: 'center',
        scaleX: finalScaleX,
        scaleY: finalScaleY,
        angle: existing?.angle ?? 0,
        opacity: existing?.opacity ?? 1,
        clipPath: clip,
        cornerColor: '#ED9518',
        borderColor: '#ED9518',
        cornerSize: 10,
        transparentCorners: false,
        borderScaleFactor: 1.5,
      });

      // ── Design is freely draggable across the whole canvas ──────────────────
      // The clip path already hides pixels outside the print area.
      // Hard position clamping is intentionally removed — it blocked the user
      // from pushing the design to the lower portion of the shirt.

      // Limit max scale
      img.on('scaling', () => {
        const bb = img.getBoundingRect(true);
        if (bb.width > pa.w * 1.02) {
          img.scaleX = pa.w / Math.max(img.width || 1, 1);
          img.scaleY = pa.w / Math.max(img.width || 1, 1);
        }
      });

      // LOCAL sync (no Zustand, no re-render) — runs every drag frame
      img.on('moving', () => onLocalSync(img));
      img.on('scaling', () => onLocalSync(img));
      img.on('rotating', () => onLocalSync(img));

      // STORE flush — runs once on mouse-up
      img.on('modified', () => onFlushStore(img));

      fc.add(img);
      fc.setActiveObject(img);
      designObjRef.current = img;

      if (guideRectRef.current) guideRectRef.current.set({ visible: true });
      fc.renderAll();

      // Flush initial placement to store
      onFlushStore(img);
    },
    imgOptions(designImageUrl), // ← KEY FIX: empty object for data: or blob: URLs
  );
}

// ─────────────────────────────────────────────────────────────────────────────

// ── Tinted garment mockup helper for accent colors without dedicated photos ──
function TintedGarmentMockup({
  src,
  tintColor,
  alt,
}: {
  src: string;
  tintColor: string;
  alt: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    // NEVER set crossOrigin for relative or same-origin URLs
    if (src.startsWith('http://') || src.startsWith('https://')) {
      try {
        const u = new URL(src);
        if (typeof window !== 'undefined' && u.origin !== window.location.origin) {
          img.crossOrigin = 'anonymous';
        }
      } catch {
        // ignore
      }
    }

    const draw = () => {
      if (cancelled) return;
      canvas.width = img.naturalWidth || 1000;
      canvas.height = img.naturalHeight || 1200;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = tintColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = 'source-over';
    };

    img.onload = draw;
    img.onerror = () => {
      console.warn('[TintedGarmentMockup] Failed to load image:', src);
    };
    img.src = src;

    if (img.complete && img.naturalWidth > 0) {
      draw();
    }

    return () => {
      cancelled = true;
    };
  }, [src, tintColor]);

  return (
    <div className="w-full h-full relative">
      {/* Underlying base image ensures canvas never flashes blank */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain pointer-events-none select-none absolute inset-0 z-[1]"
      />
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain pointer-events-none select-none absolute inset-0 z-[2]"
        aria-label={alt}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export const ApparelCanvas = forwardRef<ApparelCanvasHandle, ApparelCanvasProps>(
  ({ garment, view, color, designImageUrl, onTransformChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const fabricRef = useRef<any>(null);
    const tintRectRef = useRef<any>(null); // fabric Rect used for in-canvas colour tinting
    const designObjRef = useRef<any>(null);
    const guideRectRef = useRef<any>(null);
    const localTransformRef = useRef<DesignTransform | null>(null);
    const [isReady, setIsReady] = useState(false);

    const updateTransform = useApparelCustomizerStore((s) => s.updateTransform);

    // Called every drag frame — writes to ref only (zero React/Zustand cost)
    const onLocalSync = useCallback(
      (obj: any) => {
        const containerW = containerRef.current?.clientWidth || 480;
        const scaleFactor = containerW / CANVAS_REF_WIDTH;
        const config = getPrintAreaConfig(garment, view);
        const paCenterX = (config.printArea.x + config.printArea.width / 2) * scaleFactor;
        const paCenterY = (config.printArea.y + config.printArea.height / 2) * scaleFactor;
        const paHalfW = (config.printArea.width / 2) * scaleFactor;
        const paHalfH = (config.printArea.height / 2) * scaleFactor;

        const normX = paHalfW > 0 ? Number(((obj.left - paCenterX) / paHalfW).toFixed(3)) : 0;
        const normY = paHalfH > 0 ? Number(((obj.top - paCenterY) / paHalfH).toFixed(3)) : 0;

        const targetW = config.printArea.width * scaleFactor * config.defaultDesignScale;
        const baseScale = targetW / Math.max(obj.width || 1, 1);
        const userScaleX = baseScale > 0 ? Number((obj.scaleX / baseScale).toFixed(3)) : 1;
        const userScaleY = baseScale > 0 ? Number((obj.scaleY / baseScale).toFixed(3)) : 1;

        localTransformRef.current = {
          x: obj.left,
          y: obj.top,
          scaleX: userScaleX,
          scaleY: userScaleY,
          angle: obj.angle,
          opacity: obj.opacity,
          normX,
          normY,
        };
      },
      [garment, view],
    );

    // Called once on modified (mouse-up) — flush to Zustand
    const onFlushStore = useCallback(
      (obj: any) => {
        const containerW = containerRef.current?.clientWidth || 480;
        const scaleFactor = containerW / CANVAS_REF_WIDTH;
        const config = getPrintAreaConfig(garment, view);
        const paCenterX = (config.printArea.x + config.printArea.width / 2) * scaleFactor;
        const paCenterY = (config.printArea.y + config.printArea.height / 2) * scaleFactor;
        const paHalfW = (config.printArea.width / 2) * scaleFactor;
        const paHalfH = (config.printArea.height / 2) * scaleFactor;

        const normX = paHalfW > 0 ? Number(((obj.left - paCenterX) / paHalfW).toFixed(3)) : 0;
        const normY = paHalfH > 0 ? Number(((obj.top - paCenterY) / paHalfH).toFixed(3)) : 0;

        const targetW = config.printArea.width * scaleFactor * config.defaultDesignScale;
        const baseScale = targetW / Math.max(obj.width || 1, 1);
        const userScaleX = baseScale > 0 ? Number((obj.scaleX / baseScale).toFixed(3)) : 1;
        const userScaleY = baseScale > 0 ? Number((obj.scaleY / baseScale).toFixed(3)) : 1;

        const t: DesignTransform = {
          x: obj.left,
          y: obj.top,
          scaleX: userScaleX,
          scaleY: userScaleY,
          angle: obj.angle,
          opacity: obj.opacity,
          normX,
          normY,
        };
        localTransformRef.current = t;
        updateTransform(view, t);
        onTransformChange?.(t);
      },
      [garment, view, updateTransform, onTransformChange],
    );

    // ── Stable refs for callbacks ──────────────────────────────────────────
    const onLocalSyncRef = useRef(onLocalSync);
    onLocalSyncRef.current = onLocalSync;
    const onFlushStoreRef = useRef(onFlushStore);
    onFlushStoreRef.current = onFlushStore;

    useImperativeHandle(ref, () => ({
      getCanvas: () => fabricRef.current,
      getDesignObject: () => designObjRef.current,
      exportThumbnail: () => {
        const fc = fabricRef.current;
        if (!fc) return '';
        if (guideRectRef.current) guideRectRef.current.set({ visible: false });
        fc.renderAll();

        const containerW = containerRef.current?.clientWidth || 480;
        const containerH =
          fc.height || Math.round(containerW * (CANVAS_REF_HEIGHT / CANVAS_REF_WIDTH));

        const offscreen = document.createElement('canvas');
        offscreen.width = containerW;
        offscreen.height = containerH;
        const ctx = offscreen.getContext('2d');

        if (ctx) {
          const renderedGarment = containerRef.current?.parentElement?.querySelector(
            'canvas:not(.lower-canvas):not(.upper-canvas), img',
          );
          if (renderedGarment) {
            ctx.drawImage(renderedGarment as CanvasImageSource, 0, 0, containerW, containerH);
          }
          const lowerCanvas = fc.lowerCanvasEl;
          if (lowerCanvas) {
            ctx.drawImage(lowerCanvas, 0, 0);
          }
        }

        if (guideRectRef.current) guideRectRef.current.set({ visible: true });
        fc.renderAll();
        return offscreen.toDataURL('image/png');
      },
      loadFromSnapshot: async (json: string) => {
        const fc = fabricRef.current;
        if (!fc) return;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await new Promise<void>((resolve) =>
          fc.loadFromJSON(json, () => {
            fc.renderAll();
            resolve();
          }),
        );
      },
    }));

    // ── Canvas initialisation (depends on garment type or mount) ─────────────
    useEffect(() => {
      let destroyed = false;
      let fc: any = null;

      const init = async () => {
        const fabric = await loadFabric();
        if (destroyed || !fabric || !containerRef.current) return;

        const container = containerRef.current;
        container.innerHTML = '';

        // Wait one frame for layout so clientWidth is correct
        await new Promise((r) => requestAnimationFrame(r));
        if (destroyed) return;

        const containerW = container.clientWidth || 480;
        const containerH = Math.round(containerW * (CANVAS_REF_HEIGHT / CANVAS_REF_WIDTH));
        const scaleFactor = containerW / CANVAS_REF_WIDTH;

        const canvasEl = document.createElement('canvas');
        container.appendChild(canvasEl);

        fc = new fabric.Canvas(canvasEl, {
          width: containerW,
          height: containerH,
          selection: true,
          preserveObjectStacking: true,
          backgroundColor: 'transparent',
        });
        fabricRef.current = fc;

        // ── Print-area dashed guide rect ─────────────────────────────────────
        const config = getPrintAreaConfig(garment, view);
        const pa = {
          x: config.printArea.x * scaleFactor,
          y: config.printArea.y * scaleFactor,
          w: config.printArea.width * scaleFactor,
          h: config.printArea.height * scaleFactor,
        };
        const guide = new fabric.Rect({
          left: pa.x,
          top: pa.y,
          width: pa.w,
          height: pa.h,
          fill: 'transparent',
          stroke: 'rgba(237,149,24,0.6)',
          strokeWidth: 1.5,
          strokeDashArray: [6, 4],
          selectable: false,
          evented: false,
          visible: false,
          rx: 2,
          ry: 2,
        });
        fc.add(guide);
        guideRectRef.current = guide;

        fc.on('selection:created', () => {
          guide.set({ visible: true });
          fc.renderAll();
        });
        fc.on('selection:updated', () => {
          guide.set({ visible: true });
          fc.renderAll();
        });
        fc.on('selection:cleared', () => {
          guide.set({ visible: false });
          fc.renderAll();
        });

        // ── History snapshot on user actions ────────────────────────────────
        let snapshotTimer: ReturnType<typeof setTimeout> | null = null;
        const pushSnapshot = () => {
          if (snapshotTimer) clearTimeout(snapshotTimer);
          snapshotTimer = setTimeout(() => {
            const json: string = JSON.stringify(fc.toJSON());
            useApparelHistoryStore.getState().pushSnapshot(json);
          }, 300);
        };
        fc.on('object:modified', pushSnapshot);
        fc.on('object:added', pushSnapshot);
        fc.on('object:removed', pushSnapshot);

        fc.renderAll();
        setIsReady(true);
      };

      void init();

      return () => {
        destroyed = true;
        setIsReady(false);
        if (fc) fc.dispose();
        fabricRef.current = null;
        designObjRef.current = null;
        guideRectRef.current = null;
        tintRectRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [garment]);

    // ── Effect: update guide rect when garment or view changes ───────────────
    useEffect(() => {
      const fc = fabricRef.current;
      const guide = guideRectRef.current;
      if (!isReady || !fc || !guide) return;

      const containerW = containerRef.current?.clientWidth || 480;
      const scaleFactor = containerW / CANVAS_REF_WIDTH;
      const config = getPrintAreaConfig(garment, view);
      const pa = {
        x: config.printArea.x * scaleFactor,
        y: config.printArea.y * scaleFactor,
        w: config.printArea.width * scaleFactor,
        h: config.printArea.height * scaleFactor,
      };

      guide.set({
        left: pa.x,
        top: pa.y,
        width: pa.w,
        height: pa.h,
      });
      fc.renderAll();
    }, [isReady, garment, view]);

    // ── Effect: design image change (upload / clear / view switch) ───────────
    useEffect(() => {
      if (!isReady) return;

      const fc = fabricRef.current;

      if (!designImageUrl) {
        // Clear design
        if (fc && designObjRef.current) {
          fc.remove(designObjRef.current);
          designObjRef.current = null;
          if (guideRectRef.current) guideRectRef.current.set({ visible: false });
          fc.renderAll();
        }
        return;
      }

      // Canvas not yet mounted — canvas init will pick this up inside its callback
      if (!fc) return;

      const fabric = (window as any).fabric;
      if (!fabric) return;

      const containerW = containerRef.current?.clientWidth ?? 480;

      placeDesignImage({
        fabric,
        fc,
        garment,
        view,
        designImageUrl,
        containerW,
        designObjRef,
        guideRectRef,
        onLocalSync: (obj: any) => onLocalSyncRef.current(obj),
        onFlushStore: (obj: any) => onFlushStoreRef.current(obj),
        destroyed: false,
      });
      // Preload both front and back mockups for this garment & color to make switching instantaneous
      const frontSrc =
        color.mockupImage?.replace(/-(front|back)\.png$/, '-front.png') ??
        WHITE_BASE_MOCKUP[garment]?.front ??
        '/images/mockups/tee-white-front.png';
      const backSrc =
        color.mockupImage?.replace(/-(front|back)\.png$/, '-back.png') ??
        WHITE_BASE_MOCKUP[garment]?.back ??
        '/images/mockups/tee-white-back.png';

      if (typeof window !== 'undefined') {
        const p1 = new Image();
        p1.src = frontSrc;
        const p2 = new Image();
        p2.src = backSrc;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady, designImageUrl, garment, view]);

    // ── Render ────────────────────────────────────────────────────────────────
    // The garment mockup image is rendered as a clean element in the DOM
    // directly behind the transparent Fabric.js canvas.
    // Photographed colors render a clean <img>; accent colors render TintedGarmentMockup.
    // This guarantees the garment NEVER goes black or blank regardless of canvas init/view switches.
    const mockupSrc =
      color.mockupImage ??
      WHITE_BASE_MOCKUP[garment]?.[view] ??
      '/images/mockups/tee-white-front.png';
    const isTinted = !color.mockupImage;

    return (
      <div
        className="w-full relative select-none touch-none overflow-hidden"
        style={{ aspectRatio: `${CANVAS_REF_WIDTH} / ${CANVAS_REF_HEIGHT}` }}
      >
        {/* Layer 1: Garment Mockup Image (rendered behind the canvas) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {isTinted ? (
            <TintedGarmentMockup src={mockupSrc} tintColor={color.hex} alt={`${garment} ${view}`} />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={mockupSrc}
              alt={`${garment} ${view}`}
              onError={(e) => {
                const target = e.currentTarget;
                const fallback =
                  WHITE_BASE_MOCKUP[garment]?.[view] ?? '/images/mockups/tee-white-front.png';
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
              className="w-full h-full object-contain pointer-events-none select-none relative z-[1]"
            />
          )}
        </div>

        {/* Layer 2: Interactive Fabric.js Canvas */}
        <div ref={containerRef} className="absolute inset-0 z-[2]" />
      </div>
    );
  },
);

ApparelCanvas.displayName = 'ApparelCanvas';
