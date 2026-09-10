import { NextResponse } from 'next/server';
import { requireStaff } from '@/app/admin/lib/auth';
import { listR2Objects, getR2ObjectBuffer } from '@/lib/r2';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import AdmZip from 'adm-zip';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await requireStaff();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target');

    const zip = new AdmZip();
    let fileCount = 0;

    if (target === 'supabase') {
      const items = await prisma.orderItem.findMany({
        where: { customization: { not: Prisma.AnyNull } },
        include: { order: { select: { publicOrderId: true } } },
      });

      for (const item of items) {
        if (item.customization && typeof item.customization === 'object') {
          const custom = item.customization as any;
          const orderId = item.order.publicOrderId || item.orderId;
          const prefix = `${orderId}-${item.id}`;

          const addBase64ToZip = (url: string | undefined, suffix: string) => {
            if (url && typeof url === 'string' && url.startsWith('data:image')) {
              const matches = url.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
              if (matches && matches.length === 3) {
                const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                const data = matches[2] as string;
                zip.addFile(`${prefix}-${suffix}.${ext}`, Buffer.from(data, 'base64'));
                fileCount++;
              }
            }
          };

          addBase64ToZip(custom.designFileUrl, 'design');
          addBase64ToZip(custom.frontDesignFileUrl, 'front-design');
          addBase64ToZip(custom.backDesignFileUrl, 'back-design');
        }
      }
    } else {
      // Default to R2
      const objects = await listR2Objects('designs/checkout/');
      for (const obj of objects) {
        if (obj.Key) {
          const buffer = await getR2ObjectBuffer(obj.Key);
          if (buffer) {
            const filename = obj.Key.split('/').pop() || 'unknown_file';
            zip.addFile(filename, buffer);
            fileCount++;
          }
        }
      }
    }

    if (fileCount === 0) {
      return NextResponse.json({ message: 'No files to download' }, { status: 404 });
    }

    const zipBuffer = zip.toBuffer();

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="starby_${target || 'r2'}_backup.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading storage:', error);
    return NextResponse.json({ error: 'Failed to download storage' }, { status: 500 });
  }
}
