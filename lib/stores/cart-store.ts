import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/* ── Types ── */

export interface CartCustomization {
  color?: string;
  text?: string;
  textFont?: string;
  imageUrl?: string | null;

  // New production-grade customization fields
  designFileUrl?: string | null;
  previewFileUrl?: string | null;
  frontDesignFileUrl?: string | null;
  frontPreviewFileUrl?: string | null;
  backDesignFileUrl?: string | null;
  backPreviewFileUrl?: string | null;
  printPosition?: string | null;
  printInstructions?: string | null;

  // Apparel customizer fields (legacy)
  thumbnail?: string | undefined;
  garment?: string | undefined;
  view?: string | undefined;
  designFront?: string | undefined;
  designBack?: string | undefined;
  // Magazine customizer fields
  magazineId?: string | undefined;
  magazineTitle?: string | undefined;
  pageCount?: number | undefined;
  coverFinish?: string | undefined;
  paperWeight?: string | undefined;
  bindingType?: string | undefined;
  pdfType?: string | undefined;
  fileName?: string | undefined;
  fileSizeMb?: number | undefined;
  binding?: string | undefined;
  document?: unknown;
  pagesData?: unknown;

  // Wall Studio fields
  isWallProduct?: boolean | undefined;
  layoutName?: string | undefined;
  layoutSlug?: string | undefined;
  layoutId?: string | undefined;
  physicalPrintCount?: number | undefined;
  coverageLabel?: string | undefined;
  frameMaterial?: string | undefined;
  finishType?: string | undefined;
  slotsData?: unknown;

  [key: string]: unknown;
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  size?: string;
  name?: string;
  variant?: string;
  image?: string;
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
  syncPrices: () => Promise<void>;
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
        toggleCart: () => {
          const next = !get().isOpen;
          if (next) void get().syncPrices();
          set({ isOpen: next });
        },
        setCartOpen: (open) => {
          if (open) void get().syncPrices();
          set({ isOpen: open });
        },

        syncPrices: async () => {
          const currentItems = get().items;
          if (currentItems.length === 0) return;
          try {
            const res = await fetch('/api/products/prices', { cache: 'no-store' });
            if (!res.ok) return;
            const data = await res.json();
            if (!data?.success) return;

            let changed = false;
            const updated = currentItems.map((item) => {
              let livePrice: number | undefined;

              // Check variants first
              if (item.variantId && data.variants?.[item.variantId]) {
                livePrice = data.variants[item.variantId].price;
              } else if (item.productId && data.products?.[item.productId]) {
                livePrice = data.products[item.productId];
              }

              // Also check wall layouts and prebuilt setups for live pricing
              if (item.customization?.isWallProduct || item.productId.startsWith('wall_') || item.productId.startsWith('prebuilt_')) {
                const layoutSlug = (item.customization?.layoutSlug as string) || (item.customization?.layoutId as string);
                if (layoutSlug && data.wallLayouts?.[layoutSlug] !== undefined) {
                  livePrice = data.wallLayouts[layoutSlug];
                } else if (item.productId && data.products?.[item.productId] !== undefined) {
                  livePrice = data.products[item.productId];
                } else if (layoutSlug && data.prebuiltWalls?.[layoutSlug] !== undefined) {
                  livePrice = data.prebuiltWalls[layoutSlug];
                }
              }

              let liveName: string | undefined;
              if (item.productId && data.names?.[item.productId]) {
                liveName = data.names[item.productId];
              }

              let itemChanged = false;
              let nextPrice = item.price;
              let nextName = item.name;

              if (typeof livePrice === 'number' && livePrice !== item.price && livePrice >= 0) {
                nextPrice = livePrice;
                itemChanged = true;
              }

              if (typeof liveName === 'string' && liveName && liveName !== item.name) {
                nextName = liveName;
                itemChanged = true;
              }

              if (itemChanged) {
                changed = true;
                return { ...item, price: nextPrice, ...(nextName ? { name: nextName } : {}) };
              }
              return item;
            });

            if (changed) {
              set({ items: updated });
            }
          } catch (err) {
            console.warn('[CartStore] syncPrices error:', err);
          }
        },

        totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
        totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      }),
      {
        name: 'starby-cart',
        // Only persist the cart items, not the drawer open state
        partialize: (state) => ({ items: state.items }),
      },
    ),
    { name: 'CartStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);
