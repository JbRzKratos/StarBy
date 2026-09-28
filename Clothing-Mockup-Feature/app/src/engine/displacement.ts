/**
 * Fabric Displacement & Shading Engine
 * Warps artwork along authentic macroscopic fabric wrinkles using bilinear sampling
 * and applies subtle ambient fold lighting while preserving radiant white ink.
 */

import type { ArtworkLayer, WarpSettings } from '../types/mockup';
import type { GarmentAnalysis } from './assetManager';

// Fast precomputed sRGB to Linear (gamma 2.2) LUT
const SRGB_TO_LIN = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  SRGB_TO_LIN[i] = Math.pow(i / 255.0, 2.2);
}

// Fast precomputed Linear to sRGB (1/2.2) LUT with 4096 bins
const LIN_TO_SRGB = new Uint8Array(4096);
for (let i = 0; i < 4096; i++) {
  const lin = i / 4095.0;
  LIN_TO_SRGB[i] = Math.min(255, Math.max(0, Math.round(Math.pow(lin, 1.0 / 2.2) * 255.0)));
}

export class FabricWarper {
  private cache = new Map<string, HTMLCanvasElement>();
  private srcCache = new Map<string, { canvas: HTMLCanvasElement; data: Uint8ClampedArray; width: number; height: number }>();

  private getSourceCanvas(layer: ArtworkLayer): { canvas: HTMLCanvasElement; data: Uint8ClampedArray; width: number; height: number } {
    const key = `src_${layer.src}`;
    let cached = this.srcCache.get(key);
    if (!cached) {
      const canvas = document.createElement('canvas');
      canvas.width = layer.naturalWidth;
      canvas.height = layer.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Could not get 2D context for layer source');
      ctx.drawImage(layer.image, 0, 0);
      const imgData = ctx.getImageData(0, 0, layer.naturalWidth, layer.naturalHeight);
      cached = {
        canvas,
        data: imgData.data,
        width: layer.naturalWidth,
        height: layer.naturalHeight,
      };
      this.srcCache.set(key, cached);
    }
    return cached;
  }

  private sampleBilinear(
    srcData: Uint8ClampedArray,
    srcW: number,
    srcH: number,
    u: number,
    v: number,
    out: [number, number, number, number]
  ): boolean {
    if (u < 0 || u >= srcW || v < 0 || v >= srcH) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      return false;
    }

    const x0 = Math.floor(u);
    const y0 = Math.floor(v);
    const x1 = Math.min(srcW - 1, x0 + 1);
    const y1 = Math.min(srcH - 1, y0 + 1);

    const fx = u - x0;
    const fy = v - y0;
    const fx1 = 1.0 - fx;
    const fy1 = 1.0 - fy;

    const w00 = fx1 * fy1;
    const w10 = fx * fy1;
    const w01 = fx1 * fy;
    const w11 = fx * fy;

    const idx00 = (y0 * srcW + x0) * 4;
    const idx10 = (y0 * srcW + x1) * 4;
    const idx01 = (y1 * srcW + x0) * 4;
    const idx11 = (y1 * srcW + x1) * 4;

