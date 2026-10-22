import PDFDocument from 'pdfkit';
import { BUSINESS_DETAILS, parseShippingAddress } from './business-details';
import { formatPaymentProvider } from './payment-display';
import { drawBrandLogo, drawCode128B, drawRegistrationMarks, PRINT } from './pdf-branding';
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
 * Generate a luxury editorial black-and-white customer invoice / packing slip.
 *
 * Adheres strictly to high-contrast monochrome aesthetics (black #000000,
 * white #FFFFFF, crisp neutral tones) with architectural compartments,
 * inverted header tags, scannable Code128 barcodes, and exact studio details.
 */
export async function generateInvoicePdf(order: InvoiceOrder): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 28, bottom: 28, left: 32, right: 32 },
        autoFirstPage: true,
        info: {
          Title: `Tax Invoice ${order.invoiceNumber || order.publicOrderId || order.id}`,
          Author: BUSINESS_DETAILS.name,
          Subject: 'Tax Invoice & Packing Slip',
        },
      });

      registerPdfFonts(doc);

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const pageLeft = 32;
      const pageRight = 563;
      const contentWidth = pageRight - pageLeft; // 531 pt

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

      // ── Outer Architectural Registration Marks ───────────────────────────
      drawRegistrationMarks(doc, pageLeft - 6, 22, contentWidth + 12, 794, 5);

      // ── Header: Brand Logo, Studio Info, and Document Title ───────────────
      const logoWidth = 98;
      drawBrandLogo(doc, pageLeft, 30, logoWidth);

      // Studio Info under/beside logo
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(11)
        .fillColor(PRINT.black)
        .text('FREGORO STUDIOS', pageLeft, 76, { characterSpacing: 0.5 });
      doc
        .font(PDF_FONTS.sans)
        .fontSize(5.8)
        .fillColor(PRINT.gray700)
        .text('BESPOKE PRINT · CUSTOM APPAREL · EDITORIAL STUDIO', pageLeft, 89, {
          characterSpacing: 0.3,
        });

      doc
        .font(PDF_FONTS.sans)
        .fontSize(6.4)
        .fillColor(PRINT.ink)
        .text(BUSINESS_DETAILS.addressLine1, pageLeft, 99)
        .text(BUSINESS_DETAILS.addressLine2, pageLeft, 107.5)
        .text(
          `TEL: ${BUSINESS_DETAILS.phone}   ·   EMAIL: ${BUSINESS_DETAILS.email}`,
          pageLeft,
          116,
        );

      // Right Header Block
      const rightX = pageLeft + 310;
      const rightWidth = pageRight - rightX;

      // Inverted Badge Header
      doc.rect(rightX, 30, rightWidth, 14).fill(PRINT.black);
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(6.3)
        .fillColor(PRINT.white)
        .text('TAX INVOICE & PACKING SLIP', rightX, 34, {
          width: rightWidth,
          align: 'center',
          characterSpacing: 0.8,
        });

      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(22)
        .fillColor(PRINT.black)
        .text('INVOICE', rightX, 48, { width: rightWidth, align: 'right', characterSpacing: 0.5 });

      // Invoice metadata box
      const metaBoxY = 74;
      doc
        .rect(rightX, metaBoxY, rightWidth, 48)
        .lineWidth(0.6)
        .strokeColor(PRINT.black)
        .stroke();
      doc.rect(rightX, metaBoxY, rightWidth, 48).fill(PRINT.wash);

      const metaRow = (label: string, val: string, yPos: number, isMono = false) => {
        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(6.2)
          .fillColor(PRINT.gray700)
          .text(label, rightX + 6, yPos, { width: 72 });
        doc
          .font(isMono ? PDF_FONTS.monoBold : PDF_FONTS.sansBold)
          .fontSize(6.8)
          .fillColor(PRINT.black)
          .text(val, rightX + 80, yPos, { width: rightWidth - 86, align: 'right' });
      };

      metaRow('INVOICE NO.', invoiceNo, metaBoxY + 5, true);
      metaRow('ORDER REF.', String(orderRef), metaBoxY + 16, true);
      metaRow('DATE ISSUED', formattedDate, metaBoxY + 27, false);
      metaRow('TAX TYPE', 'RETAIL INVOICE', metaBoxY + 37, false);

      // Double divider rule
      doc
        .moveTo(pageLeft, 128)
        .lineTo(pageRight, 128)
        .lineWidth(1.2)
        .strokeColor(PRINT.black)
        .stroke();
      doc
        .moveTo(pageLeft, 131)
        .lineTo(pageRight, 131)
        .lineWidth(0.4)
        .strokeColor(PRINT.black)
        .stroke();

      // ── Dispatch & Payment High-Contrast Strip ────────────────────────────
      const stripY = 138;
      const stripH = 34;

      doc
        .rect(pageLeft, stripY, contentWidth, stripH)
        .lineWidth(0.8)
        .strokeColor(PRINT.black)
        .stroke();
      doc.rect(pageLeft, stripY, contentWidth, stripH).fill(PRINT.wash);

      // Inverted status tag
      const badgeW = isCashOnDelivery ? 120 : 110;
      doc.rect(pageLeft + 8, stripY + 6, badgeW, 12).fill(PRINT.black);
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(6.5)
        .fillColor(PRINT.white)
        .text(
          isCashOnDelivery ? '[ CASH ON DELIVERY ]' : '[ PREPAID SHIPMENT ]',
          pageLeft + 8,
          stripY + 8.5,
          { width: badgeW, align: 'center', characterSpacing: 0.5 },
        );

      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(7.5)
        .fillColor(PRINT.black)
        .text(
          isCashOnDelivery
            ? `COLLECT ${money(order.total)} FROM CUSTOMER AT DOORSTEP`
            : 'ZERO AMOUNT DUE — DO NOT COLLECT CASH AT DELIVERY',
          pageLeft + 8,
          stripY + 21,
          { width: 320 },
        );

      // Scannable barcode on the right
      const barcodeWidth = 175;
      const barcodeX = pageRight - barcodeWidth - 8;
      drawCode128B(doc, barcodeX, stripY + 5, barcodeWidth, 16, String(orderRef));
      doc
        .font(PDF_FONTS.monoBold)
        .fontSize(6)
        .fillColor(PRINT.black)
        .text(`*${orderRef}*`, barcodeX, stripY + 23, {
          width: barcodeWidth,
          align: 'center',
        });

      // ── Addresses & Fulfilment Specifications Grid ────────────────────────
      const addressY = 180;
      const addressGap = 14;
      const colWidth = (contentWidth - addressGap) / 2;
      const rightColX = pageLeft + colWidth + addressGap;
      const boxHeight = 116;

      // Left Box: Billed / Shipped To
      doc
        .rect(pageLeft, addressY, colWidth, boxHeight)
        .lineWidth(0.6)
        .strokeColor(PRINT.black)
        .stroke();
      doc.rect(pageLeft, addressY, colWidth, 14).fill(PRINT.black);
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(6.4)
        .fillColor(PRINT.white)
        .text('BILLED TO / SHIPPED TO', pageLeft + 6, addressY + 4, {
          characterSpacing: 0.6,
        });

      let addrCursorY = addressY + 20;
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(9.5)
        .fillColor(PRINT.black)
        .text(addr.name || 'Valued Customer', pageLeft + 8, addrCursorY, {
          width: colWidth - 16,
          lineBreak: false,
          ellipsis: true,
        });
      addrCursorY += 13;

      for (const line of [addr.streetLine1, addr.streetLine2].filter(Boolean)) {
        doc
          .font(PDF_FONTS.sans)
          .fontSize(7.6)
          .fillColor(PRINT.ink)
          .text(line, pageLeft + 8, addrCursorY, { width: colWidth - 16, lineGap: 1 });
        addrCursorY += doc.heightOfString(line, { width: colWidth - 16, lineGap: 1 }) + 1;
      }

      if (addr.cityStateZip) {
        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(8)
          .fillColor(PRINT.black)
          .text(addr.cityStateZip, pageLeft + 8, addrCursorY, { width: colWidth - 16 });
        addrCursorY += 11;
      }

      doc
        .font(PDF_FONTS.sans)
        .fontSize(7)
        .fillColor(PRINT.gray700)
        .text(addr.country || 'India', pageLeft + 8, addrCursorY);
      addrCursorY += 10;

      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(7.5)
        .fillColor(PRINT.black)
        .text(`Phone: ${addr.phone || 'Not provided'}`, pageLeft + 8, addrCursorY, {
          width: colWidth - 16,
        });
      addrCursorY += 10;

      if (email) {
        doc
          .font(PDF_FONTS.sans)
          .fontSize(6.6)
          .fillColor(PRINT.gray700)
          .text(`Email: ${email}`, pageLeft + 8, addrCursorY, {
            width: colWidth - 16,
            ellipsis: true,
          });
      }

      // Right Box: Payment & Fulfilment Specifications
      doc
        .rect(rightColX, addressY, colWidth, boxHeight)
        .lineWidth(0.6)
        .strokeColor(PRINT.black)
        .stroke();
      doc.rect(rightColX, addressY, colWidth, 14).fill(PRINT.black);
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(6.4)
        .fillColor(PRINT.white)
        .text('PAYMENT & FULFILMENT SPECIFICATIONS', rightColX + 6, addressY + 4, {
          characterSpacing: 0.6,
        });

      let specY = addressY + 19;
      const specRow = (label: string, value: string, isMono = false) => {
        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(5.9)
          .fillColor(PRINT.gray700)
          .text(label.toUpperCase(), rightColX + 8, specY, { width: 78 });
        doc
          .font(isMono ? PDF_FONTS.monoBold : PDF_FONTS.sansBold)
          .fontSize(6.4)
          .fillColor(PRINT.black)
          .text(value, rightColX + 86, specY, {
            width: colWidth - 94,
            ellipsis: true,
            height: 9,
          });
        specY += 12;
      };

      specRow('Payment Mode', paymentMode);
      specRow('Payment Status', paymentStatus);
      if (order.paymentGatewayPaymentId) {
        specRow('Transaction ID', order.paymentGatewayPaymentId, true);
      }
      specRow('Order Status', orderStatus);
      specRow('Fulfilment Hub', 'Fregoro Studios Hub, Thiruvallur');
      specRow('Dispatch SLA', 'Within 24 – 48 Hours');
      const carrier = order.carrier || order.shippingCarrier;
      if (carrier || order.trackingNumber) {
        specRow(
          'Courier / AWB',
          `${carrier || 'Courier Assigned'}${order.trackingNumber ? ` · ${order.trackingNumber}` : ''}`,
          true,
        );
      }

      // ── Itemized Table ────────────────────────────────────────────────────
      const colNo = pageLeft + 6;
      const colDesc = pageLeft + 24;
      const colSku = pageLeft + 276;
      const colQty = pageLeft + 356;
      const colRate = pageLeft + 394;
      const colAmount = pageLeft + 466;

      const drawItemsHeader = (y: number) => {
        doc.rect(pageLeft, y, contentWidth, 17).fill(PRINT.black);
        doc
          .rect(pageLeft, y, contentWidth, 17)
          .lineWidth(0.8)
          .strokeColor(PRINT.black)
          .stroke();

        doc.font(PDF_FONTS.sansBold).fontSize(6.2).fillColor(PRINT.white);
        doc.text('#', colNo, y + 5, { width: 14 });
        doc.text('ITEM DESCRIPTION & SPECIFICATIONS', colDesc, y + 5, { width: 248 });
        doc.text('SKU / REF', colSku, y + 5, { width: 76 });
        doc.text('QTY', colQty, y + 5, { width: 32, align: 'center' });
        doc.text('UNIT PRICE', colRate, y + 5, { width: 66, align: 'right' });
        doc.text('AMOUNT', colAmount, y + 5, { width: 62, align: 'right' });
        return y + 17;
      };

      let tableTop = addressY + boxHeight + 12;
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

        if (currentY + rowHeight > 660) {
          doc.addPage();
          drawRegistrationMarks(doc, pageLeft - 6, 22, contentWidth + 12, 794, 5);
          tableTop = 45;
          currentY = drawItemsHeader(tableTop);
        }

        if (index % 2 === 1) {
          doc.rect(pageLeft, currentY, contentWidth, rowHeight).fill('#FBFBFB');
        }
        doc
          .moveTo(pageLeft, currentY + rowHeight)
          .lineTo(pageRight, currentY + rowHeight)
          .lineWidth(0.4)
          .strokeColor(PRINT.rule)
          .stroke();

        const price = itemUnitPrice(item);
        const lineTotal = price * item.quantity;
        const title =
          item.productNameSnapshot || item.product?.name || `Product #${item.productId}`;

        doc
          .font(PDF_FONTS.mono)
          .fontSize(6.8)
          .fillColor(PRINT.gray700)
          .text(String(index + 1).padStart(2, '0'), colNo, currentY + 6, { width: 14 });

        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(8.2)
          .fillColor(PRINT.black)
          .text(title, colDesc, currentY + 5, { width: 246, height: 11, ellipsis: true });

        if (specLine) {
          doc
            .font(PDF_FONTS.sans)
            .fontSize(6.2)
            .fillColor(PRINT.gray700)
            .text(specLine, colDesc, currentY + 16, {
              width: 246,
              height: 9,
              ellipsis: true,
            });
        }

        const sku = item.skuSnapshot || item.variant || item.productId;
        doc
          .font(PDF_FONTS.mono)
          .fontSize(6.4)
          .fillColor(PRINT.black)
          .text(String(sku).slice(0, 18), colSku, currentY + 7, { width: 74, ellipsis: true });

        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(8)
          .fillColor(PRINT.black)
          .text(String(item.quantity), colQty, currentY + 6, { width: 32, align: 'center' });

        doc
          .font(PDF_FONTS.sans)
          .fontSize(7.8)
          .fillColor(PRINT.ink)
          .text(money(price), colRate, currentY + 6, { width: 66, align: 'right' });

        doc
          .font(PDF_FONTS.sansBold)
          .fontSize(7.8)
          .fillColor(PRINT.black)
          .text(money(lineTotal), colAmount, currentY + 6, { width: 62, align: 'right' });

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

      // Outer table border
      doc
        .rect(pageLeft, tableTop, contentWidth, currentY - tableTop)
        .lineWidth(0.6)
        .strokeColor(PRINT.black)
        .stroke();

      // ── Totals and Amount in Words Block ──────────────────────────────────
      let totalsY = currentY + 14;
      if (totalsY + 110 > 750) {
        doc.addPage();
        drawRegistrationMarks(doc, pageLeft - 6, 22, contentWidth + 12, 794, 5);
        totalsY = 45;
      }

      // Left Box: Amount in Words & Payment Note
      const wordsBoxWidth = 285;
      doc
        .rect(pageLeft, totalsY, wordsBoxWidth, 76)
        .lineWidth(0.6)
        .strokeColor(PRINT.black)
        .stroke();
      doc.rect(pageLeft, totalsY, wordsBoxWidth, 13).fill(PRINT.black);
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(6.2)
        .fillColor(PRINT.white)
        .text('AMOUNT IN WORDS', pageLeft + 6, totalsY + 3.5, { characterSpacing: 0.6 });

      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(7.6)
        .fillColor(PRINT.black)
        .text(numberToWordsINR(order.total), pageLeft + 8, totalsY + 19, {
          width: wordsBoxWidth - 16,
          lineGap: 1.5,
        });

      doc
        .font(PDF_FONTS.sans)
        .fontSize(6)
        .fillColor(PRINT.gray700)
        .text(
          isCashOnDelivery
            ? 'The delivery agent will collect the exact total amount shown at doorstep. Please keep exact cash change ready.'
            : 'Payment recorded in full against order reference. No additional charges or doorstep payment are due upon delivery.',
          pageLeft + 8,
          totalsY + 48,
          { width: wordsBoxWidth - 16, lineGap: 1.2 },
        );

      // Right Box: Totals Breakdown & Grand Total
      const totalsBoxX = pageRight - 226;
      const totalsBoxW = 226;
      doc
        .rect(totalsBoxX, totalsY, totalsBoxW, 76)
        .lineWidth(0.6)
        .strokeColor(PRINT.black)
        .stroke();

      let rowY = totalsY + 6;
      const totalRow = (label: string, value: string, bold = false) => {
        doc
          .font(bold ? PDF_FONTS.sansBold : PDF_FONTS.sans)
          .fontSize(7.5)
          .fillColor(bold ? PRINT.black : PRINT.gray700)
          .text(label, totalsBoxX + 10, rowY, { width: 120 });
        doc
          .font(bold ? PDF_FONTS.sansBold : PDF_FONTS.sans)
          .fontSize(7.5)
          .fillColor(PRINT.black)
          .text(value, totalsBoxX + 130, rowY, { width: totalsBoxW - 140, align: 'right' });
        rowY += 12;
      };

      totalRow('Item Subtotal', money(subtotal));
      if (discount > 0) {
        totalRow(
          `Discount${order.couponCode ? ` (${order.couponCode})` : ''}`,
          `- ${money(discount)}`,
          true,
        );
      }
      totalRow('Shipping & Packaging', shippingFee > 0 ? money(shippingFee) : 'FREE');

      // Highlighted Grand Total Bar
      const grandTotalY = totalsY + 48;
      doc.rect(totalsBoxX, grandTotalY, totalsBoxW, 28).fill(PRINT.black);
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(8)
        .fillColor(PRINT.white)
        .text('TOTAL AMOUNT', totalsBoxX + 10, grandTotalY + 9, {
          characterSpacing: 0.5,
        });
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(11.5)
        .fillColor(PRINT.white)
        .text(money(order.total), totalsBoxX + 90, grandTotalY + 7, {
          width: totalsBoxW - 100,
          align: 'right',
        });

      // ── Customer Support Terms & Authorised Signatory ─────────────────────
      let termsY = totalsY + 88;
      if (termsY + 78 > 760) {
        doc.addPage();
        drawRegistrationMarks(doc, pageLeft - 6, 22, contentWidth + 12, 794, 5);
        termsY = 45;
      }

      doc
        .moveTo(pageLeft, termsY)
        .lineTo(pageRight, termsY)
        .lineWidth(0.8)
        .strokeColor(PRINT.black)
        .stroke();

      const termsWidth = 310;
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(6.6)
        .fillColor(PRINT.black)
        .text('CUSTOMER SUPPORT & REPLACEMENT POLICY', pageLeft, termsY + 8, {
          characterSpacing: 0.5,
        });
      doc
        .font(PDF_FONTS.sans)
        .fontSize(6.1)
        .fillColor(PRINT.gray700)
        .text(
          [
            '1. Inspect the parcel upon delivery. Report any courier damage within 24 hours of receipt.',
            '2. Bespoke and custom-printed goods are crafted exclusively according to your order specs.',
            `3. Support Desk: WhatsApp / Call ${BUSINESS_DETAILS.phone}   ·   Email: ${BUSINESS_DETAILS.email}`,
            '4. Retain this invoice and packing slip for any warranty or exchange enquiries.',
          ].join('\n'),
          pageLeft,
          termsY + 19,
          { width: termsWidth, lineGap: 1.8 },
        );

      const signX = pageLeft + 335;
      const signWidth = pageRight - signX;
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(6.6)
        .fillColor(PRINT.black)
        .text('FOR FREGORO STUDIOS', signX, termsY + 8, {
          width: signWidth,
          characterSpacing: 0.5,
        });
      doc
        .font(PDF_FONTS.sans)
        .fontSize(6)
        .fillColor(PRINT.gray700)
        .text('Authorised Fulfilment Centre, Thiruvallur', signX, termsY + 18, {
          width: signWidth,
        });

      // Stylized digital mark
      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(8.8)
        .fillColor(PRINT.black)
        .text('Fregoro Studios Fulfilment', signX + 4, termsY + 34, { width: signWidth - 8 });

      doc
        .moveTo(signX, termsY + 49)
        .lineTo(pageRight, termsY + 49)
        .lineWidth(0.5)
        .strokeColor(PRINT.black)
        .stroke();
      doc
        .font(PDF_FONTS.sans)
        .fontSize(5.8)
        .fillColor(PRINT.gray700)
        .text('Authorised Signatory · Computer-Generated Document', signX, termsY + 53, {
          width: signWidth,
          align: 'center',
        });

      // ── Packing Slip Perforated Pouch Strip ───────────────────────────────
      const footerY = 774;
      doc.save();
      doc.dash(3, { space: 3 });
      doc
        .moveTo(pageLeft, footerY)
        .lineTo(pageRight, footerY)
        .lineWidth(0.6)
        .strokeColor(PRINT.black)
        .stroke();
      doc.restore();

      doc.rect(pageLeft, footerY + 4, contentWidth, 24).fill(PRINT.wash);
      doc
        .rect(pageLeft, footerY + 4, contentWidth, 24)
        .lineWidth(0.6)
        .strokeColor(PRINT.black)
        .stroke();

      doc
        .font(PDF_FONTS.sansBold)
        .fontSize(6)
        .fillColor(PRINT.black)
        .text(
          'PACKING SLIP · ATTACH SECURELY TO PARCEL OR INSERT IN SHIPMENT POUCH',
          pageLeft,
          footerY + 8,
          { width: contentWidth, align: 'center', characterSpacing: 0.5 },
        );
      doc
        .font(PDF_FONTS.mono)
        .fontSize(5.8)
        .fillColor(PRINT.gray700)
        .text(
          `ORDER REF: ${orderRef}  ·  CUSTOMER: ${addr.name}  ·  PIN: ${
            addr.zip || 'India'
          }  ·  THANK YOU FOR CHOOSING FREGORO STUDIOS`,
          pageLeft,
          footerY + 17,
          { width: contentWidth, align: 'center' },
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
