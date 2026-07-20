'use client';

import dynamic from 'next/dynamic';
import { useDevice } from '@/lib/providers/device-provider';

const Desktop = dynamic(() =>
  import('./CustomizerHub.desktop').then((m) => m.CustomizerPanelDesktop),
);
const Mobile = dynamic(() => import('./CustomizerHub.mobile').then((m) => m.CustomizerPanelMobile));

export function CustomizerHubClient() {
  const device = useDevice();

  if (device === 'mobile') {
    return (
      <div className="w-full px-5 pt-40 pb-24 min-h-screen flex flex-col">
        <Mobile />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-8 pt-40 pb-24">
      <Desktop />
    </div>
  );
}
