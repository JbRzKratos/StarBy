'use client';

import { usePathname } from 'next/navigation';
import { NavigationDesktop } from './navigation.desktop';
import { NavigationMobile } from './navigation.mobile';

export interface NavigationProps {
  variant?: 'hero' | 'solid';
}

export function NavigationClient({ variant = 'solid' }: NavigationProps) {
  const pathname = usePathname();

  // ONLY the homepage ('/') can ever use a hero navbar (transparent with dark text).
  // All other pages must strictly use a solid dark navbar with white text.
  // Wall Studio provides its own dedicated full-bleed studio toolbar to prevent double headers
  if (pathname?.startsWith('/wall-studio')) {
    return null;
  }

  const effectiveVariant = pathname === '/' ? variant : 'solid';

  return (
    <>
      <div className="hidden lg:block">
        <NavigationDesktop variant={effectiveVariant} />
      </div>
      <div className="block lg:hidden">
        <NavigationMobile variant={effectiveVariant} />
      </div>
    </>
  );
}
