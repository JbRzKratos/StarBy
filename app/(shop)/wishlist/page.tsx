import type { Metadata } from 'next';
import { getProductsFromDB } from '@/lib/services/db-service';
import { WishlistClient } from '@/components/wishlist-client';

export const metadata: Metadata = {
  title: 'My Wishlist | StarBy',
  description: 'View your saved products.',
};

export default async function WishlistPage() {
  const products = await getProductsFromDB();

  return (
    <main className="pt-36 md:pt-40 pb-20 min-h-screen">
      <div className="section-container max-w-6xl">
        <div className="mb-12">
          <h1 className="font-display text-display-lg font-bold text-bone mb-4">My Wishlist</h1>
          <p className="text-pearl text-body-lg">Items you have saved for later.</p>
        </div>

        <WishlistClient products={products} />
      </div>
    </main>
  );
}
