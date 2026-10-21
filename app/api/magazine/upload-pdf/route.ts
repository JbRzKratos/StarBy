import { NextResponse } from 'next/server';
import {
  generatePresignedUploadUrl,
  getR2PublicUrl,
  uploadBufferToR2,
} from '@/lib/r2';

export const dynamic = 'force-dynamic';

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const MAX_PROXY_BYTES = 4 * 1024 * 1024;

function isPdf(fileName: string, fileType: string): boolean {
  return (
    fileType.toLowerCase() === 'application/pdf' ||
    fileName.toLowerCase().endsWith('.pdf')
  );
}

/**
 * Upload a customer-supplied print-ready magazine PDF.
 *
 * Small files use the multipart proxy; larger files use a presigned R2 PUT so
 * they never hit Vercel's request-body limit.
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const fileName = String(body.fileName || 'magazine.pdf');
      const fileType = String(body.fileType || 'application/pdf');
      const fileSize = Number(body.fileSize || 0);

      if (!isPdf(fileName, fileType)) {
        return NextResponse.json(
          { success: false, message: 'Only PDF files are accepted' },
          { status: 400 },
        );
      }
      if (fileSize > MAX_PDF_BYTES) {
        return NextResponse.json(
          { success: false, message: 'PDF exceeds the 50MB limit' },
          { status: 400 },
        );
      }

      const presigned = await generatePresignedUploadUrl(
        'magazine-print',
        fileName,
        'application/pdf',
        300,
      );

      return NextResponse.json({
        success: true,
        mode: 'presigned',
        uploadUrl: presigned.uploadUrl,
        publicUrl: getR2PublicUrl(presigned.objectKey),
        objectKey: presigned.objectKey,
      });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No PDF file provided' },
        { status: 400 },
      );
    }
    if (!isPdf(file.name, file.type) || file.size > MAX_PROXY_BYTES) {
      return NextResponse.json(
        {
          success: false,
          message: 'PDF must be under 4MB for the proxy upload path',
        },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { objectKey } = await uploadBufferToR2(
      buffer,
      file.name,
      'application/pdf',
    );

    return NextResponse.json({
      success: true,
      mode: 'proxy',
      publicUrl: getR2PublicUrl(objectKey),
      objectKey,
    });
  } catch (error) {
    console.error('Magazine PDF upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Could not upload the PDF' },
      { status: 500 },
    );
  }
}
