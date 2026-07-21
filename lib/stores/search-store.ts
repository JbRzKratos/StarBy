import { create } from 'zustand';

interface SearchState {
  isOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  isOpen: false,
  setSearchOpen: (open) => set({ isOpen: open }),
}));
