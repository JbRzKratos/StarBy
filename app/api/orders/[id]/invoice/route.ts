import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInvoicePdf } from '@/lib/invoice';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
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

    const { searchParams } = new URL(_request.url);
    const searchEmail = (searchParams.get('email') || '').toLowerCase().trim();
    const address = (order.shippingAddress as Record<string, string | undefined>) || {};
    const orderEmail = (address.email || order.user?.email || '').toLowerCase().trim();
    const isEmailVerifiedLink = Boolean(searchEmail && orderEmail && searchEmail === orderEmail);

    // Auth check: Must be admin, owner of the order, or have verified email link
    const isOwner = Boolean(user?.id && user.id === order.userId);
    const { isSuperAdminEmail } = await import('@/app/admin/lib/auth');
    let isAdmin = isSuperAdminEmail(user?.email);

    if (!isAdmin && user?.id) {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      isAdmin = dbUser?.role === 'ADMIN' || dbUser?.role === 'STAFF';
    }

    if (!isOwner && !isAdmin && !isEmailVerifiedLink) {
      return new NextResponse('Unauthorized: Please log in or provide verified email link', {
        status: 401,
      });
    }

    const pdfBuffer = await generateInvoicePdf(order);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.publicOrderId || order.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
