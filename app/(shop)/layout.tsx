import type { ReactNode } from 'react';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/layout/cart-drawer';
import { WishlistDrawer } from '@/components/layout/wishlist-drawer';
import { SearchOverlay } from '@/components/layout/search-overlay';

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navigation />
      <CartDrawer />
      <WishlistDrawer />
      <SearchOverlay />
      {children}
      <Footer />
    </>
  );
}
