import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../lib/auth';
import { StaffClient } from '@/components/admin/staff/staff-client';

export default async function AdminStaffPage() {
  await requireAdmin(); // Only ADMIN can manage staff

  const staffUsers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'STAFF'] } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <StaffClient
      staff={staffUsers.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.fullName || '—',
        role: u.role,
        createdAt: u.createdAt.toISOString(),
      }))}
    />
  );
}
