import PDFDocument from 'pdfkit';
import { BUSINESS_DETAILS, parseShippingAddress } from './business-details';
import { formatPaymentProvider } from './payment-display';
import { drawBrandLogo, drawCode128B, PRINT } from './pdf-branding';
import { PDF_FONTS, registerPdfFonts } from './pdf-fonts';

export interface InvoiceItem {
  productId: string;
  quantity: number;
  price?: number | null;
  unitPrice?: number;
  totalPrice?: number;
  productNameSnapshot?: string | null;
  product?: { name?: string };
  variant?: string | null;
  size?: string | null;
  skuSnapshot?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customization?: any;
}

export interface InvoiceAddress {
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  addressLine2?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  pincode?: string;
  country?: string;
  phone?: string;
  email?: string;
}

export interface InvoiceOrder {
  id: string;
  publicOrderId?: string | null;
  invoiceNumber?: string | null;
  createdAt: string | Date;
  shippingAddress?: unknown;
  user?: { fullName?: string | null; email?: string | null; phone?: string | null } | null;
  items: InvoiceItem[];
  discount?: number | null;
  couponCode?: string | null;
  subtotal?: number;
  shippingFee?: number;
  tax?: number;
  total: number;
  paymentMethod?: string | null;
  paymentProvider?: string | null;
  paymentStatus?: string | null;
  paymentGatewayPaymentId?: string | null;
  shippingCarrier?: string | null;
  carrier?: string | null;
  trackingNumber?: string | null;
  status?: string | null;
}

// Convert numbers up to 99,99,999 to Indian English words
function numberToWordsINR(num: number): string {
  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.floor(Math.abs(num));
  if (n === 0) return 'Indian Rupees Zero Only';

  function convertChunk(val: number): string {
    let str = '';
    if (val > 99) {
      str += a[Math.floor(val / 100)] + ' Hundred ';
      val %= 100;
    }
    if (val > 19) {
      str += b[Math.floor(val / 10)] + (val % 10 ? ' ' + a[val % 10] : '');
    } else if (val > 0) {
      str += a[val];
    }
    return str.trim();
  }

  let words = '';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = n % 1000;

  if (crore > 0) words += convertChunk(crore) + ' Crore ';
  if (lakh > 0) words += convertChunk(lakh) + ' Lakh ';
  if (thousand > 0) words += convertChunk(thousand) + ' Thousand ';
  if (hundred > 0) words += convertChunk(hundred);

  const cleanWords = words.trim();
  return `Indian Rupees ${cleanWords} Only`;
}

