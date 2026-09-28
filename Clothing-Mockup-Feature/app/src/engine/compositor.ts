/**
 * Main Compositor for VirtualThreads 2D Mockup Editor
 * Unified rendering pipeline for both real-time interactive preview and high-resolution exports.
 */

import type {
  ArtworkLayer,
  BackgroundSettings,
  GarmentSide,
  LightingSettings,
  WarpSettings,
} from '../types/mockup';
import { assetManager } from './assetManager';
import { garmentRecolorer } from './recolor';
import { fabricWarper } from './displacement';
import { getGarmentUrl, getShadowUrl } from '../data/catalog';

export interface RenderOptions {
  templateId: number;
  side: GarmentSide;
  garmentColor: string;
  warp: WarpSettings;
  background: BackgroundSettings;
  lighting: LightingSettings;
  layers: ArtworkLayer[];
  selectedLayerId?: string | null;
  drawUIHandles?: boolean; // false for exports!
  transparentBg?: boolean; // true for transparent exports
  includeShadow?: boolean; // option for transparent exports
  outputWidth?: number; // default 2048
  outputHeight?: number; // default 2048
  snapGuides?: { x?: number; y?: number }; // center alignment guides
}

export class Compositor {
  private concrete1Pattern: HTMLImageElement | null = null;
  private concrete2Pattern: HTMLImageElement | null = null;

  async initBackgrounds() {
    try {
      this.concrete1Pattern = await assetManager.loadImage('/backgrounds/Concrete1.jpg');
      this.concrete2Pattern = await assetManager.loadImage('/backgrounds/Concrete2.jpg');
    } catch (e) {
      console.warn('Could not load concrete background patterns:', e);
    }
  }

  /**
   * Render the static base scene (background, shadow, recolored garment, and artwork)
   * This is cached during real-time 30 FPS lighting animation for maximum smoothness!
   */
  async renderBaseScene(ctx: CanvasRenderingContext2D, options: RenderOptions): Promise<void> {
    const {
      templateId,
      side,
      garmentColor,
      warp,
      background,
      layers,
      transparentBg = false,
      includeShadow = true,
      outputWidth = 2048,
      outputHeight = 2048,
    } = options;

    const garmentUrl = getGarmentUrl(templateId, side);
    const shadowUrl = getShadowUrl(templateId, side);

    // Load garment and shadow concurrently
    const [garment, shadow] = await Promise.all([
      assetManager.loadGarment(garmentUrl),
      assetManager.loadShadow(shadowUrl),
    ]);

    const scaleX = outputWidth / garment.width;
    const scaleY = outputHeight / garment.height;

    ctx.save();
    ctx.clearRect(0, 0, outputWidth, outputHeight);

    // ==========================================
    // PASS 1: BACKGROUND
    // ==========================================
    if (!transparentBg) {
      if (background.type === 'solid') {
        ctx.fillStyle = background.color || '#222222';
        ctx.fillRect(0, 0, outputWidth, outputHeight);
      } else if (background.type === 'concrete1' || background.type === 'concrete2') {
        const bgImg = background.type === 'concrete1' ? this.concrete1Pattern : this.concrete2Pattern;
        if (bgImg) {
          this.drawPatternCover(ctx, bgImg, outputWidth, outputHeight);
        } else {
          ctx.fillStyle = background.color || '#333333';
          ctx.fillRect(0, 0, outputWidth, outputHeight);
        }
      } else if (background.type === 'custom' && background.customImageElement) {
        this.drawPatternCover(ctx, background.customImageElement, outputWidth, outputHeight);
      } else {
        ctx.fillStyle = '#222222';
        ctx.fillRect(0, 0, outputWidth, outputHeight);
      }
    }

    // ==========================================
    // PASS 2: GARMENT CAST SHADOW
    // ==========================================
    const shouldDrawShadow = !transparentBg || (transparentBg && includeShadow);
    if (shouldDrawShadow && shadow) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(shadow.canvas, 0, 0, outputWidth, outputHeight);
      ctx.restore();
    }

    // ==========================================
    // PASS 3: RECOLORED GARMENT BASE
    // ==========================================
    const recoloredGarment = garmentRecolorer.renderRecoloredGarment(garment, garmentUrl, garmentColor);
    ctx.drawImage(recoloredGarment, 0, 0, outputWidth, outputHeight);

    // ==========================================
    // PASS 4: ARTWORK LAYERS
    // ==========================================
    // Every visible artwork layer is shaded and integrated into the garment surface
    ctx.save();
    ctx.scale(scaleX, scaleY);

    for (const layer of layers) {
      if (!layer.visible) continue;

      const layerCanvas = fabricWarper.renderWarpedLayer(layer, garment, warp, side);
      const rad = (layer.rotation * Math.PI) / 180.0;

      ctx.save();
      ctx.translate(layer.x, layer.y);
      ctx.rotate(rad);
      ctx.drawImage(layerCanvas, -layerCanvas.width / 2, -layerCanvas.height / 2);
      ctx.restore();
    }
    ctx.restore();

