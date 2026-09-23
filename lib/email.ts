import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');
const DEFAULT_FROM = process.env.EMAIL_FROM || 'Fregoro Studios <onboarding@resend.dev>';
const BUSINESS_EMAIL = 'fregorostudios@gmail.com';
const ADMIN_RECIPIENT = process.env.ADMIN_EMAIL || BUSINESS_EMAIL;

export const BUSINESS_ADDRESS_NAME = 'Fregoro Studios';
export const BUSINESS_ADDRESS_LINE1 = 'Plot No: A-134, N.G.G.O Nagar, Selai Village';
export const BUSINESS_ADDRESS_LINE2 = 'Thiruvallur - 631203, Tamil Nadu, India';
export const BUSINESS_FULL_ADDRESS = `${BUSINESS_ADDRESS_LINE1}, ${BUSINESS_ADDRESS_LINE2}`;

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (url && !url.includes('localhost')) {
    return url.replace(/\/$/, '');
  }
  return 'https://fregorostudios.com';
}

/** Prevent XSS by escaping HTML special characters in user-supplied strings */
function escapeHtml(str?: string | number | null): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface OrderItemEmailData {
  id?: string;
  name: string;
  variant?: string | null;
  size?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customization?: Record<string, unknown> | null;
  previewUrl?: string | null;
  designFileUrl?: string | null;
}

export interface ShippingAddressEmailData {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  street?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  pincode?: string;
  country?: string;
}

export interface OrderEmailDetails {
  orderId: string;
  publicOrderId?: string | null;
  createdAt?: string | Date;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  items?: OrderItemEmailData[];
  subtotal?: number;
  shippingFee?: number;
  discount?: number | null;
  couponCode?: string | null;
  total: number;
  paymentMethod?: string | null;
  paymentGatewayPaymentId?: string | null;
  paymentStatus?: string | null;
  shippingAddress?: ShippingAddressEmailData | Record<string, unknown> | null;
  invoiceUrl?: string;
  trackingUrl?: string;
}