function money(amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return `INR ${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function itemUnitPrice(item: InvoiceItem): number {
  return (
    item.unitPrice ??
    item.price ??
    (item.totalPrice && item.quantity ? item.totalPrice / item.quantity : 0)
  );
}

/**
 * Generate the customer invoice / packing slip.
 *
 * The document deliberately uses only black, white and neutral greys so it
 * matches the original clean invoice design. Business GST details are not
 * printed because the studio is not GST-registered.
 */
export async function generateInvoicePdf(order: InvoiceOrder): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 35, bottom: 35, left: 36, right: 36 },
        autoFirstPage: true,
        info: {
          Title: `Invoice ${order.invoiceNumber || order.publicOrderId || order.id}`,
          Author: BUSINESS_DETAILS.name,
          Subject: 'Invoice and packing slip',
        },
      });

      registerPdfFonts(doc);

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const pageLeft = 36;
      const pageRight = 559;
      const contentWidth = pageRight - pageLeft;

      const orderRef = order.publicOrderId || order.id;
      const invoiceNo =
        order.invoiceNumber ||
        `INV-${String(orderRef)
          .replace(/[^a-zA-Z0-9-]/g, '')
          .slice(-10)}`;
      const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const isCashOnDelivery =
        order.paymentProvider === 'cod' ||
        order.paymentMethod?.toLowerCase().includes('cod') ||
        order.paymentMethod?.toLowerCase().includes('cash');
      const paymentStatus = (
        order.paymentStatus || (isCashOnDelivery ? 'Pending on Delivery' : 'Paid Online')
      ).toUpperCase();
      const orderStatus = (order.status || 'Processing').replace(/_/g, ' ').toUpperCase();
      const paymentMode = isCashOnDelivery
        ? 'Cash on Delivery'
        : `Online Payment (${formatPaymentProvider(order.paymentProvider)})`;

      const addr = parseShippingAddress(order.shippingAddress, order.user);
      const email = addr.email && addr.email !== 'N/A' ? addr.email : '';

      const items = order.items || [];
      const subtotal =
        order.subtotal ??
        items.reduce((sum, item) => sum + itemUnitPrice(item) * item.quantity, 0);
      const discount = order.discount || 0;
      const shippingFee = order.shippingFee || 0;

      // ── Header ────────────────────────────────────────────────────────────
      const logoWidth = 112;
      drawBrandLogo(doc, pageLeft, 39, logoWidth);

      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(10.5)
        .fillColor(PRINT.black)
        .text('FREGORO STUDIOS', pageLeft + logoWidth + 11, 48);
      doc
        .font(PDF_FONTS.sans)
        .fontSize(5.8)
        .fillColor(PRINT.gray500)
        .text('BESPOKE PRINT · CUSTOM APPAREL · EDITORIAL', pageLeft + logoWidth + 11, 62, {
          width: 168,
        });

      const rightX = pageLeft + 300;
      const rightWidth = pageRight - rightX;
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(21)
        .fillColor(PRINT.black)
        .text('INVOICE', rightX, 37, { width: rightWidth, align: 'right' });
      doc
        .font(PDF_FONTS.sans)
        .fontSize(6)
        .fillColor(PRINT.gray500)
        .text('PACKING SLIP · ORDER DOCUMENT', rightX, 62, {
          width: rightWidth,
          align: 'right',
        });
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(7)
        .fillColor(PRINT.ink)
        .text(`INVOICE NO.  ${invoiceNo}`, rightX, 74, { width: rightWidth, align: 'right' })
        .text(`ORDER REF.  ${orderRef}`, rightX, 83, { width: rightWidth, align: 'right' })
        .text(`DATE  ${formattedDate}`, rightX, 92, { width: rightWidth, align: 'right' });

      doc
        .font(PDF_FONTS.sans)
        .fontSize(6.4)
        .fillColor(PRINT.gray700)
        .text(BUSINESS_DETAILS.addressLine1, pageLeft, 95, { width: 270 })
        .text(BUSINESS_DETAILS.addressLine2, pageLeft, 103.5, { width: 270 })
        .text(
          `${BUSINESS_DETAILS.phone}   ·   ${BUSINESS_DETAILS.email}`,
          pageLeft,
          112,
          { width: 300 },
        );

      doc
        .moveTo(pageLeft, 126)
        .lineTo(pageRight, 126)
        .lineWidth(0.9)
        .strokeColor(PRINT.black)
        .stroke();

      // ── Payment / dispatch strip ──────────────────────────────────────────
      const stripY = 136;
      const stripH = 34;
      doc.rect(pageLeft, stripY, contentWidth, stripH).fill(PRINT.wash);
      doc
        .rect(pageLeft, stripY, contentWidth, stripH)
        .lineWidth(0.7)
        .strokeColor(PRINT.black)
        .stroke();

      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(9.2)
        .fillColor(PRINT.black)
        .text(isCashOnDelivery ? 'CASH ON DELIVERY' : 'PREPAID SHIPMENT', pageLeft + 8, stripY + 6, {
          width: 300,
        });
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(7)
        .fillColor(PRINT.gray700)
        .text(
          isCashOnDelivery
            ? `COLLECT ${money(order.total)} FROM CUSTOMER`
            : 'ZERO AMOUNT DUE — DO NOT COLLECT CASH',
          pageLeft + 8,
          stripY + 19,
          { width: 320 },
        );

      const barcodeWidth = 184;
      const barcodeX = pageRight - barcodeWidth - 8;
      drawCode128B(doc, barcodeX, stripY + 5, barcodeWidth, 16, String(orderRef));
      doc
        .font(PDF_FONTS.mono)
        .fontSize(6)
        .fillColor(PRINT.gray700)
        .text(`*${orderRef}*`, barcodeX, stripY + 23, {
          width: barcodeWidth,
          align: 'center',
        });

      // ── Addresses and fulfilment ──────────────────────────────────────────
      const addressY = 184;
      const addressGap = 24;
      const leftWidth = (contentWidth - addressGap) / 2;
      const rightColX = pageLeft + leftWidth + addressGap;
      const rightColWidth = pageRight - rightColX;
      const valueX = rightColX + 74;
      const valueWidth = rightColWidth - 74;

      const sectionLabel = (label: string, x: number, width: number) => {
        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(6.5)
          .fillColor(PRINT.black)
          .text(label, x, addressY, { width, characterSpacing: 0.35 });
        doc
          .moveTo(x, addressY + 10)
          .lineTo(x + width, addressY + 10)
          .lineWidth(0.55)
          .strokeColor(PRINT.black)
          .stroke();
      };

      sectionLabel('BILLED TO / SHIPPED TO', pageLeft, leftWidth);
      sectionLabel('PAYMENT & FULFILMENT', rightColX, rightColWidth);

      let leftY = addressY + 18;
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(10)
        .fillColor(PRINT.black)
        .text(addr.name || 'Valued Customer', pageLeft, leftY, { width: leftWidth });
      leftY += 14;

      for (const line of [addr.streetLine1, addr.streetLine2].filter(Boolean)) {
        doc
          .font(PDF_FONTS.sans)
          .fontSize(8.3)
          .fillColor(PRINT.ink)
          .text(line, pageLeft, leftY, { width: leftWidth, lineGap: 1 });
        leftY += doc.heightOfString(line, { width: leftWidth, lineGap: 1 }) + 1.5;
      }

      if (addr.cityStateZip) {
        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(8.3)
          .fillColor(PRINT.black)
          .text(addr.cityStateZip, pageLeft, leftY, { width: leftWidth });
        leftY += 12;
      }
      doc
        .font(PDF_FONTS.sans)
        .fontSize(7.2)
        .fillColor(PRINT.gray700)
        .text(addr.country || 'India', pageLeft, leftY);
      leftY += 11.5;
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(7.8)
        .fillColor(PRINT.ink)
        .text(`Phone: ${addr.phone || 'Not provided'}`, pageLeft, leftY, {
          width: leftWidth,
        });
      leftY += 10.5;
      if (email) {
        doc
          .font(PDF_FONTS.sans)
          .fontSize(6.8)
          .fillColor(PRINT.gray700)
          .text(`Email: ${email}`, pageLeft, leftY, { width: leftWidth, ellipsis: true });
        leftY += 9;
      }

      let rightY = addressY + 18;
      const kv = (label: string, value: string) => {
        doc
          .font(PDF_FONTS.sans)
          .fontSize(6.2)
          .fillColor(PRINT.gray500)
          .text(label.toUpperCase(), rightColX, rightY, { width: 70 });
        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(6.9)
          .fillColor(PRINT.ink)
          .text(value, valueX, rightY, { width: valueWidth, ellipsis: true, height: 9 });
        rightY += 9.6;
      };

      kv('Payment mode', paymentMode);
      kv('Payment status', paymentStatus);
      if (order.paymentGatewayPaymentId) kv('Transaction ID', order.paymentGatewayPaymentId);
      kv('Order status', orderStatus);
      kv('Shipped by', 'Fregoro Studios Hub, Thiruvallur');
      kv('Dispatch', 'Within 24 – 48 hours');
      const carrier = order.carrier || order.shippingCarrier;
      if (carrier || order.trackingNumber) {
        kv(
          'Courier / AWB',
          `${carrier || 'Courier to be assigned'}${
            order.trackingNumber ? ` · AWB ${order.trackingNumber}` : ''
          }`,
        );
      }

      const addressBottom = Math.max(leftY, rightY) + 8;
      doc
        .moveTo(pageLeft, addressBottom)
        .lineTo(pageRight, addressBottom)
        .lineWidth(0.55)
        .strokeColor(PRINT.rule)
        .stroke();

      // ── Items ─────────────────────────────────────────────────────────────
      const colNo = pageLeft + 2;
      const colDesc = pageLeft + 20;
      const colSku = pageLeft + 274;
      const colQty = pageLeft + 354;
      const colRate = pageLeft + 386;
      const colAmount = pageLeft + 462;

      const drawItemsHeader = (y: number) => {
        doc.rect(pageLeft, y, contentWidth, 18).fill(PRINT.wash);
        doc
          .moveTo(pageLeft, y)
          .lineTo(pageRight, y)
          .lineWidth(0.75)
          .strokeColor(PRINT.black)
          .stroke();
        doc
          .moveTo(pageLeft, y + 18)
          .lineTo(pageRight, y + 18)
          .lineWidth(0.75)
          .strokeColor(PRINT.black)
          .stroke();
        doc.font(PDF_FONTS.sansBold).fontSize(6.2).fillColor(PRINT.black);
        doc.text('#', colNo, y + 6, { width: 12 });
        doc.text('ITEM DESCRIPTION', colDesc, y + 6, { width: 248 });
        doc.text('SKU / CODE', colSku, y + 6, { width: 76 });
        doc.text('QTY', colQty, y + 6, { width: 28, align: 'center' });
        doc.text('UNIT PRICE', colRate, y + 6, { width: 62, align: 'right' });
        doc.text('AMOUNT', colAmount, y + 6, { width: 67, align: 'right' });
        return y + 18;
      };

      let tableTop = addressBottom + 16;
      let currentY = drawItemsHeader(tableTop);

      items.forEach((item, index) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cust = (item.customization as Record<string, any>) || {};
        const specParts: string[] = [];
        if (item.size) specParts.push(`Size: ${item.size}`);
        if (item.variant && item.variant !== 'default') specParts.push(`Variant: ${item.variant}`);
        if (cust.color) specParts.push(`Color: ${cust.color}`);
        if (cust.is3dMockup) specParts.push('3D Studio Proof');
        if (cust.is2dMockup) specParts.push('2D Studio Proof');
        if (cust.magazineTitle) {
          const pages =
            cust.pageCount ||
            (Array.isArray(cust.pagesData) ? cust.pagesData.length : null) ||
            (Array.isArray(cust.pages) ? cust.pages.length : null) ||
            (Array.isArray(cust.document?.pages) ? cust.document.pages.length : null);
          specParts.push(
            `Magazine (${cust.magazineTitle}${pages ? ` · ${pages} pages` : ''}${
              cust.bindingType ? ` · ${cust.bindingType}` : ''
            }${cust.paperWeight ? ` · ${cust.paperWeight}` : ''}${
              cust.coverFinish ? ` · ${cust.coverFinish}` : ''
            })`,
          );
        }
        if (Array.isArray(cust.uploadedArtworks) && cust.uploadedArtworks.length > 0) {
          const artworkSides = Array.from(
            new Set(
              cust.uploadedArtworks
                .map((art: { side?: unknown }) =>
                  typeof art?.side === 'string' ? art.side : null,
                )
                .filter((side: string | null): side is string => Boolean(side)),
            ),
          ).map((side) =>
            side === 'left-sleeve'
              ? 'Left Sleeve'
              : side === 'right-sleeve'
                ? 'Right Sleeve'
                : side === 'back'
                  ? 'Back'
                  : 'Front',
          );
          if (artworkSides.length > 0) {
            specParts.push(`Artwork: ${Array.from(new Set(artworkSides)).join(', ')}`);
          }
        }
        if (cust.printInstructions) {
          specParts.push(`Note: "${String(cust.printInstructions).slice(0, 48)}"`);
        }

        const specLine = specParts.join(' · ');
        const rowHeight = specLine ? 29 : 23;

        if (currentY + rowHeight > 650) {
          doc.addPage();
          tableTop = 50;
          currentY = drawItemsHeader(tableTop);
        }

        if (index % 2 === 1) {
          doc.rect(pageLeft, currentY, contentWidth, rowHeight).fill('#FAFAFA');
        }
        doc
          .moveTo(pageLeft, currentY + rowHeight)
          .lineTo(pageRight, currentY + rowHeight)
          .lineWidth(0.35)
          .strokeColor(PRINT.rule)
          .stroke();

        const price = itemUnitPrice(item);
        const lineTotal = price * item.quantity;
        const title =
          item.productNameSnapshot || item.product?.name || `Product #${item.productId}`;

        doc
          .font(PDF_FONTS.sans)
          .fontSize(7.2)
          .fillColor(PRINT.gray500)
          .text(String(index + 1), colNo, currentY + 6, { width: 12 });
        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(8.2)
          .fillColor(PRINT.black)
          .text(title, colDesc, currentY + 5, { width: 244, height: 11, ellipsis: true });
        if (specLine) {
          doc
            .font(PDF_FONTS.sans)
            .fontSize(6.3)
            .fillColor(PRINT.gray500)
            .text(specLine, colDesc, currentY + 16, {
              width: 244,
              height: 9,
              ellipsis: true,
            });
        }

        const sku = item.skuSnapshot || item.variant || item.productId;
        doc
          .font(PDF_FONTS.mono)
          .fontSize(6.2)
          .fillColor(PRINT.gray700)
          .text(String(sku).slice(0, 18), colSku, currentY + 7, { width: 74, ellipsis: true });
        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(8)
          .fillColor(PRINT.black)
          .text(String(item.quantity), colQty, currentY + 6, { width: 28, align: 'center' });
        doc
          .font(PDF_FONTS.sans)
          .fontSize(7.8)
          .fillColor(PRINT.ink)
          .text(money(price), colRate, currentY + 6, { width: 62, align: 'right' });
        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(7.8)
          .fillColor(PRINT.black)
          .text(money(lineTotal), colAmount, currentY + 6, { width: 67, align: 'right' });

        currentY += rowHeight;
      });

      if (items.length === 0) {
        doc
          .font(PDF_FONTS.sans)
          .fontSize(8)
          .fillColor(PRINT.gray500)
          .text('No line items were recorded for this order.', colDesc, currentY + 7, {
            width: 300,
          });
        currentY += 24;
      }

      // ── Totals and amount in words ────────────────────────────────────────
      let totalsY = currentY + 16;
      if (totalsY + 100 > 755) {
        doc.addPage();
        totalsY = 55;
      }

      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(6.3)
        .fillColor(PRINT.black)
        .text('AMOUNT IN WORDS', pageLeft, totalsY + 2, { width: 270 });
      doc
        .moveTo(pageLeft, totalsY + 12)
        .lineTo(pageLeft + 280, totalsY + 12)
        .lineWidth(0.55)
        .strokeColor(PRINT.black)
        .stroke();
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(7.6)
        .fillColor(PRINT.ink)
        .text(numberToWordsINR(order.total), pageLeft, totalsY + 19, { width: 280 });
      doc
        .font(PDF_FONTS.sans)
        .fontSize(6.1)
        .fillColor(PRINT.gray500)
        .text(
          isCashOnDelivery
            ? 'The courier will collect the total shown here at delivery. Please keep exact change ready.'
            : 'Payment has been recorded against the order reference above. No further amount is due at delivery.',
          pageLeft,
          totalsY + 46,
          { width: 280, lineGap: 1.2 },
        );

      const totalsX = pageRight - 210;
      let rowY = totalsY + 4;
      const totalRow = (label: string, value: string, bold = false) => {
        doc
          .font(bold ? PDF_FONTS.sansBold : PDF_FONTS.sans)
          .fontSize(7.6)
          .fillColor(bold ? PRINT.black : PRINT.gray700)
          .text(label, totalsX, rowY, { width: 120 });
        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(7.6)
          .fillColor(PRINT.black)
          .text(value, totalsX + 110, rowY, { width: 100, align: 'right' });
        rowY += 11.5;
      };

      totalRow('Item subtotal', money(subtotal));
      if (discount > 0) {
        totalRow(`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`, `- ${money(discount)}`);
      }
      totalRow('Shipping & packaging', shippingFee > 0 ? money(shippingFee) : 'FREE');

      doc
        .moveTo(totalsX, rowY + 1)
        .lineTo(pageRight, rowY + 1)
        .lineWidth(0.8)
        .strokeColor(PRINT.black)
        .stroke();
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(8.4)
        .fillColor(PRINT.black)
        .text('TOTAL', totalsX, rowY + 8, { width: 100 });
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(11.5)
        .fillColor(PRINT.black)
        .text(money(order.total), totalsX + 70, rowY + 5, {
          width: 140,
          align: 'right',
        });

      // ── Support terms and signatory ───────────────────────────────────────
      let termsY = totalsY + 96;
      if (termsY + 78 > 760) {
        doc.addPage();
        termsY = 55;
      }

      doc
        .moveTo(pageLeft, termsY)
        .lineTo(pageRight, termsY)
        .lineWidth(0.55)
        .strokeColor(PRINT.rule)
        .stroke();

      const termsWidth = 300;
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(6.4)
        .fillColor(PRINT.black)
        .text('CUSTOMER SUPPORT & RETURNS', pageLeft, termsY + 8);
      doc
        .font(PDF_FONTS.sans)
        .fontSize(6.2)
        .fillColor(PRINT.gray700)
        .text(
          [
            '1. Please inspect the parcel on delivery and report courier damage within 24 hours.',
            '2. Personalised and custom-printed pieces are made specifically for you.',
            `3. Support: WhatsApp / Phone ${BUSINESS_DETAILS.phone} or ${BUSINESS_DETAILS.email}.`,
            '4. Keep this invoice and packing slip for any warranty or replacement request.',
          ].join('\n'),
          pageLeft,
          termsY + 18,
          { width: termsWidth, lineGap: 1.6 },
        );

      const signX = pageLeft + 322;
      const signWidth = pageRight - signX;
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(6.4)
        .fillColor(PRINT.black)
        .text('FOR FREGORO STUDIOS', signX, termsY + 8, { width: signWidth });
      doc
        .font(PDF_FONTS.sans)
        .fontSize(6.2)
        .fillColor(PRINT.gray700)
        .text('Authorised Fulfilment Centre, Thiruvallur', signX, termsY + 18, {
          width: signWidth,
        });
      doc
        .font(PDF_FONTS.sans)
        .fontSize(8.8)
        .fillColor(PRINT.ink)
        .text('Fregoro Studios Fulfilment', signX + 8, termsY + 34, { width: signWidth - 16 });
      doc
        .moveTo(signX, termsY + 49)
        .lineTo(pageRight, termsY + 49)
        .lineWidth(0.55)
        .strokeColor(PRINT.black)
        .stroke();
      doc
        .font(PDF_FONTS.sans)
        .fontSize(6)
        .fillColor(PRINT.gray500)
        .text('Authorised Signatory · Computer Generated', signX, termsY + 53, {
          width: signWidth,
          align: 'center',
        });

      // ── Packing-slip footer ───────────────────────────────────────────────
      const footerY = 770;
      doc.rect(pageLeft, footerY, contentWidth, 28).fill(PRINT.wash);
      doc
        .moveTo(pageLeft, footerY)
        .lineTo(pageRight, footerY)
        .lineWidth(0.55)
        .strokeColor(PRINT.black)
        .stroke();
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(6.2)
        .fillColor(PRINT.ink)
        .text('PACKING SLIP · STICK OR PLACE SECURELY INSIDE PARCEL POUCH', pageLeft, footerY + 5, {
          width: contentWidth,
          align: 'center',
        });
      doc
        .font(PDF_FONTS.sans)
        .fontSize(5.9)
        .fillColor(PRINT.gray700)
        .text(
          `Order Ref: ${orderRef}  ·  Customer: ${addr.name}  ·  PIN: ${
            addr.zip || 'India'
          }  ·  Thank you for choosing Fregoro Studios`,
          pageLeft,
          footerY + 14,
          { width: contentWidth, align: 'center' },
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
