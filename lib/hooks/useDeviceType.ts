'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to track device type across resize events.
 * @param initialDevice The SSR-determined device type from cookies.
 * @returns 'mobile' | 'desktop'
 */
export function useDeviceType(initialDevice: 'mobile' | 'desktop') {
  const [device, setDevice] = useState<'mobile' | 'desktop'>(initialDevice);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    // Use Pass 2 breakpoint (768px for tablet/desktop)
    const mediaQuery = window.matchMedia('(min-width: 768px)');

    // Initial sync just in case cookie was wrong (e.g., cached page)
    const currentDevice = mediaQuery.matches ? 'desktop' : 'mobile';
    if (currentDevice !== device) {
      setDevice(currentDevice);
    }

    let timeoutId: NodeJS.Timeout;

    const handleResize = (e: MediaQueryListEvent) => {
      clearTimeout(timeoutId);
      // Debounce the swap by 200ms
      timeoutId = setTimeout(() => {
        setDevice(e.matches ? 'desktop' : 'mobile');
      }, 200);
    };

    mediaQuery.addEventListener('change', handleResize);

    return () => {
      clearTimeout(timeoutId);
      mediaQuery.removeEventListener('change', handleResize);
    };
  }, [device]);

  return device;
}
