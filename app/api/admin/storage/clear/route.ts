import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireStaff } from '@/app/admin/lib/auth';
import { listR2Objects, deleteR2Objects } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function DELETE() {
  try {
    const user = await requireStaff();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Only admins can clear storage.' }, { status: 401 });
    }

    // Clear R2 bucket contents
    const objects = await listR2Objects('designs/checkout/');
    const keys = objects.map(o => o.Key).filter(Boolean) as string[];
    await deleteR2Objects(keys);

    return NextResponse.json({ success: true, message: `Cleared R2 storage.` });
  } catch (error) {
    console.error('Error clearing storage:', error);
    return NextResponse.json({ error: 'Failed to clear storage' }, { status: 500 });
  }
}
