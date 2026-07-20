import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/* ── Types ── */

export interface TextLayer {
  content: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  x: number;
  y: number;
  rotation: number;
}

export interface ImageLayer {
  url: string;
  width: number;
  height: number;
  x: number;
  y: number;
  rotation: number;
}

interface CustomizerState {
  productId: string | null;
  selectedColor: string;
  selectedSize: string;
  textLayers: TextLayer[];
  imageLayers: ImageLayer[];
  activeLayerIndex: number | null;
  canvasZoom: number;
  isDirty: boolean;
}

interface CustomizerActions {
  setProduct: (productId: string) => void;
  setColor: (color: string) => void;
  setSize: (size: string) => void;
  addTextLayer: (layer: TextLayer) => void;
  updateTextLayer: (index: number, updates: Partial<TextLayer>) => void;
  removeTextLayer: (index: number) => void;
  addImageLayer: (layer: ImageLayer) => void;
  updateImageLayer: (index: number, updates: Partial<ImageLayer>) => void;
  removeImageLayer: (index: number) => void;
  setActiveLayer: (index: number | null) => void;
  setCanvasZoom: (zoom: number) => void;
  resetCustomizer: () => void;
}

/* ── Initial State ── */

const initialState: CustomizerState = {
  productId: null,
  selectedColor: '#ffffff',
  selectedSize: 'M',
  textLayers: [],
  imageLayers: [],
  activeLayerIndex: null,
  canvasZoom: 1,
  isDirty: false,
};

/* ── Store ── */

export const useCustomizerStore = create<CustomizerState & CustomizerActions>()(
  devtools(
    (set) => ({
      ...initialState,

      setProduct: (productId) => set({ productId, isDirty: false }),
      setColor: (color) => set({ selectedColor: color, isDirty: true }),
      setSize: (size) => set({ selectedSize: size }),

      addTextLayer: (layer) =>
        set((state) => ({
          textLayers: [...state.textLayers, layer],
          isDirty: true,
        })),

      updateTextLayer: (index, updates) =>
        set((state) => ({
          textLayers: state.textLayers.map((l, i) => (i === index ? { ...l, ...updates } : l)),
          isDirty: true,
        })),

      removeTextLayer: (index) =>
        set((state) => ({
          textLayers: state.textLayers.filter((_, i) => i !== index),
          isDirty: true,
        })),

      addImageLayer: (layer) =>
        set((state) => ({
          imageLayers: [...state.imageLayers, layer],
          isDirty: true,
        })),

      updateImageLayer: (index, updates) =>
        set((state) => ({
          imageLayers: state.imageLayers.map((l, i) => (i === index ? { ...l, ...updates } : l)),
          isDirty: true,
        })),

      removeImageLayer: (index) =>
        set((state) => ({
          imageLayers: state.imageLayers.filter((_, i) => i !== index),
          isDirty: true,
        })),

      setActiveLayer: (index) => set({ activeLayerIndex: index }),
      setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),
      resetCustomizer: () => set(initialState),
    }),
    { name: 'CustomizerStore' },
  ),
);
