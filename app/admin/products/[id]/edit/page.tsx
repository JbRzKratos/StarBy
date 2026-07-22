import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '../../../lib/auth';
import { ProductFormClient } from '@/components/admin/products/product-form-client';

interface PageProps {
  params: { id: string };
}

export default async function EditProductPage({ params }: PageProps) {
  await requireStaff();

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: { variants: true },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  if (!product) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-bold text-gray-900 mb-6">Edit: {product.name}</h1>
      <ProductFormClient
        mode="edit"
        productId={product.id}
        initialData={{
          name: product.name,
          slug: product.slug,
          categorySlug: product.categorySlug,
          basePrice: product.basePrice,
          tagline: product.tagline,
          description: product.description,
          customizable: product.customizable,
          featured: product.featured,
          tags: product.tags,
          sizes: product.sizes,
        }}
        initialVariants={product.variants.map((v) => ({
          id: v.id,
          name: v.name,
          color: v.color,
          colorHex: v.colorHex,
          price: v.price,
          images: v.images,
          inStock: v.inStock,
          stockQuantity: v.stockQuantity,
          reorderThreshold: v.reorderThreshold,
        }))}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
      />
    </div>
  );
}
