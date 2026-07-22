import type { Metadata } from 'next';
import { getCategoryBySlug } from '@/data/categories';
import { products } from '@/data/products';
import { notFound } from 'next/navigation';
import { ShopPage } from '@/components/shop';

interface CategoryPageProps {
  params: { category: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const cat = getCategoryBySlug(params.category);
  return {
    title: cat?.name ?? 'Products',
    description: cat?.description ?? 'Browse StarBy products.',
  };
}

export default function CategoryPage({ params, searchParams: _searchParams }: CategoryPageProps) {
  const category = getCategoryBySlug(params.category);

  if (!category && params.category !== 'all') {
    notFound();
  }

  // We pass ALL products to ShopPage to allow instant client-side tab switching without RSC delays.
  return <ShopPage category={params.category} products={products} />;
}
