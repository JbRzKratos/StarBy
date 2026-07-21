import { create } from 'zustand';

export type PrintStyle = 'standard' | 'vintage' | 'metallic' | 'embroidered';

interface CustomizerState {
  uploadedImage: string | null; // Data URL or Object URL
  composites: Record<string, string>; // Keyed by productId, value is Data URL of composite
  selectedDeviceId: string;
  splitStyle: 'classic' | 'stepped' | 'grid';
  splitOrientation: 'horizontal' | 'vertical';
  splitPanels: number;
  splitGridCols: number;
  splitGridRows: number;
  printStyle: PrintStyle;

  setUploadedImage: (image: string) => void;
  setComposite: (productId: string, composite: string) => void;
  setSelectedDevice: (deviceId: string) => void;
  setSplitStyle: (style: 'classic' | 'stepped' | 'grid') => void;
  setSplitOrientation: (orientation: 'horizontal' | 'vertical') => void;
  setSplitPanels: (panels: number) => void;
  setSplitGrid: (cols: number, rows: number) => void;
  setPrintStyle: (style: PrintStyle) => void;
  clearUploadedImage: () => void;
  loadFromShareHash: () => void;
}

export const useCustomizerStore = create<CustomizerState>((set) => ({
  uploadedImage: null,
  composites: {},
  selectedDeviceId: 'iphone-16-pro-max', // Default — first entry in devices.ts
  splitStyle: 'classic',
  splitOrientation: 'horizontal',
  splitPanels: 3,
  splitGridCols: 3,
  splitGridRows: 2,
  printStyle: 'standard',

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
  setPrintStyle: (style) => set(() => ({ printStyle: style })),

  clearUploadedImage: () => set(() => ({ uploadedImage: null, composites: {} })),

  loadFromShareHash: () => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    try {
      const decoded = JSON.parse(atob(hash)) as Partial<CustomizerState>;
      set((state) => ({
        ...state,
        splitStyle: decoded.splitStyle ?? state.splitStyle,
        splitOrientation: decoded.splitOrientation ?? state.splitOrientation,
        splitPanels: decoded.splitPanels ?? state.splitPanels,
        splitGridCols: decoded.splitGridCols ?? state.splitGridCols,
        splitGridRows: decoded.splitGridRows ?? state.splitGridRows,
        printStyle: decoded.printStyle ?? state.printStyle,
      }));
    } catch {
      // Ignore malformed hash
    }
  },
}));
