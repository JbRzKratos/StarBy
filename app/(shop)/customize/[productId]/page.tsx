import { notFound, redirect } from 'next/navigation';
import { products } from '@/data/products';
import { isProductComingSoon } from '@/data/categories';
import { ClothingMockupIframe } from '@/components/customizer/clothing-mockup-iframe';
import { SimpleCustomizerLayout } from '@/components/customizer/simple-customizer-layout';
import type { ProductType } from '@/lib/config/printSpecs';
import { getR2AssetUrl } from '@/lib/r2';

interface CustomizePageProps {
  params: { productId: string };
}

// Map category slug to our internal ProductType for customizer logic
function mapCategoryToProductType(categorySlug: string): ProductType | null {
  switch (categorySlug) {
    case 'tees':
    case 'oversized-tees':
      return 't-shirt';
    case 'hoodies':
      return 'hoodie';
    case 'posters':
    case 'prints':
      return 'poster-single';
    case 'split-posters':
      return 'poster-split-3';
    case 'mugs':
    case 'mugs-cups':
      return 'mug';
    case 'diaries':
    case 'stationery':
    case 'skins':
    case 'accessories':
      return 'diary';
    default:
      return 't-shirt';
  }
}

import { Suspense } from 'react';
import { getLiveProductBySlug } from '@/lib/services/products-service';

export default async function CustomizePage({ params }: CustomizePageProps) {
  // Direct clothing-mockup studio entry
  if (params.productId === 'clothing-mockup') {
    return (
      <Suspense
        fallback={
          <div className="w-full h-[100dvh] bg-[#0c0e12] flex flex-col items-center justify-center gap-4 text-white">
            <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-[#3B5EFF] animate-spin" />
            <p className="font-mono text-xs uppercase tracking-widest text-white/60">
              Opening 3D Studio...
            </p>
          </div>
        }
      >
        <ClothingMockupIframe />
      </Suspense>
    );
  }

  // If user requests a curated clothing design by ID, direct them to its artwork detail page
  if (params.productId.startsWith('design-')) {
    redirect(`/products/tees/${params.productId}`);
  }

  // Fetch live product from DB to ensure real-time admin pricing reflection
  const product =
    (await getLiveProductBySlug(params.productId)) ||
    products.find((p) => p.id === params.productId || p.slug === params.productId);

  if (!product || !product.customizable) {
    notFound();
  }

  // If product is coming soon (e.g. cups, mugs, stationery, skins), redirect to drop detail page
  if (isProductComingSoon(product)) {
    redirect(`/products/${product.categorySlug}/${product.slug || product.id}`);
  }

  const productType = mapCategoryToProductType(product.categorySlug) || 't-shirt';

  const defaultVariant =
    product.variants.find((v) => v.name.toLowerCase() === 'default') || product.variants[0];
  const price = defaultVariant ? defaultVariant.price : product.basePrice;
  const isPlain =
    product.tags?.includes('plain') ||
    product.id.startsWith('plain_') ||
    product.slug?.startsWith('plain');

  // Use the 3D Clothing Mockup Studio for t-shirts and hoodies
  if (productType === 't-shirt' || productType === 'hoodie') {
    return (
      <Suspense
        fallback={
          <div className="w-full h-[100dvh] bg-[#0c0e12] flex flex-col items-center justify-center gap-4 text-white">
            <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-[#3B5EFF] animate-spin" />
            <p className="font-mono text-xs uppercase tracking-widest text-white/60">
              Opening 3D Studio...
            </p>
          </div>
        }
      >
        <ClothingMockupIframe
          productId={product.id}
          productName={product.name}
          basePrice={price}
          isPlain={isPlain}
        />
      </Suspense>
    );
  }

  // Use simple customizer for cups, mugs, posters, stationery, etc.
  const mockupImageSrc =
    product.variants?.[0]?.images?.[0] || getR2AssetUrl('images/mockups/tee-black-front.webp');

  const variantId = defaultVariant?.id || 'default';

  return (
    <SimpleCustomizerLayout
      productType={productType}
      productId={product.id}
      productName={product.name}
      price={price}
      variantId={variantId}
      mockupImageSrc={mockupImageSrc}
    />
  );
}
