'use client';

import dynamic from 'next/dynamic';
import { useDevice } from '@/lib/providers/device-provider';

const Desktop = dynamic(() => import('./Customizer.desktop').then((m) => m.CustomizerDesktop));
const Mobile = dynamic(() => import('./Customizer.mobile').then((m) => m.CustomizerMobile));

export function CustomizerClient({ productId }: { productId: string }) {
  const device = useDevice();

  if (device === 'mobile') return <Mobile productId={productId} />;
  return <Desktop productId={productId} />;
}
