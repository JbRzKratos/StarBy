import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface WishlistState {
  items: string[]; // array of productIds
  isOpen: boolean;
}

interface WishlistActions {
  toggleItem: (productId: string) => void;
  hasItem: (productId: string) => boolean;
  clearWishlist: () => void;
  setWishlistOpen: (open: boolean) => void;
}

export const useWishlistStore = create<WishlistState & WishlistActions>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        isOpen: false,
        toggleItem: (productId) =>
          set((state) => {
            if (state.items.includes(productId)) {
              return { items: state.items.filter((id) => id !== productId) };
            }
            return { items: [...state.items, productId] };
          }),
        hasItem: (productId) => get().items.includes(productId),
        clearWishlist: () => set({ items: [] }),
        setWishlistOpen: (open) => set({ isOpen: open }),
      }),
      { name: 'starby-wishlist' },
    ),
    { name: 'WishlistStore' },
  ),
);
