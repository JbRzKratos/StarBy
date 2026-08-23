'use client';

import { ProductCardDesktop } from './product-card.desktop';
import { ProductCardMobile } from './product-card.mobile';
import type { Product } from '@/data/products';

interface ProductCardProps {
  product: Product;
}

export function ProductCardClient({ product }: ProductCardProps) {
  return (
    <>
      <div className="hidden md:block">
        <ProductCardDesktop product={product} />
      </div>
      <div className="block md:hidden">
        <ProductCardMobile product={product} />
      </div>
    </>
  );
}
