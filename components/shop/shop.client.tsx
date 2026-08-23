'use client';

import { ShopDesktop } from './shop.desktop';
import { ShopMobile } from './shop.mobile';
import type { Product } from '@/data/products';

export function ShopClient({ category, products }: { category: string; products: Product[] }) {
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
