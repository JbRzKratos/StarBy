import type { Metadata } from 'next';
import { getCategoryBySlug } from '@/data/categories';
import { getLiveProducts } from '@/lib/services/products-service';
import { notFound } from 'next/navigation';
import { ShopPage } from '@/components/shop';
import { Suspense } from 'react';

// ISR: Cache statically for 60 seconds with on-demand admin revalidation
export const revalidate = 60;

interface CategoryPageProps {
  params: { category: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const cat = getCategoryBySlug(params.category);
  return {
    title: cat?.name ?? 'Products',
    description: cat?.description ?? 'Browse Fregoro Studios products.',
  };
}

export default async function CategoryPage({ params, searchParams: _searchParams }: CategoryPageProps) {
  const category = getCategoryBySlug(params.category);

  if (!category && params.category !== 'all') {
    notFound();
  }

  // Fetch live products with real-time pricing from DB
  const liveProducts = await getLiveProducts();

  return (
    <Suspense fallback={<div className="min-h-screen bg-charcoal" />}>
      <ShopPage category={params.category} products={liveProducts} />
    </Suspense>
  );
}
