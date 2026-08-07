/**
 * Skin Engine — 2D Affine Transform Matrix
 *
 * Handles all artwork positioning, scaling, and rotation in the skin editor.
 * All transforms are applied as SVG `transform="matrix(a b c d e f)"`.
 *
 * Matrix format: [a c e]   where a=scaleX, b=skewY, c=skewX,
 *                [b d f]         d=scaleY, e=translateX, f=translateY
 *                [0 0 1]
 *
 * For non-shearing transforms (our case):
 *   a = cos(θ) * sx
 *   b = sin(θ) * sx
 *   c = -sin(θ) * sy
 *   d = cos(θ) * sy
 *   e = tx
 *   f = ty
 */

import type { Rect } from './geometry';

export interface ArtworkTransform {
  /** Translation X in pixels */
  tx: number;
  /** Translation Y in pixels */
  ty: number;
  /** Uniform scale factor (1.0 = natural size) */
  scale: number;
  /** Rotation in degrees */
  rotation: number;
  /** Flip horizontal */
  flipX: boolean;
  /** Flip vertical */
  flipY: boolean;
}

export const DEFAULT_TRANSFORM: ArtworkTransform = {
  tx: 0,
  ty: 0,
  scale: 1,
  rotation: 0,
  flipX: false,
  flipY: false,
};

/**
 * Converts ArtworkTransform to an SVG transform string.
 * Rotation is applied around the artwork center.
 */
export function transformToSVGString(t: ArtworkTransform, artW: number, artH: number): string {
  const cx = t.tx + (artW * t.scale) / 2;
  const cy = t.ty + (artH * t.scale) / 2;

  const parts: string[] = [];

  // Translate to position
  parts.push(`translate(${t.tx.toFixed(3)} ${t.ty.toFixed(3)})`);

  // Scale artwork
  parts.push(`scale(${t.scale.toFixed(6)})`);

  if (t.rotation !== 0) {
    // Rotate around artwork center (in natural size coordinates)
    const rcx = artW / 2;
    const rcy = artH / 2;
    parts.push(`rotate(${t.rotation} ${rcx.toFixed(3)} ${rcy.toFixed(3)})`);
    void cx;
    void cy; // used for centering reference
  }

  // Flip transforms (applied in natural size space)
  if (t.flipX) {
    parts.push(`scale(-1 1) translate(${(-artW).toFixed(3)} 0)`);
  }
  if (t.flipY) {
    parts.push(`scale(1 -1) translate(0 ${(-artH).toFixed(3)})`);
  }

  return parts.join(' ');
}

/**
 * Computes the initial "fit cover" transform.
 * Artwork fills the entire printable area, maintaining aspect ratio.
 *
 * @param artW - Natural artwork width in pixels
 * @param artH - Natural artwork height in pixels
 * @param area - Target print area rectangle
 */
export function fitCoverTransform(artW: number, artH: number, area: Rect): ArtworkTransform {
  const scaleX = area.w / artW;
  const scaleY = area.h / artH;
  const scale = Math.max(scaleX, scaleY); // cover = max

  const scaledW = artW * scale;
  const scaledH = artH * scale;

  // Center artwork in the area
  const tx = area.x + (area.w - scaledW) / 2;
  const ty = area.y + (area.h - scaledH) / 2;

  return { tx, ty, scale, rotation: 0, flipX: false, flipY: false };
}

/**
 * Computes the initial "fit contain" transform.
 * Entire artwork is visible within the printable area.
 */
export function fitContainTransform(artW: number, artH: number, area: Rect): ArtworkTransform {
  const scaleX = area.w / artW;
  const scaleY = area.h / artH;
  const scale = Math.min(scaleX, scaleY); // contain = min

  const scaledW = artW * scale;
  const scaledH = artH * scale;

  const tx = area.x + (area.w - scaledW) / 2;
  const ty = area.y + (area.h - scaledH) / 2;

  return { tx, ty, scale, rotation: 0, flipX: false, flipY: false };
}

/**
 * Clamps translation so artwork always covers the printable area.
 * Prevents the user from dragging artwork completely off-screen.
 */
export function clampTranslation(
  tx: number,
  ty: number,
  artW: number,
  artH: number,
  scale: number,
  area: Rect,
): { tx: number; ty: number } {
  const scaledW = artW * scale;
  const scaledH = artH * scale;

  // Maximum offset: artwork right edge must be at least at area left edge
  // Minimum offset: artwork left edge must be at most at area right edge
  const minTx = area.x + area.w - scaledW;
  const maxTx = area.x;
  const minTy = area.y + area.h - scaledH;
  const maxTy = area.y;

  return {
    tx: Math.max(minTx, Math.min(maxTx, tx)),
    ty: Math.max(minTy, Math.min(maxTy, ty)),
  };
}

/**
 * Applies wheel delta to scale, clamped between minScale and maxScale.
 */
export function applyWheelZoom(
  current: ArtworkTransform,
  delta: number,
  artW: number,
  artH: number,
  area: Rect,
  minScale: number,
  maxScale: number = 5.0,
): ArtworkTransform {
  const sensitivity = 0.001;
  const rawScale = current.scale * (1 - delta * sensitivity);
  const newScale = Math.max(minScale, Math.min(maxScale, rawScale));

  // Zoom toward center of area
  const cx = area.x + area.w / 2;
  const cy = area.y + area.h / 2;

  const scaleRatio = newScale / current.scale;
  const newTx = cx - (cx - current.tx) * scaleRatio;
  const newTy = cy - (cy - current.ty) * scaleRatio;

  const clamped = clampTranslation(newTx, newTy, artW, artH, newScale, area);

  return { ...current, scale: newScale, tx: clamped.tx, ty: clamped.ty };
}

/**
 * Gets minimum scale for cover mode (artwork must fill the area).
 */
export function getMinCoverScale(artW: number, artH: number, area: Rect): number {
  return Math.max(area.w / artW, area.h / artH);
}
