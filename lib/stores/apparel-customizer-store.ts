import { create } from 'zustand';

export type GarmentType = 'tee' | 'oversized-tee' | 'hoodie';
export type GarmentView = 'front' | 'back';

export interface DesignTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  opacity: number;
}

interface DesignState {
  imageUrl: string | null;
  transform: DesignTransform | null;
}

const defaultDesign = (): DesignState => ({
  imageUrl: null,
  transform: null,
});

interface ApparelCustomizerState {
  garment: GarmentType;
  color: string; // color id — e.g. 'black', 'white', 'navy'
  view: GarmentView;
  designsByView: Record<GarmentView, DesignState>;

  // ── Actions ──
  setGarment: (g: GarmentType) => void;
  setColor: (c: string) => void;
  setView: (v: GarmentView) => void;
  setDesignImage: (view: GarmentView, url: string) => void;
  updateTransform: (view: GarmentView, transform: Partial<DesignTransform>) => void;
  clearDesign: (view: GarmentView) => void;
  reset: () => void;
}

const defaultState = {
  garment: 'tee' as GarmentType,
  color: 'black',
  view: 'front' as GarmentView,
  designsByView: {
    front: defaultDesign(),
    back: defaultDesign(),
  },
};

export const useApparelCustomizerStore = create<ApparelCustomizerState>((set) => ({
  ...defaultState,

  setGarment: (garment) =>
    set(() => ({
      garment,
      // Reset designs when switching garment type — print areas differ
      designsByView: { front: defaultDesign(), back: defaultDesign() },
    })),

  setColor: (color) => set(() => ({ color })),

  setView: (view) => set(() => ({ view })),

  setDesignImage: (view, url) =>
    set((state) => ({
      designsByView: {
        ...state.designsByView,
        [view]: { imageUrl: url, transform: null }, // null → canvas will compute default placement
      },
    })),

  updateTransform: (view, transform) =>
    set((state) => ({
      designsByView: {
        ...state.designsByView,
        [view]: {
          ...state.designsByView[view],
          transform: state.designsByView[view].transform
            ? { ...state.designsByView[view].transform, ...transform }
            : {
                x: 0,
                y: 0,
                scaleX: 1,
                scaleY: 1,
                angle: 0,
                opacity: 1,
                ...transform,
              },
        },
      },
    })),

  clearDesign: (view) =>
    set((state) => ({
      designsByView: {
        ...state.designsByView,
        [view]: defaultDesign(),
      },
    })),

  reset: () => set(() => ({ ...defaultState })),
}));
