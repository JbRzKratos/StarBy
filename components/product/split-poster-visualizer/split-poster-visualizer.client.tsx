'use client';

import { SplitPosterVisualizerDesktop } from './split-poster-visualizer.desktop';
import { SplitPosterVisualizerMobile } from './split-poster-visualizer.mobile';

export function SplitPosterVisualizerClient() {
  return (
    <>
      <div className="hidden md:block">
        <SplitPosterVisualizerDesktop />
      </div>
      <div className="block md:hidden">
        <SplitPosterVisualizerMobile />
      </div>
    </>
  );
}
