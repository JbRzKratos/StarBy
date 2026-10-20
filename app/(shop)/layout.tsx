import type { ReactNode } from 'react';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { GlobalOverlays } from '@/components/layout/global-overlays';

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navigation variant="solid" />
      <GlobalOverlays />
      {children}
      <Footer />
    </>
  );
}
