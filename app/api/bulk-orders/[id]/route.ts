import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    let isStaff = false;
    if (authUser) {
      const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } });
      isStaff = dbUser?.role === 'ADMIN' || dbUser?.role === 'STAFF';
    }

    const bulkRequest = await prisma.bulkOrderRequest.findFirst({
      where: {
        OR: [{ id }, { requestNumber: id }],
      },
      include: {
        items: true,
        artworks: true,
        quotes: {
          orderBy: { version: 'desc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!bulkRequest) {
      return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 });
    }

    // Access control: if request belongs to a user, non-staff users must match userId
    if (!isStaff && bulkRequest.userId && authUser && bulkRequest.userId !== authUser.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      request: bulkRequest,
      isStaff,
    });
  } catch (error) {
    console.error('Error fetching bulk request detail:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve bulk order details' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    let isStaff = false;
    let actorName = 'Customer';
    if (authUser) {
      const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } });
      isStaff = dbUser?.role === 'ADMIN' || dbUser?.role === 'STAFF';
      actorName = dbUser?.fullName || (isStaff ? 'Admin' : 'Customer');
    }

    const existing = await prisma.bulkOrderRequest.findFirst({
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

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 });
    }

    // 1. Customer Accepting Quote
    if (body.action === 'accept_quote') {
      const latestQuote = existing.quotes[0];
      if (!latestQuote) {
        return NextResponse.json(
          { success: false, message: 'No quote found to accept' },
          { status: 400 },
        );
      }

      await prisma.$transaction(async (tx) => {
        // Mark quote accepted
        await tx.bulkOrderQuote.update({
          where: { id: latestQuote.id },
          data: {
            status: 'accepted',
            acceptedAt: new Date(),
          },
        });

        // Update request status to approved / payment_pending
        await tx.bulkOrderRequest.update({
          where: { id: existing.id },
          data: {
            status: 'approved',
          },
        });

        // Record history
        await tx.bulkOrderStatusHistory.create({
          data: {
            requestId: existing.id,
            oldStatus: existing.status,
            newStatus: 'approved',
            changedBy: actorName,
            note: `Customer accepted Quote v${latestQuote.version} (Total: ₹${latestQuote.total.toLocaleString('en-IN')})`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: 'Quote accepted successfully! You can now proceed to payment.',
      });
    }

    // 2. Customer Requesting Changes
    if (body.action === 'request_changes') {
      const changeNotes = body.notes?.trim() || 'Customer requested revisions to the quote.';

      await prisma.$transaction(async (tx) => {
        await tx.bulkOrderRequest.update({
          where: { id: existing.id },
          data: {
            status: 'under_review',
          },
        });

        await tx.bulkOrderStatusHistory.create({
          data: {
            requestId: existing.id,
            oldStatus: existing.status,
            newStatus: 'under_review',
            changedBy: actorName,
            note: `Revision requested: ${changeNotes}`,
          },
        });

        await tx.bulkOrderMessage.create({
          data: {
            requestId: existing.id,
            sender: 'customer',
            senderName: actorName,
            message: `Revision request on quote: ${changeNotes}`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: 'Revision request submitted. Our team will review and update your quote.',
      });
    }

    // 3. Admin Status Update
    if (isStaff && body.status && body.status !== existing.status) {
      await prisma.$transaction(async (tx) => {
        await tx.bulkOrderRequest.update({
          where: { id: existing.id },
          data: {
            status: body.status,
            adminNotes: body.adminNotes !== undefined ? body.adminNotes : existing.adminNotes,
          },
        });

        await tx.bulkOrderStatusHistory.create({
          data: {
            requestId: existing.id,
            oldStatus: existing.status,
            newStatus: body.status,
            changedBy: actorName,
            note: body.note || `Status changed from ${existing.status} to ${body.status}`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: `Status updated to ${body.status}`,
      });
    }

    // 4. Admin Artwork Status Update
    if (isStaff && body.artworkId && body.artworkStatus) {
      await prisma.bulkOrderArtwork.update({
        where: { id: body.artworkId },
        data: {
          status: body.artworkStatus,
          adminNotes: body.artworkNotes !== undefined ? body.artworkNotes : undefined,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Artwork marked as ${body.artworkStatus}`,
      });
    }

    // 5. Admin Note Update
    if (isStaff && body.adminNotes !== undefined) {
      await prisma.bulkOrderRequest.update({
        where: { id: existing.id },
        data: { adminNotes: body.adminNotes },
      });

      return NextResponse.json({
        success: true,
        message: 'Internal notes saved',
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action or insufficient permissions' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Error updating bulk order request:', error);
    return NextResponse.json(
      { success: false, message: 'Internal error updating request' },
      { status: 500 },
    );
  }
}
