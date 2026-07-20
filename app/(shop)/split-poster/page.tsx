import type { Metadata } from 'next';
import { SplitPosterVisualizer } from '@/components/product/split-poster-visualizer';

export const metadata: Metadata = {
  title: 'Split Poster Visualizer',
  description:
    'Transform any image into multi-panel wall art. Preview 2, 3, 4, or 6 panel configurations live.',
};

export default function SplitPosterPage() {
  return (
    <main className="pt-36 md:pt-40 pb-20">
      <div className="section-container">
        <div className="mb-12 max-w-2xl">
          <span className="overline-label block mb-3">Design Tool</span>
          <h1 className="font-display text-display-lg md:text-display-xl font-bold text-bone mb-4">
            Split Poster Visualizer
          </h1>
          <p className="text-pearl text-body-lg leading-relaxed">
            Upload any image and see it divided across multiple panels. Hover over the panels to
            preview the wall-art spacing effect. Choose your configuration and order directly.
          </p>
        </div>

        <SplitPosterVisualizer />
      </div>
    </main>
  );
}
