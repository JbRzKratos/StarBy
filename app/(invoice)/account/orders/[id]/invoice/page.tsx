import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { PrintInvoiceButton } from '@/components/print-invoice-button';

export const dynamic = 'force-dynamic';

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      user: {
        select: { fullName: true, email: true },
      },
    },
  });

  if (!order) return notFound();

  // Restrict to admin or the owner
  if (user?.id !== order.userId && user?.email !== 'admin@starby.in') {
    return notFound();
  }

  const address = (order.shippingAddress as Record<string, string | undefined>) || {};
  const subtotal =
    order.subtotal ||
    order.items.reduce(
      (acc, item) => acc + (item.unitPrice ?? item.totalPrice / item.quantity) * item.quantity,
      0,
    );

  return (
    <div
      className="bg-slate-100 min-h-screen text-slate-900 py-8 px-4 sm:px-6 print:bg-white print:p-0 print:text-black"
      style={{
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Top Controls Bar (Hidden during printing) */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden flex justify-between items-center bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
        <Link
          href={`/account/orders`}
          className="text-slate-700 hover:text-black font-medium text-sm flex items-center gap-2 transition-colors"
        >
          &larr; Back to Orders
        </Link>
        <PrintInvoiceButton />
      </div>

      {/* Invoice Document Sheet */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 p-8 sm:p-12 rounded-lg shadow-sm print:shadow-none print:border-none print:p-0 print:w-full">
        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mb-2">
              TAX INVOICE
            </h1>
            <p className="text-sm font-semibold text-slate-700">
              Invoice / Order Ref:{' '}
              <span className="font-mono text-slate-900 font-bold">
                {order.publicOrderId || order.id}
              </span>
            </p>
            <p className="text-sm text-slate-700">
              Date:{' '}
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-slate-950 mb-1 font-display">StarBy</h2>
            <p className="text-xs text-slate-700 leading-relaxed">Premium Streetwear & Wall Art</p>
            <p className="text-xs text-slate-700 leading-relaxed">Bengaluru, Karnataka, India</p>
            <p className="text-xs text-slate-700 leading-relaxed">support@starby.in</p>
          </div>
        </div>

        {/* Addresses & Payment Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10 pb-8 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wider mb-3">
              Billed To / Shipped To:
            </h3>
            <p className="font-semibold text-slate-900 text-base">
              {address.name ||
                `${address.firstName || ''} ${address.lastName || ''}`.trim() ||
                'Customer'}
            </p>
            {address.street && <p className="text-sm text-slate-700 mt-1">{address.street}</p>}
            {(address.city || address.state || address.zip) && (
              <p className="text-sm text-slate-700">
                {address.city}
                {address.city && address.state ? ', ' : ''}
                {address.state} {address.zip}
              </p>
            )}
            <p className="text-sm text-slate-700">{address.country || 'India'}</p>
            {address.email && <p className="text-sm text-slate-700 mt-2">Email: {address.email}</p>}
            {address.phone && <p className="text-sm text-slate-700">Phone: {address.phone}</p>}
          </div>

          <div className="sm:text-right">
            <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wider mb-3">
              Payment & Fulfillment:
            </h3>
            <p className="text-sm text-slate-700">
              Payment Method:{' '}
              <span className="font-semibold text-slate-900 capitalize">
                {order.paymentProvider === 'cod'
                  ? 'Cash on Delivery (COD)'
                  : `Online Payment (${order.paymentProvider || 'Cashfree'})`}
              </span>
            </p>
            <p className="text-sm text-slate-700 mt-1">
              Payment Status:{' '}
              <span className="font-semibold text-slate-900 uppercase">{order.paymentStatus}</span>
            </p>
            {order.paymentGatewayPaymentId && (
              <p className="text-sm text-slate-700 mt-1">
                Transaction Ref:{' '}
                <span className="font-mono font-medium text-slate-900 text-xs">
                  {order.paymentGatewayPaymentId}
                </span>
              </p>
            )}
            <p className="text-sm text-slate-700 mt-1">
              Order Status:{' '}
              <span className="font-semibold text-slate-900 uppercase">
                {order.status.replace('_', ' ')}
              </span>
            </p>
          </div>
        </div>

        {/* Item Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-950 font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-1">Item Description</th>
                <th className="py-3 px-1 text-center">Qty</th>
                <th className="py-3 px-1 text-right">Unit Price</th>
                <th className="py-3 px-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {order.items.map((item) => {
                const itemPrice = item.unitPrice ?? item.totalPrice / item.quantity;
                return (
                  <tr key={item.id}>
                    <td className="py-4 px-1">
                      <p className="font-semibold text-slate-900">
                        {item.productNameSnapshot || `Product #${item.productId}`}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Variant: {item.variantId}
                        {item.size && ` · Size: ${item.size}`}
                      </p>
                    </td>
                    <td className="py-4 px-1 text-center text-slate-800 font-medium">
                      {item.quantity}
                    </td>
                    <td className="py-4 px-1 text-right text-slate-800 font-mono">
                      ₹{itemPrice.toFixed(2)}
                    </td>
                    <td className="py-4 px-1 text-right font-semibold text-slate-900 font-mono">
                      ₹{(itemPrice * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary Totals */}
        <div className="flex justify-end border-t border-slate-200 pt-6">
          <div className="w-full sm:w-72 space-y-2 text-sm">
            <div className="flex justify-between text-slate-700">
              <span>Subtotal</span>
              <span className="font-medium text-slate-900 font-mono">₹{subtotal.toFixed(2)}</span>
            </div>
            {order.discount && order.discount > 0 ? (
              <div className="flex justify-between text-red-600">
                <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                <span className="font-medium font-mono">-₹{order.discount.toFixed(2)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-slate-700">
              <span>Shipping</span>
              <span className="font-medium text-emerald-700">
                {order.shippingFee > 0 ? `₹${order.shippingFee.toFixed(2)}` : 'Free'}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t-2 border-slate-900 font-bold text-lg text-slate-950">
              <span>Total Amount</span>
              <span className="font-mono">₹{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Invoice Footer */}
        <div className="mt-12 text-center text-xs text-slate-600 border-t border-slate-200 pt-6">
          <p className="font-medium text-slate-800">Thank you for shopping with StarBy!</p>
          <p className="mt-1">
            This is a computer-generated invoice and does not require a physical signature.
          </p>
        </div>
      </div>
    </div>
  );
}
