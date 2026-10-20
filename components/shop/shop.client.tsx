'use client';

import { useEffect, useState } from 'react';
import { useDevice } from '@/lib/providers/device-provider';
import { ShopDesktop } from './shop.desktop';
import { ShopMobile } from './shop.mobile';
import type { Product } from '@/data/products';

export function ShopClient({ category, products }: { category: string; products: Product[] }) {
  const device = useDevice();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Server render keeps both trees so the first paint is correct at every width.
  // Once hydrated we keep only the active variant, removing the duplicate DOM,
  // state and scroll/animation work for the rest of the session.
  if (!mounted) {
    return (
      <>
        <div className="hidden md:block">
          <ShopDesktop category={category} products={products} />
        </div>
        <div className="block md:hidden">
          <ShopMobile category={category} products={products} />
        </div>
      </>
    );
  }

  return device === 'desktop' ? (
    <ShopDesktop category={category} products={products} />
  ) : (
    <ShopMobile category={category} products={products} />
  );
}
