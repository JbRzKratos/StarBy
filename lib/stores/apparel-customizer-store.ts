import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  color: string;
  view: GarmentView;
  designsByView: Record<GarmentView, DesignState>;

  setGarment: (g: GarmentType) => void;
  setColor: (c: string) => void;
  setView: (v: GarmentView) => void;
  setDesignImage: (view: GarmentView, url: string, width?: number, height?: number) => void;
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

export const useApparelCustomizerStore = create<ApparelCustomizerState>()(
  persist(
    (set) => ({
      ...defaultState,

      setGarment: (garment) =>
        set(() => ({
          garment,
          designsByView: { front: defaultDesign(), back: defaultDesign() },
        })),

      setColor: (color) => set(() => ({ color })),
      setView: (view) => set(() => ({ view })),

      setDesignImage: (view, url, _width = 300, _height = 300) =>
        set((state) => ({
          designsByView: {
            ...state.designsByView,
            [view]: {
              imageUrl: url,
              transform: state.designsByView[view].transform ?? {
                x: 0,
                y: 0,
                scaleX: 1,
                scaleY: 1,
                angle: 0,
                opacity: 1,
              },
            },
          },
        })),

      updateTransform: (view, transform) =>
        set((state) => {
          const current = state.designsByView[view].transform ?? {
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
          };
          return {
            designsByView: {
              ...state.designsByView,
              [view]: {
                ...state.designsByView[view],
                transform: { ...current, ...transform },
              },
            },
          };
        }),

      clearDesign: (view) =>
        set((state) => ({
          designsByView: {
            ...state.designsByView,
            [view]: defaultDesign(),
          },
        })),

      reset: () => set(() => defaultState),
    }),
    {
      name: 'starby-apparel-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
