'use client';

/**
 * usePhoneTemplate — Resolves a device ID to its full pixel-geometry template.
 *
 * Computes all SVG paths, clip IDs, and pixel dimensions needed to render
 * the phone preview. Updates reactively when deviceId or container size changes.
 */

import { useMemo, useState, useEffect, useCallback } from 'react';
import { deviceModels } from '@/data/devices';
import type { DeviceModel } from '@/data/devices';
import {
  getDevicePreviewDimensions,
  getPrintableRect,
  getSafeAreaRect,
  getBleedAreaRect,
  getCornerRadiusPx,
  type DevicePreviewDimensions,
  type Rect,
} from '@/lib/skin-engine/geometry';
import { buildCameraSubtractionPath, resolveCameraGeometry, type CameraGeometry } from '@/lib/skin-engine/svgPath';
import { buildBodyClipPath } from '@/lib/skin-engine/maskEngine';

export interface PhoneTemplate {
  device: DeviceModel;
  dims: DevicePreviewDimensions;
  clipId: string;
  bodyPath: string;
  cornerRadiusPx: number;
  cameraGeo: CameraGeometry | null;
  cameraSubtractionPath: string | null;
  printableRect: Rect;
  safeAreaRect: Rect;
  bleedAreaRect: Rect;
}

const FALLBACK_DEVICE_ID = 'iphone-16-pro-max';
const CONTAINER_HEIGHT_DEFAULT = 560;

export function usePhoneTemplate(
  deviceId: string,
  containerHeightPx: number = CONTAINER_HEIGHT_DEFAULT
): PhoneTemplate | null {
  const device = useMemo(() => {
    return deviceModels.find((d) => d.id === deviceId) ??
      deviceModels.find((d) => d.id === FALLBACK_DEVICE_ID) ??
      deviceModels[0];
  }, [deviceId]);

  return useMemo(() => {
    if (!device) return null;

    const dims = getDevicePreviewDimensions(device, containerHeightPx);
    const { clipId, bodyPath } = buildBodyClipPath(device, dims, 'editor');
    const cornerRadiusPx = getCornerRadiusPx(device, dims);

    const cameraGeo = device.cameraModule
      ? resolveCameraGeometry(device.cameraModule, dims)
      : null;

    const cameraSubtractionPath = device.cameraModule
      ? buildCameraSubtractionPath(device.cameraModule, dims)
      : null;

    const printableRect = getPrintableRect(dims);
    const safeAreaRect = getSafeAreaRect(dims);
    const bleedAreaRect = getBleedAreaRect(dims);

    return {
      device,
      dims,
      clipId,
      bodyPath,
      cornerRadiusPx,
      cameraGeo,
      cameraSubtractionPath,
      printableRect,
      safeAreaRect,
      bleedAreaRect,
    };
  }, [device, containerHeightPx]);
}

/**
 * useResizeObservedHeight — Tracks the actual pixel height of a container element.
 */
export function useResizeObservedHeight(
  ref: React.RefObject<HTMLElement | null>,
  fallback: number = CONTAINER_HEIGHT_DEFAULT
): number {
  const [height, setHeight] = useState<number>(fallback);

  const observe = useCallback(() => {
    if (ref.current) {
      setHeight(ref.current.clientHeight || fallback);
    }
  }, [ref, fallback]);

  useEffect(() => {
    observe();
    if (!ref.current) return;
    const ro = new ResizeObserver(observe);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [observe, ref]);

  return height;
}
