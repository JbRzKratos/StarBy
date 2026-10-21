import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { getGarmentSizePrice } from '@/lib/config/garment-pricing';

/* ── Types ── */

export interface CartCustomization {
  color?: string;
  text?: string;
  textFont?: string;
  imageUrl?: string | null;

  // New production-grade customization fields
  designFileUrl?: string | null;
  previewFileUrl?: string | null;
  currentPreviewFileUrl?: string | null;
  frontDesignFileUrl?: string | null;
  frontPreviewFileUrl?: string | null;
  backDesignFileUrl?: string | null;
  backPreviewFileUrl?: string | null;
  leftSleeveDesignFileUrl?: string | null;
  leftSleevePreviewFileUrl?: string | null;
  rightSleeveDesignFileUrl?: string | null;
  rightSleevePreviewFileUrl?: string | null;
  printPosition?: string | null;
  printInstructions?: string | null;
  garmentId?: string | null;

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

function cartLineIdentity(item: CartItem): string {
  const c = item.customization;
  if (!c) return '';
  return String(
    c.designId ||
      c.magazineId ||
      c.printPdfUrl ||
      c.magazineTitle ||
      c.currentPreviewFileUrl ||
      c.frontDesignFileUrl ||
      '',
  );
}

function isSameCartLine(left: CartItem, right: CartItem): boolean {
  return (
    left.productId === right.productId &&
    left.variantId === right.variantId &&
    left.size === right.size &&
    cartLineIdentity(left) === cartLineIdentity(right)
  );
}

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
            const existing = state.items.find((i) => isSameCartLine(i, item));
            if (existing) {
              return {
                items: state.items.map((i) =>
                  isSameCartLine(i, item)
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
            const res = await fetch('/api/products/prices');
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

              // For custom clothing mockup items, recalculate with the same
              // rule the 3D studio and the checkout API use. Without this the
              // bag silently fell back to the design's catalogue price (e.g.
              // ₹600) after the customer picked a hoodie (₹750), so the header
              // and the bag disagreed.
              if (
                item.customization?.is3dMockup ||
                item.customization?.is2dMockup ||
                item.productId === 'clothing-mockup' ||
                item.variantId?.startsWith('mockup-3d-') ||
                item.variantId?.startsWith('mockup-2d-')
              ) {
                const custom = item.customization || {};
                const designId =
                  typeof custom.designId === 'string' ? custom.designId : undefined;
                const isDesign001 =
                  designId === 'design-001' || item.productId === 'design-001';
                const size =
                  item.size || (typeof custom.size === 'string' ? custom.size : 'L');
                const isPlain = Boolean(custom.isPlain) || !designId;
                const garmentKey =
                  (typeof custom.garmentId === 'string' ? custom.garmentId : undefined) ||
                  (typeof custom.garment === 'string' ? custom.garment : undefined) ||
                  item.variantId;

                const liveGarments = data.garments as
                  | Record<string, { basePrice?: number; sizePrices?: Record<string, number> }>
                  | undefined;
                const garmentPrice = getGarmentSizePrice(garmentKey, size, liveGarments);

                if (isDesign001) {
                  livePrice = 1;
                } else if (isPlain) {
                  // Garment price for the chosen size + ₹49 per custom print.
                  const count =
                    typeof custom.customArtworkCount === 'number'
                      ? custom.customArtworkCount
                      : 0;
                  livePrice = garmentPrice + count * 49;
                } else {
                  // Curated design: never below the garment price, exactly like
                  // the checkout (`max(design price, garment size price)`).
                  const cataloguePrice =
                    designId && typeof data.products?.[designId] === 'number'
                      ? data.products[designId]
                      : 0;
                  livePrice = Math.max(cataloguePrice, garmentPrice);
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
        storage: createJSONStorage(() => ({
          getItem: (key: string): string | null => {
            if (typeof window === 'undefined') return null;
            try {
              return window.localStorage.getItem(key);
            } catch {
              return null;
            }
          },
          setItem: (key: string, value: string): void => {
            if (typeof window === 'undefined') return;
            try {
              window.localStorage.setItem(key, value);
            } catch (quotaErr) {
              console.warn('[CartStore] Quota exceeded in localStorage.setItem, trimming items...', quotaErr);
              try {
                const parsed = JSON.parse(value);
                if (parsed?.state?.items && Array.isArray(parsed.state.items)) {
                  parsed.state.items = parsed.state.items.map((item: CartItem) => ({
                    ...item,
                    image:
                      typeof item.image === 'string' &&
                      item.image.startsWith('data:') &&
                      item.image.length > 50000
                        ? '/images/mockups/tee-black-front.png'
                        : item.image,
                    customization: sanitizeCustomizationForStorage(item.customization),
                  }));
                  window.localStorage.setItem(key, JSON.stringify(parsed));
                }
              } catch (retryErr) {
                console.error('[CartStore] Failed to write trimmed cart to localStorage:', retryErr);
              }
            }
          },
          removeItem: (key: string): void => {
            if (typeof window === 'undefined') return;
            try {
              window.localStorage.removeItem(key);
            } catch {}
          },
        })),
        // Only persist the cart items, not the drawer open state, with oversized data URL protection
        partialize: (state) => ({
          items: state.items.map((item) => ({
            ...item,
            image:
              typeof item.image === 'string' &&
              item.image.startsWith('data:') &&
              item.image.length > 50000
                ? getPlainMockupFallback(item.customization)
                : item.image,
            customization: sanitizeCustomizationForStorage(item.customization),
          })),
        }),
      },
    ),
    { name: 'CartStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);

function getPlainMockupFallback(cust: CartCustomization | null): string {
  const garment = String(cust?.garmentId || cust?.garment || '').toLowerCase();
  const family = garment.includes('hoodie')
    ? 'hoodie'
    : garment.includes('oversized')
      ? 'oversized-tee'
      : 'tee';
  const color = String(cust?.color || 'white').toLowerCase().replace('#', '');
  const isDark =
    color.length === 6
      ? parseInt(color.slice(0, 2), 16) * 0.299 +
          parseInt(color.slice(2, 4), 16) * 0.587 +
          parseInt(color.slice(4, 6), 16) * 0.114 <
        128
      : /black|navy|charcoal|maroon|brown|grey|gray/.test(color);
  return `/images/mockups/${family}-${isDark ? 'black' : 'white'}-front.webp`;
}

function sanitizeCustomizationForStorage(cust: CartCustomization | null): CartCustomization | null {
  if (!cust || typeof cust !== 'object') return cust;
  const copy: Record<string, unknown> = { ...cust };
  const keysToCheck = [
    'designFileUrl',
    'frontDesignFileUrl',
    'backDesignFileUrl',
    'leftSleeveDesignFileUrl',
    'rightSleeveDesignFileUrl',
    'previewFileUrl',
    'currentPreviewFileUrl',
    'frontPreviewFileUrl',
    'backPreviewFileUrl',
    'leftSleevePreviewFileUrl',
    'rightSleevePreviewFileUrl',
    'thumbnail',
    'imageUrl',
  ];

  for (const k of keysToCheck) {
    const val = copy[k];
    if (typeof val === 'string' && val.startsWith('data:image/') && val.length > 50000) {
      copy[k] = undefined;
    }
  }

  if (Array.isArray(copy.uploadedArtworks)) {
    copy.uploadedArtworks = copy.uploadedArtworks.map((art: unknown) => {
      if (!art || typeof art !== 'object') return art;
      const aCopy = { ...(art as Record<string, unknown>) };
      if (typeof aCopy.url === 'string' && aCopy.url.startsWith('data:image/') && aCopy.url.length > 50000) {
        aCopy.url = '';
      }
      if (typeof aCopy.dataUrl === 'string') {
        aCopy.dataUrl = undefined;
      }
      return aCopy;
    });
  }

  return copy as CartCustomization;
}
