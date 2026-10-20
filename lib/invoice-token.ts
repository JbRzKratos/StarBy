import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Sign a short, deterministic invoice link token.
 *
 * The token binds the order identifier to the recipient email so the
 * `?email=` query cannot be treated as proof of ownership on its own.
 * Set INVOICE_TOKEN_SECRET in production; the service-role key is used as a
 * stable fallback because it is already present in this deployment.
 */
function getSecret(): string {
  return (
    process.env.INVOICE_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    'starby-invoice-token-development-secret'
  );
}

export function createInvoiceToken(orderId: string, email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  return createHmac('sha256', getSecret())
    .update(`${orderId}:${normalizedEmail}`)
    .digest('hex');
}

export function verifyInvoiceToken(
  orderId: string,
  email: string,
  token: string | null | undefined,
): boolean {
  if (!token || !email) return false;
  const expected = createInvoiceToken(orderId, email);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
