'use client';

import dynamic from 'next/dynamic';
import { useDevice } from '@/lib/providers/device-provider';
import type { StoryBlock as StoryBlockType } from '@/data/studio';

const Desktop = dynamic(() => import('./story-block.desktop').then((m) => m.StoryBlockDesktop));
const Mobile = dynamic(() => import('./story-block.mobile').then((m) => m.StoryBlockMobile));

interface StoryBlockProps {
  block: StoryBlockType;
  index: number;
}

export function StoryBlockClient({ block, index }: StoryBlockProps) {
  const device = useDevice();

  if (device === 'mobile') return <Mobile block={block} index={index} />;
  return <Desktop block={block} index={index} />;
}
