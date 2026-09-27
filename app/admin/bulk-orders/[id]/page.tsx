import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/app/admin/lib/auth';
import { AdminBulkOrderDetailClient } from '@/components/admin/bulk-orders/admin-bulk-order-detail-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps) {
  return {
    title: `Bulk Request ${params.id} — Admin Fregoro Studios`,
  };
}

export default async function AdminBulkOrderDetailPage({ params }: PageProps) {
  await requireStaff();

  const request = await prisma.bulkOrderRequest.findFirst({
    where: {
      OR: [{ id: params.id }, { requestNumber: params.id }],
    },
    include: {
      items: true,
      artworks: true,
      quotes: {
        orderBy: { version: 'desc' },
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!request) {
    notFound();
  }

  return <AdminBulkOrderDetailClient request={request} />;
}
