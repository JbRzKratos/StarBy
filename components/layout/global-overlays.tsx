'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/lib/stores/cart-store';
import { useWishlistStore } from '@/lib/stores/wishlist-store';
import { useSearchStore } from '@/lib/stores/search-store';

const CartDrawer = dynamic(
  () => import('@/components/layout/cart-drawer').then((module) => module.CartDrawer),
  { ssr: false },
);
const WishlistDrawer = dynamic(
  () => import('@/components/layout/wishlist-drawer').then((module) => module.WishlistDrawer),
  { ssr: false },
);
const SearchOverlay = dynamic(
  () => import('@/components/layout/search-overlay').then((module) => module.SearchOverlay),
  { ssr: false },
);

/**
 * Storefront overlays are interaction-only UI. Loading these chunks eagerly
 * pulls the catalogue, GSAP, and checkout UI into the initial page even though
 * most visitors never open a drawer. Mount each overlay on first use, then keep
 * it mounted so close animations still run.
 */
export function GlobalOverlays() {
  const cartOpen = useCartStore((state) => state.isOpen);
  const wishlistOpen = useWishlistStore((state) => state.isOpen);
  const searchOpen = useSearchStore((state) => state.isOpen);

  const [cartLoaded, setCartLoaded] = useState(false);
  const [wishlistLoaded, setWishlistLoaded] = useState(false);
  const [searchLoaded, setSearchLoaded] = useState(false);

  useEffect(() => {
    if (cartOpen) setCartLoaded(true);
  }, [cartOpen]);

  useEffect(() => {
    if (wishlistOpen) setWishlistLoaded(true);
  }, [wishlistOpen]);

  useEffect(() => {
    if (searchOpen) setSearchLoaded(true);
  }, [searchOpen]);

  return (
    <>
      {(cartLoaded || cartOpen) && <CartDrawer />}
      {(wishlistLoaded || wishlistOpen) && <WishlistDrawer />}
      {(searchLoaded || searchOpen) && <SearchOverlay />}
    </>
  );
}
