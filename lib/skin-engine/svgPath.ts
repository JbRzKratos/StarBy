/**
 * Skin Engine — SVG Path Module
 *
 * Generates accurate SVG path strings for phone bodies, camera islands,
 * lens apertures, flash modules, and sensor cutouts.
 *
 * All coordinates are in CSS pixels (pre-scaled from mm via geometry.ts).
 * Paths are returned as SVG `d` attribute strings.
 */

import type { DeviceModel, CameraModule, LensSpec } from '@/data/devices';
import type { DevicePreviewDimensions } from './geometry';
import { getCornerRadiusPx } from './geometry';

// ─── Primitive Path Builders ──────────────────────────────────────────────────

/**
 * SVG path for a rounded rectangle.
 * All coordinates are absolute (top-left origin).
 */
export function roundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const cr = Math.min(r, w / 2, h / 2);
  return [
    `M ${x + cr} ${y}`,
    `H ${x + w - cr}`,
    `Q ${x + w} ${y} ${x + w} ${y + cr}`,
    `V ${y + h - cr}`,
    `Q ${x + w} ${y + h} ${x + w - cr} ${y + h}`,
    `H ${x + cr}`,
    `Q ${x} ${y + h} ${x} ${y + h - cr}`,
    `V ${y + cr}`,
    `Q ${x} ${y} ${x + cr} ${y}`,
    'Z',
  ].join(' ');
}

/**
 * SVG path for a circle (using arc commands).
 */
export function circlePath(cx: number, cy: number, r: number): string {
  return [
    `M ${cx + r} ${cy}`,
    `A ${r} ${r} 0 1 0 ${cx - r} ${cy}`,
    `A ${r} ${r} 0 1 0 ${cx + r} ${cy}`,
    'Z',
  ].join(' ');
}

/**
 * Vertical pill: rounded rectangle where rx = w/2.
 */
export function pillVerticalPath(x: number, y: number, w: number, h: number): string {
  return roundedRectPath(x, y, w, h, w / 2);
}

/**
 * Horizontal pill: rounded rectangle where ry = h/2.
 */
export function pillHorizontalPath(x: number, y: number, w: number, h: number): string {
  return roundedRectPath(x, y, w, h, h / 2);
}

// ─── Device Body Path ─────────────────────────────────────────────────────────

/**
 * Builds the SVG path string for the phone body outline.
 * This is the master clip boundary.
 */
export function buildBodyPath(device: DeviceModel, dims: DevicePreviewDimensions): string {
  const r = getCornerRadiusPx(device, dims);
  return roundedRectPath(0, 0, dims.widthPx, dims.heightPx, r);
}

// ─── Camera Module Path ───────────────────────────────────────────────────────

/** Camera island geometry in pixels */
export interface CameraGeometry {
  /** Camera island outer shape path */
  islandPath: string;
  /** Individual lens hole paths (to cut out or render as glass) */
  lensPaths: string[];
  /** Flash dot path (if present) */
  flashPath: string | null;
  /** Absolute pixel positions for overlay rendering */
  islandX: number;
  islandY: number;
  islandW: number;
  islandH: number;
}

/**
 * Resolves camera module position and size in pixels from device data.
 * Camera module uses fractions of device width/height.
 */
export function resolveCameraGeometry(
  cam: CameraModule,
  dims: DevicePreviewDimensions,
): CameraGeometry {
  const { widthPx, heightPx } = dims;

  let iX: number, iY: number, iW: number, iH: number;

  if (cam.shape === 'circle') {
    // circle: x/y = top-left offset as fraction of width/height
    // w = diameter as fraction of width
    iW = widthPx * cam.w;
    iH = iW; // always square for circles
    iX = widthPx * cam.x;
    iY = heightPx * cam.y;
  } else {
    iX = widthPx * cam.x;
    iY = heightPx * cam.y;
    iW = widthPx * cam.w;
    iH = heightPx * cam.h;
  }

  // Island path
  let islandPath: string;
  switch (cam.shape) {
    case 'circle':
      islandPath = circlePath(iX + iW / 2, iY + iH / 2, iW / 2);
      break;
    case 'pill-vertical':
      islandPath = pillVerticalPath(iX, iY, iW, iH);
      break;
    case 'pill-horizontal':
      islandPath = pillHorizontalPath(iX, iY, iW, iH);
      break;
    case 'strip-vertical':
      islandPath = roundedRectPath(iX, iY, iW, iH, iW * 0.35);
      break;
    case 'rect-rounded':
    default:
      islandPath = roundedRectPath(iX, iY, iW, iH, Math.min(iW, iH) * 0.18);
      break;
  }

  // Lens paths — lenses are stored as fractions within the camera island bounding box
  const lensPaths: string[] = (cam.lenses ?? []).map((lens: LensSpec) => {
    const lcx = iX + iW * lens.cx;
    const lcy = iY + iH * lens.cy;
    const lr = iW * lens.r;
    return circlePath(lcx, lcy, lr);
  });

  // Flash path
  let flashPath: string | null = null;
  if (cam.flash) {
    const fcx = iX + iW * cam.flash.cx;
    const fcy = iY + iH * cam.flash.cy;
    const fr = iW * cam.flash.r;
    flashPath = circlePath(fcx, fcy, fr);
  }

  return {
    islandPath,
    lensPaths,
    flashPath,
    islandX: iX,
    islandY: iY,
    islandW: iW,
    islandH: iH,
  };
}

/**
 * Builds the camera island combined path including all lens cutouts.
 * Used for the SVG clipPath subtraction (artwork avoids lenses).
 */
export function buildCameraSubtractionPath(
  cam: CameraModule,
  dims: DevicePreviewDimensions,
): string {
  const geo = resolveCameraGeometry(cam, dims);
  // For clip path exclusion, we only subtract the camera module housing,
  // not individual lenses (lenses are rendered visually on top separately).
  return geo.islandPath;
}
