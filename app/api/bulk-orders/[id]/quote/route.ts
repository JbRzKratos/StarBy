import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    // Verify staff RBAC
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } });
    if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'STAFF')) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const bulkRequest = await prisma.bulkOrderRequest.findFirst({
      where: {
        OR: [{ id }, { requestNumber: id }],
      },
      include: {
        quotes: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!bulkRequest) {
      return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 });
    }

    const garmentPrice = Math.max(0, parseFloat(body.garmentPrice) || 0);
    const printingPrice = Math.max(0, parseFloat(body.printingPrice) || 0);
    const setupFee = Math.max(0, parseFloat(body.setupFee) || 0);
    const packagingFee = Math.max(0, parseFloat(body.packagingFee) || 0);
    const shippingFee = Math.max(0, parseFloat(body.shippingFee) || 0);
    const urgencyFee = Math.max(0, parseFloat(body.urgencyFee) || 0);
    const otherFees = Math.max(0, parseFloat(body.otherFees) || 0);
    const discount = Math.max(0, parseFloat(body.discount) || 0);
    const tax = Math.max(0, parseFloat(body.tax) || 0);

    const subtotal =
      garmentPrice + printingPrice + setupFee + packagingFee + otherFees + urgencyFee;
    const total = Math.max(0, subtotal - discount + shippingFee + tax);

    const latestVersion = bulkRequest.quotes[0]?.version || 0;
    const newVersion = latestVersion + 1;

    const expiresDays = parseInt(body.expiresDays || '14', 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresDays);

    const newQuote = await prisma.$transaction(async (tx) => {
      // Mark any prior active quote as superseded
      if (bulkRequest.quotes.length > 0) {
        await tx.bulkOrderQuote.updateMany({
          where: {
            requestId: bulkRequest.id,
            status: 'sent',
          },
          data: { status: 'superseded' },
        });
      }

      // Create new quote version
      const quote = await tx.bulkOrderQuote.create({
        data: {
          requestId: bulkRequest.id,
          version: newVersion,
          status: 'sent',
          garmentPrice,
          printingPrice,
          setupFee,
          packagingFee,
          shippingFee,
          urgencyFee,
          otherFees,
          subtotal,
          discount,
          tax,
          total,
          currency: 'INR',
          notes: body.notes?.trim() || null,
          lineItems: body.lineItems ? JSON.parse(JSON.stringify(body.lineItems)) : null,
          expiresAt,
        },
      });

      // Update request status to quote_sent
      await tx.bulkOrderRequest.update({
        where: { id: bulkRequest.id },
        data: { status: 'quote_sent' },
      });

      // Status history
      await tx.bulkOrderStatusHistory.create({
        data: {
          requestId: bulkRequest.id,
          oldStatus: bulkRequest.status,
          newStatus: 'quote_sent',
          changedBy: dbUser.fullName || 'Admin',
          note: `Quote v${newVersion} generated for ₹${total.toLocaleString('en-IN')} (Expires in ${expiresDays} days)`,
        },
      });

      return quote;
    });

    return NextResponse.json({
      success: true,
      quote: newQuote,
      message: `Quote v${newVersion} created and published successfully`,
    });
  } catch (error) {
    console.error('Error generating quote:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate quote' },
      { status: 500 },
    );
  }
}
