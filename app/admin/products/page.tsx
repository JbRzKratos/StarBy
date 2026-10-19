import { prisma } from '@/lib/prisma';
import { ProductsClient } from '@/components/admin/products/products-client';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  let products: Array<{
    id: string;
    name: string;
    slug: string;
    categorySlug: string;
    basePrice: number;
    tagline: string;
    description: string;
    customizable: boolean;
    featured: boolean;
    tags: string[];
    sizes: string[];
    sizePrices?: Record<string, number> | null;
    sizeStock?: Record<string, unknown> | null;
    createdAt: string;
    variants: Array<{
      id: string;
      name: string;
      color: string;
      colorHex: string;
      price: number;
      images: string[];
      inStock: boolean;
      stockQuantity: number;
      reorderThreshold: number;
    }>;
  }> = [];

  let categories: Array<{ slug: string; name: string }> = [];

  try {
    const [rawProducts, rawCategories] = await Promise.all([
      prisma.product.findMany({
        include: { variants: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
    ]);

    products = rawProducts.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      categorySlug: p.categorySlug,
      basePrice: p.basePrice,
      tagline: p.tagline || '',
      description: p.description || '',
      customizable: Boolean(p.customizable),
      featured: Boolean(p.featured),
      tags: Array.isArray(p.tags) ? p.tags : [],
      sizes: Array.isArray(p.sizes) ? p.sizes : [],
      sizePrices: (p.sizePrices as Record<string, number>) || null,
      sizeStock: (p.sizeStock as Record<string, unknown>) || null,
      createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
      variants: Array.isArray(p.variants)
        ? p.variants.map((v) => ({
            id: v.id,
            name: v.name,
            color: v.color || '',
            colorHex: v.colorHex || '#000000',
            price: v.price || p.basePrice || 0,
            images: Array.isArray(v.images) ? v.images : [],
            inStock: Boolean(v.inStock),
            stockQuantity: typeof v.stockQuantity === 'number' ? v.stockQuantity : 0,
            reorderThreshold: typeof v.reorderThreshold === 'number' ? v.reorderThreshold : 5,
          }))
        : [],
    }));

    categories = rawCategories.map((c) => ({
      slug: c.slug,
      name: c.name,
    }));
  } catch (err) {
    console.error('[AdminProductsPage] Error loading products/categories:', err);
  }

  return (
    <ProductsClient
      products={products}
      categories={categories}
    />
  );
}
