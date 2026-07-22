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
    productId: 'prod_002',
    mockupImage: '/images/products/eclipse-tee.webp',
    printArea: {
      x: 0.34, // Perfectly centered (0.34 + 0.32/2 = 0.5)
      y: 0.26, // Pushed down to sit cleanly below the collar
      width: 0.32, // Slightly narrowed for a more realistic max print width
      height: 0.44, // Adjusted height to match proportions
    },
    blendMode: 'source-over',
  },
  'orbit-hoodie': {
    productId: 'prod_007', // Orbit Hoodie
    mockupImage: '/images/products/orbit-hoodie.webp',
    printArea: {
      x: 0.35,
      y: 0.28,
      width: 0.3,
      height: 0.3,
    },
    blendMode: 'source-over',
  },
  'phantom-skin': {
    productId: 'prod_022', // Phantom Skin
    mockupImage: '/images/products/phantom-skin.webp',
    printArea: {
      x: 0.2,
      y: 0.1,
      width: 0.6,
      height: 0.8,
    },
  },
  'monolith-poster': {
    productId: 'prod_013', // Monolith Poster
    mockupImage: '/images/products/monolith-poster.webp',
    printArea: {
      x: 0.1,
      y: 0.1,
      width: 0.8,
      height: 0.8,
    },
  },
  'prism-split': {
    productId: 'prod_018', // Prism Split
    mockupImage: '/images/hero/split_posters.webp', // Fallback to hero image for split posters
    printArea: {
      x: 0.2,
      y: 0.2,
      width: 0.6,
      height: 0.6,
    },
  },
  'chronicle-diary': {
    productId: 'prod_032', // Chronicle Diary
    mockupImage: '/images/hero/stationery.webp', // Fallback to hero image
    printArea: {
      x: 0.38,
      y: 0.3,
      width: 0.35,
      height: 0.5,
      rotation: -26, // Steeper isometric angle to match the notebook cover
    },
  },
};
