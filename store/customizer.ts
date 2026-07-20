import { create } from 'zustand';

interface CustomizerState {
  uploadedImage: string | null; // Data URL or Object URL
  composites: Record<string, string>; // Keyed by productId, value is Data URL of composite

  setUploadedImage: (image: string) => void;
  setComposite: (productId: string, composite: string) => void;
  clearUploadedImage: () => void;
}

export const useCustomizerStore = create<CustomizerState>((set) => ({
  uploadedImage: null,
  composites: {},

  setUploadedImage: (image) =>
    set(() => ({
      uploadedImage: image,
      composites: {}, // Clear composites when a new image is uploaded
    })),

  setComposite: (productId, composite) =>
    set((state) => ({
      composites: { ...state.composites, [productId]: composite },
    })),

  clearUploadedImage: () => set(() => ({ uploadedImage: null, composites: {} })),
}));
