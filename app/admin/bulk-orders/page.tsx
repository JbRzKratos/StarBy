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

  let orders: AdminBulkOrderRow[] = [];

  try {
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

    orders = (Array.isArray(requests) ? requests : []).map((r) => {
      const items = Array.isArray(r.items) ? r.items : [];
      const artworks = Array.isArray(r.artworks) ? r.artworks : [];
      const quotes = Array.isArray(r.quotes) ? r.quotes : [];

      const apparelTypesSummary =
        Array.from(new Set(items.map((i) => i.apparelType))).join(', ') || 'Custom Apparel';
      const latestQuote = quotes[0];

      return {
        id: r.id,
        requestNumber: r.requestNumber || r.id,
        customerName: r.contactName || '—',
        companyName: r.companyName,
        email: r.email || '—',
        phone: r.phone || '—',
        orderType: r.orderType || 'bulk',
        eventName: r.eventName,
        totalQuantity: r.totalQuantity || 0,
        apparelTypesSummary,
        requiredDeliveryDate: r.requiredDeliveryDate
          ? r.requiredDeliveryDate.toISOString()
          : new Date().toISOString(),
        isUrgent: Boolean(r.isUrgent),
        status: r.status || 'PENDING',
        createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
        latestQuoteTotal: latestQuote ? latestQuote.total : null,
        latestQuoteVersion: latestQuote ? latestQuote.version : null,
        itemsCount: items.length,
        artworksCount: artworks.length,
      };
    });
  } catch (err) {
    console.error('[AdminBulkOrdersPage] Error loading bulk orders:', err);
  }

  return <AdminBulkOrdersClient initialOrders={orders} />;
}
