import { prisma } from '@/lib/prisma';
import { requireStaff } from '../../lib/auth';
import { ProductFormClient } from '@/components/admin/products/product-form-client';

export default async function NewProductPage() {
  await requireStaff();
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-bold text-gray-900 mb-6">New Product</h1>
      <ProductFormClient
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        mode="create"
      />
    </div>
  );
}
