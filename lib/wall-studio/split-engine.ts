import type { WallSplitGroup, PosterSize, CropData } from './types';
import { PHYSICAL_SIZES_MM } from './types';

export interface ResolutionAssessment {
  quality: 'excellent' | 'good' | 'low' | 'too-low';
  dpi: number;
  message: string;
  recommendedMinWidth: number;
  recommendedMinHeight: number;
}

export interface PanelSliceCoordinates {
  panelIndex: number;
  totalPanels: number;
  clipLeftPercent: number; // 0% to 100%
  clipRightPercent: number;
  bgSizeXPercent: number;
  bgSizeYPercent: number;
  bgPositionXPercent: number;
  bgPositionYPercent: number;
}

/**
 * Calculates continuous CSS background/clip properties for a split panel.
 * When slot and groupSlots are provided, computes exact bounding box mapping
 * ensuring horizontal and vertical optical continuity across any multi-panel arrangement.
 */
export function calculatePanelSlice(
  panelIndex: number,
  totalPanels: number,
  currentSlot?: { x: number; y: number; width: number; height: number; panelIndex?: number | null },
  groupSlots?: Array<{ x: number; y: number; width: number; height: number; panelIndex?: number | null }>,
): PanelSliceCoordinates {
  if (currentSlot && groupSlots && groupSlots.length > 0) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    groupSlots.forEach((s) => {
      minX = Math.min(minX, s.x);
      maxX = Math.max(maxX, s.x + s.width);
      minY = Math.min(minY, s.y);
      maxY = Math.max(maxY, s.y + s.height);
    });

    const groupWidth = Math.max(0.0001, maxX - minX);
    const groupHeight = Math.max(0.0001, maxY - minY);

    const bgSizeXPercent = (groupWidth / currentSlot.width) * 100;
    const bgSizeYPercent = (groupHeight / currentSlot.height) * 100;

    const relX = currentSlot.x - minX;
    const relY = currentSlot.y - minY;
    const remX = groupWidth - currentSlot.width;
    const remY = groupHeight - currentSlot.height;

    const bgPositionXPercent = remX > 0.0001 ? (relX / remX) * 100 : 50;
    const bgPositionYPercent = remY > 0.0001 ? (relY / remY) * 100 : 50;

    const panelWidthFrac = 1 / totalPanels;
    return {
      panelIndex,
      totalPanels,
      clipLeftPercent: panelIndex * panelWidthFrac * 100,
      clipRightPercent: (1 - (panelIndex + 1) * panelWidthFrac) * 100,
      bgSizeXPercent,
      bgSizeYPercent,
      bgPositionXPercent,
      bgPositionYPercent,
    };
  }

  const panelWidthFrac = 1 / totalPanels;
  const clipLeftPercent = panelIndex * panelWidthFrac * 100;
  const clipRightPercent = (1 - (panelIndex + 1) * panelWidthFrac) * 100;

  // For CSS background positioning with background-size: `${totalPanels * 100}% 100%`
  const bgSizeXPercent = totalPanels * 100;
  const bgSizeYPercent = 100;
  const bgPositionXPercent = totalPanels > 1 ? (panelIndex / (totalPanels - 1)) * 100 : 50;
  const bgPositionYPercent = 50;

  return {
    panelIndex,
    totalPanels,
    clipLeftPercent,
    clipRightPercent,
    bgSizeXPercent,
    bgSizeYPercent,
    bgPositionXPercent,
    bgPositionYPercent,
  };
}

/**
 * Assess image resolution for single poster or multi-panel split prints.
 * Evaluates real DPI for physical millimeter dimensions.
 */
export function assessImageResolution(
  pixelWidth: number,
  pixelHeight: number,
  physicalSize: PosterSize,
  isSplit: boolean = false,
  panelCount: number = 1,
): ResolutionAssessment {
  const baseMm = PHYSICAL_SIZES_MM[physicalSize] || PHYSICAL_SIZES_MM.A3;
  const totalWidthMm = isSplit ? baseMm.widthMm * panelCount : baseMm.widthMm;
  const totalHeightMm = baseMm.heightMm;

  // Convert mm to inches: 1 inch = 25.4 mm
  const widthInches = totalWidthMm / 25.4;
  const heightInches = totalHeightMm / 25.4;

  const dpiX = pixelWidth / widthInches;
  const dpiY = pixelHeight / heightInches;
  const effectiveDpi = Math.round(Math.min(dpiX, dpiY));

  const recommendedMinWidth = Math.round(widthInches * 150);
  const recommendedMinHeight = Math.round(heightInches * 150);

  if (effectiveDpi >= 250) {
    return {
      quality: 'excellent',
      dpi: effectiveDpi,
      message: 'Ultra-crisp gallery exhibition quality (300 DPI target met).',
      recommendedMinWidth,
      recommendedMinHeight,
    };
  }

  if (effectiveDpi >= 150) {
    return {
      quality: 'good',
      dpi: effectiveDpi,
      message: 'Sharp fine-art print quality. Suitable for wall display.',
      recommendedMinWidth,
      recommendedMinHeight,
    };
  }

  if (effectiveDpi >= 100) {
    return {
      quality: 'low',
      dpi: effectiveDpi,
      message: 'Acceptable from a viewing distance, but may show softness up close.',
      recommendedMinWidth,
      recommendedMinHeight,
    };
  }

  return {
    quality: 'too-low',
    dpi: effectiveDpi,
    message: 'Resolution is too low for this size. Image will look pixelated.',
    recommendedMinWidth,
    recommendedMinHeight,
  };
}

/**
 * Generates continuous normalized sub-crop data for each panel in a split group
 */
export function generatePanelSubCrops(
  baseCrop: CropData = { focusX: 0.5, focusY: 0.5, zoom: 1.0, rotation: 0 },
  splitGroup: WallSplitGroup,
): Record<string, CropData> {
  const panelCount = splitGroup.panelCount;
  const crops: Record<string, CropData> = {};

  splitGroup.slotIds.forEach((slotId, index) => {
    // Sub-slice focus calculation
    crops[slotId] = {
      ...baseCrop,
      focusX: (index + 0.5) / panelCount,
      aspectRatio: 1 / panelCount,
    };
  });

  return crops;
}
