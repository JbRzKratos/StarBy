/**
 * printExport.ts
 *
 * Dual export pipeline for the 2D apparel customizer.
 *
 *  1. exportThumbnail() — screen-resolution PNG for cart/order UI
 *  2. exportPrintReady() — high-res (300 DPI equivalent) design-only PNG for fulfillment
 */

import type { DesignTransform } from '@/lib/stores/apparel-customizer-store';
import type { PrintAreaConfig } from '@/data/printAreaConfig';
import { CANVAS_REF_WIDTH, CANVAS_REF_HEIGHT } from '@/data/printAreaConfig';

/**
 * Export the current fabric.js canvas at screen resolution.
 * Returns a data URL (image/png) suitable for cart thumbnails.
 */
export function exportThumbnail(fabricCanvas: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (fabricCanvas as any).toDataURL({ format: 'png', multiplier: 1 });
}

/**
 * Export the design layer only (no garment background) at 300-DPI equivalent resolution.
 * This is the file that goes to fulfillment.
 *
 * The offscreen canvas dimensions come from printAreaConfig.printExport.
 * The design is scaled from its screen-space transform to the high-res space.
 */
export async function exportPrintReady(
  designImageUrl: string,
  transform: DesignTransform,
  config: PrintAreaConfig,
  /** The actual display canvas dimensions so we can compute the scale factor */
  displayWidth: number,
  displayHeight: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const scaleX = displayWidth / CANVAS_REF_WIDTH;
    const scaleY = displayHeight / CANVAS_REF_HEIGHT;

    // Print-safe area in display pixels
    const paDx = config.printArea.x * scaleX;
    const paDy = config.printArea.y * scaleY;
    const paDw = config.printArea.width * scaleX;
    const paDh = config.printArea.height * scaleY;

    // Scale factor from display canvas → high-res export
    const exportW = config.printExport.widthPx;
    const exportH = config.printExport.heightPx;
    const hrScaleX = exportW / paDw;
    const hrScaleY = exportH / paDh;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const offscreen = document.createElement('canvas');
        offscreen.width = exportW;
        offscreen.height = exportH;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return reject(new Error('Could not get 2d context'));

        ctx.clearRect(0, 0, exportW, exportH);

        // Map design transform from display space → print-ready space
        const designCenterX = (transform.x - paDx) * hrScaleX;
        const designCenterY = (transform.y - paDy) * hrScaleY;
        const designScaleX = transform.scaleX * hrScaleX;
        const designScaleY = transform.scaleY * hrScaleY;

        ctx.save();
        ctx.globalAlpha = transform.opacity;
        ctx.translate(designCenterX, designCenterY);
        ctx.rotate((transform.angle * Math.PI) / 180);
        ctx.scale(designScaleX, designScaleY);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();

        resolve(offscreen.toDataURL('image/png'));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Failed to load design image for print export'));
    img.src = designImageUrl;
  });
}
