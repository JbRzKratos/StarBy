'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { DeviceTemplate, DevicePanel } from '@/data/device-templates';
import type { Transform } from '@/lib/stores/skin-customizer-store';

export const CANVAS_REF_WIDTH = 800;
export const CANVAS_REF_HEIGHT = 800;

export interface SkinCanvasHandle {
  getCanvas: () => any;
  getDesignObject: () => any;
  exportThumbnail: () => string;
}

export interface SkinCanvasProps {
  template: DeviceTemplate;
  panel: DevicePanel;
  designImageUrl: string | null;
  onTransformChange?: (t: Transform) => void;
}

// Fabric.js CDN loader (singleton promise)
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
    script.async = true;
    script.onload = () => resolve((window as any).fabric);
    document.body.appendChild(script);
  });
  return _fabricPromise;
};

export const SkinCanvas = forwardRef<SkinCanvasHandle, SkinCanvasProps>(
  ({ panel, designImageUrl, onTransformChange }, ref) => {
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<any>(null);
    const designObjRef = useRef<any>(null);
    const clipPathRef = useRef<any>(null);

    // Initialize Fabric Canvas
    useEffect(() => {
      let isMounted = true;
      loadFabric().then((fabric) => {
        if (!isMounted || !fabric || !canvasElRef.current || !canvasContainerRef.current) return;

        // Cleanup previous instance if re-initializing
        if (fabricRef.current) {
          fabricRef.current.dispose();
        }

        const rect = canvasContainerRef.current.getBoundingClientRect();
        const canvas = new fabric.Canvas(canvasElRef.current, {
          width: rect.width,
          height: rect.height,
          selection: false,
          preserveObjectStacking: true,
        });

        // Calculate scaling to fit the device panel nicely into the UI
        // We use the panel.outlinePath bounding box or assume it fits within an 800x800 logical space
        // For simplicity, we create the clip path right away.

        // Combine outline and cutouts into one compound path
        const compoundPathData = [panel.outlinePath, ...panel.cutouts.map((c) => c.path)].join(' ');

        const clipPath = new fabric.Path(compoundPathData, {
          fillRule: 'evenodd', // This is key to making the cutouts render as holes
          absolutePositioned: true,
          selectable: false,
          evented: false,
        });

        // Scale the clip path to fit the canvas container
        const boundingBox = clipPath.getBoundingRect();
        const scale = Math.min(
          (rect.width * 0.9) / boundingBox.width,
          (rect.height * 0.9) / boundingBox.height,
        );

        clipPath.set({
          scaleX: scale,
          scaleY: scale,
          left: (rect.width - boundingBox.width * scale) / 2,
          top: (rect.height - boundingBox.height * scale) / 2,
        });

        canvas.clipPath = clipPath;
        clipPathRef.current = clipPath;

        // Draw an outline stroke for the user to see the device shape
        const outlineStroke = new fabric.Path(compoundPathData, {
          fillRule: 'evenodd',
          fill: 'transparent',
          stroke: 'rgba(237, 149, 24, 0.5)', // StarBy orange
          strokeWidth: 2 / scale, // keep stroke width consistent visually
          selectable: false,
          evented: false,
          scaleX: scale,
          scaleY: scale,
          left: clipPath.left,
          top: clipPath.top,
        });
        canvas.add(outlineStroke);

        fabricRef.current = canvas;
      });

      return () => {
        isMounted = false;
        if (fabricRef.current) {
          fabricRef.current.dispose();
          fabricRef.current = null;
        }
      };
    }, [panel]);

    // Handle design image upload and cover-fit calculation
    useEffect(() => {
      if (!designImageUrl || !fabricRef.current || !clipPathRef.current) return;

      const fabric = (window as any).fabric;
      const canvas = fabricRef.current;
      const clipPath = clipPathRef.current;

      const isDataUrl = designImageUrl.startsWith('data:');
      const imgOptions = isDataUrl ? {} : { crossOrigin: 'anonymous' };

      fabric.Image.fromURL(
        designImageUrl,
        (img: any) => {
          if (!img) return;

          // Remove old design if exists
          if (designObjRef.current) {
            canvas.remove(designObjRef.current);
          }

          // Cover-fit logic:
          // The image needs to completely cover the clip path's bounding box
          const clipRect = clipPath.getBoundingRect();

          const scaleX = clipRect.width / img.width;
          const scaleY = clipRect.height / img.height;
          const coverScale = Math.max(scaleX, scaleY); // max ensures it covers both dimensions

          img.set({
            scaleX: coverScale,
            scaleY: coverScale,
            left: clipRect.left + clipRect.width / 2,
            top: clipRect.top + clipRect.height / 2,
            originX: 'center',
            originY: 'center',
            cornerColor: '#ED9518',
            borderColor: '#ED9518',
            transparentCorners: false,
          });

          // Sync initial transform to Zustand
          if (onTransformChange) {
            onTransformChange({
              x: img.left,
              y: img.top,
              scaleX: img.scaleX,
              scaleY: img.scaleY,
              angle: img.angle,
              opacity: img.opacity,
            });
          }

          designObjRef.current = img;
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        },
        imgOptions,
      );
    }, [designImageUrl, panel, onTransformChange]); // re-run if image or panel changes

    // Sync transforms to Zustand on user interaction (debounced/flushed on mouse-up)
    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const handleModify = (e: any) => {
        const obj = e.target;
        if (!obj || obj !== designObjRef.current || !onTransformChange) return;

        onTransformChange({
          x: obj.left,
          y: obj.top,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          angle: obj.angle,
          opacity: obj.opacity,
        });
      };

      canvas.on('object:modified', handleModify);
      return () => {
        canvas.off('object:modified', handleModify);
      };
    }, [onTransformChange]);

    useImperativeHandle(ref, () => ({
      getCanvas: () => fabricRef.current,
      getDesignObject: () => designObjRef.current,
      exportThumbnail: () => {
        if (!fabricRef.current) return '';
        // Unselect object so handles don't show in export
        fabricRef.current.discardActiveObject();
        fabricRef.current.renderAll();
        return fabricRef.current.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 1, // screen res
        });
      },
    }));

    // Handle resize
    useEffect(() => {
      const handleResize = () => {
        if (!canvasContainerRef.current || !fabricRef.current) return;
        const rect = canvasContainerRef.current.getBoundingClientRect();
        fabricRef.current.setDimensions({ width: rect.width, height: rect.height });
        // NOTE: In a full production app, we would re-calculate the clip path scale here
        // to maintain responsiveness.
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
      <div
        ref={canvasContainerRef}
        className="relative w-full h-full bg-charcoal/50 rounded-xl overflow-hidden flex items-center justify-center"
      >
        <canvas ref={canvasElRef} className="absolute inset-0 z-10" />
      </div>
    );
  },
);
SkinCanvas.displayName = 'SkinCanvas';
