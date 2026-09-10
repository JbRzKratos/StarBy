export type ProductType =
  't-shirt' | 'hoodie' | 'poster-single' | 'poster-split-3' | 'poster-split-5' | 'mug' | 'diary';

export interface PrintSpec {
  name: string;
  // Physical print dimensions (usually inches for apparel/posters)
  physicalDimensions: { width: number; height: number; unit: 'inch' | 'cm' | 'mm' };
  // Expected resolution logic
  targetDpi: number; // usually 300
  minimumDpi: number; // usually 150
  // Bounding box for the mockup image (relative percentages 0-100)
  mockupBoundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  // Optional: Some products have specific aspect ratios enforced
  enforceAspectRatio?: boolean;
}

export const PRINT_SPECS: Record<ProductType, PrintSpec> = {
  't-shirt': {
    name: 'T-Shirt',
    physicalDimensions: { width: 10, height: 12, unit: 'inch' }, // 10x12 inch chest print
    targetDpi: 300,
    minimumDpi: 150,
    mockupBoundingBox: { top: 25, left: 30, width: 40, height: 45 }, // example relative coords
  },
  hoodie: {
    name: 'Hoodie',
    physicalDimensions: { width: 10, height: 10, unit: 'inch' },
    targetDpi: 300,
    minimumDpi: 150,
    mockupBoundingBox: { top: 30, left: 30, width: 40, height: 35 },
  },
  'poster-single': {
    name: 'Single Poster',
    physicalDimensions: { width: 18, height: 24, unit: 'inch' },
    targetDpi: 300,
    minimumDpi: 150,
    mockupBoundingBox: { top: 5, left: 5, width: 90, height: 90 },
    enforceAspectRatio: false,
  },
  'poster-split-3': {
    name: '3-Panel Split Poster',
    physicalDimensions: { width: 24, height: 36, unit: 'inch' }, // Overall size
    targetDpi: 300,
    minimumDpi: 150,
    mockupBoundingBox: { top: 5, left: 5, width: 90, height: 90 },
  },
  'poster-split-5': {
    name: '5-Panel Split Poster',
    physicalDimensions: { width: 36, height: 48, unit: 'inch' }, // Overall size
    targetDpi: 300,
    minimumDpi: 150,
    mockupBoundingBox: { top: 5, left: 5, width: 90, height: 90 },
  },
  mug: {
    name: 'Mug',
    physicalDimensions: { width: 8.5, height: 3.5, unit: 'inch' }, // Wraparound print
    targetDpi: 300,
    minimumDpi: 150,
    mockupBoundingBox: { top: 15, left: 20, width: 60, height: 70 },
  },
  diary: {
    name: 'Personalized Diary',
    physicalDimensions: { width: 5.8, height: 8.3, unit: 'inch' }, // A5
    targetDpi: 300,
    minimumDpi: 150,
    mockupBoundingBox: { top: 10, left: 15, width: 70, height: 80 },
  },
};

/**
 * Validates the image resolution against the product specifications.
 */
export function validateImageResolution(
  imageWidthPx: number,
  imageHeightPx: number,
  productType: ProductType,
): { isValid: boolean; effectiveDpi: number; status: 'excellent' | 'good' | 'poor' | 'unusable' } {
  const spec = PRINT_SPECS[productType];
  const { width: physWidth, height: physHeight } = spec.physicalDimensions;

  // Assuming the user scales the image to fill the required dimensions.
  // We calculate the minimum DPI based on how the pixels stretch over the physical inches.
  const dpiX = imageWidthPx / physWidth;
  const dpiY = imageHeightPx / physHeight;
  const effectiveDpi = Math.min(dpiX, dpiY); // Bottleneck is the lowest DPI dimension

  if (effectiveDpi >= spec.targetDpi) {
    return { isValid: true, effectiveDpi, status: 'excellent' };
  }
  if (effectiveDpi >= spec.minimumDpi) {
    return { isValid: true, effectiveDpi, status: 'good' };
  }
  if (effectiveDpi >= spec.minimumDpi * 0.75) {
    return { isValid: true, effectiveDpi, status: 'poor' }; // Might print okay but blurry
  }

  return { isValid: false, effectiveDpi, status: 'unusable' };
}
