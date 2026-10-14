import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';

export type AdminUser = User & { isAdmin: boolean; isStaff: boolean };

/**
 * Ensures superadmin email accounts are automatically upserted and granted ADMIN role
 */
async function syncAdminUser(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): Promise<User | null> {
  const isSuperAdminEmail =
    user.email === 'fregorostudios@gmail.com' ||
    user.email === 'admin@fregorostudios.com' ||
    user.email === 'gokul@fregorostudios.com';

  let dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  if (isSuperAdminEmail) {
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email || 'fregorostudios@gmail.com',
          role: 'ADMIN',
          fullName: (user.user_metadata?.full_name as string) || 'Admin',
        },
      });
    } else if (dbUser.role !== 'ADMIN') {
      dbUser = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' },
      });
    }
  }

  return dbUser;
}

/**
 * Call from any /admin page or server action.
 * Returns the authenticated DB user if they have ADMIN or STAFF role.
 * Redirects otherwise.
 */
export const requireStaff = cache(async (): Promise<AdminUser> => {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect('/login');
    }

    const dbUser = await syncAdminUser(user);

    if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'STAFF')) {
      redirect('/');
    }

    return {
      ...dbUser,
      isAdmin: dbUser.role === 'ADMIN',
      isStaff: dbUser.role === 'STAFF',
    };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      typeof (error as { digest?: string }).digest === 'string'
    ) {
      const digest = (error as { digest: string }).digest;
      if (digest.startsWith('NEXT_REDIRECT') || digest === 'DYNAMIC_SERVER_USAGE') {
        throw error;
      }
    }
    console.error('[AdminAuth] Error in requireStaff:', error);
    redirect('/login');
  }
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
  if (!user) throw new Error('Not authenticated: please log in');

  const dbUser = await syncAdminUser(user);
  const isSuperAdminEmail =
    user.email === 'fregorostudios@gmail.com' ||
    user.email === 'admin@fregorostudios.com' ||
    user.email === 'gokul@fregorostudios.com';

  if (!dbUser || (dbUser.role !== 'ADMIN' && !isSuperAdminEmail)) {
    throw new Error('Forbidden: Only admin access users can change product prices');
  }
  return dbUser;
}

export async function assertStaff() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const dbUser = await syncAdminUser(user);
  if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'STAFF')) {
    throw new Error('Forbidden');
  }
  return dbUser;
}
