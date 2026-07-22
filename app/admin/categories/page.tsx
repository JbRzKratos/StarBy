import { prisma } from '@/lib/prisma';
import { requireStaff } from '../lib/auth';
import { CategoriesClient } from '@/components/admin/categories/categories-client';

export default async function AdminCategoriesPage() {
  await requireStaff();

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });

  const productCounts = await prisma.product.groupBy({
    by: ['categorySlug'],
    _count: { id: true },
  });
  const countMap = Object.fromEntries(productCounts.map((p) => [p.categorySlug, p._count.id]));

  return (
    <CategoriesClient
      categories={categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        tagline: c.tagline,
        gradient: c.gradient,
        featured: c.featured,
        productCount: countMap[c.slug] || 0,
      }))}
    />
  );
}
