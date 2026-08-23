import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { generatePresignedDownloadUrl } from '@/lib/r2';
import { z } from 'zod';

const confirmSchema = z.object({
  objectKey: z.string().min(1),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().int().positive().optional(),
  productId: z.string().optional(),
  title: z.string().optional(),
  canvasState: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/uploads/design/confirm
 *
 * Validates that an upload was performed and optionally saves the user's design
 * to their account library (CustomizerDesign) or generates a signed view URL.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid confirmation payload',
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { objectKey, fileName, productId, title, canvasState } = parsed.data;

    let userId: string | null = null;
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {
      userId = null;
    }

    // Generate a temporary download URL for previewing
    let previewUrl: string | null = null;
    try {
      const download = await generatePresignedDownloadUrl(objectKey, 7200); // 2 hours
      previewUrl = download.downloadUrl;
    } catch (r2Err) {
      console.warn('Could not generate preview download URL:', r2Err);
    }

    // Register file in the central StoredFile metadata table
    try {
      await prisma.storedFile.upsert({
        where: { objectKey },
        create: {
          ownerUserId: userId,
          fileType: 'customer_design',
          storageProvider: 'cloudflare_r2',
          bucket: process.env.R2_BUCKET_NAME || 'fregorostudios',
          objectKey,
          originalFilename: fileName,
          mimeType: parsed.data.fileType,
          fileSize: parsed.data.fileSize || 0,
          isPrivate: true,
          metadata: { productId, title },
        },
        update: {
          ownerUserId: userId,
        },
      });
    } catch (fileErr) {
      console.warn('Could not register in StoredFile table:', fileErr);
    }

    // If user is logged in and product is provided, save as CustomizerDesign
    let savedDesignId: string | null = null;
    if (userId && productId) {
      try {
        const design = await prisma.customizerDesign.create({
          data: {
            userId,
            productId,
            title: title || fileName || 'My Custom Design',
            previewUrl: previewUrl || objectKey,
            canvasState: (canvasState || { objectKey, fileName }) as Prisma.InputJsonValue,
          },
        });
        savedDesignId = design.id;
      } catch (dbErr) {
        console.warn('Could not save design record to DB:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Design upload confirmed',
      objectKey,
      previewUrl,
      savedDesignId,
    });
  } catch (error) {
    console.error('Design confirmation error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to confirm design upload.' },
      { status: 500 },
    );
  }
}
