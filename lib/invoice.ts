import PDFDocument from 'pdfkit';
import { Prisma } from '@prisma/client';

export async function generateInvoicePdf(order: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header
      doc.fontSize(20).text('StarBy', 50, 45);
      doc.fontSize(10).text('INVOICE', 450, 45, { align: 'right' });
      doc.text(`Order ID: ${order.id}`, { align: 'right' });
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, {
        align: 'right',
      });

      doc.moveDown(2);

      // Customer Info
      doc.fontSize(12).text('Billed To:');
      doc.fontSize(10);

      const address = order.shippingAddress as any;
      if (address) {
        doc.text(`${address.firstName} ${address.lastName}`);
        doc.text(address.addressLine1);
        if (address.addressLine2) doc.text(address.addressLine2);
        doc.text(`${address.city}, ${address.state} ${address.pincode}`);
        doc.text(`Phone: ${address.phone}`);
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
      order.items.forEach((item: any) => {
        doc.text(item.product?.name || `Product ID: ${item.productId}`, 60, y);
        doc.text(item.quantity.toString(), 350, y);
        doc.text(`Rs. ${item.price.toFixed(2)}`, 400, y);
        doc.text(`Rs. ${(item.price * item.quantity).toFixed(2)}`, 480, y);
        y += 20;
      });

      doc.moveDown(2);
      y = doc.y;

      // Summary
      doc.font('Helvetica-Bold');
      doc.text('Subtotal:', 350, y);
      const subtotal = order.items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
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
      doc.text('starby.in', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
