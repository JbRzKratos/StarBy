'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { useCustomizerStore } from '@/lib/stores/customizer-store';
import { PRINT_SPECS } from '@/lib/config/printSpecs';
import type { ProductType } from '@/lib/config/printSpecs';

interface FabricCanvasProps {
  productType: ProductType;
  side: 'front' | 'back';
}

export function FabricCanvas({ productType, side }: FabricCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const boundingBoxRef = useRef<{ width: number; height: number } | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const { designs, setEffectiveDpi } = useCustomizerStore();
  const currentDesign = designs[side];
  const uploadedImage = currentDesign.url;

  // 1. Handle Resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Register export function for this specific side
  useEffect(() => {
    useCustomizerStore.getState().registerExportFn(side, () => {
      if (!fabricCanvasRef.current) return '';
      // Only export if there is an image uploaded for this side
      if (!useCustomizerStore.getState().designs[side].url) return '';
      return fabricCanvasRef.current.toDataURL({ format: 'png' });
    });
  }, [side]);

  const calculateLiveDPI = useCallback(
    (img: fabric.Image) => {
      const spec = PRINT_SPECS[productType];
      const box = boundingBoxRef.current;
      if (!spec || !box || !box.width || !img.scaleX) return;

      // The ratio of the image to the bounding box
      const scaledWidthOnCanvas = (img.width || 0) * img.scaleX;
      const ratio = scaledWidthOnCanvas / box.width;

      // The physical width of the printed area
      const physicalWidthInches = spec.physicalDimensions.width;

      // Image covers `ratio` portion of the physical width
      const printedWidthInches = physicalWidthInches * ratio;

      // Calculate effective DPI
      const { designs } = useCustomizerStore.getState();
      const imageNativeWidth = side === 'front' ? designs.front.width : designs.back.width;
      if (imageNativeWidth === 0) return;

      const dpi = Math.round(imageNativeWidth / printedWidthInches);

      // Determine status
      let status: 'excellent' | 'good' | 'poor' | 'unusable' = 'good';
      if (dpi >= spec.targetDpi) status = 'excellent';
      else if (dpi >= spec.minimumDpi) status = 'good';
      else if (dpi >= spec.minimumDpi * 0.75) status = 'poor';
      else status = 'unusable';

      setEffectiveDpi(dpi, status, side);
    },
    [productType, setEffectiveDpi, side],
  );

  const addImageToCanvas = useCallback(
    (url: string, canvas: fabric.Canvas) => {
      fabric.Image.fromURL(url, (img) => {
        const clipPath = canvas.clipPath;
        if (!clipPath) return;

        const clipBounds = clipPath.getBoundingRect();

        // Center it inside the clipBounds
        const cx = clipBounds.left + clipBounds.width / 2;
        const cy = clipBounds.top + clipBounds.height / 2;

        // Scale to fit 80% of bounding box
        const scaleX = (clipBounds.width * 0.8) / (img.width || 1);
        const scaleY = (clipBounds.height * 0.8) / (img.height || 1);
        const scale = Math.min(scaleX, scaleY);

        img.set({
          originX: 'center',
          originY: 'center',
          left: cx,
          top: cy,
          scaleX: scale,
          scaleY: scale,
          cornerColor: '#0057FF',
          cornerStrokeColor: '#fff',
          transparentCorners: false,
          cornerSize: 10,
          padding: 5,
          borderColor: '#0057FF',
          borderDashArray: [4, 4],
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();

        img.on('scaling', () => {
          calculateLiveDPI(img);
        });
        calculateLiveDPI(img);
      });
    },
    [calculateLiveDPI],
  );

  // 2. Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasRef.current || containerSize.width === 0) return;

    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: containerSize.width,
      height: containerSize.height,
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;

    const spec = PRINT_SPECS[productType];
    if (spec && spec.mockupBoundingBox) {
      const { top, left, width, height } = spec.mockupBoundingBox;

      const pixelLeft = (left / 100) * containerSize.width;
      const pixelTop = (top / 100) * containerSize.height;
      const pixelWidth = (width / 100) * containerSize.width;
      const pixelHeight = (height / 100) * containerSize.height;

      boundingBoxRef.current = { width: pixelWidth, height: pixelHeight };

      let clipPathObj: fabric.Object;

      if (productType === 'poster-split-3') {
        const panelWidth = pixelWidth * 0.32;
        const gap = pixelWidth * 0.02;
        const rect1 = new fabric.Rect({
          left: pixelLeft,
          top: pixelTop,
          width: panelWidth,
          height: pixelHeight,
        });
        const rect2 = new fabric.Rect({
          left: pixelLeft + panelWidth + gap,
          top: pixelTop,
          width: panelWidth,
          height: pixelHeight,
        });
        const rect3 = new fabric.Rect({
          left: pixelLeft + (panelWidth + gap) * 2,
          top: pixelTop,
          width: panelWidth,
          height: pixelHeight,
        });
        clipPathObj = new fabric.Group([rect1, rect2, rect3], { absolutePositioned: true });
      } else if (productType === 'poster-split-5') {
        const panelWidth = pixelWidth * 0.18;
        const gap = pixelWidth * 0.025;
        const h1 = pixelHeight * 0.6;
        const h2 = pixelHeight * 0.8;
        const h3 = pixelHeight;
        const rect1 = new fabric.Rect({
          left: pixelLeft,
          top: pixelTop + (pixelHeight - h1) / 2,
          width: panelWidth,
          height: h1,
        });
        const rect2 = new fabric.Rect({
          left: pixelLeft + (panelWidth + gap),
          top: pixelTop + (pixelHeight - h2) / 2,
          width: panelWidth,
          height: h2,
        });
        const rect3 = new fabric.Rect({
          left: pixelLeft + (panelWidth + gap) * 2,
          top: pixelTop,
          width: panelWidth,
          height: h3,
        });
        const rect4 = new fabric.Rect({
          left: pixelLeft + (panelWidth + gap) * 3,
          top: pixelTop + (pixelHeight - h2) / 2,
          width: panelWidth,
          height: h2,
        });
        const rect5 = new fabric.Rect({
          left: pixelLeft + (panelWidth + gap) * 4,
          top: pixelTop + (pixelHeight - h1) / 2,
          width: panelWidth,
          height: h1,
        });
        clipPathObj = new fabric.Group([rect1, rect2, rect3, rect4, rect5], {
          absolutePositioned: true,
        });
      } else {
        clipPathObj = new fabric.Rect({
          left: pixelLeft,
          top: pixelTop,
          width: pixelWidth,
          height: pixelHeight,
          absolutePositioned: true,
        });
      }

      canvas.clipPath = clipPathObj;

      const guideBox = new fabric.Rect({
        left: pixelLeft,
        top: pixelTop,
        width: pixelWidth,
        height: pixelHeight,
        fill: 'transparent',
        stroke: 'rgba(255, 255, 255, 0.3)',
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        visible: !uploadedImage,
      });
      canvas.add(guideBox);
    }

    if (uploadedImage) {
      addImageToCanvas(uploadedImage, canvas);
    }

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [containerSize, productType, uploadedImage, addImageToCanvas]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
