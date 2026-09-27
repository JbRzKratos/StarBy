import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/app/admin/lib/auth';
import { sendContactSubmission } from '@/lib/email/emailService';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    await requireStaff();

    const submission = await prisma.contactSubmission.findUnique({
      where: { id: params.id },
    });

    if (!submission) {
      return NextResponse.json(
        { success: false, message: 'Contact enquiry not found' },
        { status: 404 },
      );
    }

    const emailResult = await sendContactSubmission({
      id: submission.id,
      name: submission.name,
      email: submission.email,
      phone: submission.phone || undefined,
      company: submission.company || undefined,
      subject: submission.subject,
      message: submission.message,
      createdAt: submission.createdAt,
    });

    await prisma.contactSubmission.update({
      where: { id: submission.id },
      data: {
        emailStatus: emailResult.success
          ? 'sent'
          : emailResult.adminEmailSent
            ? 'partial'
            : 'failed',
        emailError: emailResult.errors.length > 0 ? emailResult.errors.join('; ') : null,
      },
    });

    return NextResponse.json({
      success: emailResult.success,
      adminEmailSent: emailResult.adminEmailSent,
      customerEmailSent: emailResult.customerEmailSent,
      errors: emailResult.errors,
      message: emailResult.success
        ? 'Enquiry email resent successfully'
        : 'Failed to resend enquiry email',
    });
  } catch (error) {
    console.error('[Admin Contact Retry Email] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while retrying email' },
      { status: 500 },
    );
  }
}
