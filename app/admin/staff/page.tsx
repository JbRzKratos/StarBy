import { prisma } from '@/lib/prisma';
import { requireAdmin, isSuperAdminEmail } from '../lib/auth';
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

    staff = (Array.isArray(staffUsers) ? staffUsers : []).map((u) => {
      // Only the configured super-admin email really has ADMIN access. A stale
      // DB ADMIN row is downgraded to STAFF everywhere else, so show it that
      // way here too instead of labelling it "Superadmin".
      const role = isSuperAdminEmail(u.email) ? 'ADMIN' : u.role === 'ADMIN' ? 'STAFF' : u.role || 'STAFF';
      return {
        id: u.id,
        email: u.email || '—',
        name: u.fullName || '—',
        role,
        createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error('[AdminStaffPage] Error loading staff:', err);
  }

  return <StaffClient staff={staff} />;
}
