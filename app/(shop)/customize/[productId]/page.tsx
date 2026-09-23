import { notFound } from 'next/navigation';
import { products } from '@/data/products';
import { CustomizerLayout } from '@/components/customizer/customizer-layout';
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

export default async function CustomizePage({ params }: CustomizePageProps) {
  // Use static product data — no DB query needed for catalogue
  const product = products.find((p) => p.id === params.productId);

  if (!product || !product.customizable) {
    notFound();
  }

  const productType = mapCategoryToProductType(product.categorySlug) || 't-shirt';

  let mockupImageSrc =
    product.variants?.[0]?.images?.[0] || getR2AssetUrl('images/mockups/tee-black-front.png');
  if (productType === 'hoodie') {
    mockupImageSrc =
      product.variants?.[0]?.images?.[0] || getR2AssetUrl('images/mockups/hoodie-black-front.png');
  } else if (productType === 't-shirt') {
    mockupImageSrc =
      product.variants?.[0]?.images?.[0] || getR2AssetUrl('images/mockups/tee-black-front.png');
  }

  const defaultVariant =
    product.variants.find((v) => v.name.toLowerCase() === 'default') || product.variants[0];
  const price = defaultVariant ? defaultVariant.price : product.basePrice;
  const variantId = defaultVariant?.id || 'default';

  // Use simple customizer for cups, mugs, posters, stationery, etc.
  if (productType !== 't-shirt' && productType !== 'hoodie') {
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

  // Use advanced visual customizer for t-shirts
  return (
    <CustomizerLayout
      productType={productType}
      productId={product.id}
      mockupImageSrc={mockupImageSrc}
    />
  );
}
