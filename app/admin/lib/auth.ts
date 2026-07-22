import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';

export type AdminUser = User & { isAdmin: boolean; isStaff: boolean };

/**
 * Call from any /admin page or server action.
 * Returns the authenticated DB user if they have ADMIN or STAFF role.
 * Redirects otherwise.
 */
export const requireStaff = cache(async (): Promise<AdminUser> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'STAFF')) {
    redirect('/');
  }

  return {
    ...dbUser,
    isAdmin: dbUser.role === 'ADMIN',
    isStaff: dbUser.role === 'STAFF',
  };
});

/**
 * Call from ADMIN-only pages (analytics, staff, settings, coupons).
 * Redirects STAFF users to dashboard with 403-style message.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await requireStaff();
  if (!user.isAdmin) {
    redirect('/admin?error=forbidden');
  }
  return user;
}

/**
 * Use in server actions to gate by role without redirecting.
 * Throws on failure so the action surfaces an error.
 */
export async function assertAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role !== 'ADMIN') throw new Error('Forbidden: admin only');
  return dbUser;
}

export async function assertStaff() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'STAFF')) {
    throw new Error('Forbidden');
  }
  return dbUser;
}
