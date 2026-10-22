import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { PrintInvoiceButton, AutoPrintTrigger } from '@/components/print-invoice-button';
import { verifyInvoiceToken } from '@/lib/invoice-token';
import { formatPaymentProvider } from '@/lib/payment-display';
import { BUSINESS_DETAILS } from '@/lib/business-details';

export const dynamic = 'force-dynamic';

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

  const isCashOnDelivery =
    order.paymentProvider === 'cod' ||
    Boolean(order.paymentProvider && order.paymentProvider.toLowerCase().includes('cash'));

  const orderRef = order.publicOrderId || order.id;
  const invoiceNo = `INV-${String(orderRef)
    .replace(/[^a-zA-Z0-9-]/g, '')
    .slice(-10)}`;

  const recipientName =
    address.name ||
    address.fullName ||
    `${address.firstName || ''} ${address.lastName || ''}`.trim() ||
    order.user?.fullName ||
    'Customer';

  return (
    <div
      className="bg-neutral-100 min-h-screen text-black py-8 px-4 sm:px-6 print:bg-white print:p-0 print:m-0 print:text-black"
      style={{
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Top Controls Bar (Hidden during printing) */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden flex justify-between items-center bg-white border border-black/20 p-4 rounded-none shadow-sm">
        <Link
          href={`/account/orders`}
          className="text-black hover:text-black/70 font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-colors font-bold"
        >
          &larr; Back to Orders
        </Link>
        <div className="flex items-center gap-3">
          <a
            href={`/api/orders/${encodeURIComponent(order.id)}/invoice`}
            download
            className="inline-flex items-center justify-center px-4 py-2 border border-black bg-white hover:bg-neutral-100 text-black text-xs font-mono font-bold tracking-wider uppercase transition-all"
          >
            Download PDF ↗
          </a>
          <PrintInvoiceButton />
        </div>
      </div>

      {/* Invoice Document Sheet */}
      <div className="max-w-4xl mx-auto bg-white border-2 border-black p-8 sm:p-12 relative print:border-none print:p-0 print:w-full print:shadow-none">
        {/* Subtle Corner Registration Marks (Print Luxury Accent) */}
        <div className="hidden sm:block print:hidden absolute top-2 left-2 text-[10px] font-mono text-black select-none opacity-40">
          +
        </div>
        <div className="hidden sm:block print:hidden absolute top-2 right-2 text-[10px] font-mono text-black select-none opacity-40">
          +
        </div>
        <div className="hidden sm:block print:hidden absolute bottom-2 left-2 text-[10px] font-mono text-black select-none opacity-40">
          +
        </div>
        <div className="hidden sm:block print:hidden absolute bottom-2 right-2 text-[10px] font-mono text-black select-none opacity-40">
          +
        </div>

        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 pb-6 border-b-2 border-black">
          <div>
            <Image
              src="/images/fregoro-logo.png"
              alt="Fregoro Studios"
              width={180}
              height={77}
              priority
              className="h-12 w-auto mb-3 print:h-12"
            />
            <h2 className="text-sm font-bold tracking-wider text-black uppercase font-mono">
              FREGORO STUDIOS
            </h2>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600 mb-2 font-mono">
              Bespoke Print · Custom Apparel · Editorial Studio
            </p>
            <div className="text-xs text-neutral-800 space-y-0.5 mt-2 font-mono">
              <p>{BUSINESS_DETAILS.addressLine1}</p>
              <p>{BUSINESS_DETAILS.addressLine2}</p>
              <p className="font-bold text-black pt-0.5">
                TEL: {BUSINESS_DETAILS.phone} &nbsp;·&nbsp; EMAIL: {BUSINESS_DETAILS.email}
              </p>
            </div>
          </div>

          <div className="sm:text-right flex flex-col sm:items-end">
            <span className="inline-block bg-black text-white text-[10px] font-mono font-bold tracking-[0.25em] px-3 py-1 uppercase mb-2">
              TAX INVOICE &amp; PACKING SLIP
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight mb-3 font-display">
              INVOICE
            </h1>
            <div className="border border-black bg-neutral-50 p-3 text-left w-full sm:w-64 space-y-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-600 font-medium">INVOICE NO:</span>
                <span className="font-bold text-black">{invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 font-medium">ORDER REF:</span>
                <span className="font-bold text-black">{orderRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 font-medium">DATE:</span>
                <span className="font-bold text-black">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 font-medium">NATURE:</span>
                <span className="font-bold text-black">RETAIL INVOICE</span>
              </div>
            </div>
          </div>
        </div>

        {/* High-Contrast Dispatch & Payment Strip */}
        <div className="my-6 border border-black bg-neutral-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider ${
                isCashOnDelivery
                  ? 'bg-white text-black border border-black'
                  : 'bg-black text-white'
              }`}
            >
              {isCashOnDelivery ? '★ Cash on Delivery' : '★ Prepaid Shipment'}
            </span>
            <span className="text-xs font-bold text-black font-mono">
              {isCashOnDelivery
                ? `COLLECT ₹${order.total.toFixed(2)} FROM CUSTOMER AT DELIVERY`
                : 'ZERO AMOUNT DUE — DO NOT COLLECT CASH AT DELIVERY'}
            </span>
          </div>
          <div className="text-right font-mono text-xs text-neutral-600">
            <span>DISPATCH STATUS: </span>
            <span className="font-bold text-black uppercase">
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Addresses & Fulfilment Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {/* Billed To / Shipped To Box */}
          <div className="border border-black">
            <div className="bg-black text-white px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider">
              BILLED TO / SHIPPED TO
            </div>
            <div className="p-4 space-y-1 text-xs text-neutral-800">
              <p className="font-bold text-sm text-black mb-1.5">{recipientName}</p>
              {address.street && <p>{address.street}</p>}
              {(address.city || address.state || address.zip) && (
                <p className="font-semibold text-black">
                  {[address.city, address.state].filter(Boolean).join(', ')}
                  {address.zip ? ` - ${address.zip}` : ''}
                </p>
              )}
              <p className="text-neutral-600">{address.country || 'India'}</p>
              {address.phone && (
                <p className="font-mono font-semibold text-black pt-1">Phone: {address.phone}</p>
              )}
              {orderEmail && <p className="font-mono text-neutral-700">Email: {orderEmail}</p>}
            </div>
          </div>

          {/* Payment & Fulfilment Specifications Box */}
          <div className="border border-black">
            <div className="bg-black text-white px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider">
              PAYMENT &amp; FULFILMENT SPECIFICATIONS
            </div>
            <div className="p-4 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-neutral-600">PAYMENT METHOD:</span>
                <span className="font-bold text-black capitalize">
                  {formatPaymentProvider(order.paymentProvider)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">PAYMENT STATUS:</span>
                <span className="font-bold text-black uppercase">{order.paymentStatus}</span>
              </div>
              {order.paymentGatewayPaymentId && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">TRANSACTION REF:</span>
                  <span className="font-bold text-black">{order.paymentGatewayPaymentId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-600">ORDER STATUS:</span>
                <span className="font-bold text-black uppercase">
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">FULFILMENT HUB:</span>
                <span className="font-bold text-black">Fregoro Studios Hub, Thiruvallur</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">DISPATCH SLA:</span>
                <span className="font-bold text-black">Within 24 – 48 Hours</span>
              </div>
              {(order.carrier || order.trackingNumber) && (
                <div className="flex justify-between pt-1 border-t border-neutral-200">
                  <span className="text-neutral-600">COURIER / AWB:</span>
                  <span className="font-bold text-black">
                    {order.carrier || 'Assigned'}{' '}
                    {order.trackingNumber ? `· AWB ${order.trackingNumber}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="border border-black overflow-x-auto mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white font-mono text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 w-10">#</th>
                <th className="py-2.5 px-3">Item Description &amp; Specifications</th>
                <th className="py-2.5 px-3 text-center w-16">Qty</th>
                <th className="py-2.5 px-3 text-right w-28">Unit Price</th>
                <th className="py-2.5 px-3 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/20 text-xs">
              {order.items.map((item, index) => {
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
                            art &&
                            typeof art === 'object' &&
                            typeof (art as Record<string, unknown>).side === 'string'
                              ? ((art as Record<string, unknown>).side as string)
                              : null,
                          )
                          .filter((side): side is string => Boolean(side)),
                      ),
                    )
                  : [];

                return (
                  <tr key={item.id} className={index % 2 === 1 ? 'bg-neutral-50/70' : 'bg-white'}>
                    <td className="py-3 px-3 font-mono text-neutral-500 font-medium">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-black text-sm">
                        {item.productNameSnapshot || `Product #${item.productId}`}
                      </p>
                      <p className="text-[11px] text-neutral-600 font-mono mt-0.5">
                        SKU/Variant: {item.variantId}
                        {item.size && ` · Size: ${item.size}`}
                      </p>
                      {typeof customization.magazineTitle === 'string' && (
                        <p className="text-[11px] text-neutral-700 mt-1">
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
                        <p className="text-[11px] text-neutral-700 mt-1 font-mono">
                          Artwork Sides:{' '}
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
                          className="inline-block text-[11px] font-mono font-bold text-black underline underline-offset-2 mt-1"
                        >
                          Download Print-Ready PDF ↗
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center text-black font-mono font-bold">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-3 text-right text-black font-mono">
                      ₹{itemPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-black font-mono">
                      ₹{(itemPrice * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals & Amount in Words Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {/* Amount in words */}
          <div className="border border-black p-4 flex flex-col justify-between">
            <div>
              <span className="inline-block bg-black text-white text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 mb-2">
                AMOUNT IN WORDS
              </span>
              <p className="font-mono font-bold text-sm text-black">
                {numberToWordsINR(order.total)}
              </p>
            </div>
            <p className="text-[11px] text-neutral-600 mt-4 leading-relaxed font-mono">
              {isCashOnDelivery
                ? 'The delivery agent will collect the exact total amount shown at doorstep. Please keep exact cash change ready.'
                : 'Payment recorded in full against order reference. No additional charges or doorstep payment are due upon delivery.'}
            </p>
          </div>

          {/* Calculation breakdown */}
          <div className="border border-black">
            <div className="p-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-neutral-700">
                <span>ITEM SUBTOTAL:</span>
                <span className="font-bold text-black">₹{subtotal.toFixed(2)}</span>
              </div>
              {order.discount && order.discount > 0 ? (
                <div className="flex justify-between text-neutral-700">
                  <span>DISCOUNT {order.couponCode ? `(${order.couponCode})` : ''}:</span>
                  <span className="font-bold text-black">-₹{order.discount.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-neutral-700">
                <span>SHIPPING &amp; PACKAGING:</span>
                <span className="font-bold text-black">
                  {order.shippingFee > 0 ? `₹${order.shippingFee.toFixed(2)}` : 'FREE'}
                </span>
              </div>
            </div>
            <div className="bg-black text-white p-4 flex justify-between items-center">
              <span className="font-mono font-bold text-sm tracking-wider uppercase">
                TOTAL AMOUNT:
              </span>
              <span className="font-mono font-extrabold text-xl">₹{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Customer Support Terms & Signatory */}
        <div className="border-t-2 border-black pt-6 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs font-mono">
          <div>
            <h4 className="font-bold text-black uppercase tracking-wider mb-2">
              CUSTOMER SUPPORT &amp; RETURNS
            </h4>
            <ul className="text-neutral-700 space-y-1 text-[11px] leading-relaxed">
              <li>1. Inspect parcel upon delivery; report courier damage within 24 hours.</li>
              <li>2. Bespoke and custom-printed goods are crafted exclusively to order.</li>
              <li>
                3. Support: Call / WhatsApp{' '}
                <span className="font-bold text-black">{BUSINESS_DETAILS.phone}</span> or Email{' '}
                <span className="font-bold text-black">{BUSINESS_DETAILS.email}</span>
              </li>
              <li>4. Retain this invoice and packing slip for warranty and replacement.</li>
            </ul>
          </div>

          <div className="sm:text-right flex flex-col sm:items-end justify-between">
            <div>
              <h4 className="font-bold text-black uppercase tracking-wider">
                FOR FREGORO STUDIOS
              </h4>
              <p className="text-[11px] text-neutral-600">Authorised Fulfilment Centre, Thiruvallur</p>
            </div>
            <div className="mt-6 pt-2 border-t border-black w-48 text-center sm:text-right">
              <p className="font-bold text-black text-xs font-display">Fregoro Studios Fulfilment</p>
              <p className="text-[9px] text-neutral-500 uppercase tracking-wider">
                Authorised Signatory · Computer Generated
              </p>
            </div>
          </div>
        </div>

        {/* Packing Slip Tear Strip (Bottom) */}
        <div className="mt-8 pt-4 border-t-2 border-dashed border-black/40 text-center font-mono text-[10px] text-neutral-600 space-y-1">
          <p className="font-bold text-black uppercase tracking-wider">
            PACKING SLIP · ATTACH SECURELY TO PARCEL OR INSERT IN SHIPMENT POUCH
          </p>
          <p>
            ORDER REF: {orderRef} &nbsp;·&nbsp; CUSTOMER: {recipientName} &nbsp;·&nbsp; PIN:{' '}
            {address.zip || 'India'} &nbsp;·&nbsp; THANK YOU FOR CHOOSING FREGORO STUDIOS
          </p>
        </div>
      </div>

      <AutoPrintTrigger enabled={shouldAutoPrint} />
    </div>
  );
}
