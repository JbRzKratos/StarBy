'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ProductCardDesktop } from './product-card.desktop';
import { ProductCardMobile } from './product-card.mobile';
import { useDevice } from '@/lib/providers/device-provider';
import type { Product } from '@/data/products';
import type { ClothingDesignEntry } from '@/lib/clothing-designs/types';
import { loadDesign, prefetchDesign } from '@/lib/clothing-designs/client-cache';
import { ClothingProductModalLoading } from '@/components/shop/clothing-product-modal-loading';
import { prefetchClothingProductModal } from '@/components/shop/clothing-product-modal-prefetch';

// Lazy load ClothingProductModal only if triggered
const ClothingProductModal = dynamic(
  () => import('@/components/shop/clothing-product-modal').then((m) => m.ClothingProductModal),
  {
    ssr: false,
    loading: () => <ClothingProductModalLoading />,
  },
);

interface ProductCardProps {
  product: Product;
  onSelectDesign?: (design: ClothingDesignEntry) => void;
}

export function ProductCardClient({ product, onSelectDesign }: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [resolvedDesign, setResolvedDesign] = useState<ClothingDesignEntry | null>(null);
  const [mounted, setMounted] = useState(false);
  const device = useDevice();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Design products are identifiable without shipping the 190 KB manifest to
  // the browser. The single-design API response is small and cached on hover.
  const isDesignProduct =
    product.id.startsWith('design-') || product.tags?.includes('clothing-design');

  const handlePrefetch = useCallback(() => {
    if (!isDesignProduct) return;
    void prefetchDesign(product.id);
    prefetchClothingProductModal();
  }, [isDesignProduct, product.id]);

  const handleCardClick = async (e: React.MouseEvent) => {
    if (!isDesignProduct) return;

    e.preventDefault();
    e.stopPropagation();

    if (isOpening) return;
    setIsOpening(true);

    try {
      let design = resolvedDesign;
      if (!design) {
        design = await loadDesign(product.id);
        if (design) setResolvedDesign(design);
      }

      if (!design) {
        // Not in the catalogue — fall back to the normal product page.
        window.location.href = `/products/${product.categorySlug}/${product.slug}`;
        return;
      }

      if (onSelectDesign) {
        onSelectDesign(design);
      } else {
        setIsModalOpen(true);
      }
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <>
      {!mounted ? (
        <>
          <div className="hidden md:block">
            <ProductCardDesktop
              product={product}
              onCardClick={isDesignProduct ? handleCardClick : undefined}
              onPrefetch={isDesignProduct ? handlePrefetch : undefined}
            />
          </div>
          <div className="block md:hidden">
            <ProductCardMobile
              product={product}
              onCardClick={isDesignProduct ? handleCardClick : undefined}
              onPrefetch={isDesignProduct ? handlePrefetch : undefined}
            />
          </div>
        </>
      ) : device === 'desktop' ? (
        <ProductCardDesktop
          product={product}
          onCardClick={isDesignProduct ? handleCardClick : undefined}
          onPrefetch={isDesignProduct ? handlePrefetch : undefined}
        />
      ) : (
        <ProductCardMobile
          product={product}
          onCardClick={isDesignProduct ? handleCardClick : undefined}
          onPrefetch={isDesignProduct ? handlePrefetch : undefined}
        />
      )}

      {isOpening && !isModalOpen && <ClothingProductModalLoading />}

      {isModalOpen && resolvedDesign && (
        <ClothingProductModal
          design={resolvedDesign}
          onClose={() => setIsModalOpen(false)}
          defaultCategory={product.categorySlug === 'hoodies' ? 'hoodies' : 'tees'}
        />
      )}
    </>
  );
}
