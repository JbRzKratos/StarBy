import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/app/admin/lib/auth';
import {
  AdminBulkOrdersClient,
  type AdminBulkOrderRow,
} from '@/components/admin/bulk-orders/admin-bulk-orders-client';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Bulk & Custom Orders — Admin Fregoro Studios',
};

export default async function AdminBulkOrdersPage() {
  await requireStaff();

  const requests = await prisma.bulkOrderRequest.findMany({
    include: {
      items: true,
      artworks: true,
      quotes: {
        orderBy: { version: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const orders: AdminBulkOrderRow[] = requests.map((r) => {
    const apparelTypesSummary =
      Array.from(new Set(r.items.map((i) => i.apparelType))).join(', ') || 'Custom Apparel';
    const latestQuote = r.quotes[0];

    return {
      id: r.id,
      requestNumber: r.requestNumber,
      customerName: r.contactName,
      companyName: r.companyName,
      email: r.email,
      phone: r.phone,
      orderType: r.orderType,
      eventName: r.eventName,
      totalQuantity: r.totalQuantity,
      apparelTypesSummary,
      requiredDeliveryDate: r.requiredDeliveryDate
        ? r.requiredDeliveryDate.toISOString()
        : new Date().toISOString(),
      isUrgent: r.isUrgent,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      latestQuoteTotal: latestQuote ? latestQuote.total : null,
      latestQuoteVersion: latestQuote ? latestQuote.version : null,
      itemsCount: r.items.length,
      artworksCount: r.artworks.length,
    };
  });

  return <AdminBulkOrdersClient initialOrders={orders} />;
}
