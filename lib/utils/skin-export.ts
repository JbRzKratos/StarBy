import type { DevicePanel } from '@/data/device-templates';
import type { Transform } from '@/lib/stores/skin-customizer-store';

/**
 * MM to Pixels conversion for high-res print export
 * 300 DPI (Dots Per Inch) = ~11.81 Pixels Per Millimeter
 */
const DPI = 300;
const MM_TO_INCH = 25.4;
const PIXELS_PER_MM = DPI / MM_TO_INCH;

/** Minimal Fabric.js canvas/object interface for CDN-loaded fabric */
interface FabricObject {
  getBoundingRect(): { width: number; height: number };
  set(opts: Record<string, unknown>): void;
}
interface FabricCanvas {
  clipPath: FabricObject | null;
  add(obj: FabricObject): void;
  renderAll(): void;
  toDataURL(opts: { format: string; quality: number; multiplier: number }): string;
  dispose(): void;
}
interface FabricStatic {
  Canvas: new (el: HTMLCanvasElement, opts: Record<string, unknown>) => FabricCanvas;
  Path: new (data: string, opts: Record<string, unknown>) => FabricObject;
  Image: {
    fromURL(
      url: string,
      callback: (img: FabricObject | null) => void,
      opts: Record<string, unknown>,
    ): void;
  };
}

/**
 * Generate a high-resolution, print-ready export of the customizer design.
 * This function creates a hidden, off-screen Fabric.js canvas, scales it to the exact
 * physical dimensions (at 300 DPI), applies the compound SVG clip path (outline minus cutouts),
 * and renders the user's design image into it.
 */
export async function exportPrintReadySkin(
  panel: DevicePanel,
  designImageUrl: string,
  transform: Transform,
  uiScale: number, // The scale factor that was applied to the clipPath in the UI, to reverse-map the transforms
): Promise<string> {
  return new Promise((resolve, reject) => {
    // 1. Calculate the exact pixel dimensions needed for 300 DPI print
    const pixelWidth = Math.round(panel.printAreaBounds.width * PIXELS_PER_MM);
    const pixelHeight = Math.round(panel.printAreaBounds.height * PIXELS_PER_MM);

    // 2. Create an offscreen canvas
    const canvasEl = document.createElement('canvas');
    canvasEl.width = pixelWidth;
    canvasEl.height = pixelHeight;

    const fabric = (window as Window & { fabric?: FabricStatic }).fabric;
    if (!fabric) {
      return reject(new Error('Fabric.js is not loaded.'));
    }

    const offscreenCanvas = new fabric.Canvas(canvasEl, {
      width: pixelWidth,
      height: pixelHeight,
      renderOnAddRemove: false,
    });

    // 3. Create the compound clip path (outline minus cutouts)
    const compoundPathData = [panel.outlinePath, ...panel.cutouts.map((c) => c.path)].join(' ');

    const clipPath = new fabric.Path(compoundPathData, {
      fillRule: 'evenodd',
      absolutePositioned: true,
    });

    // We need to scale the clipPath to exactly fit the 300 DPI canvas
    const clipRect = clipPath.getBoundingRect();
    const targetScaleX = pixelWidth / clipRect.width;
    const targetScaleY = pixelHeight / clipRect.height;

    // We assume uniform scaling is required to maintain device proportions
    const targetScale = Math.min(targetScaleX, targetScaleY);

    clipPath.set({
      scaleX: targetScale,
      scaleY: targetScale,
      left: (pixelWidth - clipRect.width * targetScale) / 2,
      top: (pixelHeight - clipRect.height * targetScale) / 2,
    });

    offscreenCanvas.clipPath = clipPath;

    // 4. Load the user's design image
    const isDataUrl = designImageUrl.startsWith('data:');
    const imgOptions = isDataUrl ? {} : { crossOrigin: 'anonymous' };

    fabric.Image.fromURL(
      designImageUrl,
      (img: FabricObject | null) => {
        if (!img) {
          offscreenCanvas.dispose();
          return reject(new Error('Failed to load design image for export.'));
        }

        // 5. Map the UI transform (which was scaled for the screen) to the 300 DPI canvas
        // The scale ratio between the UI canvas's clipPath and the Offscreen canvas's clipPath
        const exportToUiRatio = targetScale / uiScale;

        // Note: In a robust implementation, the Transform state would store normalized
        // coordinates (e.g. 0 to 1 relative to the clip path) so it's resolution-independent.
        // For this v1, we scale the absolute UI transforms up by the ratio.

        img.set({
          scaleX: transform.scaleX * exportToUiRatio,
          scaleY: transform.scaleY * exportToUiRatio,
          angle: transform.angle,
          opacity: transform.opacity,
          originX: 'center',
          originY: 'center',
          left: pixelWidth / 2,
          top: pixelHeight / 2,
        });

        offscreenCanvas.add(img);
        offscreenCanvas.renderAll();

        // 6. Export to base64 PNG
        const dataUrl = offscreenCanvas.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 1,
        });

        offscreenCanvas.dispose();
        resolve(dataUrl);
      },
      imgOptions,
    );
  });
}
