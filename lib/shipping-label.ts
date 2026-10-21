import PDFDocument from 'pdfkit';
import { BUSINESS_DETAILS, parseShippingAddress } from './business-details';

/**
 * Code 128 Set B symbol widths (values 0–106). Each digit is the width, in
 * modules, of alternating bar/space elements. Value 106 is the stop symbol and
 * has seven elements instead of six.
 */
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312',
  '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
  '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131',
  '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
  '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
  '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321',
  '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224',
  '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114',
  '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112',
  '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113',
  '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412',
  '211214', '211232', '2331112',
];

/**
 * Encode text as Code 128 Set B. Returns the symbol values, including the
 * start character, the modulo-103 checksum and the stop symbol.
 */
function encodeCode128B(text: string): number[] | null {
  const values: number[] = [];
  for (const char of text) {
    const value = char.charCodeAt(0) - 32;
    // Set B covers printable ASCII 32–126; skip anything else rather than
    // emitting a barcode that cannot round-trip to the order reference.
    if (value < 0 || value > 94) return null;
    values.push(value);
  }
  if (values.length === 0) return null;

  const start = 104; // Start B
  let checksum = start;
  values.forEach((value, index) => {
    checksum += value * (index + 1);
  });

  return [start, ...values, checksum % 103, 106];
}

/** Draw a genuinely scannable Code 128B barcode with quiet zones. */
function drawCode128B(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
) {
  const codes = encodeCode128B(text);
  if (!codes) return;

  const modules = codes.reduce(
    (sum, value) =>
      sum +
      CODE128_PATTERNS[value].split('').reduce((patternSum, digit) => patternSum + Number(digit), 0),
    0,
  );
  const quietZone = 10; // modules on each side
  const moduleWidth = width / (modules + quietZone * 2);
  let cursor = x + quietZone * moduleWidth;

  doc.save();
  doc.fillColor('#000000');
  for (const value of codes) {
    const pattern = CODE128_PATTERNS[value];
    let isBar = true;
    for (const digit of pattern) {
      const elementWidth = Number(digit) * moduleWidth;
      if (isBar) {
        doc.rect(cursor, y, elementWidth, height).fill('#000000');
      }
      cursor += elementWidth;
      isBar = !isBar;
    }
  }
  doc.restore();
}

export interface ShippingLabelOrder {
  id: string;
  publicOrderId?: string | null;
  createdAt: string | Date;
  shippingAddress?: unknown;
  user?: { fullName?: string | null; email?: string | null; phone?: string | null } | null;
  items?: Array<{ quantity: number }>;
  total: number;
  paymentMethod?: string | null;
  paymentProvider?: string | null;
  paymentStatus?: string | null;
  carrier?: string | null;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
}

/** Trim a string to fit a pdfkit text box without splitting words mid-way. */
function truncateToWidth(doc: PDFKit.PDFDocument, text: string, width: number): string {
  if (!text) return '';
  if (doc.widthOfString(text) <= width) return text;
  let value = text;
  while (value.length > 1 && doc.widthOfString(`${value}…`) > width) {
    value = value.slice(0, -1);
  }
  return `${value.trim()}…`;
}

/**
 * Generate a 4×6 inch (288 × 432 pt) courier shipping label.
 *
 * The layout is deliberately high-contrast and oversized so it stays readable
 * when printed on a thermal label printer or a normal A4 sheet (fit-to-page):
 *
 *   ┌──────────────────────────────┐
 *   │ brand + order reference      │
 *   │ FROM / RTO return address    │
 *   │ SHIP TO (largest block)      │
 *   │ PREPAID / COLLECT strip      │
 *   │ order meta + barcode         │
 *   │ handling + RTO instructions  │
 *   └──────────────────────────────┘
 */
