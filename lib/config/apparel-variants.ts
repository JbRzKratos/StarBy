/**
 * Authoritative Apparel Catalog & Approved Color Matrix
 * Single source of truth for all active apparel products, fabrics, GSM, and colors.
 * Strict rules: Only these 4 apparel products and their approved colors are permitted.
 */

export interface ApparelColorSwatch {
  name: string;
  hex: string;
  twClass?: string;
}

export interface ApparelProductConfig {
  id: 'regular-t-shirt' | 'oversized-t-shirt' | 'acid-wash-t-shirt' | 'hoodie';
  slug: string;
  name: string;
  garment3dId: string; // Mapped to 3D engine model in registry.ts
  fabric: string;
  gsm: number;
  basePrice: number;
  sizes: ('S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL')[];
  colors: ApparelColorSwatch[];
  description: string;
  defaultColorHex: string;
}

export const APPAREL_CONFIG: Record<string, ApparelProductConfig> = {
  'regular-t-shirt': {
    id: 'regular-t-shirt',
    slug: 'regular-t-shirt',
    name: 'Regular T-Shirt',
    garment3dId: 'regular-t-shirt',
    fabric: 'Cotton',
    gsm: 180,
    basePrice: 799,
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    defaultColorHex: '#FFFFFF',
    colors: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Black', hex: '#111215' },
      { name: 'Olive Green', hex: '#3B443B' },
      { name: 'C.Brown', hex: '#5A3825' },
      { name: 'Maroon', hex: '#800000' },
    ],
    description: '180 GSM 100% combed cotton, classic unisex cut with reinforced ribbing.',
  },
  'oversized-t-shirt': {
    id: 'oversized-t-shirt',
    slug: 'oversized-t-shirt',
    name: 'Oversized T-Shirt',
    garment3dId: 'oversized-t-shirt',
    fabric: 'French Terry',
    gsm: 240,
    basePrice: 999,
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    defaultColorHex: '#FFFFFF',
    colors: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Black', hex: '#111215' },
      { name: 'Dusky Pink', hex: '#D8A1A8' },
      { name: 'Beige', hex: '#D4C5B9' },
      { name: 'Navy Blue', hex: '#1B263B' },
    ],
    description: '240 GSM heavyweight French Terry, relaxed dropped-shoulder silhouette.',
  },
  'acid-wash-t-shirt': {
    id: 'acid-wash-t-shirt',
    slug: 'acid-wash-t-shirt',
    name: 'Acid Wash T-Shirt',
    garment3dId: 'acid-wash-t-shirt',
    fabric: 'Acid Washed Cotton',
    gsm: 240,
    basePrice: 1099,
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    defaultColorHex: '#2B2B2B',
    colors: [
      { name: 'Black', hex: '#2B2B2B' },
      { name: 'White', hex: '#E5E5E5' },
      { name: 'Violet', hex: '#5E4B8B' },
    ],
    description: '240 GSM premium heavy cotton with authentic vintage acid wash marbled finish.',
  },
  hoodie: {
    id: 'hoodie',
    slug: 'hoodie',
    name: 'Hoodie',
    garment3dId: 'hoodie',
    fabric: 'Heavy Fleece',
    gsm: 300,
    basePrice: 1499,
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    defaultColorHex: '#111215',
    colors: [
      { name: 'Black', hex: '#111215' },
      { name: 'White', hex: '#FFFFFF' },
    ],
    description: '300 GSM heavyweight brushed fleece pullover with double-layer drawstring hood.',
  },
};

export const APPAREL_LIST: ApparelProductConfig[] = Object.values(APPAREL_CONFIG);

export function getApparelConfig(id: string): ApparelProductConfig | undefined {
  return APPAREL_CONFIG[id];
}

export function validateApparelVariant(
  apparelId: string,
  colorName: string,
  size?: string,
): { valid: boolean; error?: string } {
  const config = APPAREL_CONFIG[apparelId];
  if (!config) {
    return { valid: false, error: `Invalid apparel type "${apparelId}". Allowed: Regular T-Shirt, Oversized T-Shirt, Acid Wash T-Shirt, Hoodie.` };
  }

  const validColor = config.colors.some(
    (c) => c.name.toLowerCase() === colorName.toLowerCase() || c.hex.toLowerCase() === colorName.toLowerCase(),
  );
  if (!validColor) {
    return {
      valid: false,
      error: `Color "${colorName}" is not available for ${config.name}. Approved colors: ${config.colors.map((c) => c.name).join(', ')}.`,
    };
  }

  if (size && !config.sizes.some((s) => s === size)) {
    return {
      valid: false,
      error: `Size "${size}" is not valid. Available sizes: ${config.sizes.join(', ')}.`,
    };
  }

  return { valid: true };
}
