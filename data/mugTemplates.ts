export interface MugTemplate {
  productId: string;
  mockupImage: string;
  wrapType: 'full-wrap' | 'single-panel' | 'glass-see-through';
  handlePosition: 'left' | 'right' | 'hidden';
  isColorChanging: boolean;
  printArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  blendMode?: GlobalCompositeOperation;
  dimensions3D?: {
    radius: number;
    height: number;
    material: 'ceramic' | 'glass' | 'enamel' | 'matte';
    handleOffset: [number, number, number]; // x, y, z
    handleRadius: number;
    handleTube: number;
  };
}

export const mugTemplates: Record<string, MugTemplate> = {
  'classic-mug-11oz': {
    productId: 'prod_m01',
    mockupImage: '/images/products/classic_mug_11oz.png',
    wrapType: 'full-wrap',
    handlePosition: 'right',
    isColorChanging: false,
    printArea: {
      x: 0.3,
      y: 0.35,
      width: 0.4,
      height: 0.45,
    },
    blendMode: 'multiply',
    dimensions3D: {
      radius: 1.3,
      height: 2.5,
      material: 'ceramic',
      handleOffset: [1.3, 0, 0],
      handleRadius: 0.8,
      handleTube: 0.15,
    },
  },
  'classic-mug-15oz': {
    productId: 'prod_m02',
    mockupImage: '/images/products/classic_mug_15oz.png',
    wrapType: 'full-wrap',
    handlePosition: 'right',
    isColorChanging: false,
    printArea: {
      x: 0.3,
      y: 0.25,
      width: 0.4,
      height: 0.55,
    },
    blendMode: 'multiply',
    dimensions3D: {
      radius: 1.3,
      height: 3.0, // taller
      material: 'ceramic',
      handleOffset: [1.3, 0.2, 0],
      handleRadius: 1.0,
      handleTube: 0.15,
    },
  },
  'magic-mug': {
    productId: 'prod_m03',
    mockupImage: '/images/products/magic_mug.png',
    wrapType: 'full-wrap',
    handlePosition: 'right',
    isColorChanging: true,
    printArea: {
      x: 0.3,
      y: 0.35,
      width: 0.4,
      height: 0.45,
    },
    blendMode: 'source-over',
    dimensions3D: {
      radius: 1.3,
      height: 2.5,
      material: 'matte',
      handleOffset: [1.3, 0, 0],
      handleRadius: 0.8,
      handleTube: 0.15,
    },
  },
  'latte-mug': {
    productId: 'prod_m04',
    mockupImage: '/images/products/latte_mug.png',
    wrapType: 'single-panel',
    handlePosition: 'right',
    isColorChanging: false,
    printArea: {
      x: 0.3,
      y: 0.3,
      width: 0.4,
      height: 0.5,
    },
    blendMode: 'multiply',
    dimensions3D: {
      radius: 1.1, // top is wider but let's approximate
      height: 3.2,
      material: 'ceramic',
      handleOffset: [1.1, 0.3, 0],
      handleRadius: 1.0,
      handleTube: 0.12,
    },
  },
  'enamel-camping-mug': {
    productId: 'prod_m05',
    mockupImage: '/images/products/enamel_mug.png',
    wrapType: 'single-panel',
    handlePosition: 'right',
    isColorChanging: false,
    printArea: {
      x: 0.3,
      y: 0.35,
      width: 0.4,
      height: 0.45,
    },
    blendMode: 'multiply',
    dimensions3D: {
      radius: 1.5,
      height: 2.2,
      material: 'enamel',
      handleOffset: [1.5, 0, 0],
      handleRadius: 0.7,
      handleTube: 0.12,
    },
  },
  'heart-handle-mug': {
    productId: 'prod_m06',
    mockupImage: '/images/products/heart_mug.png',
    wrapType: 'single-panel',
    handlePosition: 'right',
    isColorChanging: false,
    printArea: {
      x: 0.3,
      y: 0.35,
      width: 0.4,
      height: 0.45,
    },
    blendMode: 'multiply',
    dimensions3D: {
      radius: 1.3,
      height: 2.5,
      material: 'ceramic',
      handleOffset: [1.3, 0, 0],
      handleRadius: 0.8,
      handleTube: 0.15, // A true heart needs custom geometry, we'll approximate
    },
  },
  'travel-tumbler': {
    productId: 'prod_m07',
    mockupImage: '/images/products/tumbler.png',
    wrapType: 'full-wrap',
    handlePosition: 'hidden',
    isColorChanging: false,
    printArea: {
      x: 0.3,
      y: 0.25,
      width: 0.4,
      height: 0.55,
    },
    blendMode: 'multiply',
    dimensions3D: {
      radius: 1.2,
      height: 3.5,
      material: 'enamel',
      handleOffset: [1.2, 0, 0], // Hidden handle anyway
      handleRadius: 0.01,
      handleTube: 0.01,
    },
  },
  'glass-coffee-cup': {
    productId: 'prod_m08',
    mockupImage: '/images/products/glass_mug.png',
    wrapType: 'glass-see-through',
    handlePosition: 'right',
    isColorChanging: false,
    printArea: {
      x: 0.3,
      y: 0.35,
      width: 0.4,
      height: 0.45,
    },
    blendMode: 'overlay',
    dimensions3D: {
      radius: 1.3,
      height: 2.2,
      material: 'glass',
      handleOffset: [1.3, 0, 0],
      handleRadius: 0.8,
      handleTube: 0.15,
    },
  },
};
