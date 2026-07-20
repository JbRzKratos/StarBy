'use client';

import { useRef, useEffect } from 'react';
import { templates } from '@/data/customizationTemplates';

interface CustomizerCanvasProps {
  productId: string;
  initialImage?: string | null;
}

/**
 * fabric.js canvas wrapper. Dynamically imported (SSR disabled).
 * Uses requestAnimationFrame throttling for redraws.
 */
export function CustomizerCanvas({ productId, initialImage }: CustomizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<unknown>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let activeFabricCanvas: any = null;

    const initCanvas = async () => {
      const fabricModule = await import('fabric');
      const fabric = fabricModule.default ?? fabricModule;

      if (!canvasRef.current) return;

      const template = templates[productId.replace('prod_', '')] || templates['eclipse-tee'];

      if (!template) {
        console.error('No customization template found');
        return;
      }

      /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
      const canvas = new (fabric as any).Canvas(canvasRef.current, {
        width: 600,
        height: 700,
        backgroundColor: '#1A1A1E',
        selection: true,
        preserveObjectStacking: true,
      });
      activeFabricCanvas = canvas;
      fabricRef.current = canvas;

      // Calculate absolute print area for the 600x700 canvas
      const paX = 600 * template.printArea.x;
      const paY = 700 * template.printArea.y;
      const paW = 600 * template.printArea.width;
      const paH = 700 * template.printArea.height;

      // 1. Load Background Mockup
      (fabric as any).Image.fromURL(template.mockupImage, (img: any) => {
        img.set({
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false,
        });

        // Scale to fit canvas
        const scale = Math.min(600 / img.width, 700 / img.height);
        img.scale(scale);

        // Center the scaled image
        const scaledW = img.width * scale;
        const scaledH = img.height * scale;
        img.set({
          left: (600 - scaledW) / 2,
          top: (700 - scaledH) / 2,
        });

        canvas.add(img);
        canvas.sendToBack(img);

        // 2. Load User Image if provided
        if (initialImage) {
          (fabric as any).Image.fromURL(initialImage, (userImg: any) => {
            // Setup clipping mask to keep it inside the print area
            const clipPath = new (fabric as any).Rect({
              left: paX,
              top: paY,
              width: paW,
              height: paH,
              absolutePositioned: true,
            });

            // Calculate scale to cover print area
            const scaleX = paW / userImg.width;
            const scaleY = paH / userImg.height;
            const userScale = Math.max(scaleX, scaleY);

            userImg.set({
              left: paX + paW / 2,
              top: paY + paH / 2,
              originX: 'center',
              originY: 'center',
              scaleX: userScale,
              scaleY: userScale,
              clipPath: clipPath,
              globalCompositeOperation: template.blendMode || 'source-over',
              cornerColor: '#3B5EFF',
              borderColor: '#3B5EFF',
              cornerSize: 12,
              transparentCorners: false,
            });

            if (template.printArea.rotation) {
              userImg.rotate(template.printArea.rotation);
              clipPath.rotate(template.printArea.rotation);
            }

            canvas.add(userImg);
            canvas.setActiveObject(userImg);
            canvas.renderAll();
          });
        }

        /* Print zone outline (guideline) */
        const printZone = new (fabric as any).Rect({
          left: paX,
          top: paY,
          width: paW,
          height: paH,
          fill: 'transparent',
          stroke: 'rgba(59, 94, 255, 0.5)',
          strokeWidth: 1,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
        });

        if (template.printArea.rotation) {
          printZone.rotate(template.printArea.rotation);
        }

        canvas.add(printZone);
        canvas.renderAll();
      });
      /* eslint-enable */
    };

    void initCanvas();

    return () => {
      if (activeFabricCanvas) {
        (activeFabricCanvas as { dispose: () => void }).dispose();
      }
    };
  }, [productId, initialImage]);

  return (
    <div className="bg-graphite border border-smoke rounded-lg p-0 flex items-center justify-center overflow-hidden w-full h-[60vh] lg:h-[700px]">
      <canvas ref={canvasRef} className="max-w-full max-h-full" />
    </div>
  );
}
