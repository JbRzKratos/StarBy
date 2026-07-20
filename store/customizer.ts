import { create } from 'zustand';

interface CustomizerState {
  uploadedImage: string | null; // Data URL or Object URL
  composites: Record<string, string>; // Keyed by productId, value is Data URL of composite
  selectedDeviceId: string;
  splitStyle: 'classic' | 'stepped' | 'grid';
  splitOrientation: 'horizontal' | 'vertical';
  splitPanels: number;
  splitGridCols: number;
  splitGridRows: number;

  setUploadedImage: (image: string) => void;
  setComposite: (productId: string, composite: string) => void;
  setSelectedDevice: (deviceId: string) => void;
  setSplitStyle: (style: 'classic' | 'stepped' | 'grid') => void;
  setSplitOrientation: (orientation: 'horizontal' | 'vertical') => void;
  setSplitPanels: (panels: number) => void;
  setSplitGrid: (cols: number, rows: number) => void;
  clearUploadedImage: () => void;
}

export const useCustomizerStore = create<CustomizerState>((set) => ({
  uploadedImage: null,
  composites: {},
  selectedDeviceId: 'iphone-15-pro', // Default
  splitStyle: 'classic',
  splitOrientation: 'horizontal',
  splitPanels: 3,
  splitGridCols: 3,
  splitGridRows: 2,

  setUploadedImage: (image) =>
    set(() => ({
      uploadedImage: image,
      composites: {}, // Clear composites when a new image is uploaded
    })),

  setComposite: (productId, composite) =>
    set((state) => ({
      composites: { ...state.composites, [productId]: composite },
    })),

  setSelectedDevice: (deviceId) =>
    set(() => ({
      selectedDeviceId: deviceId,
    })),

  setSplitStyle: (style) => set(() => ({ splitStyle: style })),
  setSplitOrientation: (orientation) => set(() => ({ splitOrientation: orientation })),
  setSplitPanels: (panels) => set(() => ({ splitPanels: panels })),
  setSplitGrid: (cols, rows) => set(() => ({ splitGridCols: cols, splitGridRows: rows })),

  clearUploadedImage: () => set(() => ({ uploadedImage: null, composites: {} })),
}));
