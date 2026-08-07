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

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        items: true,
      },
    });

    if (!order) {
      return new NextResponse('Order not found', { status: 404 });
    }

    // Auth check: Must be admin or the owner of the order
    const isOwner = user?.id === order.userId;
    let isAdmin = false;

    if (user) {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      isAdmin = dbUser?.role === 'ADMIN' || dbUser?.role === 'STAFF';
    }

    if (!isOwner && !isAdmin) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const pdfBuffer = await generateInvoicePdf(order);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
