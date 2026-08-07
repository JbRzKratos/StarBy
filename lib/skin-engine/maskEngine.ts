/**
 * Skin Engine — Mask Engine Module
 *
 * Builds SVG <clipPath> and <mask> definitions that constrain artwork
 * precisely to the device body, optionally subtracting camera island regions.
 *
 * Two approaches:
 * 1. SUBTRACT mode: artwork is clipped inside body minus camera housing
 * 2. FULL mode: artwork fills entire body (camera housing rendered on top)
 *
 * For production skin manufacturing, FULL mode is correct:
 * the vinyl is cut to body shape and the camera housing is a separate cut.
 * The camera island appears on top as a visual overlay in the preview.
 */

import type { DeviceModel } from '@/data/devices';
import type { DevicePreviewDimensions } from './geometry';
import { buildBodyPath } from './svgPath';

export interface ClipPathDefs {
  /** Unique clip path ID for this device instance */
  clipId: string;
  /** The SVG <clipPath> element as a JSX-compatible props object */
  bodyPath: string;
}

/**
 * Builds the clip path definition for the device body.
 * The artwork will be clipped to this shape.
 *
 * @param device - Device model
 * @param dims - Resolved pixel dimensions
 * @param instanceId - Unique identifier suffix to avoid duplicate SVG IDs
 */
export function buildBodyClipPath(
  device: DeviceModel,
  dims: DevicePreviewDimensions,
  instanceId: string = 'default',
): ClipPathDefs {
  const clipId = `skin-body-clip-${device.id}-${instanceId}`;
  const bodyPath = buildBodyPath(device, dims);
  return { clipId, bodyPath };
}

/**
 * Builds clip path ID for the camera avoidance zone.
 * Used when displaying the "camera avoidance" warning overlay.
 */
export function buildCameraClipId(deviceId: string, instanceId: string = 'default'): string {
  return `skin-camera-clip-${deviceId}-${instanceId}`;
}

/**
 * Builds clip path ID for the S-Pen silo area.
 * Only applicable to Samsung Ultra/Note devices.
 */
export function buildSpenClipId(deviceId: string): string {
  return `skin-spen-clip-${deviceId}`;
}
