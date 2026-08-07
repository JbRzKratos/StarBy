'use client';

/**
 * useSkinExport — PNG and SVG export for the skin editor.
 *
 * PNG export:
 *  1. Clone the SVG
 *  2. Set export viewBox at 300 or 600 DPI scale
 *  3. Convert to <canvas> via Image.src = svgDataUrl
 *  4. canvas.toBlob → download
 *
 * SVG export:
 *  1. Clone SVG, strip interaction attrs
 *  2. Serialize and offer as download
 */

import { useCallback, useState } from 'react';
import type { DeviceModel } from '@/data/devices';
import type { DevicePreviewDimensions } from '@/lib/skin-engine/geometry';

const MM_PER_INCH = 25.4;

export type ExportDPI = 300 | 600;

export interface UseSkinExportReturn {
  isExporting: boolean;
  exportPNG: (svgEl: SVGSVGElement, dpi: ExportDPI) => Promise<void>;
  exportSVG: (svgEl: SVGSVGElement) => void;
}

export function useSkinExport(
  device: DeviceModel | null,
  dims: DevicePreviewDimensions | null
): UseSkinExportReturn {
  const [isExporting, setIsExporting] = useState(false);

  const exportPNG = useCallback(
    async (svgEl: SVGSVGElement, dpi: ExportDPI) => {
      if (!device || !dims || isExporting) return;
      setIsExporting(true);

      try {
        // Calculate export pixel dimensions
        // Device width in mm × (dpi / 25.4) = export width in px
        const exportW = Math.round(dims.widthMM * (dpi / MM_PER_INCH));
        const exportH = Math.round(dims.heightMM * (dpi / MM_PER_INCH));

        // Clone and prepare SVG for export
        const clone = svgEl.cloneNode(true) as SVGSVGElement;

        // Remove interactive-only elements from export
        clone.querySelectorAll('[data-interactive-only="true"]').forEach((el) =>
          el.remove()
        );
        clone.querySelectorAll('[data-export-hide="true"]').forEach((el) => el.remove());

        clone.setAttribute('width', String(exportW));
        clone.setAttribute('height', String(exportH));
        clone.setAttribute('viewBox', `0 0 ${dims.widthPx} ${dims.heightPx}`);
        clone.removeAttribute('style');

        // Serialize SVG
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clone);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        // Draw to canvas
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = exportW;
            canvas.height = exportH;
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('Canvas context unavailable')); return; }

            ctx.drawImage(img, 0, 0, exportW, exportH);
            URL.revokeObjectURL(url);

            canvas.toBlob(
              (blob) => {
                if (!blob) { reject(new Error('toBlob failed')); return; }
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `${device.id}-skin-${dpi}dpi.png`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(a.href), 5000);
                resolve();
              },
              'image/png',
              1.0
            );
          };
          img.onerror = reject;
          img.src = url;
        });
      } catch (err) {
        console.error('[SkinExport] PNG export failed:', err);
      } finally {
        setIsExporting(false);
      }
    },
    [device, dims, isExporting]
  );

  const exportSVG = useCallback(
    (svgEl: SVGSVGElement) => {
      if (!device || !dims) return;

      const clone = svgEl.cloneNode(true) as SVGSVGElement;
      clone.querySelectorAll('[data-interactive-only="true"]').forEach((el) => el.remove());
      clone.querySelectorAll('[data-export-hide="true"]').forEach((el) => el.remove());

      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('viewBox', `0 0 ${dims.widthPx} ${dims.heightPx}`);

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clone);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${device.id}-skin-vector.svg`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    },
    [device, dims]
  );

  return { isExporting, exportPNG, exportSVG };
}
