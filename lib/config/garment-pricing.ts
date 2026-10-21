/**
 * Authoritative garment price table shared by the storefront, the 3D studio
 * bridge and the checkout API.
 *
 * The four core garments are live-editable from the admin panel (they map to
 * the `plain_*` products in Postgres). The remaining entries cover the extra
 * models the 3D studio can load from a deep link so a garment never falls back
 * to a silent ₹600 default.
 *
 * Keep this table in sync with `Clothing-Mockup-Feature/app/src/App.tsx`
 * (`GARMENT_DEFAULT_BASE_PRICES`). The studio additionally receives the live
 * values from `/api/products/prices` (`garments`) at runtime.
 */

export interface GarmentPricing {
  id: string;
  name: string;
  basePrice: number;
  sizePrices: Record<string, number>;
}

const STANDARD_SIZES = ['S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', 'XXXL'] as const;

function sizeMap(base: number, extended: number): Record<string, number> {
  const map: Record<string, number> = {};
  for (const size of STANDARD_SIZES) {
    map[size] = size === '3XL' || size === 'XXXL' ? extended : base;
  }
  return map;
}

function garment(
  id: string,
  name: string,
  basePrice: number,
  extended3xl: number,
): GarmentPricing {
  return { id, name, basePrice, sizePrices: sizeMap(basePrice, extended3xl) };
}

export const GARMENT_PRICING: Record<string, GarmentPricing> = {
  'regular-t-shirt': garment('regular-t-shirt', 'Regular T-Shirt', 600, 645),
  'oversized-t-shirt': garment('oversized-t-shirt', 'Oversized T-Shirt', 670, 699),
  'acid-wash-t-shirt': garment('acid-wash-t-shirt', 'Acid Wash T-Shirt', 699, 720),
  hoodie: garment('hoodie', 'Hoodie', 750, 780),
  'fitted-t-shirt': garment('fitted-t-shirt', 'Fitted T-Shirt', 620, 665),
  'zip-hoodie': garment('zip-hoodie', 'Zip-Up Hoodie', 850, 880),
  sweatshirt: garment('sweatshirt', 'Crewneck Sweatshirt', 800, 830),
  sweatpants: garment('sweatpants', 'Sweatpants', 700, 750),
  jeans: garment('jeans', 'Denim Jeans', 999, 1049),
  'tank-top': garment('tank-top', 'Tank Top', 500, 545),
  cap: garment('cap', 'Baseball Cap', 399, 399),
  balaclava: garment('balaclava', 'Balaclava', 349, 349),
};

/** Plain catalogue product id -> 3D garment id (live admin price overrides). */
export const PLAIN_PRODUCT_TO_GARMENT: Record<string, string> = {
  plain_regular_tee: 'regular-t-shirt',
  'regular-t-shirt': 'regular-t-shirt',
  plain_oversized_tee: 'oversized-t-shirt',
  'oversized-t-shirt': 'oversized-t-shirt',
  plain_acid_wash_tee: 'acid-wash-t-shirt',
  'acid-wash-t-shirt': 'acid-wash-t-shirt',
  plain_hoodie: 'hoodie',
  hoodie: 'hoodie',
};

/**
 * Resolve a free-form garment string (studio garment id, product name, variant
 * id, URL param) to a known garment id. Returns `null` when nothing matches so
 * callers can decide on their own fallback.
 */
export function normalizeGarmentId(raw?: string | null): string | null {
  if (!raw) return null;
  const value = raw.toLowerCase();
  if (GARMENT_PRICING[value]) return value;

  // Longest/most specific keywords first.
  if (value.includes('zip') && value.includes('hood')) return 'zip-hoodie';
  if (value.includes('acid')) return 'acid-wash-t-shirt';
  if (value.includes('oversized')) return 'oversized-t-shirt';
  if (value.includes('sweatpant') || value.includes('jogger')) return 'sweatpants';
  if (value.includes('sweatshirt') || value.includes('crewneck') || value.includes('crew neck')) {
    return 'sweatshirt';
  }
  if (value.includes('jeans') || value.includes('denim')) return 'jeans';
  if (value.includes('tank')) return 'tank-top';
  if (value.includes('balaclava')) return 'balaclava';
  if (value.includes('cap') || value.includes('hat')) return 'cap';
  if (value.includes('hood')) return 'hoodie';
  if (value.includes('fitted')) return 'fitted-t-shirt';
  if (value.includes('regular') || value.includes('t-shirt') || value.includes('tee')) {
    return 'regular-t-shirt';
  }
  return null;
}

function normalizeSize(size?: string | null): string {
  return (size || 'L').trim().toUpperCase();
}

function lookupSizePrice(
  sizePrices: Record<string, number> | null | undefined,
  size: string,
): number | undefined {
  if (!sizePrices) return undefined;
  const direct = sizePrices[size];
  if (typeof direct === 'number' && Number.isFinite(direct)) return direct;
  if (size === '2XL' && typeof sizePrices.XXL === 'number') return sizePrices.XXL;
  if (size === 'XXL' && typeof sizePrices['2XL'] === 'number') return sizePrices['2XL'];
  if (size === '3XL' && typeof sizePrices.XXXL === 'number') return sizePrices.XXXL;
  if (size === 'XXXL' && typeof sizePrices['3XL'] === 'number') return sizePrices['3XL'];
  const fallback = sizePrices.L ?? sizePrices.M ?? sizePrices.S;
  return typeof fallback === 'number' ? fallback : undefined;
}

/**
 * Size-aware garment price. `overrides` lets callers pass the live map returned
 * by `/api/products/prices` (or any admin-driven snapshot).
 */
export function getGarmentSizePrice(
  garmentId: string | null | undefined,
  size?: string | null,
  overrides?: Record<string, { basePrice?: number; sizePrices?: Record<string, number> }> | null,
): number {
  const resolvedId = normalizeGarmentId(garmentId) || 'regular-t-shirt';
  const live = overrides?.[resolvedId];
  const table = GARMENT_PRICING[resolvedId] || GARMENT_PRICING['regular-t-shirt'];

  const liveSizePrice = lookupSizePrice(live?.sizePrices, normalizeSize(size));
  if (typeof liveSizePrice === 'number') return liveSizePrice;

  const tableSizePrice = lookupSizePrice(table.sizePrices, normalizeSize(size));
  if (typeof tableSizePrice === 'number') return tableSizePrice;

  if (typeof live?.basePrice === 'number' && live.basePrice > 0) return live.basePrice;
  return table.basePrice;
}

/** Base (L-size) garment price, used for `max()` style curated pricing. */
export function getGarmentBasePrice(
  garmentId: string | null | undefined,
  overrides?: Record<string, { basePrice?: number; sizePrices?: Record<string, number> }> | null,
): number {
  return getGarmentSizePrice(garmentId, 'L', overrides);
}

/**
 * Curated designs are priced at whichever is higher: the design's own catalogue
 * price or the selected garment's price. This is the exact rule the checkout
 * applies server-side, so the studio total always matches what is charged.
 */
export function getCuratedUnitPrice(
  designBasePrice: number,
  garmentId: string | null | undefined,
  size?: string | null,
  overrides?: Record<string, { basePrice?: number; sizePrices?: Record<string, number> }> | null,
): number {
  const designPrice = Number.isFinite(designBasePrice) && designBasePrice > 0 ? designBasePrice : 0;
  const garmentPrice = getGarmentSizePrice(garmentId, size, overrides);
  return Math.max(designPrice, garmentPrice);
}

export const GARMENT_PRICING_LIST: GarmentPricing[] = Object.values(GARMENT_PRICING);
