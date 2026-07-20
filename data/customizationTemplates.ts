export interface CustomizationTemplate {
  productId: string;
  mockupImage: string;
  printArea: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  };
  blendMode?: GlobalCompositeOperation; // For better realism on canvas
}

// These coordinate ratios assume a standard base mockup size, e.g., 800x800 for the generator.
// When compositing on canvas, we scale these relative to the canvas size.
export const templates: Record<string, CustomizationTemplate> = {
  'eclipse-tee': {
    productId: 'prod_001',
    mockupImage: '/images/products/eclipse_tee.png', // Assuming this exists or falls back to hero tees
    printArea: {
      x: 0.35, // 35% from left
      y: 0.25, // 25% from top
      width: 0.3, // 30% of image width
      height: 0.4, // 40% of image height
    },
    blendMode: 'multiply',
  },
  'orbit-hoodie': {
    productId: 'prod_002',
    mockupImage: '/images/products/orbit_hoodie.png',
    printArea: {
      x: 0.38,
      y: 0.3,
      width: 0.24,
      height: 0.25,
    },
    blendMode: 'multiply',
  },
  'phantom-skin': {
    productId: 'prod_003',
    mockupImage: '/images/products/phantom_skin.png',
    printArea: {
      x: 0.2,
      y: 0.1,
      width: 0.6,
      height: 0.8,
    },
  },
  'monolith-poster': {
    productId: 'prod_004',
    mockupImage: '/images/products/monolith_poster.png',
    printArea: {
      x: 0.1,
      y: 0.1,
      width: 0.8,
      height: 0.8,
    },
  },
  'prism-split': {
    productId: 'prod_005',
    mockupImage: '/images/hero/split_posters.png', // Fallback to hero image for split posters
    printArea: {
      x: 0.2,
      y: 0.2,
      width: 0.6,
      height: 0.6,
    },
  },
  'chronicle-diary': {
    productId: 'prod_006',
    mockupImage: '/images/hero/stationery.png', // Fallback to hero image
    printArea: {
      x: 0.25,
      y: 0.15,
      width: 0.5,
      height: 0.7,
      rotation: -10, // Simulate the isometric angle of the diary mockup
    },
  },
};
