import { NextResponse } from 'next/server';
import { uploadBufferToR2, getR2PublicUrl } from '@/lib/r2';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Upload to R2
    const { objectKey } = await uploadBufferToR2(
      buffer,
      `magazine-bg-${Date.now()}-${file.name}`,
      file.type,
    );

    const publicUrl = getR2PublicUrl(objectKey);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
