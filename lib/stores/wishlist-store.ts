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
  syncWithDb: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState & WishlistActions>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        isOpen: false,
        toggleItem: async (productId) => {
          const state = get();
          const isRemoving = state.items.includes(productId);

          set((state) => {
            if (isRemoving) {
              return { items: state.items.filter((id) => id !== productId) };
            }
            return { items: [...state.items, productId] };
          });

          // Sync with server in background
          try {
            if (isRemoving) {
              await fetch('/api/wishlist', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId }),
              });
            } else {
              await fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productIds: [productId] }),
              });
            }
          } catch {
            // silent fail for guests
          }
        },
        hasItem: (productId) => get().items.includes(productId),
        clearWishlist: () => set({ items: [] }),
        setWishlistOpen: (open) => set({ isOpen: open }),
        syncWithDb: async () => {
          try {
            // First push local items to DB
            const currentItems = get().items;
            if (currentItems.length > 0) {
              await fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productIds: currentItems }),
              });
            }
            // Then fetch unified list
            const res = await fetch('/api/wishlist');
            const data = await res.json();
            if (res.ok && data.success && Array.isArray(data.items)) {
              const ids = (
                data.items as { productId?: string; product?: { id: string }; id?: string }[]
              ).map((i) => i.productId || i.product?.id || i.id);
              set({ items: ids.filter(Boolean) });
            }
          } catch (e) {
            console.error('Wishlist sync failed', e);
          }
        },
      }),
      { name: 'starby-wishlist' },
    ),
    { name: 'WishlistStore' },
  ),
);
