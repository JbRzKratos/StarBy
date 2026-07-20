import type { ReactNode } from 'react';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/layout/cart-drawer';

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navigation />
      <CartDrawer />
      {children}
      <Footer />
    </>
  );
}
