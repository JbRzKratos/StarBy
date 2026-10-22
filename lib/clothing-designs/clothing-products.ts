import type { Product } from '@/data/products';
import clothingDesignProducts from '@/data/clothing-design-products.json';

/**
 * Returns the browser-safe Product records for curated clothing designs.
 *
 * The actual mapping is generated from `design-manifest.json` by
 * `scripts/generate-clothing-products.mjs`. Keeping it in JSON prevents the
 * private manifest (and its original R2 object keys) from entering any client
 * bundle through `data/products.ts`.
 */
export function getClothingDesignProducts(): Product[] {
  return clothingDesignProducts as Product[];
}
