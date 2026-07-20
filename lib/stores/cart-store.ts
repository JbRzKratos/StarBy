import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/* ── Types ── */

export interface CartCustomization {
  color: string;
  text: string;
  textFont: string;
  imageUrl: string | null;
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  size?: string;
  customization: CartCustomization | null;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

interface CartActions {
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId: string, size?: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number, size?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
  totalItems: () => number;
  totalPrice: () => number;
}

/* ── Store ── */

export const useCartStore = create<CartState & CartActions>()(
  devtools(
    persist(
      (set, get) => ({
        /* State */
        items: [],
        isOpen: false,

        /* Actions */
        addItem: (item) =>
          set((state) => {
            const existing = state.items.find(
              (i) =>
                i.productId === item.productId &&
                i.variantId === item.variantId &&
                i.size === item.size,
            );
            if (existing) {
              return {
                items: state.items.map((i) =>
                  i.productId === item.productId &&
                  i.variantId === item.variantId &&
                  i.size === item.size
                    ? { ...i, quantity: i.quantity + item.quantity }
                    : i,
                ),
              };
            }
            return { items: [...state.items, item] };
          }),

        removeItem: (productId, variantId, size) =>
          set((state) => ({
            items: state.items.filter(
              (i) => !(i.productId === productId && i.variantId === variantId && i.size === size),
            ),
          })),

        updateQuantity: (productId, variantId, quantity, size) =>
          set((state) => ({
            items: state.items.map((i) =>
              i.productId === productId && i.variantId === variantId && i.size === size
                ? { ...i, quantity }
                : i,
            ),
          })),

        clearCart: () => set({ items: [] }),
        toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
        setCartOpen: (open) => set({ isOpen: open }),

        totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
        totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      }),
      { name: 'starby-cart' },
    ),
    { name: 'CartStore' },
  ),
);
