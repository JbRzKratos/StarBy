import { cache } from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';
import { SUPER_ADMIN_EMAILS, isSuperAdminEmail } from '@/lib/auth-constants';

export { SUPER_ADMIN_EMAILS, isSuperAdminEmail };
export type AdminUser = User & { isAdmin: boolean; isStaff: boolean };

/**
 * Ensures superadmin email accounts are automatically upserted and granted ADMIN role.
 * If Prisma experiences a transient database or network error, superadmin accounts
 * will safely fallback to an in-memory AdminUser rather than locking the user out.
 */
async function syncAdminUser(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): Promise<AdminUser | null> {
  const isSuperAdmin = isSuperAdminEmail(user.email);

  try {
    // 1. First look up by primary Supabase Auth ID
    let dbUser = await prisma.user.findUnique({ where: { id: user.id } });

    // 2. Fallback look up by email if ID didn't match (e.g. auth user recreation or OAuth)
    if (!dbUser && user.email) {
      dbUser = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() } });
      if (dbUser && dbUser.id !== user.id) {
        try {
          dbUser = await prisma.user.update({
            where: { email: user.email.toLowerCase() },
            data: { id: user.id },
          });
        } catch (err) {
          console.warn('[AdminAuth] Could not align user ID to auth.users ID:', err);
        }
      }
    }

    if (isSuperAdmin) {
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            id: user.id,
            email: user.email?.toLowerCase() || 'gokul30sep@gmail.com',
            role: 'ADMIN',
            fullName: (user.user_metadata?.full_name as string) || 'Admin',
          },
        });
      } else if (dbUser.role !== 'ADMIN') {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { role: 'ADMIN' },
        });
      }
    }

    if (dbUser) {
      return {
        ...dbUser,
        isAdmin: dbUser.role === 'ADMIN' || isSuperAdmin,
        isStaff: dbUser.role === 'STAFF' || dbUser.role === 'ADMIN' || isSuperAdmin,
      };
    }
  } catch (err) {
    console.error('[AdminAuth] Database error in syncAdminUser:', err);
    // If Prisma has a connection hiccup, never kick out a verified superadmin:
    if (isSuperAdmin) {
      return {
        id: user.id,
        email: user.email?.toLowerCase() || 'gokul30sep@gmail.com',
        role: 'ADMIN',
        fullName: (user.user_metadata?.full_name as string) || 'Admin',
        isAdmin: true,
        isStaff: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        phone: null,
        avatarUrl: null,
        notes: null,
      } as AdminUser;
    }
  }

  if (isSuperAdmin) {
    return {
      id: user.id,
      email: user.email?.toLowerCase() || 'gokul30sep@gmail.com',
      role: 'ADMIN',
      fullName: (user.user_metadata?.full_name as string) || 'Admin',
      isAdmin: true,
      isStaff: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      phone: null,
      avatarUrl: null,
      notes: null,
    } as AdminUser;
  }

  return null;
}

/**
 * Helper to get current pathname for return redirects
 */
function getCurrentAdminPath(): string {
  try {
    const headerList = headers();
    return headerList.get('x-pathname') || headerList.get('next-url') || '/admin/products';
  } catch {
    return '/admin/products';
  }
}

/**
 * Call from any /admin page or server action.
 * Returns the authenticated DB user if they have ADMIN or STAFF role.
 * Redirects to /login?redirectTo=... otherwise.
 */
export const requireStaff = cache(async (): Promise<AdminUser> => {
  try {
    const supabase = createClient();
    let authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null = null;

    // 1. Primary: getUser()
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (user && !authError) {
        authUser = user;
      }
    } catch (userErr) {
      console.warn('[AdminAuth] getUser() check error, attempting session fallback:', userErr);
    }

    // 2. Resilient Fallback: getSession()
    if (!authUser) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          authUser = session.user;
        }
      } catch (sessionErr) {
        console.warn('[AdminAuth] getSession() fallback failed:', sessionErr);
      }
    }

    if (!authUser) {
      const path = getCurrentAdminPath();
      redirect(`/login?redirectTo=${encodeURIComponent(path)}`);
    }

    const adminUser = await syncAdminUser(authUser);
    const isSuperAdmin = isSuperAdminEmail(authUser.email);

    if (!adminUser || (!adminUser.isAdmin && !adminUser.isStaff && !isSuperAdmin)) {
      redirect('/');
    }

    return adminUser;
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
    const path = getCurrentAdminPath();
    redirect(`/login?redirectTo=${encodeURIComponent(path)}`);
  }
});

/**
 * Call from ADMIN-only pages (analytics, staff, settings, coupons).
 * Redirects STAFF users to dashboard with 403-style message.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await requireStaff();
  if (!user.isAdmin && !isSuperAdminEmail(user.email)) {
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
  let authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null = null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) authUser = user;
  } catch {}

  if (!authUser) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) authUser = session.user;
    } catch {}
  }

  if (!authUser) throw new Error('Not authenticated: please log in');

  const adminUser = await syncAdminUser(authUser);
  const isSuperAdmin = isSuperAdminEmail(authUser.email);

  if (!adminUser || (!adminUser.isAdmin && !isSuperAdmin)) {
    throw new Error('Forbidden: Only admin access users can change product prices');
  }
  return adminUser;
}

export async function assertStaff() {
  const supabase = createClient();
  let authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null = null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) authUser = user;
  } catch {}

  if (!authUser) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) authUser = session.user;
    } catch {}
  }

  if (!authUser) throw new Error('Not authenticated');

  const adminUser = await syncAdminUser(authUser);
  const isSuperAdmin = isSuperAdminEmail(authUser.email);
  if (!adminUser || (!adminUser.isAdmin && !adminUser.isStaff && !isSuperAdmin)) {
    throw new Error('Forbidden');
  }
  return adminUser;
}
