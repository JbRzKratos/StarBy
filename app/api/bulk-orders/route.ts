import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { dispatchNotification } from '@/lib/notifications';
import { sendBulkOrderSubmission } from '@/lib/email/emailService';
import type { BulkOrderFormState } from '@/lib/bulk-orders/types';

export const dynamic = 'force-dynamic';

function generateRequestNumber(): string {
  const random5 = Math.floor(10000 + Math.random() * 90000);
  return `FREGORO-BULK-${random5}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const orderType = searchParams.get('orderType');
    const search = searchParams.get('search')?.toLowerCase();
    const urgentOnly = searchParams.get('urgent') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Identify user
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    // Check if user is staff/admin
    let isStaff = false;
    let dbUser = null;
    if (authUser) {
      dbUser = await prisma.user.findUnique({ where: { id: authUser.id } });
      isStaff = dbUser?.role === 'ADMIN' || dbUser?.role === 'STAFF';
    }

    // Build filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (!isStaff) {
      // Normal customer: can only see their own requests
      if (!authUser) {
        return NextResponse.json({ success: true, requests: [] });
      }
      where.userId = authUser.id;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (orderType && orderType !== 'all') {
      where.orderType = orderType;
    }

    if (urgentOnly) {
      where.isUrgent = true;
    }

    if (search) {
      where.OR = [
        { requestNumber: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { eventName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const requests = await prisma.bulkOrderRequest.findMany({
      where,
      include: {
        items: true,
        artworks: true,
        quotes: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      requests,
      isStaff,
    });
  } catch (error) {
    console.error('Error fetching bulk orders:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve bulk requests' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: BulkOrderFormState = await request.json();

    // 1. Validation
    if (!body.contactName?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Contact name is required' },
        { status: 400 },
      );
    }

    if (!body.phone?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required for quote delivery' },
        { status: 400 },
      );
    }

    if (!body.email?.trim() || !body.email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'A valid email address is required' },
        { status: 400 },
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Please select at least one apparel item' },
        { status: 400 },
      );
    }

    // Validate quantities
    let grandTotalQuantity = 0;
    for (const item of body.items) {
      if (!item.apparelType?.trim()) {
        return NextResponse.json(
          { success: false, message: 'Invalid apparel selection' },
          { status: 400 },
        );
      }

      // Check size-color matrix
      let itemTotal = 0;
      if (Array.isArray(item.sizeColorMatrix) && item.sizeColorMatrix.length > 0) {
        for (const row of item.sizeColorMatrix) {
          const rowSum = Object.values(row.quantities || {}).reduce(
            (sum, q) => sum + (typeof q === 'number' && q > 0 ? q : 0),
            0,
          );
          itemTotal += rowSum;
        }
      }

      // Fallback if matrix sum is zero but manual total was entered
      if (itemTotal === 0 && item.totalQuantity > 0) {
        itemTotal = item.totalQuantity;
      }

      if (itemTotal <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: `Please specify quantities for "${item.apparelType}". Total cannot be 0.`,
          },
          { status: 400 },
        );
      }

      item.totalQuantity = itemTotal;
      grandTotalQuantity += itemTotal;
    }

    if (grandTotalQuantity <= 0) {
      return NextResponse.json(
        { success: false, message: 'Total order quantity must be greater than zero' },
        { status: 400 },
      );
    }

    // Optional user session
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    // Generate unique request number
    let requestNumber = generateRequestNumber();
    let collision = await prisma.bulkOrderRequest.findUnique({
      where: { requestNumber },
    });
    while (collision) {
      requestNumber = generateRequestNumber();
      collision = await prisma.bulkOrderRequest.findUnique({
        where: { requestNumber },
      });
    }

    // 2. Create in database transaction
    const newRequest = await prisma.$transaction(async (tx) => {
      const created = await tx.bulkOrderRequest.create({
        data: {
          requestNumber,
          userId: authUser?.id || null,
          orderType: body.orderType || 'Corporate',
          eventName: body.eventName?.trim() || null,
          companyName: body.companyName?.trim() || null,
          contactName: body.contactName.trim(),
          phone: body.phone.trim(),
          email: body.email.trim(),
          estimatedQuantity: body.estimatedQuantity || grandTotalQuantity,
          totalQuantity: grandTotalQuantity,
          requiredDeliveryDate: body.requiredDeliveryDate
            ? new Date(body.requiredDeliveryDate)
            : null,
          eventDate: body.eventDate ? new Date(body.eventDate) : null,
          isUrgent: Boolean(body.isUrgent),
          websiteOrSocial: body.websiteOrSocial?.trim() || null,
          budgetRange: body.budgetRange || null,
          contactPreference: body.contactPreference || 'whatsapp',
          customerNotes: body.customerNotes?.trim() || null,
          shippingMethod: body.shippingMethod || 'delivery',
          shippingAddress: body.deliveryAddress
            ? JSON.parse(JSON.stringify(body.deliveryAddress))
            : null,
          packagingPreference: body.packagingOption || 'individual',
          packagingNotes: body.packagingNotes?.trim() || null,
          customLabelOption: body.brandingOption || 'none',
          customLabelNotes: body.brandingNotes?.trim() || null,
          status: 'new',
          statusHistory: {
            create: {
              oldStatus: null,
              newStatus: 'new',
              changedBy: 'customer',
              note: 'Initial quote request submitted by customer',
            },
          },
        },
      });

      // Create items
      for (const item of body.items) {
        await tx.bulkOrderItem.create({
          data: {
            requestId: created.id,
            apparelType: item.apparelType,
            productId: item.productId || null,
            fabric: item.fabric || null,
            gsm: item.gsm || null,
            printingMethod: item.printingMethod || body.printingMethodPreference || 'Not Sure',
            printingPlacements: item.printingPlacements || ['front'],
            designNotes: item.designNotes?.trim() || body.generalDesignNotes?.trim() || null,
            totalQuantity: item.totalQuantity,
            sizeColorMatrix: JSON.parse(JSON.stringify(item.sizeColorMatrix || [])),
          },
        });
      }

      // Create artworks
      if (Array.isArray(body.artworks) && body.artworks.length > 0) {
        for (const art of body.artworks) {
          if (art.fileUrl) {
            await tx.bulkOrderArtwork.create({
              data: {
                requestId: created.id,
                placement: art.placement || 'front',
                label: art.label || null,
                fileUrl: art.fileUrl,
                fileKey: art.fileKey || null,
                fileName: art.fileName || 'artwork.png',
                fileType: art.fileType || 'image/png',
                fileSize: art.fileSize || null,
                printSize: art.printSize || 'Standard',
                dimensionsMm: art.dimensionsMm || null,
                notes: art.notes?.trim() || null,
                status: 'received',
              },
            });
          }
        }
      }

      return created;
    });

    // 3. Dispatch bulk order transactional emails (Admin + Customer)
    let emailStatus = { adminSent: false, customerSent: false };
    try {
      const emailResult = await sendBulkOrderSubmission({
        id: newRequest.id,
        requestNumber: newRequest.requestNumber,
        orderType: newRequest.orderType,
        companyName: newRequest.companyName,
        eventName: newRequest.eventName,
        contactName: newRequest.contactName,
        phone: newRequest.phone,
        email: newRequest.email,
        totalQuantity: grandTotalQuantity,
        requiredDeliveryDate: newRequest.requiredDeliveryDate,
        eventDate: newRequest.eventDate,
        isUrgent: newRequest.isUrgent,
        customerNotes: newRequest.customerNotes,
        shippingMethod: newRequest.shippingMethod,
        shippingAddress: body.deliveryAddress
          ? JSON.parse(JSON.stringify(body.deliveryAddress))
          : null,
        packagingPreference: newRequest.packagingPreference,
        packagingNotes: newRequest.packagingNotes,
        customLabelOption: newRequest.customLabelOption,
        customLabelNotes: newRequest.customLabelNotes,
        contactPreference: newRequest.contactPreference,
        createdAt: newRequest.createdAt,
        items: body.items,
        artworks: body.artworks,
      });
      emailStatus = {
        adminSent: emailResult.adminEmailSent,
        customerSent: emailResult.customerEmailSent,
      };
    } catch (emailErr) {
      console.error('[BulkOrder API] Email dispatch error (non-fatal):', emailErr);
    }

    // 4. Dispatch multi-channel notification (non-blocking)
    try {
      await dispatchNotification('BULK_ORDER_REQUESTED', {
        orderId: newRequest.id,
        publicOrderId: newRequest.requestNumber,
        customerName: newRequest.contactName,
        customerEmail: newRequest.email,
        customerPhone: newRequest.phone,
        totalQuantity: grandTotalQuantity,
        orderType: newRequest.orderType,
        companyName: newRequest.companyName || undefined,
        createdAt: newRequest.createdAt.toISOString(),
      });
    } catch (notifErr) {
      console.warn('Bulk notification dispatch error (non-fatal):', notifErr);
    }

    return NextResponse.json({
      success: true,
      requestId: newRequest.id,
      requestNumber: newRequest.requestNumber,
      message: 'Quote request submitted successfully',
      emailStatus,
    });
  } catch (error) {
    console.error('Error submitting bulk order request:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit quote request. Please try again.' },
      { status: 500 },
    );
  }
}
