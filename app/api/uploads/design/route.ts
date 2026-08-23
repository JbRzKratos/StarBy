import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePresignedUploadUrl, validateDesignFile } from '@/lib/r2';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const uploadRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1),
  fileSize: z.number().int().positive(),
  productId: z.string().optional(),
});

/**
 * POST /api/uploads/design
 *
 * Generates a pre-signed PUT URL for uploading custom artwork directly
 * from the client browser to Cloudflare R2.
 *
 * Security:
 * - Requires authenticated user (or returns guest prefix with rate limit)
 * - Strict MIME type and size validation
 * - Randomized non-guessable R2 storage keys
 */
export async function POST(request: Request) {
  try {
    // 1. Rate limiting
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await rateLimit(`upload:${ip}`, 20, 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, message: 'Upload rate limit exceeded. Please wait a moment.' },
        { status: 429 },
      );
    }

    // 2. Validate input schema
    const body = await request.json();
    const parsed = uploadRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid upload request',
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { fileName, fileType, fileSize } = parsed.data;

    // 3. Validate file MIME type and size limit (50MB max)
    const fileValidation = validateDesignFile(fileType, fileSize);
    if (!fileValidation.valid) {
      return NextResponse.json({ success: false, message: fileValidation.error }, { status: 400 });
    }

    // 4. Authenticate user
    let userId = 'guest';
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      userId = 'guest';
    }

    // 5. Generate pre-signed URL via R2
    const presigned = await generatePresignedUploadUrl(userId, fileName, fileType);

    return NextResponse.json({
      success: true,
      uploadUrl: presigned.uploadUrl,
      objectKey: presigned.objectKey,
      expiresIn: presigned.expiresIn,
      fileType,
      fileName,
    });
  } catch (error) {
    console.error('Presigned upload URL generation failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate upload URL. Storage service may be unavailable.',
      },
      { status: 500 },
    );
  }
}
