/**
 * Single source of truth for full-admin access.
 *
 * Only this account is allowed to administer the storefront and save curated
 * 3D artwork placements. Do not derive this list from environment variables:
 * otherwise a stale/misconfigured ADMIN_EMAIL can silently grant admin access.
 */
export const SUPER_ADMIN_EMAILS = ['gokul30sep@gmail.com'];

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
