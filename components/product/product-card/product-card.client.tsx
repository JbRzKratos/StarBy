'use client';

import dynamic from 'next/dynamic';
import { useDevice } from '@/lib/providers/device-provider';
import type { Product } from '@/data/products';

const Desktop = dynamic(() => import('./product-card.desktop').then((m) => m.ProductCardDesktop));
const Mobile = dynamic(() => import('./product-card.mobile').then((m) => m.ProductCardMobile));

interface ProductCardProps {
  product: Product;
}

export function ProductCardClient({ product }: ProductCardProps) {
  const device = useDevice();

  if (device === 'mobile') return <Mobile product={product} />;
  return <Desktop product={product} />;
}