    ctx.restore();
  }

  /**
   * Apply environmental lighting (gobo tree shadows), brightness/contrast, and UI gizmos.
   */
  applyLightingAndUI(
    ctx: CanvasRenderingContext2D,
    goboImg: HTMLImageElement | null,
    options: RenderOptions
  ): void {
    const {
      lighting,
      outputWidth = 2048,
      outputHeight = 2048,
      selectedLayerId,
      layers,
      drawUIHandles = false,
      snapGuides,
      transparentBg = false,
    } = options;

    // Snapshot silhouette alpha if transparentBg is requested to prevent multiply artifact outside garment
    let savedAlpha: Uint8ClampedArray | null = null;
    if (transparentBg) {
      const currentData = ctx.getImageData(0, 0, outputWidth, outputHeight);
      savedAlpha = new Uint8ClampedArray(outputWidth * outputHeight);
      for (let i = 0; i < savedAlpha.length; i++) {
        savedAlpha[i] = currentData.data[i * 4 + 3];
      }
    }

    // Environmental Lighting Pass (Gobo Tree Shadows)
    if (lighting.amount > 0 && goboImg) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = (lighting.amount / 100.0) * 0.45;

      // Position gobo with gentle diagonal sunlight shift as in reference
      const scale = Math.max(outputWidth / goboImg.width, outputHeight / goboImg.height) * 1.25;
      const gw = goboImg.width * scale;
      const gh = goboImg.height * scale;
      const gx = (outputWidth - gw) / 2 + outputWidth * 0.08;
      const gy = (outputHeight - gh) / 2;

      ctx.drawImage(goboImg, gx, gy, gw, gh);
      ctx.restore();
    }

    // Brightness and Contrast adjustments
    if (lighting.brightness !== 0 || lighting.contrast !== 0) {
      this.applyBrightnessContrast(ctx, outputWidth, outputHeight, lighting.brightness, lighting.contrast);
    }

    // Restore pristine silhouette alpha on transparent exports
    if (savedAlpha) {
      const finalData = ctx.getImageData(0, 0, outputWidth, outputHeight);
      for (let i = 0; i < savedAlpha.length; i++) {
        finalData.data[i * 4 + 3] = savedAlpha[i];
      }
      ctx.putImageData(finalData, 0, 0);
    }

    // UI Handles & Guidelines (Preview only)
    if (drawUIHandles) {
      ctx.save();
      // Snap Guides
      if (snapGuides) {
        ctx.save();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#3b82f6';
        ctx.setLineDash([4, 4]);

        if (snapGuides.x !== undefined) {
          ctx.beginPath();
          ctx.moveTo(snapGuides.x, 0);
          ctx.lineTo(snapGuides.x, outputHeight);
          ctx.stroke();
        }
        if (snapGuides.y !== undefined) {
          ctx.beginPath();
          ctx.moveTo(0, snapGuides.y);
          ctx.lineTo(outputWidth, snapGuides.y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Transform Gizmo for selected layer
      if (selectedLayerId) {
        const selectedLayer = layers.find((l) => l.id === selectedLayerId);
        if (selectedLayer && selectedLayer.visible) {
          this.drawTransformGizmo(ctx, selectedLayer);
        }
      }
      ctx.restore();
    }
  }

  /**
   * Complete unified scene render
   */
  async renderScene(ctx: CanvasRenderingContext2D, options: RenderOptions): Promise<void> {
    await this.renderBaseScene(ctx, options);

    let goboImg: HTMLImageElement | null = null;
    if (options.lighting.amount > 0) {
      try {
        goboImg = assetManager.getGoboFrameSync(options.lighting.frameIndex || 0);
        if (!goboImg) {
          goboImg = await assetManager.loadGoboFrame(options.lighting.frameIndex || 0);
        }
      } catch (e) {
        // Fallback gracefully if frame fails
      }
    }

    this.applyLightingAndUI(ctx, goboImg, options);
  }

  private drawPatternCover(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    w: number,
    h: number
  ) {
    const imgRatio = img.width / img.height;
    const canvasRatio = w / h;

    let drawW = w;
    let drawH = h;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      drawW = w;
      drawH = w / imgRatio;
      offsetY = (h - drawH) / 2;
    } else {
      drawH = h;
      drawW = h * imgRatio;
      offsetX = (w - drawW) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  }

  private applyBrightnessContrast(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    brightness: number,
    contrast: number
  ) {
    if (brightness === 0 && contrast === 0) return;

    const bFactor = 1.0 + (brightness / 10.0) * 0.22;
    const cFactor = 1.0 + (contrast / 10.0) * 0.22;

    ctx.save();
    ctx.filter = `brightness(${bFactor}) contrast(${cFactor})`;
    ctx.globalCompositeOperation = 'copy';
    ctx.drawImage(ctx.canvas, 0, 0, w, h);
    ctx.restore();
  }

  private drawTransformGizmo(ctx: CanvasRenderingContext2D, layer: ArtworkLayer) {
    const dispW = layer.width * Math.abs(layer.scaleX);
    const dispH = layer.height * Math.abs(layer.scaleY);
    const rad = (layer.rotation * Math.PI) / 180.0;

    ctx.save();
    ctx.translate(layer.x, layer.y);
    ctx.rotate(rad);

    const halfW = dispW / 2;
    const halfH = dispH / 2;

    // Bounding Box
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.0;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(-halfW, -halfH, dispW, dispH);

    // Rotation Handle Stem & Circle
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(0, -halfH);
    ctx.lineTo(0, -halfH - 24);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.arc(0, -halfH - 24, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 4 Corner Scale Handles
    const handleSize = 10;
    const corners = [
      [-halfW, -halfH],
      [halfW, -halfH],
      [halfW, halfH],
      [-halfW, halfH],
    ];

    for (const [cx, cy] of corners) {
      ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
    }

    ctx.restore();
  }
}

export const compositor = new Compositor();

if (typeof window !== 'undefined') {
  (window as any).__compositor = compositor;
  (window as any).__fabricWarper = fabricWarper;
  (window as any).__assetManager = assetManager;
}
