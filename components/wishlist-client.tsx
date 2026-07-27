'use client';

import { useEffect, useState } from 'react';
import { useWishlistStore } from '@/lib/stores/wishlist-store';
import { ProductCard } from '@/components/product/product-card';
import type { Product } from '@/data/products';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export function WishlistClient({ products }: { products: Product[] }) {
  const { items, syncWithDb } = useWishlistStore();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser({ id: data.user.id });
      }
    });
  }, []);

  useEffect(() => {
    if (user) {
      syncWithDb();
    }
  }, [user, syncWithDb]);

  if (!mounted) return <div className="min-h-[400px]" />;

  const wishlistedProducts = products.filter((p) => items.includes(p.id));

  if (wishlistedProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-mono text-pearl mb-4">Your wishlist is empty</h2>
        <p className="text-ash mb-8">Save items you love to revisit them later.</p>
        <Link
          href="/products/all"
          className="px-8 py-3 border border-cobalt text-cobalt font-mono hover:bg-cobalt hover:text-bone transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {wishlistedProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
