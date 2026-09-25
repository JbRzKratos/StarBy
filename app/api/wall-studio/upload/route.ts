import { NextResponse } from 'next/server';
import { uploadBufferToR2, getR2PublicUrl, generatePresignedUploadUrl } from '@/lib/r2';
import { assessImageResolution } from '@/lib/wall-studio/split-engine';
import type { PosterSize } from '@/lib/wall-studio/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // 1. Direct Presigned Upload Generation (Bypasses Vercel 4.5MB Payload Limit)
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const {
        fileName,
        fileType,
        fileSize,
        physicalSize = 'A3',
        isSplit = false,
        panelCount = 1,
        pixelWidth = 2400,
        pixelHeight = 1800,
      } = body;

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!fileType || !allowedTypes.includes(fileType.toLowerCase())) {
        return NextResponse.json(
          { success: false, message: 'Only JPG, PNG, and WEBP files are allowed' },
          { status: 400 },
        );
      }

      // 50MB max size for direct R2 uploads
      if (fileSize && fileSize > 50 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, message: 'Image size exceeds maximum limit of 50MB' },
          { status: 400 },
        );
      }

      try {
        const presigned = await generatePresignedUploadUrl(
          'wall-studio',
          fileName || 'artwork.jpg',
          fileType,
          180, // 3-minute expiry
        );
        const publicUrl = getR2PublicUrl(presigned.objectKey);
        const assessment = assessImageResolution(
          pixelWidth,
          pixelHeight,
          physicalSize as PosterSize,
          isSplit,
          panelCount,
        );

        return NextResponse.json({
          success: true,
          mode: 'presigned',
          uploadUrl: presigned.uploadUrl,
          publicUrl,
          objectKey: presigned.objectKey,
          resolution: assessment,
          pixelWidth,
          pixelHeight,
        });
      } catch (presignError) {
        console.warn('Presigned URL generation failed (check R2 env vars):', presignError);
        return NextResponse.json(
          { success: false, message: 'Could not generate direct upload URL' },
          { status: 500 },
        );
      }
    }

    // 2. Multipart form data fallback (for small payloads)
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

    // 4.5MB max size for direct Vercel serverless proxy
    if (file.size > 4.5 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          message: 'Image size exceeds serverless limit. Please use direct upload.',
        },
        { status: 413 },
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
