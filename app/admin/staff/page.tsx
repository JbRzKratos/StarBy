import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../lib/auth';
import { StaffClient } from '@/components/admin/staff/staff-client';

export const dynamic = 'force-dynamic';

export default async function AdminStaffPage() {
  await requireAdmin(); // Only ADMIN can manage staff

  let staff: Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
  }> = [];

  try {
    const staffUsers = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STAFF'] } },
      orderBy: { createdAt: 'desc' },
    });

    staff = (Array.isArray(staffUsers) ? staffUsers : []).map((u) => ({
      id: u.id,
      email: u.email || '—',
      name: u.fullName || '—',
      role: u.role || 'STAFF',
      createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error('[AdminStaffPage] Error loading staff:', err);
  }

  return <StaffClient staff={staff} />;
}
