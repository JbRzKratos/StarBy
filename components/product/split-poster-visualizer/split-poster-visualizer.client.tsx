'use client';

import dynamic from 'next/dynamic';
import { useDevice } from '@/lib/providers/device-provider';

const Desktop = dynamic(() =>
  import('./split-poster-visualizer.desktop').then((m) => m.SplitPosterVisualizerDesktop),
);
const Mobile = dynamic(() =>
  import('./split-poster-visualizer.mobile').then((m) => m.SplitPosterVisualizerMobile),
);

export function SplitPosterVisualizerClient() {
  const device = useDevice();

  if (device === 'mobile') return <Mobile />;
  return <Desktop />;
}
