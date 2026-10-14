import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getR2StorageUsage } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function GET() {
  const R2_MAX_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB (Cloudflare R2 free tier allowance)
  const SUPABASE_MAX_BYTES = 500 * 1024 * 1024; // 500 MB (Supabase free tier DB allowance)

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdminEmail =
      user.email === 'fregorostudios@gmail.com' ||
      user.email === 'admin@fregorostudios.com' ||
      user.email === 'gokul@fregorostudios.com';

    let dbUser = await prisma.user.findUnique({ where: { id: user.id } });

    if (isSuperAdminEmail) {
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            id: user.id,
            email: user.email || 'fregorostudios@gmail.com',
            role: 'ADMIN',
            fullName: (user.user_metadata?.full_name as string) || 'Admin',
          },
        });
      } else if (dbUser.role !== 'ADMIN') {
        dbUser = await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN' },
        });
      }
    }

    if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Calculate Real Cloudflare R2 Storage (all files and assets)
    let r2Usage = { totalBytes: 0, fileCount: 0 };
    try {
      r2Usage = await getR2StorageUsage();
    } catch (r2Err) {
      console.warn('Could not calculate R2 usage, using fallback 0:', r2Err);
    }

    // 2. Calculate Real Supabase PostgreSQL Database Size in bytes
    let supabaseBytes = 0;
    try {
      const dbSizeRes = await prisma.$queryRawUnsafe<Array<{ size: bigint | number }>>(
        'SELECT pg_database_size(current_database()) as size;',
      );
      if (dbSizeRes && dbSizeRes[0] && dbSizeRes[0].size) {
        supabaseBytes = Number(dbSizeRes[0].size);
      }
    } catch (dbErr) {
      console.warn('Error querying pg_database_size:', dbErr);
    }

    // If pg_database_size was 0, fallback to basic size estimate
    if (supabaseBytes === 0) {
      try {
        const [orderCount, productCount, userCount] = await Promise.all([
          prisma.order.count(),
          prisma.product.count(),
          prisma.user.count(),
        ]);
        supabaseBytes = Math.max(
          1024 * 1024,
          orderCount * 4096 + productCount * 8192 + userCount * 2048,
        );
      } catch (countErr) {
        console.warn('Error estimating DB size from counts:', countErr);
        supabaseBytes = 1024 * 1024;
      }
    }

    const r2Percentage = Math.min(
      100,
      Math.max(0.1, Number(((r2Usage.totalBytes / R2_MAX_BYTES) * 100).toFixed(2))),
    );
    const supabasePercentage = Math.min(
      100,
      Math.max(0.1, Number(((supabaseBytes / SUPABASE_MAX_BYTES) * 100).toFixed(2))),
    );

    return NextResponse.json({
      r2: {
        usedBytes: r2Usage.totalBytes,
        totalBytes: R2_MAX_BYTES,
        percentage: r2Percentage,
        fileCount: r2Usage.fileCount,
      },
      supabase: {
        usedBytes: supabaseBytes,
        totalBytes: SUPABASE_MAX_BYTES,
        percentage: supabasePercentage,
      },
    });
  } catch (error) {
    console.error('Error calculating storage stats:', error);
    // Never fail with 500 when calculating dashboard stats — return safe fallback numbers
    return NextResponse.json({
      r2: {
        usedBytes: 0,
        totalBytes: R2_MAX_BYTES,
        percentage: 0.1,
        fileCount: 0,
      },
      supabase: {
        usedBytes: 1024 * 1024,
        totalBytes: SUPABASE_MAX_BYTES,
        percentage: 0.2,
      },
    });
  }
}
