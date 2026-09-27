import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/app/admin/lib/auth';
import { sendBulkOrderSubmission } from '@/lib/email/emailService';
import type { SizeColorMatrixRow } from '@/lib/bulk-orders/types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    await requireStaff();

    const bulkOrder = await prisma.bulkOrderRequest.findFirst({
      where: {
        OR: [{ id: params.id }, { requestNumber: params.id }],
      },
      include: {
        items: true,
        artworks: true,
      },
    });

    if (!bulkOrder) {
      return NextResponse.json(
        { success: false, message: 'Bulk order request not found' },
        { status: 404 },
      );
    }

    // Resend the notification emails
    const result = await sendBulkOrderSubmission({
      id: bulkOrder.id,
      requestNumber: bulkOrder.requestNumber,
      orderType: bulkOrder.orderType,
      companyName: bulkOrder.companyName,
      eventName: bulkOrder.eventName,
      contactName: bulkOrder.contactName,
      phone: bulkOrder.phone,
      email: bulkOrder.email,
      totalQuantity: bulkOrder.totalQuantity,
      requiredDeliveryDate: bulkOrder.requiredDeliveryDate,
      eventDate: bulkOrder.eventDate,
      isUrgent: bulkOrder.isUrgent,
      customerNotes: bulkOrder.customerNotes,
      shippingMethod: bulkOrder.shippingMethod,
      shippingAddress:
        bulkOrder.shippingAddress && typeof bulkOrder.shippingAddress === 'object'
          ? (bulkOrder.shippingAddress as Record<string, unknown>)
          : null,
      packagingPreference: bulkOrder.packagingPreference,
      packagingNotes: bulkOrder.packagingNotes,
      customLabelOption: bulkOrder.customLabelOption,
      customLabelNotes: bulkOrder.customLabelNotes,
      contactPreference: bulkOrder.contactPreference,
      createdAt: bulkOrder.createdAt,
      items: bulkOrder.items.map((i) => ({
        apparelType: i.apparelType,
        totalQuantity: i.totalQuantity,
        fabric: i.fabric || undefined,
        gsm: i.gsm || undefined,
        printingMethod: i.printingMethod || undefined,
        printingPlacements: i.printingPlacements || [],
        designNotes: i.designNotes || undefined,
        sizeColorMatrix: Array.isArray(i.sizeColorMatrix)
          ? (i.sizeColorMatrix as unknown as SizeColorMatrixRow[])
          : [],
      })),
      artworks: bulkOrder.artworks.map((a) => ({
        placement: a.placement,
        label: a.label || undefined,
        fileUrl: a.fileUrl,
        fileName: a.fileName,
        fileType: a.fileType,
        fileSize: a.fileSize || undefined,
        printSize: a.printSize || undefined,
        dimensionsMm: a.dimensionsMm || undefined,
      })),
    });

    return NextResponse.json({
      success: result.success,
      adminEmailSent: result.adminEmailSent,
      customerEmailSent: result.customerEmailSent,
      errors: result.errors,
      message: result.success
        ? 'Email notification resent successfully'
        : 'Failed to resend email notification',
    });
  } catch (error) {
    console.error('[Admin Bulk Order Retry Email] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while retrying email' },
      { status: 500 },
    );
  }
}
