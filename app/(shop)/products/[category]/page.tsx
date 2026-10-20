import type { Metadata } from 'next';
import { getCategoryBySlug, type Category } from '@/data/categories';
import { getLiveProducts } from '@/lib/services/products-service';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ShopPage } from '@/components/shop';
import { Suspense } from 'react';

// ISR: Cache statically for 60 seconds with on-demand admin revalidation
export const revalidate = 60;

interface CategoryPageProps {
  params: { category: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

async function resolveCategory(slug: string): Promise<Category | undefined> {
  const staticCategory = getCategoryBySlug(slug);
  if (staticCategory || slug === 'all') return staticCategory;

  // Categories created in the admin panel live in Postgres only. Fall back to
  // the DB so a freshly published category does not 404 on the storefront.
  try {
    const dbCategory = await prisma.category.findUnique({ where: { slug } });
    if (!dbCategory) return undefined;
    return {
      slug: dbCategory.slug,
      name: dbCategory.name,
      description: dbCategory.description,
      tagline: dbCategory.tagline,
      productCount: dbCategory.productCount,
      featured: dbCategory.featured,
      gradient: dbCategory.gradient,
      image: dbCategory.image ?? undefined,
      comingSoon: false,
    };
  } catch {
    return undefined;
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const cat = await resolveCategory(params.category);
  if (!cat && params.category !== 'all') {
    notFound();
  }
  return {
    title: cat?.name ?? 'Products',
    description: cat?.description ?? 'Browse Fregoro Studios products.',
  };
}

export default async function CategoryPage({ params, searchParams: _searchParams }: CategoryPageProps) {
  const category = await resolveCategory(params.category);

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
