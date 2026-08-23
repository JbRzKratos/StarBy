import PDFDocument from 'pdfkit';

interface InvoiceItem {
  productId: string;
  quantity: number;
  price?: number | null;
  unitPrice?: number;
  totalPrice?: number;
  productNameSnapshot?: string | null;
  product?: { name?: string };
}

interface InvoiceAddress {
  name?: string;
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  addressLine2?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  pincode?: string;
  phone?: string;
}

interface InvoiceOrder {
  id: string;
  publicOrderId?: string | null;
  createdAt: string | Date;
  shippingAddress?: unknown;
  user?: { fullName?: string | null; email?: string | null } | null;
  items: InvoiceItem[];
  discount?: number | null;
  couponCode?: string | null;
  total: number;
}

export async function generateInvoicePdf(order: InvoiceOrder): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header
      doc.fontSize(20).text('Fregoro Studios', 50, 45);
      doc.fontSize(10).text('INVOICE', 450, 45, { align: 'right' });
      doc.text(`Order ID: ${order.id}`, { align: 'right' });
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, {
        align: 'right',
      });

      doc.moveDown(2);

      // Customer Info
      doc.fontSize(12).text('Billed To:');
      doc.fontSize(10);

      const address = order.shippingAddress as InvoiceAddress | null | undefined;
      if (address && typeof address === 'object') {
        const name =
          address.name ||
          `${address.firstName || ''} ${address.lastName || ''}`.trim() ||
          order.user?.fullName ||
          'Customer';
        doc.text(name);
        const street = address.street || address.addressLine1 || '';
        if (street) doc.text(street);
        if (address.addressLine2) doc.text(address.addressLine2);
        const cityLine = [address.city, address.state, address.zip || address.pincode]
          .filter(Boolean)
          .join(', ');
        if (cityLine) doc.text(cityLine);
        if (address.phone) doc.text(`Phone: ${address.phone}`);
      } else {
        doc.text(order.user?.fullName || 'Customer');
        if (order.user?.email) doc.text(order.user.email);
      }

      doc.moveDown(2);

      // Table Header
      let y = doc.y;
      doc.rect(50, y, 500, 20).fill('#f3f4f6');
      doc.fillColor('#000000').font('Helvetica-Bold');
      doc.text('Item', 60, y + 5);
      doc.text('Qty', 350, y + 5);
      doc.text('Price', 400, y + 5);
      doc.text('Total', 480, y + 5);

      y += 25;
      doc.font('Helvetica');

      // Table Rows
      order.items.forEach((item: InvoiceItem) => {
        const itemPrice =
          item.unitPrice ?? item.price ?? (item.totalPrice ? item.totalPrice / item.quantity : 0);
        doc.text(
          item.productNameSnapshot || item.product?.name || `Product ID: ${item.productId}`,
          60,
          y,
        );
        doc.text(item.quantity.toString(), 350, y);
        doc.text(`Rs. ${itemPrice.toFixed(2)}`, 400, y);
        doc.text(`Rs. ${(itemPrice * item.quantity).toFixed(2)}`, 480, y);
        y += 20;
      });

      doc.moveDown(2);
      y = doc.y;

      // Summary
      doc.font('Helvetica-Bold');
      doc.text('Subtotal:', 350, y);
      const subtotal = order.items.reduce(
        (sum: number, item: InvoiceItem) =>
          sum +
          (item.unitPrice ??
            item.price ??
            (item.totalPrice ? item.totalPrice / item.quantity : 0)) *
            item.quantity,
        0,
      );
      doc.text(`Rs. ${subtotal.toFixed(2)}`, 480, y);

      y += 20;
      if (order.discount && order.discount > 0) {
        doc.text(`Discount (${order.couponCode || 'N/A'}):`, 350, y);
        doc.text(`-Rs. ${order.discount.toFixed(2)}`, 480, y);
        y += 20;
      }

      doc.text('Total:', 350, y);
      doc.text(`Rs. ${order.total.toFixed(2)}`, 480, y);

      // Footer
      doc.moveDown(4);
      doc.font('Helvetica').fontSize(10).text('Thank you for your business!', { align: 'center' });
      doc.text('fregorostudios.com', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
