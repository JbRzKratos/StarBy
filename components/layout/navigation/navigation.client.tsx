'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useDevice } from '@/lib/providers/device-provider';

export interface NavigationProps {
  variant?: 'hero' | 'solid';
}

const Desktop = dynamic(() => import('./navigation.desktop').then((m) => m.NavigationDesktop));
const Mobile = dynamic(() => import('./navigation.mobile').then((m) => m.NavigationMobile));

export function NavigationClient({ variant = 'solid' }: NavigationProps) {
  const device = useDevice();
  const pathname = usePathname();

  // ONLY the homepage ('/') can ever use a hero navbar (transparent with dark text).
  // All other pages must strictly use a solid dark navbar with white text.
  const effectiveVariant = pathname === '/' ? variant : 'solid';

  if (device === 'mobile') return <Mobile variant={effectiveVariant} />;
  return <Desktop variant={effectiveVariant} />;
}
