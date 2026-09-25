import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { WallStudioEditor } from '@/components/wall-studio/wall-studio-editor';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Fregoro Wall Studio — Physical Wall Art Composition Engine',
  description:
    'Physically design your wall composition before purchasing. Choose from 22 signature layouts, curated design placements, continuous multi-panel split posters, custom photo uploads, and smart curated themes.',
  keywords: [
    'wall studio',
    'wall composition',
    'split poster',
    'poster wall setup',
    'custom wall art',
    'curated gallery wall',
    'fregoro wall studio',
  ],
};

export default function WallStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen bg-[#090A0C] flex items-center justify-center text-white/50 font-mono text-xs">
          Loading Fregoro Wall Studio...
        </div>
      }
    >
      <WallStudioEditor />
    </Suspense>
  );
}
