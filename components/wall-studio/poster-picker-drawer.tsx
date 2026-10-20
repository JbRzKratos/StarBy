'use client';

import dynamic from 'next/dynamic';
import { useWallStudioStore } from '@/lib/wall-studio/store';

/**
 * The picker pulls in the 400 KB artwork catalogue and the recommendation
 * engine. Load it only after the user actually opens a poster slot.
 */
const PosterPickerContent = dynamic(
  () => import('./poster-picker-content').then((mod) => mod.PosterPickerContent),
  { ssr: false },
);

export const PosterPickerDrawer: React.FC = () => {
  const { isPickerOpen } = useWallStudioStore();
  if (!isPickerOpen) return null;
  return <PosterPickerContent />;
};
