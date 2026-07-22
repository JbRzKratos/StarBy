import { prisma } from '@/lib/prisma';
import { requireStaff } from '../lib/auth';
import { ProductsClient } from '@/components/admin/products/products-client';

export default async function AdminProductsPage() {
  await requireStaff();

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
