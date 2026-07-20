import type { Metadata } from 'next';
import { getProductBySlug, products } from '@/data/products';
import { ProductDetailClient } from '@/components/product/product-detail-client';

export const runtime = 'edge';

interface ProductPageProps {
  params: { category: string; slug: string };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = getProductBySlug(params.slug);
  return {
    title: product?.name ?? 'Product',
    description: product?.description ?? 'StarBy premium product.',
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = getProductBySlug(params.slug) ?? products[0];
  if (!product) return <div className="pt-32 section-container text-pearl">Product not found.</div>;

  return <ProductDetailClient product={product} />;
}
