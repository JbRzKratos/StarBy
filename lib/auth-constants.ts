export const SUPER_ADMIN_EMAILS = [
  'gokul30sep@gmail.com',
  'fregorostudios@gmail.com',
  'admin@fregorostudios.com',
  'gokul@fregorostudios.com',
];

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const envAdmin =
    (typeof process !== 'undefined' &&
      (process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase() ||
        process.env.ADMIN_EMAIL?.trim().toLowerCase())) ||
    '';
  return (
    SUPER_ADMIN_EMAILS.includes(normalized) ||
    (Boolean(envAdmin) && normalized === envAdmin)
  );
}
