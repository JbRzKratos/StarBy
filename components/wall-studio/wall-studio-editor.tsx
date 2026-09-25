'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWallStudioStore } from '@/lib/wall-studio/store';
import { getLayoutById } from '@/lib/wall-studio/layouts-data';
import { getPrebuiltWallBySlug } from '@/lib/wall-studio/prebuilt-walls-data';
import { WallToolbar } from './wall-toolbar';
import { WallCanvas } from './wall-canvas';
import { PosterPickerDrawer } from './poster-picker-drawer';
import { CustomImageModal } from './custom-image-modal';
import { LayoutSelectorModal } from './layout-selector-modal';
import { FregoroCuratorModal } from './fregoro-curator-modal';
import { ShareWallModal } from './share-wall-modal';
import { DesignPlacementsModal } from './design-placements-modal';
import { WallSummaryBar } from './wall-summary-bar';

export const WallStudioEditor: React.FC = () => {
  const searchParams = useSearchParams();
  const { setLayout, themeFill } = useWallStudioStore();

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
    <div className="relative w-full h-screen pt-0 bg-[#090A0C] text-white flex flex-col overflow-hidden">
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
