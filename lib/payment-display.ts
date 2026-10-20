/**
 * Payment provider display helper.
 *
 * The store is online-payment only (Cashfree). Cash on Delivery was removed
 * from checkout, but a few historical orders may still carry the old provider
 * value in the database — those are rendered with an accurate label instead of
 * a raw "cod" string.
 */
export function formatPaymentProvider(provider?: string | null): string {
  const raw = (provider || '').trim();
  if (!raw) return 'Cashfree';
  const value = raw.toLowerCase();
  if (value === 'cod' || value === 'cash' || value === 'cash_on_delivery') {
    return 'Cash on Delivery';
  }
  if (value === 'cashfree') return 'Cashfree';
  // Unknown/legacy gateways (e.g. "razorpay") → keep the raw value readable.
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
