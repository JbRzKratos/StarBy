import { NextResponse } from 'next/server';
import { uploadBufferToR2, getR2PublicUrl, generatePresignedUploadUrl } from '@/lib/r2';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
];

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // 1. Direct Presigned Upload Generation for large files (bypasses serverless payload limit)
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { fileName, fileType, fileSize, placement = 'front' } = body;

      if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType.toLowerCase())) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid file format. Allowed: PNG, JPG, JPEG, WEBP, PDF, SVG.',
          },
          { status: 400 },
        );
      }

      if (fileSize && fileSize > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { success: false, message: 'File exceeds 50MB limit' },
          { status: 400 },
        );
      }

      try {
        const presigned = await generatePresignedUploadUrl(
          `bulk_${placement}`,
          fileName || 'artwork.png',
          fileType,
          300, // 5-minute expiry
        );
        const publicUrl = getR2PublicUrl(presigned.objectKey);

        return NextResponse.json({
          success: true,
          mode: 'presigned',
          uploadUrl: presigned.uploadUrl,
          publicUrl,
          objectKey: presigned.objectKey,
          fileName,
          fileType,
        });
      } catch (presignError) {
        console.warn('Presigned URL generation error (falling back to direct):', presignError);
        return NextResponse.json(
          { success: false, message: 'Presigned URL generation unavailable' },
          { status: 500 },
        );
      }
    }

    // 2. Direct Multipart Upload
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const placement = (formData.get('placement') as string) || 'front';

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No artwork file uploaded' },
        { status: 400 },
      );
    }

    const fileType = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid file format. Only PNG, JPG, JPEG, WEBP, PDF, and SVG are supported.',
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: 'File size exceeds 50MB maximum limit.' },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let publicUrl: string;
    let objectKey: string | undefined;

    try {
      const sanitizedName = `bulk_${placement}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const uploadRes = await uploadBufferToR2(buffer, sanitizedName, fileType);
      objectKey = uploadRes.objectKey;
      publicUrl = getR2PublicUrl(objectKey);
    } catch (r2Error) {
      console.warn('R2 upload failed or credentials missing, falling back to data URL:', r2Error);
      publicUrl = `data:${fileType};base64,${buffer.toString('base64')}`;
    }

    return NextResponse.json({
      success: true,
      fileUrl: publicUrl,
      fileKey: objectKey || null,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      placement,
    });
  } catch (error) {
    console.error('Bulk artwork upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal error processing artwork upload' },
      { status: 500 },
    );
  }
}
