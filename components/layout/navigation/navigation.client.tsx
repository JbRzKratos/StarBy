'use client';

import dynamic from 'next/dynamic';
import { useDevice } from '@/lib/providers/device-provider';

const Desktop = dynamic(() => import('./navigation.desktop').then((m) => m.NavigationDesktop));
const Mobile = dynamic(() => import('./navigation.mobile').then((m) => m.NavigationMobile));

export function NavigationClient() {
  const device = useDevice();

  if (device === 'mobile') return <Mobile />;
  return <Desktop />;
}
