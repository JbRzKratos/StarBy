'use client';

import dynamic from 'next/dynamic';
import { useDevice } from '@/lib/providers/device-provider';

const Desktop = dynamic(() => import('./hero.desktop').then((m) => m.HeroDesktop));
const Mobile = dynamic(() => import('./hero.mobile').then((m) => m.HeroMobile));

export function HeroClient() {
  const device = useDevice();

  if (device === 'mobile') return <Mobile />;
  return <Desktop />;
}
