import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireStaff } from '@/app/admin/lib/auth';
import { listR2Objects } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireStaff();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const objects = await listR2Objects('designs/checkout/');
    let r2Bytes = 0;
    
    for (const obj of objects) {
      if (obj.Size) {
        r2Bytes += obj.Size;
      }
    }

    const items = await prisma.orderItem.findMany({
      where: {
        customization: {
          not: Prisma.AnyNull,
        },
      },
      select: {
        customization: true,
      },
    });

    let supabaseBytes = 0;
    for (const item of items) {
      if (item.customization && typeof item.customization === 'object') {
        const custom = item.customization as any;
        if (typeof custom.designFileUrl === 'string' && custom.designFileUrl.startsWith('data:image')) supabaseBytes += custom.designFileUrl.length;
        if (typeof custom.frontDesignFileUrl === 'string' && custom.frontDesignFileUrl.startsWith('data:image')) supabaseBytes += custom.frontDesignFileUrl.length;
        if (typeof custom.backDesignFileUrl === 'string' && custom.backDesignFileUrl.startsWith('data:image')) supabaseBytes += custom.backDesignFileUrl.length;
      }
    }

    const R2_MAX_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB
    const SUPABASE_MAX_BYTES = 500 * 1024 * 1024; // 500 MB typical free tier

    return NextResponse.json({
      r2: {
        usedBytes: r2Bytes,
        totalBytes: R2_MAX_BYTES,
        percentage: r2Bytes > 0 ? (r2Bytes / R2_MAX_BYTES) * 100 : 0,
      },
      supabase: {
        usedBytes: supabaseBytes,
        totalBytes: SUPABASE_MAX_BYTES,
        percentage: supabaseBytes > 0 ? (supabaseBytes / SUPABASE_MAX_BYTES) * 100 : 0,
      }
    });
  } catch (error) {
    console.error('Error calculating storage stats:', error);
    return NextResponse.json({ error: 'Failed to calculate storage stats' }, { status: 500 });
  }
}
