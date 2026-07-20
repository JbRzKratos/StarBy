'use client';

import dynamic from 'next/dynamic';
import { useDevice } from '@/lib/providers/device-provider';
import type { Product } from '@/data/products';

const Desktop = dynamic(() => import('./shop.desktop').then((m) => m.ShopDesktop));
const Mobile = dynamic(() => import('./shop.mobile').then((m) => m.ShopMobile));

export function ShopClient({ category, products }: { category: string; products: Product[] }) {
  const device = useDevice();

  if (device === 'mobile') return <Mobile category={category} products={products} />;
  return <Desktop category={category} products={products} />;
}
