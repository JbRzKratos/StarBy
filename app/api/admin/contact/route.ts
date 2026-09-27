import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/app/admin/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireStaff();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (status && ['new', 'read', 'replied', 'closed'].includes(status)) {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const submissions = await prisma.contactSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, submissions });
  } catch (error) {
    console.error('[Admin Contact API GET] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch contact submissions' },
      { status: 500 },
    );
  }
}
