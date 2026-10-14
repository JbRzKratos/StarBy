'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ProductCardDesktop } from './product-card.desktop';
import { ProductCardMobile } from './product-card.mobile';
import type { Product } from '@/data/products';
import { getDesignById } from '@/lib/clothing-designs/manifest';
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

  const clothingDesign: ClothingDesignEntry | null =
    getDesignById(product.id) ||
    getDesignById(product.slug) ||
    (product.id.startsWith('design-') || product.tags?.includes('clothing-design')
      ? getDesignById(product.id)
      : null);

  const handleCardClick = (e: React.MouseEvent) => {
    if (clothingDesign) {
      e.preventDefault();
      e.stopPropagation();
      if (onSelectDesign) {
        onSelectDesign(clothingDesign);
      } else {
        setIsModalOpen(true);
      }
    }
  };

  return (
    <>
      <div className="hidden md:block">
        <ProductCardDesktop
          product={product}
          onCardClick={clothingDesign ? handleCardClick : undefined}
        />
      </div>
      <div className="block md:hidden">
        <ProductCardMobile
          product={product}
          onCardClick={clothingDesign ? handleCardClick : undefined}
        />
      </div>

      {isModalOpen && clothingDesign && (
        <ClothingProductModal
          design={clothingDesign}
          onClose={() => setIsModalOpen(false)}
          defaultCategory={product.categorySlug === 'hoodies' ? 'hoodies' : 'tees'}
        />
      )}
    </>
  );
}

