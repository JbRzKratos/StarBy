import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canMutateBulkOrder, resolveBulkOrderActor } from '@/lib/bulk-orders/access';

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

    const actor = await resolveBulkOrderActor();
    const { isStaff } = actor;
    const senderName = actor.authUser
      ? actor.actorName
      : 'Customer';

    const bulkRequest = await prisma.bulkOrderRequest.findFirst({
      where: {
        OR: [{ id }, { requestNumber: id }],
      },
    });

    if (!bulkRequest) {
      return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 });
    }

    if (!canMutateBulkOrder(bulkRequest, actor, id)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const sender = isStaff ? 'admin' : 'customer';
    const wantsNeedMoreInfo = Boolean(
      body.setStatusNeedMoreInfo ?? body.markNeedMoreInfo,
    );

    const newMessage = await prisma.$transaction(async (tx) => {
      const msg = await tx.bulkOrderMessage.create({
        data: {
          requestId: bulkRequest.id,
          sender,
          senderName,
          message,
        },
      });

      // If admin asked for more info, optionally set status to need_more_info
      if (isStaff && wantsNeedMoreInfo) {
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
