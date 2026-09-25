import type { WallLayoutData, SlotSelection, PosterSize } from './types';
import { getLayoutById } from './layouts-data';

export interface PriceBreakdown {
  basePrice: number;
  compareAtPrice: number;
  customUploadSurcharge: number;
  customUploadCount: number;
  totalSavings: number;
  finalPrice: number;
  physicalPrintCount: number;
  logicalArtworkCount: number;
  sizeCounts: Record<PosterSize, number>;
}

const CUSTOM_UPLOAD_FEE = 49; // ₹49 per custom customer upload for print proofing

/**
 * Deterministic Price Calculator used by both client preview and server-side verification.
 * NEVER TRUST CLIENT-SUBMITTED PRICE.
 */
export function calculateWallPrice(
  layout: WallLayoutData,
  selections: Record<string, SlotSelection>,
): PriceBreakdown {
  const basePrice = layout.basePrice;
  const compareAtPrice = layout.compareAtPrice || Math.round(basePrice * 1.35);

  let customUploadCount = 0;
  const sizeCounts: Record<PosterSize, number> = {
    A0: 0,
    A1: 0,
    A2: 0,
    A3: 0,
    A4: 0,
    A5: 0,
    A6: 0,
    '13x19': 0,
    CUSTOM: 0,
  };

  // Count physical sizes and custom uploads
  for (const slot of layout.slots) {
    if (slot.size && sizeCounts[slot.size] !== undefined) {
      sizeCounts[slot.size] += 1;
    }

    const sel = selections[slot.id];
    if (sel?.isCustomUpload) {
      customUploadCount += 1;
    }
  }

  const customUploadSurcharge = customUploadCount * CUSTOM_UPLOAD_FEE;
  const finalPrice = Math.round(basePrice + customUploadSurcharge);
  const totalSavings = Math.max(0, compareAtPrice - finalPrice);

  return {
    basePrice,
    compareAtPrice,
    customUploadSurcharge,
    customUploadCount,
    totalSavings,
    finalPrice,
    physicalPrintCount: layout.physicalPrintCount,
    logicalArtworkCount: layout.logicalArtworkCount,
    sizeCounts,
  };
}

/**
 * Server-side recalculation helper from layoutId
 */
export function verifyWallPriceServer(
  layoutIdOrSlug: string,
  selections: Record<string, SlotSelection>,
): PriceBreakdown | null {
  const layout = getLayoutById(layoutIdOrSlug);
  if (!layout) return null;
  return calculateWallPrice(layout, selections);
}