    const a = w00 * srcData[idx00 + 3] + w10 * srcData[idx10 + 3] + w01 * srcData[idx01 + 3] + w11 * srcData[idx11 + 3];
    if (a < 1) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      return false;
    }

    out[0] = w00 * srcData[idx00] + w10 * srcData[idx10] + w01 * srcData[idx01] + w11 * srcData[idx11];
    out[1] = w00 * srcData[idx00 + 1] + w10 * srcData[idx10 + 1] + w01 * srcData[idx01 + 1] + w11 * srcData[idx11 + 1];
    out[2] = w00 * srcData[idx00 + 2] + w10 * srcData[idx10 + 2] + w01 * srcData[idx01 + 2] + w11 * srcData[idx11 + 2];
    out[3] = a;
    return true;
  }

  /**
   * Render warped and shaded layer to an offscreen canvas
   */
  renderWarpedLayer(
    layer: ArtworkLayer,
    garment: GarmentAnalysis,
    warp: WarpSettings,
    side: 'front' | 'back' = 'front'
  ): HTMLCanvasElement {
    const dispW = Math.max(1, Math.round(layer.width * Math.abs(layer.scaleX)));
    const dispH = Math.max(1, Math.round(layer.height * Math.abs(layer.scaleY)));

    const cacheKey = `${garment.img.src}_${layer.id}_${Math.round(layer.x)}_${Math.round(layer.y)}_${dispW}x${dispH}_${Math.round(layer.rotation)}_${warp.enabled ? '1' : '0'}_${warp.strength.toFixed(2)}_${warp.blendFactor.toFixed(2)}_${layer.flipX ? '1' : '0'}_${layer.flipY ? '1' : '0'}_${layer.opacity.toFixed(2)}_${side}`;

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { data: srcData, width: srcW, height: srcH } = this.getSourceCanvas(layer);

    const canvas = document.createElement('canvas');
    canvas.width = dispW;
    canvas.height = dispH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create canvas context');

    const imgData = ctx.createImageData(dispW, dispH);
    const destData = imgData.data;

    const rad = (layer.rotation * Math.PI) / 180.0;
    const cosT = Math.cos(rad);
    const sinT = Math.sin(rad);

    const gw = garment.width;
    const gh = garment.height;
    const gradX = garment.gradX;
    const gradY = garment.gradY;
    const smoothLuma = garment.smoothLuma;
    const rawLumaArr = garment.luma;
    const alphaMask = garment.alphaMask;
    const medLuma = garment.medianLuma || 0.55;

    // Physical displacement strength multiplier:
    // With grad values ~0.02 - 0.04, a multiplier of 180 gives ~5-12px displacement at strength 2.0
    const strengthMultiplier = warp.enabled ? warp.strength * 180.0 : 0;
    // Fold shading blend factor: default 0.50 if not specified
    const blendFactor = warp.blendFactor !== undefined ? warp.blendFactor : 0.50;

    const halfW = dispW / 2;
    const halfH = dispH / 2;

    const sampleColor: [number, number, number, number] = [0, 0, 0, 0];

    for (let v = 0; v < dispH; v++) {
      const dv = v - halfH;
      const rowOffset = v * dispW;

      for (let u = 0; u < dispW; u++) {
        const du = u - halfW;

        // Map local layer coordinate (u, v) into native garment coordinate space (gx, gy)
        const gx = Math.round(layer.x + du * cosT - dv * sinT);
        const gy = Math.round(layer.y + du * sinT + dv * cosT);

        if (gx < 0 || gx >= gw || gy < 0 || gy >= gh) {
          continue;
        }

        const gIdx = gy * gw + gx;
        // Strictly clip to garment silhouette
        if (alphaMask[gIdx] === 0) {
          continue;
        }

        // Clean front neckline collar boundary check
        if (side === 'front') {
          const distFromCenter = Math.abs(gx - gw * 0.5) / (gw * 0.22);
          if (distFromCenter < 1.0) {
            const collarY = 260 + (1.0 - distFromCenter * distFromCenter) * 155;
            if (gy < collarY) {
              continue;
            }
          }
        }

        let dispU = 0;
        let dispV = 0;

        if (strengthMultiplier > 0) {
          const gX = gradX[gIdx];
          const gY = gradY[gIdx];

          // Displacement vector in garment space along fold contours
          const dGX = -gX * strengthMultiplier;
          const dGY = -gY * strengthMultiplier;

          // Rotate displacement vector back to local layer space
          dispU = dGX * cosT + dGY * sinT;
          dispV = -dGX * sinT + dGY * cosT;
        }

        let localU = u + dispU;
        let localV = v + dispV;

        if (layer.flipX) localU = dispW - 1 - localU;
        if (layer.flipY) localV = dispH - 1 - localV;

        const srcU = (localU / dispW) * srcW;
        const srcV = (localV / dispH) * srcH;

        if (!this.sampleBilinear(srcData, srcW, srcH, srcU, srcV, sampleColor)) {
          continue;
        }

        const r = sampleColor[0];
        const g = sampleColor[1];
        const b = sampleColor[2];
        const a = sampleColor[3];

        if (a < 1) continue;

        // 1. Broad macroscopic fold illumination normalized to authentic garment body median
        const lumaVal = smoothLuma[gIdx];
        const rawLuma = rawLumaArr[gIdx];
        const foldRatio = lumaVal / medLuma;

        // Fold illumination response:
        // Shadows darken naturally; highlights have restrained lift to prevent blowout
        let foldShade = 1.0;
        if (blendFactor > 0) {
          if (foldRatio < 1.0) {
            foldShade = 1.0 + (foldRatio - 1.0) * (blendFactor * 1.10);
          } else {
            foldShade = 1.0 + (foldRatio - 1.0) * (blendFactor * 0.72);
          }
        }

        // 2. High-frequency fabric weave micro-texture (zero-centered)
        const weaveDelta = Math.max(-0.25, Math.min(0.25, (rawLuma - lumaVal) / medLuma));
        const weaveMod = 1.0 + weaveDelta * (0.36 * blendFactor);

        // 3. Conversion to linear color space
        const rInt = Math.max(0, Math.min(255, Math.round(r)));
        const gInt = Math.max(0, Math.min(255, Math.round(g)));
        const bInt = Math.max(0, Math.min(255, Math.round(b)));
        const rLin = SRGB_TO_LIN[rInt];
        const gLin = SRGB_TO_LIN[gInt];
        const bLin = SRGB_TO_LIN[bInt];
        const cMax = Math.max(rLin, gLin, bLin);

        // 4. Physical diffuse reflectance floor for black/dark ink:
        // Real screenprinting pigment reflects diffuse ambient light and reveals underlying thread structure.
        // Pure black is not a digital void; it reflects ~3.8% in linear space, allowing weave and folds through.
        // Applied strictly to dark achromatic inks (cMax < 0.25) so saturated colors remain 100% pure.
        const darkFloor = 0.038 * Math.max(0, 1.0 - cMax * 4.0) * blendFactor;
        const effR = Math.max(rLin, darkFloor);
        const effG = Math.max(gLin, darkFloor);
        const effB = Math.max(bLin, darkFloor);

        // 5. Subtle, bounded surface sheen on illuminated fold ridges and weave peaks:
        let sheen = 0;
        if (blendFactor > 0) {
          const ridgeCatch = Math.max(0, foldRatio - 1.0) * 0.040;
          const threadCatch = Math.max(0, weaveDelta) * 0.036;
          sheen = (ridgeCatch + threadCatch) * Math.max(0, 1.0 - cMax * 2.0) * blendFactor;
        }

        // 6. Lit linear color channels
        const litR = effR * foldShade * weaveMod + sheen;
        const litG = effG * foldShade * weaveMod + sheen;
        const litB = effB * foldShade * weaveMod + sheen;

        // 7. Convert back to sRGB via fast LUT (defensive against NaN/infinity)
        const safeLitR = Number.isFinite(litR) ? Math.max(0, litR) : rLin;
        const safeLitG = Number.isFinite(litG) ? Math.max(0, litG) : gLin;
        const safeLitB = Number.isFinite(litB) ? Math.max(0, litB) : bLin;

        const qR = Math.max(0, Math.min(4095, Math.round(safeLitR * 4095)));
        const qG = Math.max(0, Math.min(4095, Math.round(safeLitG * 4095)));
        const qB = Math.max(0, Math.min(4095, Math.round(safeLitB * 4095)));
        const outR = LIN_TO_SRGB[qR] ?? rInt;
        const outG = LIN_TO_SRGB[qG] ?? gInt;
        const outB = LIN_TO_SRGB[qB] ?? bInt;

        const finalAlpha = Math.max(0, Math.min(255, Math.round(a * layer.opacity)));

        const outIdx = (rowOffset + u) * 4;
        destData[outIdx] = outR;
        destData[outIdx + 1] = outG;
        destData[outIdx + 2] = outB;
        destData[outIdx + 3] = finalAlpha;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    if (this.cache.size > 30) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(cacheKey, canvas);

    return canvas;
  }

  clearCache(): void {
    this.cache.clear();
    this.srcCache.clear();
  }
}

export const fabricWarper = new FabricWarper();
