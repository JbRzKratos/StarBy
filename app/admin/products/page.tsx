import { prisma } from '@/lib/prisma';
import { ProductManagerClient } from './ProductManagerClient';

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      variants: true,
    },
    orderBy: {
      createdAt: 'desc',
    }
  });

  return <ProductManagerClient products={products} />;
}
