import { NextResponse } from 'next/server';
import { uploadBufferToR2, getR2PublicUrl } from '@/lib/r2';
import { assessImageResolution } from '@/lib/wall-studio/split-engine';
import type { PosterSize } from '@/lib/wall-studio/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const size = (formData.get('physicalSize') as PosterSize) || 'A3';
    const isSplit = formData.get('isSplit') === 'true';
    const panelCount = parseInt(formData.get('panelCount') as string) || 1;
    const pixelWidth = parseInt(formData.get('pixelWidth') as string) || 2400;
    const pixelHeight = parseInt(formData.get('pixelHeight') as string) || 1800;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No image file provided' },
        { status: 400 },
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: 'Only JPG, PNG, and WEBP files are allowed' },
        { status: 400 },
      );
    }

    // 25MB max size
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'Image size exceeds maximum limit of 25MB' },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let publicUrl: string;
    let objectKey: string | undefined;

    try {
      const uploadRes = await uploadBufferToR2(buffer, file.name, file.type);
      objectKey = uploadRes.objectKey;
      publicUrl = getR2PublicUrl(objectKey);
    } catch (r2Error) {
      console.warn(
        'R2 upload failed or credentials missing, falling back to base64 Data URL:',
        r2Error,
      );
      publicUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
    }

    // Analyze Resolution
    const assessment = assessImageResolution(pixelWidth, pixelHeight, size, isSplit, panelCount);

    return NextResponse.json({
      success: true,
      publicUrl,
      objectKey,
      resolution: assessment,
      pixelWidth,
      pixelHeight,
      fileSize: file.size,
    });
  } catch (error) {
    console.error('Error handling custom image upload:', error);
    return NextResponse.json(
      { success: false, message: 'Upload failed', error: String(error) },
      { status: 500 },
    );
  }
}
