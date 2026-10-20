import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStaffUser } from '@/app/admin/lib/auth';
import { sendContactSubmission } from '@/lib/email/emailService';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const staff = await getStaffUser();
    if (!staff) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

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

    const bothSent = emailResult.adminEmailSent && emailResult.customerEmailSent;
    const anySent = emailResult.adminEmailSent || emailResult.customerEmailSent;

    await prisma.contactSubmission.update({
      where: { id: submission.id },
      data: {
        emailStatus: bothSent ? 'sent' : anySent ? 'partial' : 'failed',
        emailError: emailResult.errors.length > 0 ? emailResult.errors.join('; ') : null,
      },
    });

    return NextResponse.json({
      success: anySent,
      adminEmailSent: emailResult.adminEmailSent,
      customerEmailSent: emailResult.customerEmailSent,
      errors: emailResult.errors,
      message: bothSent
        ? 'Enquiry email resent successfully'
        : anySent
          ? 'Enquiry email partially resent — check the delivery log'
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
