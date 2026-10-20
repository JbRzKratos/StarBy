import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdminEmail } from '@/lib/auth-constants';

export interface BulkOrderActor {
  authUser: { id: string; email?: string } | null;
  isStaff: boolean;
  actorName: string;
}

/**
 * Resolve the current caller for a bulk-order request.
 * Staff is determined from the database role (the admin panel already limits
 * full admin access to the single super-admin account).
 */
export async function resolveBulkOrderActor(): Promise<BulkOrderActor> {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { authUser: null, isStaff: false, actorName: 'Customer' };
  }

  const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } });
  // A stale DB ADMIN row must not grant staff access. Only the configured
  // super-admin or a genuine STAFF account can act as staff.
  const isStaff = dbUser?.role === 'STAFF' || isSuperAdminEmail(authUser.email);

  return {
    authUser: { id: authUser.id, email: authUser.email },
    isStaff,
    actorName: dbUser?.fullName || (isStaff ? 'Admin' : 'Customer'),
  };
}

/**
 * Read access:
 * - staff can read any request
 * - a signed-in owner can read their own request
 * - an anonymous request is readable only through its public requestNumber
 */
export function canReadBulkOrder(
  request: { userId: string | null; requestNumber: string },
  actor: BulkOrderActor,
  routeId: string,
): boolean {
  if (actor.isStaff) return true;
  if (request.userId) return Boolean(actor.authUser && actor.authUser.id === request.userId);
  return routeId === request.requestNumber;
}

/**
 * Customer mutation access. Same rules as read access, but staff can also mutate.
 */
export function canMutateBulkOrder(
  request: { userId: string | null; requestNumber: string },
  actor: BulkOrderActor,
  routeId: string,
): boolean {
  if (actor.isStaff) return true;
  if (request.userId) return Boolean(actor.authUser && actor.authUser.id === request.userId);
  return routeId === request.requestNumber;
}
