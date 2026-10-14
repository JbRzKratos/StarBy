'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWallStudioStore } from '@/lib/wall-studio/store';
import { getLayoutById } from '@/lib/wall-studio/layouts-data';
import { getPrebuiltWallBySlug } from '@/lib/wall-studio/prebuilt-walls-data';
import dynamic from 'next/dynamic';
import { WallToolbar } from './wall-toolbar';
import { WallCanvas } from './wall-canvas';
import { PosterPickerDrawer } from './poster-picker-drawer';
import { WallSummaryBar } from './wall-summary-bar';

const CustomImageModal = dynamic(
  () => import('./custom-image-modal').then((m) => m.CustomImageModal),
  { ssr: false },
);
const LayoutSelectorModal = dynamic(
  () => import('./layout-selector-modal').then((m) => m.LayoutSelectorModal),
  { ssr: false },
);
const DesignPlacementsModal = dynamic(
  () => import('./design-placements-modal').then((m) => m.DesignPlacementsModal),
  { ssr: false },
);
const FregoroCuratorModal = dynamic(
  () => import('./fregoro-curator-modal').then((m) => m.FregoroCuratorModal),
  { ssr: false },
);
const ShareWallModal = dynamic(
  () => import('./share-wall-modal').then((m) => m.ShareWallModal),
  { ssr: false },
);

export const WallStudioEditor: React.FC = () => {
  const searchParams = useSearchParams();
  const { setLayout, themeFill, syncLayoutPrices } = useWallStudioStore();

  // Fetch live layout base prices from PostgreSQL in real-time
  useEffect(() => {
    async function fetchLivePrices() {
      try {
        const res = await fetch('/api/products/prices', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.wallLayouts) {
            syncLayoutPrices(data.wallLayouts);
          }
        }
      } catch (err) {
        console.warn('Could not sync wall studio live prices:', err);
      }
    }
    fetchLivePrices();
  }, [syncLayoutPrices]);

  // Handle URL query parameters (e.g. ?layout=stepped-grand or ?prebuilt=batman-archive or ?theme=cars)
  useEffect(() => {
    const layoutParam = searchParams.get('layout');
    const prebuiltParam = searchParams.get('prebuilt');
    const themeParam = searchParams.get('theme');

    if (prebuiltParam) {
      const prebuilt = getPrebuiltWallBySlug(prebuiltParam);
      if (prebuilt) {
        setLayout(prebuilt.layoutId, prebuilt.presetSelections);
        return;
      }
    }

    if (layoutParam) {
      const layout = getLayoutById(layoutParam);
      if (layout) {
        setLayout(layout.id);
      }
    }

    if (themeParam) {
      themeFill(themeParam);
    }
  }, [searchParams, setLayout, themeFill]);

  return (
    <div className="relative w-full h-[100dvh] pt-0 bg-[#090A0C] text-white flex flex-col overflow-hidden">
      {/* ─── STREAMLINED MINIMALIST STUDIO HEADER ─── */}
      <WallToolbar />

      {/* ─── MAIN RESPONSIVE WALL CANVAS VIEWPORT (75-85% Viewport Immersion) ─── */}
      <main className="relative flex-1 w-full overflow-hidden flex items-center justify-center">
        <WallCanvas />
        {/* ─── POSTER PICKER SIDEBAR DRAWER (Docked inside canvas, never overlaps topbar) ─── */}
        <PosterPickerDrawer />
      </main>

      {/* ─── BOTTOM STICKY SUMMARY & CHECKOUT BAR ─── */}
      <WallSummaryBar />

      {/* ─── MODALS ─── */}
      <CustomImageModal />
      <LayoutSelectorModal />
      <DesignPlacementsModal />
      <FregoroCuratorModal />
      <ShareWallModal />
    </div>
  );
};
