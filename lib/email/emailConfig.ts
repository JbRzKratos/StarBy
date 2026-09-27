/**
 * Central Email Configuration for Fregoro Studios
 *
 * Server-only configuration for transactional emails.
 * Never expose RESEND_API_KEY or private credentials to the client.
 */

export const BUSINESS_NAME = 'Fregoro Studios';
export const BUSINESS_EMAIL = process.env.FREGORO_CONTACT_EMAIL || 'fregorostudios@gmail.com';
export const BUSINESS_ADDRESS_NAME = 'Fregoro Studios';
export const BUSINESS_ADDRESS_LINE1 = 'Plot No: A-134, N.G.G.O Nagar, Selai Village';
export const BUSINESS_ADDRESS_LINE2 = 'Thiruvallur - 631203, Tamil Nadu, India';
export const BUSINESS_FULL_ADDRESS = `${BUSINESS_ADDRESS_LINE1}, ${BUSINESS_ADDRESS_LINE2}`;

/**
 * Clean numeric WhatsApp number for wa.me links
 * Priority: FREGORO_WHATSAPP_NUMBER (server) -> NEXT_PUBLIC_WHATSAPP_NUMBER -> default official business number
 */
export function getEmailWhatsappNumber(): string {
  const raw =
    process.env.FREGORO_WHATSAPP_NUMBER ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    '918680991921';
  return raw.replace(/[^0-9]/g, '');
}

/**
 * Generate official WhatsApp chat link with an encoded prefilled message
 */
export function getEmailWhatsappLink(message: string): string {
  const number = getEmailWhatsappNumber();
  return `https://wa.me/${number}?text=${encodeURIComponent(message.trim())}`;
}

/**
 * Public website base URL
 */
export function getEmailBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (url && !url.includes('localhost')) {
    return url.replace(/\/$/, '');
  }
  return 'https://fregorostudios.com';
}

/**
 * Sender email configuration
 * Production preferred: verified Fregoro domain (e.g. orders@fregoro.com / hello@fregoro.com)
 * Resend sandbox fallback: onboarding@resend.dev (limited to sending to verified account email)
 */
export function getSenderEmail(): string {
  if (process.env.FREGORO_FROM_EMAIL) {
    return process.env.FREGORO_FROM_EMAIL;
  }
  if (process.env.EMAIL_FROM) {
    return process.env.EMAIL_FROM;
  }
  // Safe default: if a custom domain is verified on Resend, this will succeed.
  // Otherwise, onboarding@resend.dev is used for development/testing.
  return `${BUSINESS_NAME} <hello@fregoro.com>`;
}

/**
 * Destination inbox for admin contact & bulk order notifications
 */
export function getAdminContactEmail(): string {
  return process.env.FREGORO_CONTACT_EMAIL || process.env.ADMIN_EMAIL || 'fregorostudios@gmail.com';
}

/**
 * Default Reply-To when not replying to a specific customer
 */
export function getDefaultReplyToEmail(): string {
  return process.env.FREGORO_REPLY_TO_EMAIL || getAdminContactEmail();
}

/**
 * Escape HTML special characters in dynamic strings to prevent XSS in email clients
 */
export function escapeEmailHtml(str?: string | number | null): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize subject strings to prevent header injection / newline attacks
 */
export function sanitizeEmailSubject(subject: string): string {
  return subject
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Inspect environment configuration status for diagnostics and error handling
 */
export function getEmailConfigStatus(): {
  hasApiKey: boolean;
  fromEmail: string;
  adminEmail: string;
  isSandboxDomain: boolean;
} {
  const apiKey = process.env.RESEND_API_KEY;
  const from = getSenderEmail();
  const admin = getAdminContactEmail();
  const isSandbox = from.includes('resend.dev');

  return {
    hasApiKey: Boolean(apiKey && apiKey.startsWith('re_')),
    fromEmail: from,
    adminEmail: admin,
    isSandboxDomain: isSandbox,
  };
}
