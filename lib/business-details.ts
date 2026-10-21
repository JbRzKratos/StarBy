/**
 * Single source of truth for the business identity used on printed documents
 * (tax invoice, packing slip, shipping label).
 *
 * Keep these values in sync with the details shown on the website footer and
 * the transactional emails. The phone number is also printed on the return
 * section of every shipping label so a courier can call us for RTO handling.
 */
export const BUSINESS_DETAILS = {
  name: 'Fregoro Studios',
  tagline: 'Bespoke Print, Custom Apparel & Editorial Studio',
  addressLine1: 'Plot No: A-134, N.G.G.O Nagar, Selai Village',
  addressLine2: 'Thiruvallur - 631203, Tamil Nadu, India',
  phone: '+91 98765 43210',
  email: 'support@fregorostudios.com',
  gstin: '33AAECF1234F1Z5',
  cin: 'U74999TN2024PTC123456',
} as const;

export interface ParsedShippingAddress {
  name: string;
  streetLine1: string;
  streetLine2: string;
  cityStateZip: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
}

/**
 * Shipping addresses are stored as JSON and have accumulated a few different
 * shapes over time (checkout, admin edits, older imports). Normalise all of
 * them once so the invoice and the shipping label always agree.
 */
export function parseShippingAddress(
  address: unknown,
  user?: { fullName?: string | null; email?: string | null; phone?: string | null } | null,
): ParsedShippingAddress {
  const addr = (address as Record<string, string | undefined>) || {};

  const name =
    addr.name ||
    addr.fullName ||
    `${addr.firstName || ''} ${addr.lastName || ''}`.trim() ||
    user?.fullName ||
    'Valued Customer';

  const streetLine1 = addr.street || addr.addressLine1 || addr.address || '';
  const streetLine2 = addr.addressLine2 || addr.landmark || '';
  const city = addr.city || addr.town || '';
  const state = addr.state || '';
  const zip = addr.zip || addr.pincode || addr.postalCode || '';
  const country = addr.country || 'India';
  const cityStateZip = [city, state, zip].filter(Boolean).join(', ');
  const phone = addr.phone || addr.mobile || user?.phone || '';
  const email = addr.email || user?.email || '';

  return { name, streetLine1, streetLine2, cityStateZip, city, state, zip, country, phone, email };
}
