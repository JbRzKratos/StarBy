import { create } from 'zustand';
import type { ProductType } from '@/lib/config/printSpecs';
import { validateImageResolution } from '@/lib/config/printSpecs';

interface SideDesign {
  url: string | null;
  width: number;
  height: number;
  effectiveDpi: number | null;
  dpiStatus: 'excellent' | 'good' | 'poor' | 'unusable' | null;
}

interface CustomizerState {
  productType: ProductType | null;
  productId: string | null;
  activeVariant: { id: string; price: number; [key: string]: unknown } | null;

  // Designs for front and back
  designs: {
    front: SideDesign;
    back: SideDesign;
  };

  setUploadedImage: (url: string, width: number, height: number, side: 'front' | 'back') => void;
  setEffectiveDpi: (dpi: number, status: 'excellent' | 'good' | 'poor' | 'unusable', side: 'front' | 'back') => void;

  // Fabric Canvas State
  exportPreviewFns: {
    front: (() => string) | null;
    back: (() => string) | null;
  };

  // Variant Configuration
  selectedColor: string;
  selectedSide: 'front' | 'back';

  // Actions
  setProduct: (type: ProductType, productId: string) => void;
  setActiveVariant: (variant: { id: string; price: number; [key: string]: unknown }) => void;
  registerExportFn: (side: 'front' | 'back', fn: () => string) => void;
  setSelectedColor: (color: string) => void;
  setSelectedSide: (side: 'front' | 'back') => void;
  reset: () => void;
}

const defaultSideDesign: SideDesign = {
  url: null,
  width: 0,
  height: 0,
  effectiveDpi: null,
  dpiStatus: null,
};

export const useCustomizerStore = create<CustomizerState>((set, get) => ({
  productType: null,
  productId: null,
  activeVariant: null,

  designs: {
    front: { ...defaultSideDesign },
    back: { ...defaultSideDesign },
  },

  exportPreviewFns: {
    front: null,
    back: null,
  },

  selectedColor: 'Black',
  selectedSide: 'front',

  setProduct: (type, productId) => set({ productType: type, productId }),

  setActiveVariant: (variant) => set({ activeVariant: variant }),

  setUploadedImage: (url, width, height, side) => {
    const { productType } = get();

    let effectiveDpi = null;
    let dpiStatus: SideDesign['dpiStatus'] = null;

    if (productType) {
      const validation = validateImageResolution(width, height, productType);
      effectiveDpi = validation.effectiveDpi;
      dpiStatus = validation.status;
    }

    set((state) => ({
      designs: {
        ...state.designs,
        [side]: {
          url,
          width,
          height,
          effectiveDpi,
          dpiStatus,
        },
      },
    }));
  },

  setEffectiveDpi: (dpi, status, side) =>
    set((state) => ({
      designs: {
        ...state.designs,
        [side]: {
          ...state.designs[side],
          effectiveDpi: dpi,
          dpiStatus: status,
        },
      },
    })),

  registerExportFn: (side, fn) =>
    set((state) => ({
      exportPreviewFns: {
        ...state.exportPreviewFns,
        [side]: fn,
      },
    })),

  setSelectedColor: (color) => set({ selectedColor: color }),
  setSelectedSide: (side) => set({ selectedSide: side }),

  reset: () =>
    set({
      productType: null,
      productId: null,
      activeVariant: null,
      designs: {
        front: { ...defaultSideDesign },
        back: { ...defaultSideDesign },
      },
      exportPreviewFns: {
        front: null,
        back: null,
      },
      selectedColor: 'Black',
      selectedSide: 'front',
    }),
}));
