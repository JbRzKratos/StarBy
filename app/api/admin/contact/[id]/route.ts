import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/app/admin/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

const VALID_STATUSES = ['new', 'read', 'replied', 'closed'] as const;
type ContactStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireStaff();

    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status as ContactStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        },
        { status: 400 },
      );
    }

    const updated = await prisma.contactSubmission.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      submission: updated,
      message: `Enquiry status updated to ${status}`,
    });
  } catch (error) {
    console.error('[Admin Contact API PATCH] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update contact enquiry status' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await requireStaff();

    await prisma.contactSubmission.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Enquiry deleted successfully',
    });
  } catch (error) {
    console.error('[Admin Contact API DELETE] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete contact enquiry' },
      { status: 500 },
    );
  }
}
