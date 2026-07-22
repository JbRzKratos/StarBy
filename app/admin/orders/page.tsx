import { prisma } from '@/lib/prisma';
import { OrderManagerClient } from './OrderManagerClient';

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      user: true,
      items: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return <OrderManagerClient orders={orders} />;
}
