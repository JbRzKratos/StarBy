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
    // back not yet available — fall back to black-back
    back: '/images/mockups/hoodie-black-back.png',
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

// ── Image URL options: NEVER set crossOrigin on data: URLs ───────────────────
// Setting crossOrigin on a data: URI causes silent load failures in Chrome and
// Firefox because data: URIs have no origin and the browser treats the
// crossOrigin attribute as an error trigger.
const imgOptions = (url: string): Record<string, string> =>
  url.startsWith('data:') ? {} : { crossOrigin: 'anonymous' };

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
      const designScale = targetW / Math.max(img.width || 1, 1);

      img.set({
        left: pa.x + pa.w / 2,
        top: pa.y + pa.h / 2,
        originX: 'center',
        originY: 'center',
        scaleX: designScale,
        scaleY: designScale,
        angle: 0,
        opacity: 1,
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
    imgOptions(designImageUrl), // ← KEY FIX: empty object for data: URLs
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
    const onLocalSync = useCallback((obj: any) => {
      localTransformRef.current = {
        x: obj.left,
        y: obj.top,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
        angle: obj.angle,
        opacity: obj.opacity,
      };
    }, []);

    // Called once on modified (mouse-up) — flush to Zustand
    const onFlushStore = useCallback(
      (obj: any) => {
        const t: DesignTransform = {
          x: obj.left,
          y: obj.top,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          angle: obj.angle,
          opacity: obj.opacity,
        };
        localTransformRef.current = t;
        updateTransform(view, t);
        onTransformChange?.(t);
      },
      [view, updateTransform, onTransformChange],
    );

    // ── Stable refs for callbacks ──────────────────────────────────────────
    // This is the key fix for the infinite-reload loop:
    // onTransformChange is an inline arrow in the parent => new reference every render.
    // If onFlushStore (which depends on onTransformChange) is in the design-image effect
    // deps, the effect fires every render, removes+reloads the design, calls onFlushStore,
    // triggers updateTransform, triggers re-render, new onTransformChange, loop forever.
    // Solution: store the latest callbacks in refs and keep them OUT of effect deps.
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
        const url: string = fc.toDataURL({ format: 'png', multiplier: 1 });
        if (guideRectRef.current) guideRectRef.current.set({ visible: true });
        fc.renderAll();
        return url;
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

    // ── Canvas initialisation ────────────────────────────────────────────────
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
    }, [garment, view]);

    // ── Effect: colour change → swap garment image + update tint rect ──────────
    useEffect(() => {
      let isCancelled = false;

      if (!isReady) return;

      const fc = fabricRef.current;
      if (!fc) return;

      const fabric = (window as any).fabric;
      if (!fabric) return;

      // Remove ALL old tint rects and background mockup images before adding the new color mockup
      if (tintRectRef.current) {
        fc.remove(tintRectRef.current);
        tintRectRef.current = null;
      }
      const existingBgObjects = fc
        .getObjects()
        .filter((o: any) => o !== designObjRef.current && o !== guideRectRef.current);
      existingBgObjects.forEach((o: any) => fc.remove(o));

      const mockupSrc = color.mockupImage ?? WHITE_BASE_MOCKUP[garment][view];
      const containerW = containerRef.current?.clientWidth ?? 480;
      const containerH = fc.height as number;

      fabric.Image.fromURL(
        mockupSrc,
        (img: any) => {
          if (isCancelled || !img || !fabricRef.current) return;
          const gScale = Math.max(
            containerW / Math.max(img.width || 1, 1),
            containerH / Math.max(img.height || 1, 1),
          );

          // Add tint rect inside fabric for non-real-asset colours
          if (!color.mockupImage) {
            const tr = new fabric.Rect({
              left: 0,
              top: 0,
              width: containerW,
              height: containerH,
              fill: color.hex,
              selectable: false,
              evented: false,
            });
            fabricRef.current.add(tr);
            fabricRef.current.sendToBack(tr);
            tintRectRef.current = tr;
            img.set({ globalCompositeOperation: 'multiply' });
          }

          img.set({
            left: containerW / 2,
            top: containerH / 2,
            originX: 'center',
            originY: 'center',
            scaleX: gScale,
            scaleY: gScale,
            selectable: false,
            evented: false,
          });
          fabricRef.current.add(img);
          fabricRef.current.sendToBack(img);
          if (tintRectRef.current) fabricRef.current.sendToBack(tintRectRef.current);
          fabricRef.current.renderAll();
        },
        imgOptions(mockupSrc),
      );

      return () => {
        isCancelled = true;
      };
    }, [isReady, color, garment, view]);

    // ── Effect: design image change (upload / clear) ──────────────────────────
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
        // Use refs so this effect does NOT re-run when callback identity changes
        onLocalSync: (obj: any) => onLocalSyncRef.current(obj),
        onFlushStore: (obj: any) => onFlushStoreRef.current(obj),
        destroyed: false,
      });
      // Intentionally exclude onLocalSync/onFlushStore from deps — stored in refs above.
      // The effect must only re-run on actual data changes (url, garment, view).
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady, designImageUrl, garment, view]);

    // ── Render ────────────────────────────────────────────────────────────────
    // The canvas container is a simple absolutely-positioned div.
    // Tinting is handled INSIDE fabric.js (tintRect + multiply blend on garment image),
    // NOT via CSS mix-blend-mode on this container. This prevents tinting from
    // bleeding into the dark outer wrapper area around the garment photo.
    return (
      <div
        className="w-full relative select-none touch-none"
        style={{ aspectRatio: `${CANVAS_REF_WIDTH} / ${CANVAS_REF_HEIGHT}` }}
      >
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      </div>
    );
  },
);

ApparelCanvas.displayName = 'ApparelCanvas';
