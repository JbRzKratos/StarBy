import PDFDocument from 'pdfkit';
import { BUSINESS_DETAILS, parseShippingAddress } from './business-details';
import { drawBrandLogo, drawCode128B, drawRegistrationMarks, PRINT } from './pdf-branding';
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
 * Engineered for high-contrast thermal and laser monochrome printing:
 * pure black (#000000) and white (#FFFFFF) with architectural framing,
 * inverted header badges, high-visibility sorting hubs, and scannable barcodes.
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
          Subject: 'Courier Shipping Label and Return Routing',
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

      const outerLeft = 8;
      const outerRight = 280;
      const outerWidth = outerRight - outerLeft; // 272 pt
      const innerLeft = 14;
      const innerRight = 274;
      const innerWidth = innerRight - innerLeft; // 260 pt

      // ── Outer Frame & Architectural Registration Marks ────────────────────
      doc
        .rect(outerLeft, 8, outerWidth, 416)
        .lineWidth(1.2)
        .strokeColor(PRINT.black)
        .stroke();
      doc
        .rect(outerLeft + 2, 10, outerWidth - 4, 412)
        .lineWidth(0.4)
        .strokeColor(PRINT.black)
        .stroke();

      drawRegistrationMarks(doc, outerLeft + 6, 14, outerWidth - 12, 404, 3.5);

      // ── Header: Logo, Branding & Label Badge ──────────────────────────────
      const logoWidth = 66;
      drawBrandLogo(doc, innerLeft, 14, logoWidth);

      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(8.5)
        .fillColor(PRINT.black)
        .text('FREGORO STUDIOS', 86, 16, { characterSpacing: 0.4 });
      doc
        .font(PDF_FONTS.sans)
        .fontSize(5)
        .fillColor(PRINT.gray700)
        .text('CUSTOM APPAREL & EDITORIAL', 86, 26, { characterSpacing: 0.3 });

      // Inverted label badge
      const headerRightW = 86;
      const headerRightX = innerRight - headerRightW;
      doc.rect(headerRightX, 14, headerRightW, 12).fill(PRINT.black);
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(5.8)
        .fillColor(PRINT.white)
        .text('SHIPPING LABEL', headerRightX, 17, {
          width: headerRightW,
          align: 'center',
          characterSpacing: 0.6,
        });

      doc
        .font(PDF_FONTS.monoBold)
        .fontSize(6.5)
        .fillColor(PRINT.black)
        .text(truncateToWidth(doc, String(orderRef), headerRightW), headerRightX, 28, {
          width: headerRightW,
          align: 'right',
          lineBreak: false,
        });

      doc
        .moveTo(outerLeft, 42)
        .lineTo(outerRight, 42)
        .lineWidth(0.8)
        .strokeColor(PRINT.black)
        .stroke();

      // ── FROM / Return Address Box ──────────────────────────────────────────
      const fromY = 46;
      const fromH = 58;
      doc
        .rect(outerLeft + 3, fromY, outerWidth - 6, fromH)
        .lineWidth(0.6)
        .strokeColor(PRINT.black)
        .stroke();

      // Inverted FROM Header Tab
      doc.rect(outerLeft + 3, fromY, outerWidth - 6, 11).fill(PRINT.black);
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(5.2)
        .fillColor(PRINT.white)
        .text('FROM: FREGORO STUDIOS (IF UNDELIVERABLE RETURN TO SENDER)', innerLeft, fromY + 3, {
          width: innerWidth,
          characterSpacing: 0.4,
        });

      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(7)
        .fillColor(PRINT.black)
        .text(BUSINESS_DETAILS.name.toUpperCase(), innerLeft, fromY + 14);

      doc
        .font(PDF_FONTS.sans)
        .fontSize(5.6)
        .fillColor(PRINT.ink)
        .text(BUSINESS_DETAILS.addressLine1, innerLeft, fromY + 23, { width: innerWidth })
        .text(BUSINESS_DETAILS.addressLine2, innerLeft, fromY + 30.5, { width: innerWidth });

      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(5.6)
        .fillColor(PRINT.black)
        .text(
          `TEL: ${BUSINESS_DETAILS.phone}   ·   EMAIL: ${BUSINESS_DETAILS.email}`,
          innerLeft,
          fromY + 39,
          { width: innerWidth },
        );

      doc
        .font(PDF_FONTS.mono)
        .fontSize(4.8)
        .fillColor(PRINT.gray700)
        .text('HUB: SELAI VILLAGE, THIRUVALLUR - 631203, TAMIL NADU', innerLeft, fromY + 48, {
          width: innerWidth,
        });

      // ── SHIP TO / Deliver To Compartment ───────────────────────────────────
      const shipY = 108;
      const shipHeaderH = 13;

      // Inverted SHIP TO Header
      doc.rect(outerLeft + 3, shipY, outerWidth - 6, shipHeaderH).fill(PRINT.black);
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(6.4)
        .fillColor(PRINT.white)
        .text('SHIP TO / DELIVER TO', innerLeft, shipY + 3.5, { characterSpacing: 0.6 });

      // Recipient Name - Hero element for easy identification
      const nameY = shipY + 18;
      doc.font(PDF_FONTS.sansBold).fontSize(11.8).fillColor(PRINT.black);
      const nameLine = truncateToWidth(doc, addr.name, innerWidth);
      doc.text(nameLine, innerLeft, nameY, {
        width: innerWidth,
        lineBreak: false,
        ellipsis: true,
      });

      // Street Address Block
      const streetText = [addr.streetLine1, addr.streetLine2].filter(Boolean).join('\n');
      const addressTop = nameY + 15;
      const addressCap = 30;
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

      // Destination Sorting Hub Line: City, State - PINCODE (High visibility for couriers)
      const renderedAddressHeight = Math.min(addressHeight, addressCap);
      const cityY = addressTop + renderedAddressHeight + 5;
      const cityLineRaw = [addr.city, addr.state].filter(Boolean).join(', ');
      const cityLine = addr.zip
        ? `${cityLineRaw}${cityLineRaw ? ' - ' : ''}${addr.zip}`
        : cityLineRaw;

      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(10.6)
        .fillColor(PRINT.black)
        .text(truncateToWidth(doc, cityLine || addr.country, innerWidth), innerLeft, cityY, {
          width: innerWidth,
          lineBreak: false,
          ellipsis: true,
        });

      const countryY = cityY + 13;
      doc
        .font(PDF_FONTS.sans)
        .fontSize(6.2)
        .fillColor(PRINT.gray700)
        .text(addr.country || 'India', innerLeft, countryY);

      // Phone & Email block
      const phoneY = countryY + 9;
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(9.2)
        .fillColor(PRINT.black)
        .text(
          addr.phone ? `PHONE: ${addr.phone}` : 'PHONE: NOT PROVIDED',
          innerLeft,
          phoneY,
          { width: innerWidth, lineBreak: false, ellipsis: true },
        );

      const emailY = phoneY + 11.5;
      if (addr.email) {
        doc
          .font(PDF_FONTS.sans)
          .fontSize(6.2)
          .fillColor(PRINT.gray700)
          .text(truncateToWidth(doc, addr.email, innerWidth), innerLeft, emailY, {
            width: innerWidth,
            lineBreak: false,
            ellipsis: true,
          });
      }

      const shipContentBottom = addr.email ? emailY + 8 : phoneY + 11;
      const shipH = Math.max(106, shipContentBottom - shipY + 4);
      doc
        .rect(outerLeft + 3, shipY, outerWidth - 6, shipH)
        .lineWidth(1.2)
        .strokeColor(PRINT.black)
        .stroke();

      // ── Payment Status Strip ──────────────────────────────────────────────
      const payY = shipY + shipH + 5;
      const payH = 32;

      if (isCashOnDelivery) {
        doc
          .rect(outerLeft + 3, payY, outerWidth - 6, payH)
          .lineWidth(1.2)
          .strokeColor(PRINT.black)
          .stroke();
        doc.rect(outerLeft + 3, payY, outerWidth - 6, payH).fill(PRINT.wash);

        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(9.5)
          .fillColor(PRINT.black)
          .text('[ CASH ON DELIVERY ]', innerLeft, payY + 5.5);
        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(6.8)
          .fillColor(PRINT.black)
          .text(`COLLECT ${inr(order.total)} FROM CUSTOMER`, innerLeft, payY + 18.5);

        doc
          .font(PDF_FONTS.sans)
          .fontSize(5)
          .fillColor(PRINT.gray700)
          .text('INVOICE VALUE', innerLeft, payY + 5.5, {
            width: innerWidth,
            align: 'right',
          });
        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(7.5)
          .fillColor(PRINT.black)
          .text(inr(order.total), innerLeft, payY + 13, {
            width: innerWidth,
            align: 'right',
          });
        doc
          .font(PDF_FONTS.sans)
          .fontSize(4.8)
          .fillColor(PRINT.gray700)
          .text('DOORSTEP CASH', innerLeft, payY + 22, {
            width: innerWidth,
            align: 'right',
          });
      } else {
        // Solid black prepaid container for unmissable warehouse & courier recognition
        doc.rect(outerLeft + 3, payY, outerWidth - 6, payH).fill(PRINT.black);

        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(10)
          .fillColor(PRINT.white)
          .text('[ PREPAID SHIPMENT ]', innerLeft, payY + 5.5, { characterSpacing: 0.5 });
        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(6.6)
          .fillColor(PRINT.white)
          .text('ZERO AMOUNT DUE — DO NOT COLLECT CASH', innerLeft, payY + 18.5);

        doc
          .font(PDF_FONTS.sans)
          .fontSize(5)
          .fillColor(PRINT.gray300)
          .text('INVOICE VALUE', innerLeft, payY + 5.5, {
            width: innerWidth,
            align: 'right',
          });
        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(7.5)
          .fillColor(PRINT.white)
          .text(inr(order.total), innerLeft, payY + 13, {
            width: innerWidth,
            align: 'right',
          });
        doc
          .font(PDF_FONTS.sans)
          .fontSize(4.8)
          .fillColor(PRINT.gray300)
          .text('PAID ONLINE', innerLeft, payY + 22, {
            width: innerWidth,
            align: 'right',
          });
      }

      // ── Order Meta & Routing Strip ────────────────────────────────────────
      const metaY = payY + payH + 5;
      const metaH = 40;
      const metaTopH = 22;
      const metaWidth = outerWidth - 6;
      const colW = metaWidth / 3;

      doc
        .rect(outerLeft + 3, metaY, metaWidth, metaH)
        .lineWidth(0.6)
        .strokeColor(PRINT.black)
        .stroke();
      doc
        .moveTo(outerLeft + 3, metaY + metaTopH)
        .lineTo(outerRight - 3, metaY + metaTopH)
        .lineWidth(0.4)
        .strokeColor(PRINT.rule)
        .stroke();

      doc
        .moveTo(outerLeft + 3 + colW, metaY)
        .lineTo(outerLeft + 3 + colW, metaY + metaTopH)
        .lineWidth(0.4)
        .strokeColor(PRINT.rule)
        .stroke();
      doc
        .moveTo(outerLeft + 3 + colW * 2, metaY)
        .lineTo(outerLeft + 3 + colW * 2, metaY + metaTopH)
        .lineWidth(0.4)
        .strokeColor(PRINT.rule)
        .stroke();

      const meta = [
        { label: 'ORDER REF', value: orderRef },
        { label: 'ITEMS', value: String(itemCount || 1) },
        { label: 'ORDER DATE', value: orderDate },
      ];
      meta.forEach((entry, index) => {
        const x = outerLeft + 8 + colW * index;
        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(4.8)
          .fillColor(PRINT.gray700)
          .text(entry.label, x, metaY + 3.5);
        doc
          .font(PDF_FONTS.monoBold)
          .fontSize(6.8)
          .fillColor(PRINT.black)
          .text(truncateToWidth(doc, String(entry.value), colW - 10), x, metaY + 10.5, {
            width: colW - 10,
            lineBreak: false,
            ellipsis: true,
          });
      });

      const carrier = order.carrier || order.shippingCarrier || '';
      doc
        .font(PDF_FONTS.sans)
        .fontSize(5.4)
        .fillColor(PRINT.black)
        .text(
          `COURIER: ${carrier || 'Courier Assigned'}${
            order.trackingNumber ? `   AWB: ${order.trackingNumber}` : ''
          }`,
          innerLeft,
          metaY + metaTopH + 5,
          { width: innerWidth, lineBreak: false, ellipsis: true },
        );

      // ── Scannable Barcode ──────────────────────────────────────────────────
      const barcodeY = metaY + metaH + 7;
      drawCode128B(doc, innerLeft, barcodeY, innerWidth, 25, String(orderRef));
      const barcodeTextY = barcodeY + 27;
      doc
        .font(PDF_FONTS.monoBold)
        .fontSize(6.4)
        .fillColor(PRINT.black)
        .text(`*${orderRef}*`, innerLeft, barcodeTextY, {
          width: innerWidth,
          align: 'center',
        });

      // ── Handling Advisory Strip ───────────────────────────────────────────
      const handlingY = barcodeTextY + 10;
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(5.4)
        .fillColor(PRINT.black)
        .text(
          '[ HANDLE WITH CARE · KEEP DRY · DO NOT BEND · BESPOKE PRINT & APPAREL ]',
          innerLeft,
          handlingY,
          { width: innerWidth, align: 'center', characterSpacing: 0.4 },
        );

      // ── RTO / Return Routing Instructions ─────────────────────────────────
      const rtoY = handlingY + 8;
      const rtoH = Math.max(34, 420 - rtoY);

      doc
        .rect(outerLeft + 3, rtoY, outerWidth - 6, rtoH)
        .lineWidth(0.6)
        .strokeColor(PRINT.black)
        .stroke();

      // Top title
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(5.2)
        .fillColor(PRINT.black)
        .text('RETURN / RTO INSTRUCTIONS (IF UNDELIVERABLE RETURN TO SENDER)', innerLeft, rtoY + 3.5, {
          width: innerWidth,
          characterSpacing: 0.3,
        });

      const rtoSplit = innerLeft + 168;
      const rtoBodyTop = rtoY + 11;
      doc
        .moveTo(rtoSplit, rtoBodyTop)
        .lineTo(rtoSplit, rtoY + rtoH - 4)
        .lineWidth(0.35)
        .strokeColor(PRINT.rule)
        .stroke();

      doc
        .font(PDF_FONTS.sans)
        .fontSize(4.8)
        .fillColor(PRINT.gray700)
        .text(
          'If the recipient is unavailable, refuses delivery, or the address is incomplete, initiate RTO and return parcel directly to sender at FROM address. Do not abandon.',
          innerLeft,
          rtoBodyTop,
          { width: 160, height: rtoH - 14, ellipsis: true, lineGap: 1 },
        );

      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(4.8)
        .fillColor(PRINT.black)
        .text('RTO HOTLINE', rtoSplit + 6, rtoBodyTop);
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(4.6)
        .fillColor(PRINT.black)
        .text(BUSINESS_DETAILS.phone, rtoSplit + 6, rtoBodyTop + 6)
        .font(PDF_FONTS.sans)
        .fontSize(4.4)
        .fillColor(PRINT.gray700)
        .text(BUSINESS_DETAILS.email, rtoSplit + 6, rtoBodyTop + 12);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