export async function generateShippingLabelPdf(order: ShippingLabelOrder): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [288, 432], // 4 × 6 inches at 72 dpi
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        autoFirstPage: true,
        info: {
          Title: `Shipping Label ${order.publicOrderId || order.id}`,
          Author: BUSINESS_DETAILS.name,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const addr = parseShippingAddress(order.shippingAddress, order.user);
      const orderRef = order.publicOrderId || order.id;
      const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const itemCount = (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);

      const isCashOnDelivery =
        order.paymentProvider === 'cod' ||
        order.paymentMethod?.toLowerCase().includes('cod') ||
        order.paymentMethod?.toLowerCase().includes('cash');
      const isPrepaid = !isCashOnDelivery;

      const left = 8;
      const right = 280;
      const innerLeft = 16;
      const innerRight = 272;
      const innerWidth = innerRight - innerLeft;

      // ── Outer frame ────────────────────────────────────────────────────────
      doc.rect(left, 8, right - left, 416).lineWidth(1.2).strokeColor('#0F172A').stroke();

      // ── Header ─────────────────────────────────────────────────────────────
      doc.rect(left, 8, right - left, 36).fill('#0F172A');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(12).text(
        BUSINESS_DETAILS.name.toUpperCase(),
        innerLeft,
        16,
      );
      doc.font('Helvetica').fontSize(6.2).fillColor('#94A3B8').text(
        'CUSTOM PRINTED APPAREL · SHIPPING LABEL',
        innerLeft,
        31,
      );
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#E5C287').text(
        `ORDER ${orderRef}`,
        innerLeft,
        31,
        { width: innerWidth, align: 'right' },
      );

      // ── FROM / return address ──────────────────────────────────────────────
      doc.rect(left + 4, 50, right - left - 8, 60).lineWidth(0.8).strokeColor('#CBD5E1').fill('#F8FAFC');
      doc.rect(left + 4, 50, right - left - 8, 12).fill('#E2E8F0');
      doc.font('Helvetica-Bold').fontSize(6.6).fillColor('#0F172A').text(
        'FROM / RETURN ADDRESS — IF UNDELIVERABLE, RETURN TO SENDER',
        innerLeft,
        53.5,
        { width: innerWidth },
      );
      doc.font('Helvetica-Bold').fontSize(7.6).fillColor('#0F172A').text(
        BUSINESS_DETAILS.name.toUpperCase(),
        innerLeft,
        66.5,
      );
      doc.font('Helvetica').fontSize(6.2).fillColor('#334155').text(
        `${BUSINESS_DETAILS.addressLine1}, ${BUSINESS_DETAILS.addressLine2}`,
        innerLeft,
        76,
        { width: innerWidth },
      );
      doc.font('Helvetica-Bold').fontSize(6.2).fillColor('#0F172A').text(
        `Phone: ${BUSINESS_DETAILS.phone}   ·   ${BUSINESS_DETAILS.email}`,
        innerLeft,
        94,
        { width: innerWidth },
      );

      // ── SHIP TO ────────────────────────────────────────────────────────────
      const shipY = 116;
      const shipH = 150;
      doc.rect(left + 4, shipY, right - left - 8, shipH).lineWidth(1.6).strokeColor('#0F172A').fill('#FFFFFF');
      doc.rect(left + 4, shipY, right - left - 8, 17).fill('#0F172A');
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#FFFFFF').text('SHIP TO / DELIVER TO', innerLeft, shipY + 4.5);
      doc.font('Helvetica').fontSize(6).fillColor('#CBD5E1').text(
        'DELIVERY ADDRESS',
        innerLeft,
        shipY + 5,
        { width: innerWidth, align: 'right' },
      );

      // Recipient name — biggest text on the label so it is readable from arm's length.
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#0F172A');
      const nameLine = truncateToWidth(doc, addr.name, innerWidth);
      doc.text(nameLine, innerLeft, shipY + 23, { width: innerWidth, lineBreak: false, ellipsis: true });

      // Street address block. Wrap naturally and only shrink/truncate when the
      // customer supplied an unusually long address (three lines is the cap).
      const streetText = [addr.streetLine1, addr.streetLine2].filter(Boolean).join('\n');
      const addressTop = shipY + 41;
      const maxAddressHeight = 34;
      let addressFont = 8.8;
      let addressHeight = doc
        .font('Helvetica')
        .fontSize(addressFont)
        .heightOfString(streetText, { width: innerWidth, lineGap: 1 });
      if (addressHeight > maxAddressHeight) {
        addressFont = 7.8;
        addressHeight = doc
          .font('Helvetica')
          .fontSize(addressFont)
          .heightOfString(streetText, { width: innerWidth, lineGap: 1 });
      }
      doc.font('Helvetica').fontSize(addressFont).fillColor('#1E293B').text(streetText, innerLeft, addressTop, {
        width: innerWidth,
        height: maxAddressHeight,
        ellipsis: true,
        lineGap: 1,
      });

      // City / state / PIN — bold and large for courier sorting.
      const cityLineRaw = [addr.city, addr.state].filter(Boolean).join(', ');
      const cityLine = addr.zip ? `${cityLineRaw}${cityLineRaw ? ' - ' : ''}${addr.zip}` : cityLineRaw;
      const cityY = addressTop + Math.min(addressHeight, maxAddressHeight) + 7;
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A').text(
        truncateToWidth(doc, cityLine || addr.country, innerWidth),
        innerLeft,
        cityY,
        { width: innerWidth, lineBreak: false, ellipsis: true },
      );
      doc.font('Helvetica').fontSize(7).fillColor('#475569').text(addr.country || 'India', innerLeft, cityY + 14);

      // Phone is essential for last-mile delivery in India — emphasise it.
      const phoneY = Math.max(shipY + 104, cityY + 30);
      doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#1D4ED8').text(
        addr.phone ? `PHONE: ${addr.phone}` : 'PHONE: NOT PROVIDED',
        innerLeft,
        phoneY,
        { width: innerWidth, lineBreak: false, ellipsis: true },
      );
      if (addr.email) {
        doc.font('Helvetica').fontSize(6.6).fillColor('#64748B').text(
          truncateToWidth(doc, addr.email, innerWidth),
          innerLeft,
          phoneY + 16,
          { width: innerWidth, lineBreak: false, ellipsis: true },
        );
      }

      // ── Payment strip ──────────────────────────────────────────────────────
      const payY = 272;
      if (isPrepaid) {
        doc.rect(left + 4, payY, right - left - 8, 32).lineWidth(1).strokeColor('#047857').fill('#ECFDF5');
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#065F46').text('PREPAID', innerLeft, payY + 7);
        doc.font('Helvetica-Bold').fontSize(7.4).fillColor('#047857').text(
          'ZERO AMOUNT DUE — DO NOT COLLECT CASH',
          innerLeft,
          payY + 20,
        );
      } else {
        doc.rect(left + 4, payY, right - left - 8, 32).lineWidth(1).strokeColor('#B91C1C').fill('#FEF2F2');
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#991B1B').text('CASH ON DELIVERY', innerLeft, payY + 7);
        doc.font('Helvetica-Bold').fontSize(8.6).fillColor('#B91C1C').text(
          `COLLECT ₹${order.total.toFixed(2)} FROM CUSTOMER`,
          innerLeft,
          payY + 20,
        );
      }
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#0F172A').text(
        `INVOICE VALUE: ₹${order.total.toFixed(2)}`,
        innerLeft,
        payY + 9,
        { width: innerWidth, align: 'right' },
      );
      doc.font('Helvetica').fontSize(5.8).fillColor('#64748B').text(
        isPrepaid ? 'PAID ONLINE' : 'PAYABLE AT DOORSTEP',
        innerLeft,
        payY + 21,
        { width: innerWidth, align: 'right' },
      );

      // ── Order meta strip ───────────────────────────────────────────────────
      const metaY = 310;
      const metaH = 34;
      const colWidth = (right - left - 8) / 3;
      doc.rect(left + 4, metaY, right - left - 8, metaH).lineWidth(0.8).strokeColor('#CBD5E1').fill('#FFFFFF');
      doc.moveTo(left + 4 + colWidth, metaY).lineTo(left + 4 + colWidth, metaY + metaH).lineWidth(0.6).strokeColor('#E2E8F0').stroke();
      doc.moveTo(left + 4 + colWidth * 2, metaY).lineTo(left + 4 + colWidth * 2, metaY + metaH).lineWidth(0.6).strokeColor('#E2E8F0').stroke();

      const meta = [
        { label: 'ORDER REF', value: orderRef },
        { label: 'ITEMS', value: String(itemCount || 1) },
        { label: 'ORDER DATE', value: orderDate },
      ];
      meta.forEach((entry, index) => {
        const x = left + 10 + colWidth * index;
        doc.font('Helvetica').fontSize(5.6).fillColor('#64748B').text(entry.label, x, metaY + 5);
        doc.font('Courier-Bold').fontSize(7.4).fillColor('#0F172A').text(
          truncateToWidth(doc, entry.value, colWidth - 12),
          x,
          metaY + 14,
          { width: colWidth - 12, lineBreak: false, ellipsis: true },
        );
      });

      const carrier = order.carrier || order.shippingCarrier || '';
      doc.font('Helvetica').fontSize(5.8).fillColor('#475569').text(
        `COURIER: ${carrier || 'To be assigned'}${order.trackingNumber ? `   AWB: ${order.trackingNumber}` : ''}`,
        innerLeft,
        metaY + 25,
        { width: innerWidth, lineBreak: false, ellipsis: true },
      );

      // ── Order barcode ──────────────────────────────────────────────────────
      // Full-width so it never collides with the handling text underneath.
      drawCode128B(doc, innerLeft, 350, innerWidth, 22, String(orderRef));
      doc.font('Courier-Bold').fontSize(6.6).fillColor('#334155').text(
        `*${orderRef}*`,
        innerLeft,
        374,
        { width: innerWidth, align: 'center' },
      );

      // ── Handling line ─────────────────────────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(5.8).fillColor('#0F172A').text(
        'HANDLE WITH CARE · KEEP DRY · DO NOT BEND · CUSTOM PRINTED APPAREL',
        innerLeft,
        383,
        { width: innerWidth, align: 'center' },
      );

      // ── RTO / return instructions ─────────────────────────────────────────
      doc.rect(left + 4, 391, right - left - 8, 31).lineWidth(0.6).strokeColor('#E2E8F0').fill('#F8FAFC');
      doc.font('Helvetica-Bold').fontSize(5.5).fillColor('#B91C1C').text(
        'RETURN / RTO — IF UNDELIVERABLE, RETURN TO SENDER',
        innerLeft,
        393.5,
        { width: innerWidth },
      );
      doc.font('Helvetica').fontSize(5).fillColor('#475569').text(
        `If the recipient is unavailable, refuses delivery, or the address is incomplete, mark RTO and return this parcel to the FROM address above. Do not abandon the parcel. Questions: ${BUSINESS_DETAILS.phone} · ${BUSINESS_DETAILS.email}`,
        innerLeft,
        400.5,
        { width: innerWidth, lineGap: 0.6 },
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
