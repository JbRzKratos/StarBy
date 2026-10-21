import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { PrintInvoiceButton, AutoPrintTrigger } from '@/components/print-invoice-button';
import { verifyInvoiceToken } from '@/lib/invoice-token';
import { formatPaymentProvider } from '@/lib/payment-display';

export const dynamic = 'force-dynamic';

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { email?: string; token?: string; print?: string; autoPrint?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: params.id }, { publicOrderId: params.id }],
    },
    include: {
      items: true,
      user: {
        select: { fullName: true, email: true },
      },
    },
  });

  if (!order) return notFound();

  const address = (order.shippingAddress as Record<string, string | undefined>) || {};
  const orderEmail = (address.email || order.user?.email || '').toLowerCase().trim();
  const searchEmail = (searchParams?.email || '').toLowerCase().trim();

  const isOwner = Boolean(user?.id && user.id === order.userId);
  const { isSuperAdminEmail } = await import('@/app/admin/lib/auth');
  let isAdmin = isSuperAdminEmail(user?.email);

  if (!isAdmin && user?.id) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    isAdmin = dbUser?.role === 'STAFF';
  }

  const isEmailVerifiedLink = Boolean(
    searchEmail &&
      orderEmail &&
      searchEmail === orderEmail &&
      verifyInvoiceToken(params.id, searchEmail, searchParams?.token),
  );

  // Restrict to admin, owner, or verified order recipient link
  if (!isOwner && !isAdmin && !isEmailVerifiedLink) {
    return notFound();
  }

  const shouldAutoPrint = searchParams?.print === '1' || searchParams?.autoPrint === '1';
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 border-b border-slate-300 pb-6 mb-8">
          <div>
            <Image
              src="/images/fregoro-logo.png"
              alt="Fregoro Studios"
              width={180}
              height={77}
              priority
              className="h-14 w-auto mb-4 print:h-14"
            />
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 mb-2">
              Packing Slip · Order Document
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight mb-2">
              INVOICE
            </h1>
            <p className="text-sm font-semibold text-slate-700">
              Invoice / Order Ref:{' '}
              <span className="font-mono text-black font-bold">
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
          <div className="sm:text-right">
            <h2 className="text-2xl font-bold text-black mb-1 font-display">Fregoro Studios</h2>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              Bespoke Print, Custom Apparel &amp; Editorial Studio
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">Plot No: A-134, N.G.G.O Nagar</p>
            <p className="text-xs text-slate-700 leading-relaxed">
              Selai Village, Thiruvallur - 631203
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">Tamil Nadu, India</p>
            <p className="text-xs text-slate-700 leading-relaxed font-mono">
              fregorostudios@gmail.com
            </p>
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
                {formatPaymentProvider(order.paymentProvider)}
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
                const customization = (item.customization ?? {}) as Record<string, unknown>;
                const documentPages =
                  customization.document &&
                  typeof customization.document === 'object' &&
                  Array.isArray((customization.document as { pages?: unknown }).pages)
                    ? ((customization.document as { pages: unknown[] }).pages.length as number)
                    : null;
                const magazinePages =
                  typeof customization.pageCount === 'number'
                    ? customization.pageCount
                    : Array.isArray(customization.pagesData)
                      ? customization.pagesData.length
                      : documentPages;
                const printPdfUrl =
                  typeof customization.printPdfUrl === 'string'
                    ? customization.printPdfUrl
                    : typeof customization.designFileUrl === 'string' &&
                        /\.pdf(\?|$)/i.test(customization.designFileUrl)
                      ? customization.designFileUrl
                      : null;
                const artworkSides = Array.isArray(customization.uploadedArtworks)
                  ? Array.from(
                      new Set(
                        customization.uploadedArtworks
                          .map((art) =>
                            art && typeof art === 'object' && typeof (art as Record<string, unknown>).side === 'string'
                              ? ((art as Record<string, unknown>).side as string)
                              : null,
                          )
                          .filter((side): side is string => Boolean(side)),
                      ),
                    )
                  : [];
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
                      {typeof customization.magazineTitle === 'string' && (
                        <p className="text-xs text-slate-600 mt-1">
                          Magazine: {customization.magazineTitle}
                          {magazinePages ? ` · ${magazinePages} pages` : ''}
                          {typeof customization.bindingType === 'string'
                            ? ` · ${customization.bindingType}`
                            : ''}
                          {typeof customization.paperWeight === 'string'
                            ? ` · ${customization.paperWeight}`
                            : ''}
                          {typeof customization.coverFinish === 'string'
                            ? ` · ${customization.coverFinish}`
                            : ''}
                        </p>
                      )}
                      {artworkSides.length > 0 && (
                        <p className="text-xs text-slate-600 mt-1">
                          Artwork sides:{' '}
                          {Array.from(
                            new Set(
                              artworkSides.map((side) =>
                                side === 'left-sleeve'
                                  ? 'Left Sleeve'
                                  : side === 'right-sleeve'
                                    ? 'Right Sleeve'
                                    : side === 'back'
                                      ? 'Back'
                                      : 'Front',
                              ),
                            ),
                          ).join(', ')}
                        </p>
                      )}
                      {printPdfUrl && (
                        <a
                          href={printPdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-[11px] font-semibold text-slate-700 underline underline-offset-2 mt-1"
                        >
                          Download print-ready PDF ↗
                        </a>
                      )}
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
              <div className="flex justify-between text-slate-700">
                <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                <span className="font-medium font-mono text-slate-900">-₹{order.discount.toFixed(2)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-slate-700">
              <span>Shipping</span>
              <span className="font-medium text-slate-900">
                {order.shippingFee > 0 ? `₹${order.shippingFee.toFixed(2)}` : 'Free'}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t-2 border-black font-bold text-lg text-black">
              <span>Total Amount</span>
              <span className="font-mono">₹{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Invoice Footer */}
        <div className="mt-12 text-center text-xs text-slate-600 border-t border-slate-200 pt-6">
          <p className="font-medium text-slate-800">Thank you for shopping with Fregoro Studios!</p>
          <p className="mt-1">
            This is a computer-generated invoice and does not require a physical signature.
          </p>
        </div>
      </div>
      <AutoPrintTrigger enabled={shouldAutoPrint} />
    </div>
  );
}
