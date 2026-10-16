import { prisma } from '@/lib/prisma';
import { CategoriesClient } from '@/components/admin/categories/categories-client';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  let mappedCategories: Array<{
    id: string;
    slug: string;
    name: string;
    description: string;
    tagline: string;
    gradient: string;
    featured: boolean;
    productCount: number;
  }> = [];

  try {
    const [categories, productCounts] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.product
        .groupBy({
          by: ['categorySlug'],
          _count: { id: true },
        })
        .catch(() => []),
    ]);

    const countMap = Object.fromEntries(
      (Array.isArray(productCounts) ? productCounts : []).map((p) => [p.categorySlug, p._count?.id || 0]),
    );

    mappedCategories = (Array.isArray(categories) ? categories : []).map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description || '',
      tagline: c.tagline || '',
      gradient: c.gradient || 'from-blue-600 to-indigo-600',
      featured: Boolean(c.featured),
      productCount: countMap[c.slug] || 0,
    }));
  } catch (err) {
    console.error('[AdminCategoriesPage] Error loading categories:', err);
  }

  return <CategoriesClient categories={mappedCategories} />;
}
