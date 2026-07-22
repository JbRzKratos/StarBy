import { prisma } from '@/lib/prisma';
import { ProductManagerClient } from './ProductManagerClient';
import type { Product } from './ProductManagerClient';

export const runtime = 'edge';

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      variants: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return <ProductManagerClient products={products as unknown as Product[]} />;
}