function formatAddressHtml(
  addr?: ShippingAddressEmailData | Record<string, unknown> | null,
): string {
  if (!addr || typeof addr !== 'object') {
    return '<span style="color: #8E8E93; font-style: italic;">No shipping address on file</span>';
  }
  const a = addr as Record<string, string | undefined>;
  const name = a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim();
  const street = a.street || a.addressLine1 || '';
  const street2 = a.addressLine2 || '';
  const cityStateZip = [a.city, a.state, a.zip || a.pincode].filter(Boolean).join(', ');
  const country = a.country || 'India';
  const phone = a.phone;
  const email = a.email;

  const lines: string[] = [];
  if (name)
    lines.push(`<strong style="color: #F5F1EA; font-size: 14px;">${escapeHtml(name)}</strong>`);
  if (street)
    lines.push(`<span style="color: #C7C7CC; font-size: 13px;">${escapeHtml(street)}</span>`);
  if (street2)
    lines.push(`<span style="color: #C7C7CC; font-size: 13px;">${escapeHtml(street2)}</span>`);
  if (cityStateZip)
    lines.push(`<span style="color: #C7C7CC; font-size: 13px;">${escapeHtml(cityStateZip)}</span>`);
  if (country)
    lines.push(`<span style="color: #9E9EA7; font-size: 12px;">${escapeHtml(country)}</span>`);
  if (phone)
    lines.push(
      `<span style="color: #E5C287; font-size: 12px; margin-top: 4px; display: inline-block;">📞 ${escapeHtml(phone)}</span>`,
    );
  if (email)
    lines.push(
      `<span style="color: #9E9EA7; font-size: 12px; display: block;">✉️ ${escapeHtml(email)}</span>`,
    );

  return lines.join('<br />');
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CUSTOMER ORDER CONFIRMATION EMAIL
 * Luxury, Celestial & Creative Design for Fregoro Studios customers
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function sendOrderConfirmationEmail(
  toEmail: string,
  orderId: string,
  customerName: string,
  total: number,
  details?: Partial<OrderEmailDetails>,
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping order confirmation email to:', toEmail);
    return false;
  }

  const baseUrl = getBaseUrl();
  const safeName = escapeHtml(customerName || details?.customerName || 'Valued Collector');
  const safeOrderId = escapeHtml(
    orderId || details?.publicOrderId || details?.orderId || 'STB-ORDER',
  );
  const finalTotal = details?.total ?? total ?? 0;
  const subtotal = details?.subtotal ?? finalTotal;
  const shippingFee = details?.shippingFee ?? 0;
  const discount = details?.discount ?? 0;
  const items =
    details?.items && details.items.length > 0
      ? details.items
      : [
          {
            name: 'Custom Astronomical Star Map',
            variant: 'Custom Star Map Edition',
            quantity: 1,
            unitPrice: subtotal,
            totalPrice: subtotal,
          },
        ];

  const invoiceUrl = `${baseUrl}/account/orders/${encodeURIComponent(orderId)}/invoice?email=${encodeURIComponent(toEmail)}`;
  const trackingUrl = `${baseUrl}/track?orderId=${encodeURIComponent(safeOrderId)}&email=${encodeURIComponent(toEmail)}`;

  // Build items HTML
  const itemsHtml = items
    .map((item) => {
      const itemTitle = escapeHtml(item.name);
      const variantDetails = [
        item.size ? `Size: ${item.size}` : null,
        item.variant ? `Edition: ${item.variant}` : null,
      ]
        .filter(Boolean)
        .join(' · ');

      // Extract custom text if present
      let customSnippet = '';
      if (item.customization && typeof item.customization === 'object') {
        const c = item.customization as Record<string, unknown>;
        const title = c.text || c.headline || c.title;
        const occasion = c.occasion;
        const dateLoc = [c.date, c.location || c.locationName].filter(Boolean).join(' · ');
        if (title || occasion || dateLoc) {
          customSnippet = `
            <div style="margin-top: 6px; padding: 6px 10px; background: rgba(229, 194, 135, 0.08); border-left: 2px solid #E5C287; border-radius: 4px; font-size: 11px; color: #E5C287; line-height: 1.4;">
              ${title ? `<div><strong>"${escapeHtml(String(title))}"</strong></div>` : ''}
              ${occasion ? `<div>✦ Occasion: ${escapeHtml(String(occasion))}</div>` : ''}
              ${dateLoc ? `<div>✦ ${escapeHtml(String(dateLoc))}</div>` : ''}
            </div>
          `;
        }
      }

      return `
        <tr>
          <td style="padding: 16px 12px; border-bottom: 1px solid rgba(245, 241, 234, 0.08); vertical-align: top;">
            <div style="font-size: 14px; font-weight: 600; color: #F5F1EA; margin-bottom: 4px;">${itemTitle}</div>
            ${variantDetails ? `<div style="font-size: 12px; color: #9E9EA7; font-family: monospace;">${escapeHtml(variantDetails)}</div>` : ''}
            ${customSnippet}
          </td>
          <td style="padding: 16px 12px; border-bottom: 1px solid rgba(245, 241, 234, 0.08); text-align: center; vertical-align: top; font-size: 14px; color: #C7C7CC; font-family: monospace;">
            ${item.quantity}
          </td>
          <td style="padding: 16px 12px; border-bottom: 1px solid rgba(245, 241, 234, 0.08); text-align: right; vertical-align: top; font-size: 14px; font-weight: 600; color: #F5F1EA; font-family: monospace;">
            ₹${item.totalPrice.toFixed(2)}
          </td>
        </tr>
      `;
    })
    .join('');

  const shippingHtml = formatAddressHtml(details?.shippingAddress);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Your Cosmos is Being Crafted · Order Confirmed #${safeOrderId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #090A10; color: #F5F1EA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; line-height: 1.5;">
  
  <!-- Outer Wrapper -->
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #090A10; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 30px 12px 50px 12px;">
        
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #11131B; border: 1px solid rgba(245, 241, 234, 0.12); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
          
          <!-- Top Celestial Header & Brand -->
          <tr>
            <td style="padding: 40px 30px 25px 30px; text-align: center; background: radial-gradient(circle at 50% 0%, rgba(229, 194, 135, 0.15) 0%, rgba(17, 19, 27, 0) 70%), #11131B; border-bottom: 1px solid rgba(245, 241, 234, 0.08);">
              <div style="letter-spacing: 5px; font-size: 11px; text-transform: uppercase; color: #E5C287; font-weight: 700; margin-bottom: 10px;">
                ✦ F R E G O R O &nbsp; S T U D I O S ✦
              </div>
              <h1 style="margin: 0 0 6px 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; color: #F5F1EA;">
                Your Order is Confirmed
              </h1>
              <p style="margin: 0; font-size: 13px; color: #9E9EA7; letter-spacing: 1px; text-transform: uppercase;">
                CELESTIAL CARTOGRAPHY &amp; BESPOKE OBJECTS
              </p>
            </td>
          </tr>

          <!-- Hero Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <p style="font-size: 16px; color: #F5F1EA; margin: 0 0 12px 0;">
                Dear <strong>${safeName}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #C7C7CC; margin: 0 0 20px 0;">
                Thank you for choosing Fregoro Studios. We have received your order and confirmed your payment. Our studio team and astronomical rendering engine are now crafting your archival piece with microscopic accuracy.
              </p>

              <!-- Order Snapshot Card -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #171924; border: 1px solid rgba(229, 194, 135, 0.2); border-radius: 12px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid rgba(245, 241, 234, 0.06);">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 12px; text-transform: uppercase; color: #9E9EA7; font-weight: 600; letter-spacing: 1px;">Order Reference</td>
                        <td align="right" style="font-size: 14px; font-weight: 700; color: #E5C287; font-family: monospace;">#${safeOrderId}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid rgba(245, 241, 234, 0.06);">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 12px; text-transform: uppercase; color: #9E9EA7; font-weight: 600; letter-spacing: 1px;">Payment Status</td>
                        <td align="right">
                          <span style="display: inline-block; background-color: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.4); color: #4ade80; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
                            ✓ Paid in Full
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 12px; text-transform: uppercase; color: #9E9EA7; font-weight: 600; letter-spacing: 1px;">Est. Dispatch &amp; Delivery</td>
                        <td align="right" style="font-size: 13px; font-weight: 600; color: #F5F1EA;">3 – 5 Business Days</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Section: Itemized Bill -->
              <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #E5C287; margin-bottom: 12px;">
                ✦ Manifest &amp; Billing Breakdown
              </div>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #171924; border: 1px solid rgba(245, 241, 234, 0.08); border-radius: 12px; overflow: hidden; margin-bottom: 25px;">
                <thead>
                  <tr style="background-color: rgba(245, 241, 234, 0.03); border-bottom: 1px solid rgba(245, 241, 234, 0.1);">
                    <th align="left" style="padding: 12px; font-size: 11px; text-transform: uppercase; color: #9E9EA7; font-weight: 600; letter-spacing: 1px;">Item &amp; Specifications</th>
                    <th align="center" style="padding: 12px; font-size: 11px; text-transform: uppercase; color: #9E9EA7; font-weight: 600; letter-spacing: 1px;">Qty</th>
                    <th align="right" style="padding: 12px; font-size: 11px; text-transform: uppercase; color: #9E9EA7; font-weight: 600; letter-spacing: 1px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" align="right" style="padding: 12px 12px 4px 12px; font-size: 13px; color: #9E9EA7;">Subtotal</td>
                    <td align="right" style="padding: 12px 12px 4px 12px; font-size: 13px; color: #F5F1EA; font-family: monospace;">₹${subtotal.toFixed(2)}</td>
                  </tr>
                  ${
                    discount > 0
                      ? `
                    <tr>
                      <td colspan="2" align="right" style="padding: 4px 12px; font-size: 13px; color: #ef4444;">Discount applied</td>
                      <td align="right" style="padding: 4px 12px; font-size: 13px; color: #ef4444; font-family: monospace;">-₹${discount.toFixed(2)}</td>
                    </tr>
                    `
                      : ''
                  }
                  <tr>
                    <td colspan="2" align="right" style="padding: 4px 12px 12px 12px; font-size: 13px; color: #9E9EA7;">Shipping &amp; Protective Packaging</td>
                    <td align="right" style="padding: 4px 12px 12px 12px; font-size: 13px; color: #4ade80; font-family: monospace;">
                      ${shippingFee > 0 ? `₹${shippingFee.toFixed(2)}` : 'FREE'}
                    </td>
                  </tr>
                  <tr style="border-top: 1px solid rgba(245, 241, 234, 0.15); background-color: rgba(229, 194, 135, 0.05);">
                    <td colspan="2" align="right" style="padding: 14px 12px; font-size: 14px; font-weight: 700; color: #F5F1EA; text-transform: uppercase; letter-spacing: 0.5px;">Grand Total Paid</td>
                    <td align="right" style="padding: 14px 12px; font-size: 16px; font-weight: 800; color: #E5C287; font-family: monospace;">₹${finalTotal.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>

              <!-- Shipping Address Dossier -->
              <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #E5C287; margin-bottom: 10px;">
                ✦ Delivery Destination
              </div>
              <div style="background-color: #171924; border: 1px solid rgba(245, 241, 234, 0.08); border-radius: 12px; padding: 18px 20px; line-height: 1.6; margin-bottom: 30px;">
                ${shippingHtml}
              </div>

              <!-- Action Buttons -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${trackingUrl}" target="_blank" style="display: inline-block; width: 85%; max-width: 320px; background-color: #E5C287; color: #090A10; font-weight: 700; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; text-align: center; box-shadow: 0 4px 15px rgba(229, 194, 135, 0.3);">
                      Track Order Live
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${invoiceUrl}" target="_blank" style="display: inline-block; width: 85%; max-width: 320px; background-color: transparent; border: 1px solid rgba(245, 241, 234, 0.25); color: #F5F1EA; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; text-align: center;">
                      View &amp; Print Official Tax Invoice &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Studio Craftsmanship Guarantee -->
              <div style="border-top: 1px dashed rgba(245, 241, 234, 0.12); padding-top: 20px; font-size: 12px; color: #9E9EA7; line-height: 1.6; text-align: center;">
                <p style="margin: 0 0 6px 0; color: #E5C287; font-weight: 600;">✦ The Fregoro Studios Standard ✦</p>
                <p style="margin: 0;">
                  Printed on 300 GSM Archival Fine Art Paper with fade-resistant pigment inks. Every celestial map is mathematically computed to depict star alignments exactly as they occurred.
                </p>
              </div>

            </td>
          </tr>

          <!-- Official Business Footer with Thiruvallur Address -->
          <tr>
            <td style="padding: 30px 25px; text-align: center; background-color: #0C0D13; border-top: 1px solid rgba(245, 241, 234, 0.08); font-size: 12px; color: #71717A;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #A1A1AA;">
                ${BUSINESS_ADDRESS_NAME}
              </p>
              <p style="margin: 0 0 10px 0; line-height: 1.5;">
                ${BUSINESS_ADDRESS_LINE1}<br />
                ${BUSINESS_ADDRESS_LINE2}
              </p>
              <p style="margin: 0 0 12px 0;">
                Have a question or custom request? Reply directly to this email or reach us at
                <a href="mailto:${BUSINESS_EMAIL}" style="color: #E5C287; text-decoration: none;">${BUSINESS_EMAIL}</a>.
              </p>
              <p style="margin: 0; font-size: 11px; color: #52525B;">
                &copy; ${new Date().getFullYear()} ${BUSINESS_ADDRESS_NAME}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;

  try {
    await resend.emails.send({
      from: DEFAULT_FROM,
      to: [toEmail],
      replyTo: BUSINESS_EMAIL,
      subject: `✦ Order Confirmed #${safeOrderId} — Your Celestial Artifact is in Production`,
      html,
    });
    return true;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return false;
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ADMIN NEW ORDER & BILLING INVOICE NOTIFICATION
 * Neat, Professional, Itemized Billing Notification sent to Fregoro Studios staff
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function sendAdminNewOrderEmail(
  orderId: string,
  total: number,
  details?: Partial<OrderEmailDetails>,
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping admin notification');
    return false;
  }

  const baseUrl = getBaseUrl();
  const safeOrderId = escapeHtml(
    orderId || details?.publicOrderId || details?.orderId || 'STB-ORDER',
  );
  const finalTotal = details?.total ?? total ?? 0;
  const subtotal = details?.subtotal ?? finalTotal;
  const shippingFee = details?.shippingFee ?? 0;
  const discount = details?.discount ?? 0;
  const customerName = escapeHtml(details?.customerName || 'Customer');
  const customerEmail = escapeHtml(details?.customerEmail || 'Not provided');
  const customerPhone = escapeHtml(details?.customerPhone || 'Not provided');
  const paymentMethod = escapeHtml(details?.paymentMethod || 'Online (Cashfree)');
  const paymentTxnId = escapeHtml(details?.paymentGatewayPaymentId || 'N/A');

  const items =
    details?.items && details.items.length > 0
      ? details.items
      : [
          {
            name: 'Custom Star Map Product',
            variant: 'Standard',
            quantity: 1,
            unitPrice: subtotal,
            totalPrice: subtotal,
          },
        ];

  const adminOrderUrl = `${baseUrl}/admin/orders/${encodeURIComponent(orderId)}`;
  const invoiceUrl = `${baseUrl}/account/orders/${encodeURIComponent(orderId)}/invoice`;

  // Item table rows with artwork links
  const itemsHtml = items
    .map((item) => {
      const itemTitle = escapeHtml(item.name);
      const specLine = [
        item.size ? `Size: ${item.size}` : null,
        item.variant ? `Variant: ${item.variant}` : null,
      ]
        .filter(Boolean)
        .join(' · ');

      let customDetailsHtml = '';
      if (item.customization && typeof item.customization === 'object') {
        const c = item.customization as Record<string, unknown>;
        const keys = Object.keys(c).filter(
          (k) =>
            typeof c[k] === 'string' &&
            c[k] &&
            !['designFileUrl', 'previewFileUrl', 'thumbnail'].includes(k),
        );
        if (keys.length > 0) {
          customDetailsHtml = `
            <div style="margin-top: 6px; padding: 6px 8px; background: #222430; border-radius: 4px; font-size: 11px; color: #D1D5DB;">
              ${keys
                .slice(0, 5)
                .map(
                  (k) =>
                    `<div><strong>${escapeHtml(k)}:</strong> ${escapeHtml(String(c[k]))}</div>`,
                )
                .join('')}
            </div>
          `;
        }
      }

      // Download print asset button if present
      let fileLinks = '';
      if (item.designFileUrl || item.previewUrl) {
        fileLinks = `
          <div style="margin-top: 8px;">
            ${item.designFileUrl ? `<a href="${item.designFileUrl}" target="_blank" style="display: inline-block; background-color: #2563EB; color: #FFFFFF; font-size: 11px; font-weight: 700; text-decoration: none; padding: 4px 10px; border-radius: 4px; margin-right: 6px;">📥 Download Print Artwork</a>` : ''}
            ${item.previewUrl ? `<a href="${item.previewUrl}" target="_blank" style="display: inline-block; background-color: #374151; color: #FFFFFF; font-size: 11px; text-decoration: none; padding: 4px 8px; border-radius: 4px;">👁 View Preview</a>` : ''}
          </div>
        `;
      }

      return `
        <tr>
          <td style="padding: 14px 12px; border-bottom: 1px solid #2D303E; vertical-align: top;">
            <div style="font-weight: 700; font-size: 14px; color: #FFFFFF;">${itemTitle}</div>
            ${specLine ? `<div style="font-size: 12px; color: #9CA3AF; font-family: monospace; margin-top: 2px;">${escapeHtml(specLine)}</div>` : ''}
            ${customDetailsHtml}
            ${fileLinks}
          </td>
          <td align="center" style="padding: 14px 12px; border-bottom: 1px solid #2D303E; font-size: 13px; color: #E5E7EB; font-family: monospace; vertical-align: top;">
            ${item.quantity}
          </td>
          <td align="right" style="padding: 14px 12px; border-bottom: 1px solid #2D303E; font-size: 13px; color: #E5E7EB; font-family: monospace; vertical-align: top;">
            ₹${item.unitPrice.toFixed(2)}
          </td>
          <td align="right" style="padding: 14px 12px; border-bottom: 1px solid #2D303E; font-size: 14px; font-weight: 700; color: #FFFFFF; font-family: monospace; vertical-align: top;">
            ₹${item.totalPrice.toFixed(2)}
          </td>
        </tr>
      `;
    })
    .join('');

  const shippingHtml = formatAddressHtml(details?.shippingAddress);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order Billing Manifest - #${safeOrderId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0D13; color: #E5E7EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0D13; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 25px 12px 40px 12px;">

        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; background-color: #161822; border: 1px solid #282C3D; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">

          <!-- Top Banner -->
          <tr>
            <td style="padding: 28px 25px; background: linear-gradient(135deg, #1E2333 0%, #161822 100%); border-bottom: 1px solid #282C3D;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #10B981; color: #042F2E; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                      ✓ Payment Verified (PAID)
                    </span>
                    <h1 style="margin: 0 0 4px 0; font-size: 22px; font-weight: 800; color: #FFFFFF;">
                      New Order Received: #${safeOrderId}
                    </h1>
                    <div style="font-size: 13px; color: #9CA3AF;">
                      Placed on ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <div style="font-size: 24px; font-weight: 800; color: #10B981; font-family: monospace;">
                      ₹${finalTotal.toFixed(2)}
                    </div>
                    <div style="font-size: 11px; text-transform: uppercase; color: #9CA3AF;">Total Paid</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Quick Action Buttons -->
          <tr>
            <td style="padding: 16px 25px; background-color: #1D212E; border-bottom: 1px solid #282C3D;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <a href="${adminOrderUrl}" target="_blank" style="display: inline-block; background-color: #F3F4F6; color: #111827; font-weight: 700; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-size: 13px; margin-right: 8px;">
                      Open in Admin Panel &rarr;
                    </a>
                    <a href="${invoiceUrl}" target="_blank" style="display: inline-block; background-color: transparent; border: 1px solid #4B5563; color: #E5E7EB; font-weight: 600; text-decoration: none; padding: 9px 16px; border-radius: 6px; font-size: 13px;">
                      View Tax Invoice
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer & Payment Dossier -->
          <tr>
            <td style="padding: 24px 25px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <!-- Left: Customer & Payment -->
                  <td width="50%" style="vertical-align: top; padding-right: 15px;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #9CA3AF; letter-spacing: 1px; margin-bottom: 8px;">
                      Customer Information
                    </div>
                    <div style="background-color: #1C202C; border: 1px solid #2D303E; border-radius: 8px; padding: 12px 14px; font-size: 13px; line-height: 1.6;">
                      <div><strong style="color: #FFFFFF;">${customerName}</strong></div>
                      <div>✉️ <a href="mailto:${customerEmail}" style="color: #60A5FA; text-decoration: none;">${customerEmail}</a></div>
                      <div>📞 <a href="tel:${customerPhone}" style="color: #E5C287; text-decoration: none;">${customerPhone}</a></div>
                      <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #2D303E; font-size: 11px; color: #9CA3AF;">
                        <div><strong>Method:</strong> ${paymentMethod}</div>
                        <div><strong>Txn ID:</strong> <span style="font-family: monospace;">${paymentTxnId}</span></div>
                      </div>
                    </div>
                  </td>

                  <!-- Right: Shipping Destination -->
                  <td width="50%" style="vertical-align: top; padding-left: 15px;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #9CA3AF; letter-spacing: 1px; margin-bottom: 8px;">
                      Delivery Address
                    </div>
                    <div style="background-color: #1C202C; border: 1px solid #2D303E; border-radius: 8px; padding: 12px 14px; font-size: 13px; line-height: 1.6;">
                      ${shippingHtml}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Section: Itemized Manifest Table -->
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #9CA3AF; letter-spacing: 1px; margin: 24px 0 10px 0;">
                Production Manifest &amp; Billing Items
              </div>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1C202C; border: 1px solid #2D303E; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                <thead>
                  <tr style="background-color: #222634; border-bottom: 1px solid #2D303E;">
                    <th align="left" style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #9CA3AF; font-weight: 700;">Item / Customization</th>
                    <th align="center" style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #9CA3AF; font-weight: 700;">Qty</th>
                    <th align="right" style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #9CA3AF; font-weight: 700;">Price</th>
                    <th align="right" style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #9CA3AF; font-weight: 700;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" align="right" style="padding: 10px 12px 4px 12px; font-size: 12px; color: #9CA3AF;">Subtotal</td>
                    <td align="right" style="padding: 10px 12px 4px 12px; font-size: 12px; color: #E5E7EB; font-family: monospace;">₹${subtotal.toFixed(2)}</td>
                  </tr>
                  ${
                    discount > 0
                      ? `
                    <tr>
                      <td colspan="3" align="right" style="padding: 4px 12px; font-size: 12px; color: #EF4444;">Discount</td>
                      <td align="right" style="padding: 4px 12px; font-size: 12px; color: #EF4444; font-family: monospace;">-₹${discount.toFixed(2)}</td>
                    </tr>
                    `
                      : ''
                  }
                  <tr>
                    <td colspan="3" align="right" style="padding: 4px 12px 10px 12px; font-size: 12px; color: #9CA3AF;">Shipping</td>
                    <td align="right" style="padding: 4px 12px 10px 12px; font-size: 12px; color: #10B981; font-family: monospace;">
                      ${shippingFee > 0 ? `₹${shippingFee.toFixed(2)}` : 'FREE'}
                    </td>
                  </tr>
                  <tr style="border-top: 1px solid #2D303E; background-color: #202432;">
                    <td colspan="3" align="right" style="padding: 12px; font-size: 13px; font-weight: 700; color: #FFFFFF; text-transform: uppercase;">Total Received</td>
                    <td align="right" style="padding: 12px; font-size: 16px; font-weight: 800; color: #10B981; font-family: monospace;">₹${finalTotal.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>

            </td>
          </tr>

          <!-- Admin Footer -->
          <tr>
            <td style="padding: 20px 25px; text-align: center; background-color: #12141D; border-top: 1px solid #282C3D; font-size: 11px; color: #6B7280;">
              <p style="margin: 0 0 4px 0; font-weight: 600; color: #9CA3AF;">
                ${BUSINESS_ADDRESS_NAME} Internal Operations
              </p>
              <p style="margin: 0;">
                Official Business Address: ${BUSINESS_FULL_ADDRESS}
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;

  try {
    await resend.emails.send({
      from: DEFAULT_FROM,
      to: [ADMIN_RECIPIENT],
      replyTo: details?.customerEmail || BUSINESS_EMAIL,
      subject: `⚡ [NEW ORDER] #${safeOrderId} · ₹${finalTotal.toFixed(2)} by ${customerName}`,
      html,
    });
    return true;
  } catch (error) {
    console.error('Failed to send admin order email:', error);
    return false;
  }
}

export async function sendContactEmail(
  name: string,
  email: string,
  subject: string,
  message: string,
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping contact email from:', email);
    return false;
  }

  const safeName = escapeHtml(name);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message);

  try {
    await resend.emails.send({
      from: DEFAULT_FROM,
      to: [ADMIN_RECIPIENT],
      replyTo: email,
      subject: `New Customer Query: ${safeSubject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="color: #000;">New Contact Form Query</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
          </div>
          <p style="color: #666; font-size: 13px;">Hit "Reply" in your email client to respond directly to ${escapeHtml(email)}.</p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error('Failed to send contact email:', error);
    return false;
  }
}

export async function sendContactAutoReply(toEmail: string, name: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping auto-reply to:', toEmail);
    return false;
  }

  const safeName = escapeHtml(name);

  try {
    await resend.emails.send({
      from: DEFAULT_FROM,
      to: [toEmail],
      replyTo: BUSINESS_EMAIL,
      subject: 'We got your message — Fregoro Studios Support',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="color: #000;">Hey ${safeName}, we received your message!</h2>
          <p>Thanks for reaching out to Fregoro Studios. Our team will get back to you within 24–48 hours.</p>
          <p>You can also reach us directly at <a href="mailto:${BUSINESS_EMAIL}" style="color: #0057FF;">${BUSINESS_EMAIL}</a>.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px; line-height: 1.5;">
            ${BUSINESS_ADDRESS_NAME}<br />
            ${BUSINESS_FULL_ADDRESS}
          </p>
          <p style="color: #888; font-size: 12px;">If you didn't submit this form, you can ignore this email.</p>
          <p>– The Fregoro Studios Team</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send contact auto-reply:', error);
    return false;
  }
}

export async function sendOrderShippedEmail(
  toEmail: string,
  orderId: string,
  customerName: string,
  trackingUrl?: string,
  trackingNumber?: string,
  carrier?: string,
) {
  if (!process.env.RESEND_API_KEY) return false;
  const safeName = escapeHtml(customerName);

  try {
    await resend.emails.send({
      from: DEFAULT_FROM,
      to: [toEmail],
      replyTo: BUSINESS_EMAIL,
      subject: `Your Order #${orderId} has Shipped! 🚚`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="color: #000;">Great news, ${safeName}!</h2>
          <p>Your order <strong>#${escapeHtml(orderId)}</strong> has been shipped and is on its way to you.</p>
          ${
            trackingUrl || trackingNumber
              ? `
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Tracking Details</h3>
              ${carrier ? `<p style="margin: 0;"><strong>Carrier:</strong> ${escapeHtml(carrier)}</p>` : ''}
              ${trackingNumber ? `<p style="margin: 0;"><strong>Tracking Number:</strong> ${escapeHtml(trackingNumber)}</p>` : ''}
              ${trackingUrl ? `<p style="margin-top: 10px;"><a href="${escapeHtml(trackingUrl)}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Track Your Shipment</a></p>` : ''}
            </div>
          `
              : ''
          }
          <p>Thank you for shopping with Fregoro Studios! If you need anything, simply reply to this email or write to <a href="mailto:${BUSINESS_EMAIL}">${BUSINESS_EMAIL}</a>.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px; line-height: 1.5;">
            ${BUSINESS_ADDRESS_NAME}<br />
            ${BUSINESS_FULL_ADDRESS}
          </p>
          <p>Best regards,<br/>The Fregoro Studios Team</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send order shipped email:', error);
    return false;
  }
}

export async function sendOrderDeliveredEmail(
  toEmail: string,
  orderId: string,
  customerName: string,
) {
  if (!process.env.RESEND_API_KEY) return false;
  const safeName = escapeHtml(customerName);

  try {
    await resend.emails.send({
      from: DEFAULT_FROM,
      to: [toEmail],
      replyTo: BUSINESS_EMAIL,
      subject: `Your Order #${orderId} has been Delivered! 🎉`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="color: #000;">Your order has arrived, ${safeName}!</h2>
          <p>Your order <strong>#${escapeHtml(orderId)}</strong> has been marked as delivered.</p>
          <p>We hope you love your celestial artwork! If you have any questions, feedback, or need assistance, simply reply to this email or contact us at <a href="mailto:${BUSINESS_EMAIL}">${BUSINESS_EMAIL}</a>.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px; line-height: 1.5;">
            ${BUSINESS_ADDRESS_NAME}<br />
            ${BUSINESS_FULL_ADDRESS}
          </p>
          <p>Best regards,<br/>The Fregoro Studios Team</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send order delivered email:', error);
    return false;
  }
}
