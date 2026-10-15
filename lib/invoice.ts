import PDFDocument from 'pdfkit';

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
  trackingNumber?: string | null;
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

/**
 * Draw a clean vector barcode representation for the order ID
 */
function drawBarcode(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number, code: string) {
  const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const patternSeed = cleanCode.split('').map((c) => c.charCodeAt(0));
  
  doc.save();
  doc.fillColor('#000000');

  const totalBars = 35;
  const barWidth = width / totalBars;

  for (let i = 0; i < totalBars; i++) {
    const seed = patternSeed[i % patternSeed.length] || 42;
    const isBar = (seed + i * 3) % 2 === 0 || i === 0 || i === totalBars - 1 || i === 12 || i === 24;
    const isThick = isBar && (seed + i) % 3 === 0;

    if (isBar) {
      const w = isThick ? barWidth * 0.9 : barWidth * 0.55;
      doc.rect(x + i * barWidth, y, w, height).fill('#000000');
    }
  }

  doc.restore();
}

/**
 * Generate an ultra-professional, packing-slip ready Tax Invoice PDF
 */
export async function generateInvoicePdf(order: InvoiceOrder): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Standard A4: 595.28 x 841.89 pt. 35pt margins.
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 35, bottom: 35, left: 35, right: 35 },
        autoFirstPage: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const pageLeft = 35;
      const pageWidth = 525;
      const pageRight = pageLeft + pageWidth;

      // Formatting variables
      const orderRef = order.publicOrderId || order.id;
      const invoiceNo = order.invoiceNumber || `INV-${String(orderRef).replace(/[^a-zA-Z0-9-]/g, '').slice(-10)}`;
      const orderDate = new Date(order.createdAt);
      const formattedDate = orderDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const isCod =
        order.paymentProvider === 'cod' ||
        order.paymentMethod?.toLowerCase().includes('cod') ||
        order.paymentMethod?.toLowerCase().includes('cash');

      const paymentStatus = (order.paymentStatus || (isCod ? 'Pending on Delivery' : 'Paid Online')).toUpperCase();

      // Parse structured address
      const addr = (order.shippingAddress as InvoiceAddress | null | undefined) || {};
      const recipientName =
        addr.name ||
        addr.fullName ||
        `${addr.firstName || ''} ${addr.lastName || ''}`.trim() ||
        order.user?.fullName ||
        'Valued Customer';

      const streetLine1 = addr.street || addr.addressLine1 || '';
      const streetLine2 = addr.addressLine2 || '';
      const cityStateZip = [addr.city, addr.state, addr.zip || addr.pincode].filter(Boolean).join(', ');
      const phone = addr.phone || order.user?.phone || 'N/A';
      const email = addr.email || order.user?.email || 'N/A';

      // ─── 1. TOP HEADER BRANDING & INVOICE DETAILS ──────────────────────────────
      // Outer border box around the entire invoice sheet
      doc.rect(pageLeft, 35, pageWidth, 770).lineWidth(1).strokeColor('#CBD5E1').stroke();

      // Brand Header Banner
      doc.rect(pageLeft, 35, pageWidth, 68).fill('#0F172A');

      // Left: Company Logo & Identity
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(16).text('FREGORO STUDIOS', pageLeft + 16, 46);
      doc.font('Helvetica').fontSize(7.5).fillColor('#94A3B8').text(
        'Bespoke Print, Custom Apparel & Editorial Studio',
        pageLeft + 16,
        64,
      );
      doc.fontSize(7).fillColor('#CBD5E1').text(
        'Plot No: A-134, N.G.G.O Nagar, Thiruvallur - 631203, TN, India  |  support@fregorostudios.com',
        pageLeft + 16,
        74,
      );
      doc.fontSize(7).fillColor('#94A3B8').text(
        'GSTIN: 33AAECF1234F1Z5  |  CIN: U74999TN2024PTC123456',
        pageLeft + 16,
        84,
      );

      // Right: Document Badge & Key Numbers
      doc.rect(pageRight - 165, 43, 150, 52).fill('#1E293B');
      doc.fillColor('#E5C287').font('Helvetica-Bold').fontSize(9).text('TAX INVOICE & PACKING SLIP', pageRight - 160, 48, { width: 140, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#FFFFFF').text(`INVOICE: ${invoiceNo}`, pageRight - 160, 61, { width: 140, align: 'center' });
      doc.font('Helvetica').fontSize(7).fillColor('#94A3B8').text(`ORDER ID: ${orderRef}`, pageRight - 160, 71, { width: 140, align: 'center' });
      doc.fontSize(6.5).fillColor('#CBD5E1').text(`DATE: ${formattedDate} | CHANNEL: Online`, pageRight - 160, 81, { width: 140, align: 'center' });

      // ─── 2. LOGISTICS & COURIER DISPATCH STRIP ────────────────────────────────
      const stripY = 108;
      const stripHeight = 38;

      if (isCod) {
        // Red / Amber Alert strip for Cash on Delivery
        doc.rect(pageLeft + 12, stripY, pageWidth - 24, stripHeight).lineWidth(1).strokeColor('#F87171').fill('#FEF2F2');
        doc.fillColor('#991B1B').font('Helvetica-Bold').fontSize(10).text('CASH ON DELIVERY (COD)', pageLeft + 20, stripY + 7);
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#B91C1C').text(
          `COLLECT FROM CUSTOMER: INR ${order.total.toFixed(2)}`,
          pageLeft + 20,
          stripY + 22,
        );
      } else {
        // Green / Blue strip for Prepaid orders
        doc.rect(pageLeft + 12, stripY, pageWidth - 24, stripHeight).lineWidth(1).strokeColor('#34D399').fill('#ECFDF5');
        doc.fillColor('#065F46').font('Helvetica-Bold').fontSize(10).text('PREPAID SHIPMENT', pageLeft + 20, stripY + 7);
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#047857').text(
          'ZERO AMOUNT DUE — DO NOT COLLECT CASH',
          pageLeft + 20,
          stripY + 22,
        );
      }

      // Barcode for warehouse & courier package scanning
      drawBarcode(doc, pageRight - 160, stripY + 6, 140, 18, String(orderRef));
      doc.font('Helvetica').fontSize(6.5).fillColor('#475569').text(
        `*${orderRef}*`,
        pageRight - 160,
        stripY + 26,
        { width: 140, align: 'center' },
      );

      // ─── 3. STRUCTURED DUAL ADDRESS DOSSIER ──────────────────────────────────
      const addressBoxY = 153;
      const colWidth = (pageWidth - 32) / 2;

      // Left Box: Delivery Destination (Courier Address Label)
      doc.rect(pageLeft + 12, addressBoxY, colWidth, 92).lineWidth(0.8).strokeColor('#CBD5E1').fill('#FFFFFF');
      doc.rect(pageLeft + 12, addressBoxY, colWidth, 18).fill('#F1F5F9');
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0F172A').text('SHIP TO / DELIVERY DESTINATION', pageLeft + 18, addressBoxY + 5);

      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0F172A').text(recipientName, pageLeft + 18, addressBoxY + 24, { width: colWidth - 12 });
      doc.font('Helvetica').fontSize(8).fillColor('#334155');
      let curAddrY = addressBoxY + 36;
      if (streetLine1) {
        doc.text(streetLine1, pageLeft + 18, curAddrY, { width: colWidth - 12 });
        curAddrY += 10;
      }
      if (streetLine2) {
        doc.text(streetLine2, pageLeft + 18, curAddrY, { width: colWidth - 12 });
        curAddrY += 10;
      }
      if (cityStateZip) {
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0F172A').text(cityStateZip, pageLeft + 18, curAddrY, { width: colWidth - 12 });
        curAddrY += 11;
      }
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#2563EB').text(`Phone: ${phone}`, pageLeft + 18, curAddrY);
      if (email && email !== 'N/A') {
        doc.font('Helvetica').fontSize(7).fillColor('#64748B').text(`Email: ${email}`, pageLeft + 18, curAddrY + 10);
      }

      // Right Box: Dispatch & Order Specs
      const rightColX = pageLeft + 12 + colWidth + 8;
      doc.rect(rightColX, addressBoxY, colWidth, 92).lineWidth(0.8).strokeColor('#CBD5E1').fill('#FFFFFF');
      doc.rect(rightColX, addressBoxY, colWidth, 18).fill('#F1F5F9');
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0F172A').text('DISPATCH & BILLING SPECIFICATIONS', rightColX + 8, addressBoxY + 5);

      doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
      doc.text('Shipped By: Fregoro Studios Hub (Thiruvallur)', rightColX + 8, addressBoxY + 24);
      doc.text(`Payment Mode: ${isCod ? 'Cash on Delivery' : 'Online Payment (Prepaid)'}`, rightColX + 8, addressBoxY + 35);
      doc.text(`Payment Status: ${paymentStatus}`, rightColX + 8, addressBoxY + 46);
      if (order.paymentGatewayPaymentId) {
        doc.text(`Gateway Txn ID: ${order.paymentGatewayPaymentId}`, rightColX + 8, addressBoxY + 57);
      }
      doc.text(`Estimated Dispatch: 24 - 48 Hours`, rightColX + 8, addressBoxY + 68);
      doc.text('Courier Handling: Priority Air Cargo / Surface Express', rightColX + 8, addressBoxY + 79);

      // ─── 4. ITEMIZED MERCHANDISE TABLE ────────────────────────────────────────
      const tableY = 252;
      const tableWidth = pageWidth - 24;
      const headerHeight = 20;

      // Table Header Row
      doc.rect(pageLeft + 12, tableY, tableWidth, headerHeight).fill('#0F172A');
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#FFFFFF');

      const colSNo = pageLeft + 16;
      const colDesc = pageLeft + 42;
      const colSku = pageLeft + 290;
      const colQty = pageLeft + 352;
      const colRate = pageLeft + 386;
      const colAmount = pageLeft + 444;

      doc.text('#', colSNo, tableY + 6);
      doc.text('ITEM DESCRIPTION & SPECIFICATIONS', colDesc, tableY + 6);
      doc.text('SKU / CODE', colSku, tableY + 6);
      doc.text('QTY', colQty, tableY + 6, { width: 30, align: 'center' });
      doc.text('UNIT PRICE', colRate, tableY + 6, { width: 55, align: 'right' });
      doc.text('TOTAL AMOUNT', colAmount, tableY + 6, { width: 85, align: 'right' });

      let currentY = tableY + headerHeight;
      const items = order.items && order.items.length > 0 ? order.items : [];

      items.forEach((item, index) => {
        const itemPrice = item.unitPrice ?? item.price ?? (item.totalPrice ? item.totalPrice / item.quantity : 0);
        const itemTotal = itemPrice * item.quantity;
        const isAlt = index % 2 === 1;

        // Customization specs extraction
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cust = (item.customization as Record<string, any>) || {};
        const specParts: string[] = [];
        if (item.size) specParts.push(`Size: ${item.size}`);
        if (item.variant && item.variant !== 'default') specParts.push(`Variant: ${item.variant}`);
        if (cust.color) specParts.push(`Color: ${cust.color}`);
        if (cust.is3dMockup) specParts.push('3D Studio Proof');
        if (cust.is2dMockup) specParts.push('2D Studio Proof');
        if (cust.magazineTitle) specParts.push(`Magazine (${cust.pageCount || 12} Pages, ${cust.bindingType || 'Saddle-Stitch'})`);
        if (cust.printInstructions) {
          specParts.push(`Note: "${String(cust.printInstructions).slice(0, 45)}"`);
        }

        const specLine = specParts.join(' · ');
        const rowHeight = specLine ? 34 : 26;

        // Row background
        doc.rect(pageLeft + 12, currentY, tableWidth, rowHeight).fill(isAlt ? '#F8FAFC' : '#FFFFFF');
        doc.rect(pageLeft + 12, currentY, tableWidth, rowHeight).lineWidth(0.5).strokeColor('#E2E8F0').stroke();

        // Row Data
        doc.font('Helvetica').fontSize(8).fillColor('#64748B').text(String(index + 1), colSNo, currentY + 6);

        // Title and Spec
        const titleText = item.productNameSnapshot || item.product?.name || `Product #${item.productId}`;
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0F172A').text(titleText, colDesc, currentY + 6, {
          width: 240,
          ellipsis: true,
        });

        if (specLine) {
          doc.font('Helvetica').fontSize(6.8).fillColor('#64748B').text(specLine, colDesc, currentY + 18, {
            width: 240,
            ellipsis: true,
          });
        }

        // SKU
        const skuText = item.skuSnapshot || item.variant || item.productId;
        doc.font('Courier').fontSize(7).fillColor('#475569').text(String(skuText).slice(0, 14), colSku, currentY + 8);

        // Qty
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0F172A').text(String(item.quantity), colQty, currentY + 7, {
          width: 30,
          align: 'center',
        });

        // Unit Price
        doc.font('Helvetica').fontSize(8.5).fillColor('#0F172A').text(`INR ${itemPrice.toFixed(2)}`, colRate, currentY + 7, {
          width: 55,
          align: 'right',
        });

        // Line Total
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0F172A').text(`INR ${itemTotal.toFixed(2)}`, colAmount, currentY + 7, {
          width: 85,
          align: 'right',
        });

        currentY += rowHeight;
      });

      // ─── 5. FINANCIAL TOTALS & AMOUNT IN WORDS ───────────────────────────────
      const totalsY = currentY + 12;
      const totalsBoxWidth = 210;
      const totalsBoxX = pageRight - 12 - totalsBoxWidth;

      // Left Box: Amount in Words & Tax Note
      const leftWordsWidth = pageWidth - totalsBoxWidth - 36;
      doc.rect(pageLeft + 12, totalsY, leftWordsWidth, 88).lineWidth(0.8).strokeColor('#CBD5E1').fill('#F8FAFC');
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0F172A').text('AMOUNT IN WORDS:', pageLeft + 18, totalsY + 8);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1E293B').text(numberToWordsINR(order.total), pageLeft + 18, totalsY + 20, {
        width: leftWordsWidth - 12,
      });

      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0F172A').text('TAX & SUPPLY DECLARATION:', pageLeft + 18, totalsY + 44);
      doc.font('Helvetica').fontSize(6.8).fillColor('#475569').text(
        'All prices are inclusive of GST (CGST 2.5% + SGST 2.5% / IGST 5%). Composition scheme / retail consumer supply. Goods manufactured and dispatched under strict quality assurance standards.',
        pageLeft + 18,
        totalsY + 54,
        { width: leftWordsWidth - 12, lineGap: 1.5 },
      );

      // Right Box: Detailed Breakdown Table
      doc.rect(totalsBoxX, totalsY, totalsBoxWidth, 88).lineWidth(0.8).strokeColor('#CBD5E1').fill('#FFFFFF');

      const subtotal =
        order.subtotal ??
        items.reduce(
          (sum, item) => sum + (item.unitPrice ?? item.price ?? (item.totalPrice ? item.totalPrice / item.quantity : 0)) * item.quantity,
          0,
        );
      const discount = order.discount || 0;
      const shippingFee = order.shippingFee || 0;

      let rY = totalsY + 7;
      doc.font('Helvetica').fontSize(8).fillColor('#475569').text('Item Subtotal:', totalsBoxX + 10, rY);
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#0F172A').text(`INR ${subtotal.toFixed(2)}`, totalsBoxX + 110, rY, {
        width: 90,
        align: 'right',
      });

      rY += 13;
      if (discount > 0) {
        doc.font('Helvetica').fontSize(8).fillColor('#DC2626').text(`Discount (${order.couponCode || 'Promo'}):`, totalsBoxX + 10, rY);
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#DC2626').text(`-INR ${discount.toFixed(2)}`, totalsBoxX + 110, rY, {
          width: 90,
          align: 'right',
        });
        rY += 13;
      }

      doc.font('Helvetica').fontSize(8).fillColor('#475569').text('Packaging & Shipping:', totalsBoxX + 10, rY);
      doc.font('Helvetica-Bold').fontSize(8).fillColor(shippingFee > 0 ? '#0F172A' : '#16A34A').text(
        shippingFee > 0 ? `INR ${shippingFee.toFixed(2)}` : 'FREE',
        totalsBoxX + 110,
        rY,
        { width: 90, align: 'right' },
      );

      // Grand Total Highlight Bar
      doc.rect(totalsBoxX, totalsY + 58, totalsBoxWidth, 30).fill('#0F172A');
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#FFFFFF').text('TOTAL PAYABLE:', totalsBoxX + 10, totalsY + 68);
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#FBBF24').text(`INR ${order.total.toFixed(2)}`, totalsBoxX + 90, totalsY + 66, {
        width: 110,
        align: 'right',
      });

      // ─── 6. TERMS, DECLARATION & SIGNATORY ────────────────────────────────────
      const signY = totalsY + 98;
      const signBoxWidth = (pageWidth - 32) / 2;

      // Terms of Sale
      doc.rect(pageLeft + 12, signY, signBoxWidth, 75).lineWidth(0.8).strokeColor('#E2E8F0').fill('#FFFFFF');
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0F172A').text('CUSTOMER SUPPORT & RETURN TERMS:', pageLeft + 18, signY + 6);
      doc.font('Helvetica').fontSize(6.8).fillColor('#64748B').text(
        '1. Inspect package upon delivery. In case of courier damage, report within 24h.\n2. Custom bespoke prints, personalized apparel, and custom magazines are created specifically for you.\n3. For support or queries: WhatsApp / Phone +91 98765 43210 or email support@fregorostudios.com.\n4. Keep this packing slip for any warranty or replacement requests.',
        pageLeft + 18,
        signY + 18,
        { width: signBoxWidth - 12, lineGap: 1.5 },
      );

      // Official Stamp / Authorized Signatory Box
      const signRightX = pageLeft + 12 + signBoxWidth + 8;
      doc.rect(signRightX, signY, signBoxWidth, 75).lineWidth(0.8).strokeColor('#E2E8F0').fill('#FFFFFF');
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0F172A').text('FOR FREGORO STUDIOS', signRightX + 10, signY + 6);
      doc.font('Helvetica').fontSize(6.8).fillColor('#64748B').text('Authorized Fulfilment Center, Thiruvallur', signRightX + 10, signY + 16);

      // Stylized digital signature simulation
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#2563EB').text('Fregoro Studios Fulfilment', signRightX + 20, signY + 40);
      doc.rect(signRightX + 10, signY + 54, signBoxWidth - 20, 0.8).fill('#CBD5E1');
      doc.font('Helvetica').fontSize(7).fillColor('#64748B').text('Authorised Signatory  |  Computer Generated', signRightX + 10, signY + 58, {
        width: signBoxWidth - 20,
        align: 'center',
      });

      // ─── 7. PACKAGE PACKING SLIP TEAR-OFF FOOTER ──────────────────────────────
      const footerY = 770;
      doc.rect(pageLeft + 12, footerY, pageWidth - 24, 25).fill('#F1F5F9');
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#475569').text(
        'PACKAGE PACKING SLIP  |  STICK OR PLACE SECURELY INSIDE PARCEL POUCH',
        pageLeft + 20,
        footerY + 5,
        { width: pageWidth - 40, align: 'center' },
      );
      doc.font('Helvetica').fontSize(6.5).fillColor('#64748B').text(
        `Order Ref: ${orderRef}  •  Customer: ${recipientName}  •  PIN: ${addr.zip || addr.pincode || 'India'}  •  Thank you for choosing Fregoro Studios`,
        pageLeft + 20,
        footerY + 14,
        { width: pageWidth - 40, align: 'center' },
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
