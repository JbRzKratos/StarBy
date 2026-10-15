import { prisma } from '@/lib/prisma';
import { ProductsClient } from '@/components/admin/products/products-client';
import { syncClothingDesignsToDb } from '@/scripts/sync_clothing_designs_to_db';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const designCount = await prisma.product.count({
    where: { id: { startsWith: 'design-' } },
  });

  if (designCount === 0) {
    try {
      await syncClothingDesignsToDb();
    } catch (e) {
      console.warn('Auto sync clothing designs in admin page error:', e);
    }
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <ProductsClient
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        categorySlug: p.categorySlug,
        basePrice: p.basePrice,
        tagline: p.tagline,
        description: p.description,
        customizable: p.customizable,
        featured: p.featured,
        tags: p.tags,
        sizes: p.sizes,
        createdAt: p.createdAt.toISOString(),
        variants: p.variants.map((v) => ({
          id: v.id,
          name: v.name,
          color: v.color,
          colorHex: v.colorHex,
          price: v.price,
          images: v.images,
          inStock: v.inStock,
          stockQuantity: v.stockQuantity,
          reorderThreshold: v.reorderThreshold,
        })),
      }))}
      categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
    />
  );
}
