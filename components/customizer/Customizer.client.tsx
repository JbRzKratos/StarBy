'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useDevice } from '@/lib/providers/device-provider';

const Desktop = dynamic(() => import('./Customizer.desktop').then((m) => m.CustomizerDesktop), {
  ssr: false,
  loading: () => (
    <div className="section-container min-h-screen pt-36 md:pt-40 pb-20 flex items-center justify-center">
      <div className="w-full h-[600px] bg-charcoal/50 animate-pulse rounded-xl" />
    </div>
  ),
});

const Mobile = dynamic(() => import('./Customizer.mobile').then((m) => m.CustomizerMobile), {
  ssr: false,
  loading: () => (
    <div className="section-container min-h-screen pt-36 pb-20 flex items-center justify-center">
      <div className="w-full h-[500px] bg-charcoal/50 animate-pulse rounded-xl" />
    </div>
  ),
});

export function CustomizerClient({ productId }: { productId: string }) {
  const device = useDevice();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="section-container min-h-screen pt-36 md:pt-40 pb-20 flex items-center justify-center">
        <div className="w-full h-[600px] bg-charcoal/50 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (device === 'mobile') return <Mobile productId={productId} />;
  return <Desktop productId={productId} />;
}
