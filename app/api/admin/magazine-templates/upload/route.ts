import { NextResponse } from 'next/server';
import { uploadBufferToR2, getR2PublicUrl } from '@/lib/r2';
import { getAdminUser } from '@/app/admin/lib/auth';

export const dynamic = 'force-dynamic';

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

export async function POST(req: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PNG, JPG, WEBP, GIF or SVG image.' },
        { status: 415 },
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'File is too large. Maximum size is 15 MB.' },
        { status: 413 },
      );
    }

    const extension =
      file.type === 'image/jpeg'
        ? 'jpg'
        : file.type === 'image/svg+xml'
          ? 'svg'
          : (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');

    const buffer = Buffer.from(await file.arrayBuffer());
    const { objectKey } = await uploadBufferToR2(
      buffer,
      `magazine-bg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`,
      file.type,
    );

    return NextResponse.json({ url: getR2PublicUrl(objectKey) });
  } catch (error) {
    console.error('[Magazine Upload] Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
