import { create } from 'zustand';

export interface Transform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  opacity: number;
}

export interface SkinCustomizerState {
  deviceType: 'phone' | 'laptop' | null;
  brand: string | null;
  model: string | null;
  variant: string | null;
  designImage: string | null;
  transform: Transform | null;

  setDevice: (
    deviceType: 'phone' | 'laptop' | null,
    brand: string | null,
    model: string | null,
    variant: string | null,
  ) => void;
  setDesignImage: (url: string | null) => void;
  updateTransform: (t: Partial<Transform>) => void;
  reset: () => void;
}

export const useSkinCustomizerStore = create<SkinCustomizerState>((set) => ({
  deviceType: null,
  brand: null,
  model: null,
  variant: null,
  designImage: null,
  transform: null,

  setDevice: (deviceType, brand, model, variant) =>
    set({
      deviceType,
      brand,
      model,
      variant,
      // When changing device, reset the transform so the image cover-fits again
      transform: null,
    }),

  setDesignImage: (designImage) => set({ designImage, transform: null }),

  updateTransform: (t) =>
    set((state) => ({
      transform: state.transform ? { ...state.transform, ...t } : (t as Transform),
    })),

  reset: () =>
    set({
      deviceType: null,
      brand: null,
      model: null,
      variant: null,
      designImage: null,
      transform: null,
    }),
}));
