import PDFDocument from 'pdfkit';
import { BUSINESS_DETAILS, parseShippingAddress } from './business-details';
import { drawBrandLogo, drawCode128B, PRINT } from './pdf-branding';
import { PDF_FONTS, registerPdfFonts } from './pdf-fonts';

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

function inr(amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return `INR ${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
 * Visual language matches the invoice/packing slip: white stock, black type,
 * thin rules and neutral grey section bands. Everything is monochrome so the
 * label prints cleanly on a thermal printer.
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
          Subject: 'Courier shipping label and return instructions',
        },
      });

      registerPdfFonts(doc);

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

      const left = 8;
      const right = 280;
      const innerLeft = 16;
      const innerRight = 272;
      const innerWidth = innerRight - innerLeft;

      // ── Outer frame ────────────────────────────────────────────────────────
      doc.rect(left, 8, right - left, 416).lineWidth(1.1).strokeColor(PRINT.black).stroke();

      // ── Header: logo + wordmark + label title ─────────────────────────────
      drawBrandLogo(doc, innerLeft, 11, 76);
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(8.6)
        .fillColor(PRINT.black)
        .text('FREGORO STUDIOS', 98, 14);
      doc
        .font(PDF_FONTS.sans)
        .fontSize(5.1)
        .fillColor(PRINT.gray500)
        .text('CUSTOM PRINTED APPAREL', 98, 25);

      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(6.4)
        .fillColor(PRINT.black)
        .text('SHIPPING LABEL', 172, 13, { width: 100, align: 'right' });
      doc
        .font(PDF_FONTS.sans)
        .fontSize(4.9)
        .fillColor(PRINT.gray500)
        .text('ORDER REFERENCE', 172, 24, { width: 100, align: 'right' });
      doc
        .font(PDF_FONTS.monoBold)
        .fontSize(6.3)
        .fillColor(PRINT.ink)
        .text(truncateToWidth(doc, String(orderRef), 100), 172, 31, {
          width: 100,
          align: 'right',
          lineBreak: false,
        });

      doc
        .moveTo(left, 50)
        .lineTo(right, 50)
        .lineWidth(0.8)
        .strokeColor(PRINT.black)
        .stroke();

      // ── FROM / return address ──────────────────────────────────────────────
      const fromY = 55;
      const fromH = 60;
      doc
        .rect(left + 4, fromY, right - left - 8, fromH)
        .lineWidth(0.6)
        .strokeColor(PRINT.black)
        .stroke();
      doc.rect(left + 4, fromY, right - left - 8, 12).fill(PRINT.washStrong);
      doc
        .moveTo(left + 4, fromY + 12)
        .lineTo(right - 4, fromY + 12)
        .lineWidth(0.4)
        .strokeColor(PRINT.rule)
        .stroke();
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(5.4)
        .fillColor(PRINT.black)
        .text(
          'FROM / RETURN ADDRESS — IF UNDELIVERABLE, RETURN TO SENDER',
          innerLeft,
          fromY + 3.5,
          { width: innerWidth },
        );

      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(7.2)
        .fillColor(PRINT.black)
        .text(BUSINESS_DETAILS.name.toUpperCase(), innerLeft, fromY + 16);
      doc
        .font(PDF_FONTS.sans)
        .fontSize(5.6)
        .fillColor(PRINT.ink)
        .text(BUSINESS_DETAILS.addressLine1, innerLeft, fromY + 25.5, { width: innerWidth });
      doc.text(BUSINESS_DETAILS.addressLine2, innerLeft, fromY + 32.5, { width: innerWidth });
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(5.6)
        .fillColor(PRINT.ink)
        .text(
          `Phone: ${BUSINESS_DETAILS.phone}  ·  ${BUSINESS_DETAILS.email}`,
          innerLeft,
          fromY + 41,
          { width: innerWidth },
        );

      // ── SHIP TO ────────────────────────────────────────────────────────────
      const shipY = 120;
      const shipHeaderH = 15;
      doc.rect(left + 4, shipY, right - left - 8, shipHeaderH).fill(PRINT.washStrong);
      doc
        .rect(left + 4, shipY, right - left - 8, shipHeaderH)
        .lineWidth(1.3)
        .strokeColor(PRINT.black)
        .stroke();
      doc
        .moveTo(left + 4, shipY + shipHeaderH)
        .lineTo(right - 4, shipY + shipHeaderH)
        .lineWidth(0.6)
        .strokeColor(PRINT.black)
        .stroke();
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(6.7)
        .fillColor(PRINT.black)
        .text('SHIP TO / DELIVER TO', innerLeft, shipY + 4.5);

      // Recipient name — biggest text on the label so it is readable from arm's length.
      const nameY = shipY + 21;
      doc.font(PDF_FONTS.sansBold).fontSize(12.2).fillColor(PRINT.black);
      const nameLine = truncateToWidth(doc, addr.name, innerWidth);
      doc.text(nameLine, innerLeft, nameY, {
        width: innerWidth,
        lineBreak: false,
        ellipsis: true,
      });

      // Street address block. Lines flow on a fixed grid; long addresses shrink
      // one step before being elided, so the city and phone below never drift.
      const streetText = [addr.streetLine1, addr.streetLine2].filter(Boolean).join('\n');
      const addressTop = nameY + 15;
      const addressCap = 31;
      let addressFont = 8.2;
      let addressHeight = doc
        .font(PDF_FONTS.sans)
        .fontSize(addressFont)
        .heightOfString(streetText, { width: innerWidth, lineGap: 1 });
      if (addressHeight > addressCap) {
        addressFont = 7.4;
        addressHeight = doc
          .font(PDF_FONTS.sans)
          .fontSize(addressFont)
          .heightOfString(streetText, { width: innerWidth, lineGap: 1 });
      }
      doc
        .font(PDF_FONTS.sans)
        .fontSize(addressFont)
        .fillColor(PRINT.ink)
        .text(streetText, innerLeft, addressTop, {
          width: innerWidth,
          height: addressCap,
          ellipsis: true,
          lineGap: 1,
        });

      // City / state / PIN — bold and large for courier sorting.
      const renderedAddressHeight = Math.min(addressHeight, addressCap);
      const cityY = addressTop + renderedAddressHeight + 6;
      const cityLineRaw = [addr.city, addr.state].filter(Boolean).join(', ');
      const cityLine = addr.zip ? `${cityLineRaw}${cityLineRaw ? ' - ' : ''}${addr.zip}` : cityLineRaw;
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(10.6)
        .fillColor(PRINT.black)
        .text(truncateToWidth(doc, cityLine || addr.country, innerWidth), innerLeft, cityY, {
          width: innerWidth,
          lineBreak: false,
          ellipsis: true,
        });

      const countryY = cityY + 12.5;
      doc
        .font(PDF_FONTS.sans)
        .fontSize(6.1)
        .fillColor(PRINT.gray500)
        .text(addr.country || 'India', innerLeft, countryY);

      // Phone and email sit immediately below the address rather than being
      // pushed to the bottom of the box, which left a large dead gap.
      const phoneY = cityY + 23;
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(9.4)
        .fillColor(PRINT.black)
        .text(
          addr.phone ? `PHONE: ${addr.phone}` : 'PHONE: NOT PROVIDED',
          innerLeft,
          phoneY,
          { width: innerWidth, lineBreak: false, ellipsis: true },
        );
      const emailY = phoneY + 12;
      if (addr.email) {
        doc
          .font(PDF_FONTS.sans)
          .fontSize(6.2)
          .fillColor(PRINT.gray500)
          .text(truncateToWidth(doc, addr.email, innerWidth), innerLeft, emailY, {
            width: innerWidth,
            lineBreak: false,
            ellipsis: true,
          });
      }

      // Box height follows the content so short and long addresses both have
      // even padding and the sections below stay tightly stacked.
      const shipContentBottom = addr.email ? emailY + 8 : phoneY + 12;
      const shipH = Math.max(104, shipContentBottom - shipY + 6);
      doc
        .rect(left + 4, shipY, right - left - 8, shipH)
        .lineWidth(1.3)
        .strokeColor(PRINT.black)
        .stroke();

      // ── Payment strip ──────────────────────────────────────────────────────
      const payY = shipY + shipH + 6;
      const payH = 31;
      doc.rect(left + 4, payY, right - left - 8, payH).fill(PRINT.wash);
      doc
        .rect(left + 4, payY, right - left - 8, payH)
        .lineWidth(0.9)
        .strokeColor(PRINT.black)
        .stroke();

      if (isCashOnDelivery) {
        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(9.4)
          .fillColor(PRINT.black)
          .text('CASH ON DELIVERY', innerLeft, payY + 5.5);
        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(6.8)
          .fillColor(PRINT.ink)
          .text(`COLLECT ${inr(order.total)} FROM CUSTOMER`, innerLeft, payY + 18.5);
      } else {
        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(10)
          .fillColor(PRINT.black)
          .text('PREPAID', innerLeft, payY + 5);
        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(6.6)
          .fillColor(PRINT.ink)
          .text('ZERO AMOUNT DUE — DO NOT COLLECT CASH', innerLeft, payY + 18.5);
      }

      doc
        .font(PDF_FONTS.sans)
        .fontSize(4.9)
        .fillColor(PRINT.gray500)
        .text('INVOICE VALUE', innerLeft, payY + 5, {
          width: innerWidth,
          align: 'right',
        });
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(7)
        .fillColor(PRINT.black)
        .text(inr(order.total), innerLeft, payY + 12, {
          width: innerWidth,
          align: 'right',
        })
        .font(PDF_FONTS.sans)
        .fontSize(4.9)
        .fillColor(PRINT.gray500)
        .text(isCashOnDelivery ? 'PAYABLE AT DOORSTEP' : 'PAID ONLINE', innerLeft, payY + 21, {
          width: innerWidth,
          align: 'right',
        });

      // ── Order meta strip ───────────────────────────────────────────────────
      const metaY = payY + payH + 6;
      const metaH = 42;
      const metaTopH = 24;
      const metaWidth = right - left - 8;
      const colWidth = metaWidth / 3;
      doc
        .rect(left + 4, metaY, metaWidth, metaH)
        .lineWidth(0.6)
        .strokeColor(PRINT.black)
        .stroke();
      doc
        .moveTo(left + 4, metaY + metaTopH)
        .lineTo(right - 4, metaY + metaTopH)
        .lineWidth(0.45)
        .strokeColor(PRINT.rule)
        .stroke();
      doc
        .moveTo(left + 4 + colWidth, metaY)
        .lineTo(left + 4 + colWidth, metaY + metaTopH)
        .lineWidth(0.45)
        .strokeColor(PRINT.rule)
        .stroke();
      doc
        .moveTo(left + 4 + colWidth * 2, metaY)
        .lineTo(left + 4 + colWidth * 2, metaY + metaTopH)
        .lineWidth(0.45)
        .strokeColor(PRINT.rule)
        .stroke();

      const meta = [
        { label: 'ORDER REF', value: orderRef },
        { label: 'ITEMS', value: String(itemCount || 1) },
        { label: 'ORDER DATE', value: orderDate },
      ];
      meta.forEach((entry, index) => {
        const x = left + 10 + colWidth * index;
        doc
          .font(PDF_FONTS.sans)
          .fontSize(4.9)
          .fillColor(PRINT.gray500)
          .text(entry.label, x, metaY + 4);
        doc
          .font(PDF_FONTS.monoBold)
          .fontSize(6.8)
          .fillColor(PRINT.black)
          .text(truncateToWidth(doc, String(entry.value), colWidth - 12), x, metaY + 11, {
            width: colWidth - 12,
            lineBreak: false,
            ellipsis: true,
          });
      });

      const carrier = order.carrier || order.shippingCarrier || '';
      doc
        .font(PDF_FONTS.sans)
        .fontSize(5.2)
        .fillColor(PRINT.gray700)
        .text(
          `COURIER: ${carrier || 'To be assigned'}${
            order.trackingNumber ? `   AWB: ${order.trackingNumber}` : ''
          }`,
          innerLeft,
          metaY + metaTopH + 5,
          { width: innerWidth, lineBreak: false, ellipsis: true },
        );

      // ── Order barcode ──────────────────────────────────────────────────────
      const barcodeY = metaY + metaH + 10;
      drawCode128B(doc, innerLeft, barcodeY, innerWidth, 25, String(orderRef));
      const barcodeTextY = barcodeY + 27;
      doc
        .font(PDF_FONTS.monoBold)
        .fontSize(6.2)
        .fillColor(PRINT.ink)
        .text(`*${orderRef}*`, innerLeft, barcodeTextY, {
          width: innerWidth,
          align: 'center',
        });

      // ── Handling line ─────────────────────────────────────────────────────
      const handlingY = barcodeTextY + 10;
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(5.6)
        .fillColor(PRINT.black)
        .text('HANDLE WITH CARE · KEEP DRY · DO NOT BEND · CUSTOM PRINTED APPAREL', innerLeft, handlingY, {
          width: innerWidth,
          align: 'center',
        });

      // ── RTO / return instructions ─────────────────────────────────────────
      const rtoY = handlingY + 8;
      const rtoH = Math.max(34, 420 - rtoY);
      doc
        .rect(left + 4, rtoY, right - left - 8, rtoH)
        .lineWidth(0.6)
        .strokeColor(PRINT.black)
        .stroke();
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(5.3)
        .fillColor(PRINT.black)
        .text('RETURN / RTO — IF UNDELIVERABLE, RETURN TO SENDER', innerLeft, rtoY + 3.5, {
          width: innerWidth,
        });

      // Split the footer into instructions and a dedicated RTO contact block.
      // This keeps the box balanced instead of leaving a large blank area.
      const rtoSplit = innerLeft + 174;
      const rtoBodyTop = rtoY + 11;
      doc
        .moveTo(rtoSplit, rtoBodyTop - 1)
        .lineTo(rtoSplit, rtoY + rtoH - 5)
        .lineWidth(0.35)
        .strokeColor(PRINT.rule)
        .stroke();
      doc
        .font(PDF_FONTS.sans)
        .fontSize(5)
        .fillColor(PRINT.gray700)
        .text(
          'If the recipient is unavailable, refuses delivery, or the address is incomplete, mark RTO and return this parcel to the FROM address above. Do not abandon the parcel.',
          innerLeft,
          rtoBodyTop,
          { width: 166, height: rtoH - 14, ellipsis: true, lineGap: 1 },
        );
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(4.7)
        .fillColor(PRINT.black)
        .text('RTO CONTACT', rtoSplit + 6, rtoBodyTop, {
          width: innerRight - (rtoSplit + 6),
        });
      doc
        .font(PDF_FONTS.sans)
        .fontSize(4.5)
        .fillColor(PRINT.gray700)
        .text(
          `${BUSINESS_DETAILS.phone}\n${BUSINESS_DETAILS.email}`,
          rtoSplit + 6,
          rtoBodyTop + 6,
          { width: innerRight - (rtoSplit + 6), lineGap: 1 },
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
