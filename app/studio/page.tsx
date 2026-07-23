import type { Metadata } from 'next';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/layout/cart-drawer';
import { WishlistDrawer } from '@/components/layout/wishlist-drawer';
import { SearchOverlay } from '@/components/layout/search-overlay';
import { StoryHero } from '@/components/studio/story-hero';
import { StoryBlock } from '@/components/studio/story-block';
import { ProcessSection } from '@/components/studio/process-section';
import { ValuesGrid } from '@/components/studio/values-grid';
import { storyBlocks } from '@/data/studio';

export const metadata: Metadata = {
  title: 'Studio',
  description: "The StarBy story. We don't sell products — we sell self-expression.",
};

export default function StudioPage() {
  return (
    <>
      <Navigation />
      <CartDrawer />
      <WishlistDrawer />
      <SearchOverlay />
      <main>
        <StoryHero />
        {storyBlocks.map((block, i) => (
          <StoryBlock key={block.id} block={block} index={i} />
        ))}
        <ProcessSection />
        <ValuesGrid />
      </main>
      <Footer />
    </>
  );
}
