import type { Metadata } from 'next';
import { SavedDesigns } from '@/components/account/saved-designs';

export const metadata: Metadata = {
  title: 'My Designs | StarBy',
  description: 'View your saved custom designs.',
};

export default function AccountDesignsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-display-sm font-bold text-bone mb-2">My Designs</h1>
        <p className="text-pearl font-mono text-sm">
          Access and manage your saved custom merchandise designs.
        </p>
      </div>

      <SavedDesigns />
    </div>
  );
}
