import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        { success: false, message: 'Message content is required' },
        { status: 400 },
      );
    }

    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    let isStaff = false;
    let senderName = 'Customer';
    if (authUser) {
      const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } });
      isStaff = dbUser?.role === 'ADMIN' || dbUser?.role === 'STAFF';
      senderName = dbUser?.fullName || (isStaff ? 'Fregoro Support' : 'Customer');
    }

    const bulkRequest = await prisma.bulkOrderRequest.findFirst({
      where: {
        OR: [{ id }, { requestNumber: id }],
      },
    });

    if (!bulkRequest) {
      return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 });
    }

    const sender = isStaff ? 'admin' : 'customer';

    const newMessage = await prisma.$transaction(async (tx) => {
      const msg = await tx.bulkOrderMessage.create({
        data: {
          requestId: bulkRequest.id,
          sender,
          senderName: body.senderName || senderName,
          message,
        },
      });

      // If admin asked for more info, optionally set status to need_more_info
      if (isStaff && body.setStatusNeedMoreInfo) {
        await tx.bulkOrderRequest.update({
          where: { id: bulkRequest.id },
          data: { status: 'need_more_info' },
        });

        await tx.bulkOrderStatusHistory.create({
          data: {
            requestId: bulkRequest.id,
            oldStatus: bulkRequest.status,
            newStatus: 'need_more_info',
            changedBy: senderName,
            note: `Information requested: ${message.substring(0, 100)}...`,
          },
        });
      } else if (!isStaff && bulkRequest.status === 'need_more_info') {
        // Customer responded, set back to under_review
        await tx.bulkOrderRequest.update({
          where: { id: bulkRequest.id },
          data: { status: 'under_review' },
        });

        await tx.bulkOrderStatusHistory.create({
          data: {
            requestId: bulkRequest.id,
            oldStatus: bulkRequest.status,
            newStatus: 'under_review',
            changedBy: senderName,
            note: 'Customer responded with requested details',
          },
        });
      }

      return msg;
    });

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error('Error posting message:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 },
    );
  }
}
