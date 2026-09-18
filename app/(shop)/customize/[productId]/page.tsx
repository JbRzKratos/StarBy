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
      return 'poster-single';
    case 'mugs':
      return 'mug';
    case 'diaries':
      return 'diary';
    default:
      return null;
  }
}

export default async function CustomizePage({ params }: CustomizePageProps) {
  // Use static product data — no DB query needed for catalogue
  const product = products.find((p) => p.id === params.productId);

  if (!product || !product.customizable) {
    notFound();
  }

  const productType = mapCategoryToProductType(product.categorySlug);

  if (!productType) {
    notFound();
  }

  let mockupImageSrc = getR2AssetUrl('images/mockups/tee-black-front.png');
  if (productType === 'hoodie') {
    mockupImageSrc = getR2AssetUrl('images/mockups/hoodie-black-front.png');
  } else if (productType === 't-shirt') {
    mockupImageSrc = getR2AssetUrl('images/mockups/tee-black-front.png');
  }

  const defaultVariant = product.variants.find((v) => v.name.toLowerCase() === 'default');
  const price = defaultVariant ? defaultVariant.price : product.basePrice;

  // Use simple customizer for cups, mugs, hoodies, etc.
  if (productType === 'mug' || productType === 'hoodie') {
    return (
      <SimpleCustomizerLayout
        productType={productType}
        productId={product.id}
        productName={product.name}
        price={price}
        variantId={defaultVariant?.id || 'default'}
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
