import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '../../lib/auth';
import { OrderDetailClient } from '@/components/admin/orders/order-detail-client';

interface PageProps {
  params: { id: string };
}

export default async function OrderDetailPage({ params }: PageProps) {
  await requireStaff();

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      items: true,
    },
  });

  if (!order) notFound();

  // Fetch product + variant details for items
  const productIds = Array.from(new Set(order.items.map((i) => i.productId)));
  const variantIds = Array.from(new Set(order.items.map((i) => i.variantId)));

  const [products, variants] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, slug: true },
    }),
    prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, name: true, color: true, colorHex: true, images: true },
    }),
  ]);

  const enrichedItems = order.items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const variant = variants.find((v) => v.id === item.variantId);
    return {
      id: item.id,
      productName: product?.name || 'Unknown',
      productSlug: product?.slug || '',
      variantName: variant?.name || '',
      variantColor: variant?.color || '',
      variantColorHex: variant?.colorHex || '#ccc',
      variantImage: variant?.images?.[0] || null,
      quantity: item.quantity,
      price: item.price,
      size: item.size || null,
    };
  });

  const shippingAddress = order.shippingAddress as {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };

  return (
    <OrderDetailClient
      order={{
        id: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        discount: order.discount || 0,
        couponCode: order.couponCode || null,
        shippingMethod: order.shippingMethod || 'standard',
        estimatedDeliveryDate: order.estimatedDeliveryDate?.toISOString() || null,
        razorpayOrderId: order.razorpayOrderId || null,
        razorpayPaymentId: order.razorpayPaymentId || null,
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
      }}
    />
  );
}
