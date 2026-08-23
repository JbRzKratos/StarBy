import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { OrderDetailClient } from '@/components/admin/orders/order-detail-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function OrderDetailPage({ params }: PageProps) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      items: {
        include: {
          orderCustomization: true,
        },
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) notFound();

  // Fetch product + variant details for items
  const productIds = Array.from(new Set(order.items.map((i) => i.productId)));
  const variantIds = Array.from(
    new Set(order.items.map((i) => i.variantId).filter((v) => v !== 'default')),
  );

  const [products, variants] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, slug: true },
    }),
    variantIds.length > 0
      ? prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, name: true, color: true, colorHex: true, images: true },
        })
      : Promise.resolve([]),
  ]);

  const enrichedItems = order.items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const variant = variants.find((v) => v.id === item.variantId);
    return {
      id: item.id,
      productName: item.productNameSnapshot || product?.name || 'Product',
      productSlug: product?.slug || '',
      variantName: variant?.name || item.variantId || '',
      variantColor: variant?.color || '',
      variantColorHex: variant?.colorHex || '#ccc',
      variantImage: variant?.images?.[0] || null,
      quantity: item.quantity,
      price: item.unitPrice ?? item.totalPrice / item.quantity,
      size: item.size || null,
      orderCustomization: item.orderCustomization
        ? {
            designFileUrl: item.orderCustomization.designFileUrl,
            designFileName: item.orderCustomization.designFileName,
            printPosition: item.orderCustomization.printPosition,
            printInstructions: item.orderCustomization.printInstructions,
            customerNotes: item.orderCustomization.customerNotes,
            productionStatus: item.orderCustomization.productionStatus,
          }
        : null,
    };
  });

  const shippingAddress = order.shippingAddress as {
    name?: string;
    firstName?: string;
    lastName?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone?: string;
    email?: string;
  };

  return (
    <OrderDetailClient
      order={{
        id: order.id,
        publicOrderId: order.publicOrderId || null,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentProvider: order.paymentProvider || 'cashfree',
        paymentGatewayOrderId: order.paymentGatewayOrderId || null,
        paymentGatewayPaymentId: order.paymentGatewayPaymentId || null,
        subtotal: order.subtotal,
        total: order.total,
        discount: order.discount || 0,
        shippingFee: order.shippingFee || 0,
        tax: order.tax || 0,
        couponCode: order.couponCode || null,
        shippingMethod: order.shippingMethod || 'standard',
        estimatedDeliveryDate: order.estimatedDeliveryDate?.toISOString() || null,
        carrier: order.carrier || null,
        trackingNumber: order.trackingNumber || null,
        trackingUrl: order.trackingUrl || null,
        internalNotes: order.internalNotes || '',
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        customer: order.user
          ? {
              id: order.user.id,
              name: order.user.fullName || order.user.email,
              email: order.user.email,
            }
          : null,
        shippingAddress,
        items: enrichedItems,
        statusHistory: order.statusHistory.map((sh) => ({
          id: sh.id,
          oldStatus: sh.oldStatus,
          newStatus: sh.newStatus,
          changedBy: sh.changedBy,
          note: sh.note,
          createdAt: sh.createdAt.toISOString(),
        })),
      }}
    />
  );
}
