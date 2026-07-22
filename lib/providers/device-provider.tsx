'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type DeviceType = 'mobile' | 'desktop';

const DeviceContext = createContext<DeviceType>('desktop');

export function DeviceProvider({
  children,
  initialDevice,
}: {
  children: React.ReactNode;
  initialDevice: DeviceType;
}) {
  const [device, setDevice] = useState<DeviceType>(initialDevice);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(min-width: 768px)');

    // Sync immediately after mount (SSR always renders 'desktop').
    setDevice(mediaQuery.matches ? 'desktop' : 'mobile');

    let timeoutId: NodeJS.Timeout;

    const handleResize = (e: MediaQueryListEvent) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDevice(e.matches ? 'desktop' : 'mobile');
      }, 200);
    };

    mediaQuery.addEventListener('change', handleResize);

    return () => {
      clearTimeout(timeoutId);
      mediaQuery.removeEventListener('change', handleResize);
    };
    // Run once on mount — handleResize reads from the event, not the closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <DeviceContext.Provider value={device}>{children}</DeviceContext.Provider>;
}

export function useDevice() {
  return useContext(DeviceContext);
}
