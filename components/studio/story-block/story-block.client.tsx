'use client';

import { StoryBlockDesktop } from './story-block.desktop';
import { StoryBlockMobile } from './story-block.mobile';
import type { StoryBlock as StoryBlockType } from '@/data/studio';

interface StoryBlockProps {
  block: StoryBlockType;
  index: number;
}

export function StoryBlockClient({ block, index }: StoryBlockProps) {
  return (
    <>
      <div className="hidden md:block">
        <StoryBlockDesktop block={block} index={index} />
      </div>
      <div className="block md:hidden">
        <StoryBlockMobile block={block} index={index} />
      </div>
    </>
  );
}
