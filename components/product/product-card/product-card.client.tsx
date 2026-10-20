'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ProductCardDesktop } from './product-card.desktop';
import { ProductCardMobile } from './product-card.mobile';
import type { Product } from '@/data/products';
import type { ClothingDesignEntry } from '@/lib/clothing-designs/types';

// Lazy load ClothingProductModal only if triggered
const ClothingProductModal = dynamic(
  () => import('@/components/shop/clothing-product-modal').then((m) => m.ClothingProductModal),
  { ssr: false },
);

interface ProductCardProps {
  product: Product;
  onSelectDesign?: (design: ClothingDesignEntry) => void;
}

export function ProductCardClient({ product, onSelectDesign }: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resolvedDesign, setResolvedDesign] = useState<ClothingDesignEntry | null>(null);

  // Design products are identifiable without the 190 KB manifest. The manifest
  // itself is imported only when a shopper actually opens the product.
  const isDesignProduct =
    product.id.startsWith('design-') || product.tags?.includes('clothing-design');

  const handleCardClick = async (e: React.MouseEvent) => {
    if (!isDesignProduct) return;

    e.preventDefault();
    e.stopPropagation();

    let design = resolvedDesign;
    if (!design) {
      const { getDesignById } = await import('@/lib/clothing-designs/manifest');
      design = getDesignById(product.id) || getDesignById(product.slug) || null;
      if (design) setResolvedDesign(design);
    }

    if (!design) {
      // Not in the manifest — fall back to the normal product page.
      window.location.href = `/products/${product.categorySlug}/${product.slug}`;
      return;
    }

    if (onSelectDesign) {
      onSelectDesign(design);
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div className="hidden md:block">
        <ProductCardDesktop
          product={product}
          onCardClick={isDesignProduct ? handleCardClick : undefined}
        />
      </div>
      <div className="block md:hidden">
        <ProductCardMobile
          product={product}
          onCardClick={isDesignProduct ? handleCardClick : undefined}
        />
      </div>

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

