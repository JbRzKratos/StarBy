import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateShippingLabelPdf } from '@/lib/shipping-label';
import { createClient } from '@/lib/supabase/server';
import { verifyInvoiceToken } from '@/lib/invoice-token';

/**
 * Download / print the courier shipping label for an order.
 *
 * Auth mirrors the tax-invoice route: an admin/staff session, the customer who
 * owns the order, or a signed invoice e-mail link. Admin panel buttons simply
 * link here with the active session.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: params.id }, { publicOrderId: params.id }],
      },
      include: {
        user: true,
        items: true,
      },
    });

    if (!order) {
      return new NextResponse('Order not found', { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const searchEmail = (searchParams.get('email') || '').toLowerCase().trim();
    const token = searchParams.get('token');
    const address = (order.shippingAddress as Record<string, string | undefined>) || {};
    const orderEmail = (address.email || order.user?.email || '').toLowerCase().trim();
    const isEmailVerifiedLink = Boolean(
      searchEmail &&
        orderEmail &&
        searchEmail === orderEmail &&
        verifyInvoiceToken(params.id, searchEmail, token),
    );

    const isOwner = Boolean(user?.id && user.id === order.userId);
    const { isSuperAdminEmail } = await import('@/app/admin/lib/auth');
    let isAdmin = isSuperAdminEmail(user?.email);

    if (!isAdmin && user?.id) {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      isAdmin = dbUser?.role === 'STAFF';
    }

    if (!isOwner && !isAdmin && !isEmailVerifiedLink) {
      return new NextResponse('Unauthorized: Please log in or provide a verified link', {
        status: 401,
      });
    }

    const pdfBuffer = await generateShippingLabelPdf(order);
    const orderRef = order.publicOrderId || order.id;
    const disposition = searchParams.get('print') === '1' ? 'inline' : 'attachment';

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="shipping-label-${orderRef}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Shipping label generation error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
