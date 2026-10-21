'use client';

import { useEffect, useState } from 'react';
import { useDevice } from '@/lib/providers/device-provider';
import { ShopDesktop } from './shop.desktop';
import { ShopMobile } from './shop.mobile';
import type { Product } from '@/data/products';
import type { CatalogDesignEntry } from '@/lib/clothing-designs/catalog-page';

export function ShopClient({
  category,
  products,
  initialDesigns,
  initialTotal,
  initialTotalPages,
}: {
  category: string;
  products: Product[];
  initialDesigns?: CatalogDesignEntry[];
  initialTotal?: number;
  initialTotalPages?: number;
}) {
  const device = useDevice();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Server render keeps both trees so the first paint is correct at every width.
  // Once hydrated we keep only the active variant, removing the duplicate DOM,
  // state and scroll/animation work for the rest of the session.
  if (!mounted) {
    return (
      <>
        <div className="hidden md:block">
          <ShopDesktop
            category={category}
            products={products}
            initialDesigns={initialDesigns}
            initialTotal={initialTotal}
            initialTotalPages={initialTotalPages}
          />
        </div>
        <div className="block md:hidden">
          <ShopMobile
            category={category}
            products={products}
            initialDesigns={initialDesigns}
            initialTotal={initialTotal}
            initialTotalPages={initialTotalPages}
          />
        </div>
      </>
    );
  }

  return device === 'desktop' ? (
    <ShopDesktop
      category={category}
      products={products}
      initialDesigns={initialDesigns}
      initialTotal={initialTotal}
      initialTotalPages={initialTotalPages}
    />
  ) : (
    <ShopMobile
      category={category}
      products={products}
      initialDesigns={initialDesigns}
      initialTotal={initialTotal}
      initialTotalPages={initialTotalPages}
    />
  );
}
