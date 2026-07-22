import { prisma } from '@/lib/prisma';
import { requireStaff } from '../lib/auth';
import { CouponsClient } from '@/components/admin/coupons/coupons-client';

export default async function AdminCouponsPage() {
  await requireStaff();

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <CouponsClient
      coupons={coupons.map((c) => ({
        id: c.id,
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minOrderAmount: c.minOrderAmount,
        maxUses: c.maxUses,
        usageCount: c.usageCount,
        isActive: c.isActive,
        expiresAt: c.expiresAt?.toISOString() || null,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
