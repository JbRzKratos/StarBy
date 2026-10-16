import { prisma } from '@/lib/prisma';
import { requireStaff } from '../lib/auth';
import { CouponsClient } from '@/components/admin/coupons/coupons-client';

export const dynamic = 'force-dynamic';

export default async function AdminCouponsPage() {
  await requireStaff();

  let mappedCoupons: Array<{
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
    minOrderValue: number | null;
    maxUses: number | null;
    usageCount: number;
    isActive: boolean;
    expiresAt: string | null;
    createdAt: string;
  }> = [];

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    mappedCoupons = (Array.isArray(coupons) ? coupons : []).map((c) => ({
      id: c.id,
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderValue: c.minOrderValue,
      maxUses: c.maxUses,
      usageCount: c.usageCount || 0,
      isActive: Boolean(c.isActive),
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error('[AdminCouponsPage] Error loading coupons:', err);
  }

  return <CouponsClient coupons={mappedCoupons} />;
}
