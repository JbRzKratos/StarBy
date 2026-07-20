'use client';

import { useEffect, type ReactNode } from 'react';

/**
 * Initializes GSAP plugins and reduced-motion config on mount.
 * Wrap the app with this provider in the root layout.
 */
export function GsapProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    /**
     * Dynamic import ensures GSAP config (plugin registration + matchMedia)
     * runs only on the client, once, at app boot.
     */
    const init = async () => {
      await import('@/lib/gsap-config');
    };
    void init();
  }, []);

  return <>{children}</>;
}
