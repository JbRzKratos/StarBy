import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CustomizerLayout } from '@/components/customizer/customizer-layout';
import { SimpleCustomizerLayout } from '@/components/customizer/simple-customizer-layout';
import type { ProductType } from '@/lib/config/printSpecs';

interface CustomizePageProps {
  params: { productId: string };
}

// Map database category slug to our internal ProductType for customizer logic
function mapCategoryToProductType(categorySlug: string): ProductType | null {
  switch (categorySlug) {
    case 'tees':
    case 'oversized-tees':
      return 't-shirt';
    case 'hoodies':
      return 'hoodie';
    case 'posters':
      return 'poster-single'; // We might need to handle split posters separately or use variants
    case 'mugs':
      return 'mug';
    case 'diaries':
      return 'diary';
    default:
      return null; // Not customizable
  }
}

export default async function CustomizePage({ params }: CustomizePageProps) {
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    include: { variants: true },
  });

  if (!product || !product.customizable) {
    notFound();
  }

  const productType = mapCategoryToProductType(product.categorySlug);

  if (!productType) {
    notFound();
  }

  // Temporary fallback logic for mockups. In a real app, these might be defined in the DB or config
  let mockupImageSrc = '/images/mockups/tee-black-front.png';
  if (productType === 'hoodie') {
    mockupImageSrc = '/images/mockups/hoodie-black-front.png';
  } else if (productType === 't-shirt') {
    // If we have oversized or different colors, we can map them based on the active variant
    // For now, let's use the standard one
    mockupImageSrc = '/images/mockups/tee-black-front.png';
  }

  // Default to base price, or use default variant price if available
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
