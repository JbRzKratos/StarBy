'use client';

/**
 * Warm the lazy modal chunk without blocking the click. Used by gallery cards
 * and product grids on hover/focus (and once during idle on the gallery).
 */
export function prefetchClothingProductModal(): void {
  void import('./clothing-product-modal').catch(() => {
    // A failed prefetch is harmless; the click still triggers a fresh import.
  });
}
