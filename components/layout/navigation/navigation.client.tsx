'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { NavigationDesktop } from './navigation.desktop';
import { NavigationMobile } from './navigation.mobile';

export interface NavigationProps {
  variant?: 'hero' | 'solid';
}

export function NavigationClient({ variant = 'solid' }: NavigationProps) {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktop(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  // ONLY the homepage ('/') can ever use a hero navbar (transparent with dark text).
  // All other pages must strictly use a solid dark navbar with white text.
  // Wall Studio provides its own dedicated full-bleed studio toolbar to prevent double headers
  if (pathname?.startsWith('/wall-studio')) {
    return null;
  }

  const effectiveVariant = pathname === '/' ? variant : 'solid';

  // First render (SSR + hydration) keeps both trees so the correct bar paints
  // immediately at every width. After mount, only the active navigation stays
  // mounted — one scroll listener, one auth listener, one offer marquee.
  if (isDesktop === null) {
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

  return isDesktop ? (
    <NavigationDesktop variant={effectiveVariant} />
  ) : (
    <NavigationMobile variant={effectiveVariant} />
  );
}
