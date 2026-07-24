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

  // Mugs & Cups specific state
  customText: string;
  customTextFont: string;
  customTextColor: string;
  mugLayout: 'single-panel' | 'full-wrap' | 'collage';
  isMagicMugRevealed: boolean;
  viewMode: '2d' | '3d';

  setCustomText: (text: string) => void;
  setCustomTextFont: (font: string) => void;
  setCustomTextColor: (color: string) => void;
  setMugLayout: (layout: 'single-panel' | 'full-wrap' | 'collage') => void;
  setIsMagicMugRevealed: (revealed: boolean) => void;
  setViewMode: (mode: '2d' | '3d') => void;
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
  customText: '',
  customTextFont: 'Space Grotesk',
  customTextColor: '#ffffff',
  mugLayout: 'single-panel',
  isMagicMugRevealed: false,
  viewMode: '2d',

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

  clearUploadedImage: () => set(() => ({ uploadedImage: null, composites: {}, customText: '' })),

  setCustomText: (text) => set(() => ({ customText: text })),
  setCustomTextFont: (font) => set(() => ({ customTextFont: font })),
  setCustomTextColor: (color) => set(() => ({ customTextColor: color })),
  setMugLayout: (layout) => set(() => ({ mugLayout: layout })),
  setIsMagicMugRevealed: (revealed) => set(() => ({ isMagicMugRevealed: revealed })),
  setViewMode: (mode) => set(() => ({ viewMode: mode })),

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
        customText: decoded.customText ?? state.customText,
        customTextFont: decoded.customTextFont ?? state.customTextFont,
        customTextColor: decoded.customTextColor ?? state.customTextColor,
        mugLayout: decoded.mugLayout ?? state.mugLayout,
        isMagicMugRevealed: decoded.isMagicMugRevealed ?? state.isMagicMugRevealed,
      }));
    } catch {
      // Ignore malformed hash
    }
  },
}));
