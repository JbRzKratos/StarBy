import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCashfreeOrder, getCashfreeEnvironment } from '@/lib/cashfree';

export const dynamic = 'force-dynamic';

function getSiteUrl(request: Request): string {
  const host = request.headers.get('host') || 'localhost:3000';
  const proto =
    request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const bulkRequest = await prisma.bulkOrderRequest.findFirst({
      where: {
        OR: [{ id }, { requestNumber: id }],
      },
      include: {
        quotes: {
          where: { status: 'accepted' },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!bulkRequest) {
      return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 });
    }

    const acceptedQuote = bulkRequest.quotes[0];
    if (!acceptedQuote) {
      return NextResponse.json(
        {
          success: false,
          message: 'An approved quote is required before payment can be initiated.',
        },
        { status: 400 },
      );
    }

    if (acceptedQuote.total <= 0) {
      return NextResponse.json(
        { success: false, message: 'Quote total must be greater than zero' },
        { status: 400 },
      );
    }

    // Clean phone number
    const rawPhone = bulkRequest.phone.replace(/[^0-9]/g, '');
    let cleanPhone = '9999999999';
    if (rawPhone.length === 10) {
      cleanPhone = rawPhone;
    } else if (rawPhone.length === 12 && rawPhone.startsWith('91')) {
      cleanPhone = rawPhone.slice(2);
    } else if (rawPhone.length >= 10) {
      cleanPhone = rawPhone.slice(-10);
    }

    const siteUrl = getSiteUrl(request);
    const cfEnvironment = getCashfreeEnvironment();
    const isLocal = siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1');

    // Unique payment gateway order ID
    const cfOrderId = `CF_BULK_${bulkRequest.requestNumber.replace(/[^A-Za-z0-9]/g, '')}_${Date.now()}`;

    let returnUrl = `${siteUrl}/bulk-orders/request/${bulkRequest.requestNumber}?order_id=${cfOrderId}&paid=true`;
    if (cfEnvironment === 'production' && returnUrl.startsWith('http://')) {
      if (isLocal) {
        returnUrl = `https://fregoro.vercel.app/bulk-orders/request/${bulkRequest.requestNumber}?order_id=${cfOrderId}&paid=true`;
      } else {
        returnUrl = returnUrl.replace(/^http:\/\//i, 'https://');
      }
    }

    const notifyUrl =
      !isLocal && siteUrl.startsWith('https://') ? `${siteUrl}/api/webhooks/cashfree` : undefined;

    // Create Cashfree order server-side with immutable quote price
    const cfOrder = await createCashfreeOrder({
      order_id: cfOrderId,
      order_amount: Math.round(acceptedQuote.total * 100) / 100,
      order_currency: 'INR',
      customer_details: {
        customer_id: bulkRequest.userId || `bulk_${cleanPhone}`,
        customer_name: bulkRequest.contactName,
        customer_email: bulkRequest.email,
        customer_phone: cleanPhone,
      },
      order_meta: {
        return_url: returnUrl,
        ...(notifyUrl ? { notify_url: notifyUrl } : {}),
      },
      order_note: `Fregoro Bulk Order ${bulkRequest.requestNumber} (Quote v${acceptedQuote.version})`,
    });

    // Save gateway order ID to quote
    await prisma.bulkOrderQuote.update({
      where: { id: acceptedQuote.id },
      data: {
        paymentGatewayOrderId: cfOrderId,
      },
    });

    await prisma.bulkOrderRequest.update({
      where: { id: bulkRequest.id },
      data: {
        status: 'payment_pending',
      },
    });

    return NextResponse.json({
      success: true,
      paymentSessionId: cfOrder.payment_session_id,
      cashfreeOrderId: cfOrderId,
      cashfreeEnvironment: cfEnvironment,
      amount: acceptedQuote.total,
    });
  } catch (error) {
    console.error('Error initiating bulk order checkout:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to initiate secure payment gateway' },
      { status: 500 },
    );
  }
}
