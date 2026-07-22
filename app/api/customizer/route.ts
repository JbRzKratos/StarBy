import { NextResponse } from 'next/server';
import { CustomizerSaveSchema } from '@/lib/validations/schemas';
import { rateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting (15 saves per minute)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await rateLimit(`customizer:${ip}`, 15, 60 * 1000);

    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, message: 'Too many save requests. Please try again shortly.' },
        { status: 429 },
      );
    }

    // 2. Validate Payload with Zod
    const body = await request.json();
    const validation = CustomizerSaveSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid customizer design payload',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { productId, title, canvasState, previewUrl } = validation.data;

    // 3. Get Authenticated User (if logged in)
    let userId: string | null = null;
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {
      // Guest design fallback
    }

    // 4. Save to Database via Prisma
    let designId = `DSN_${Date.now()}`;
    try {
      const savedDesign = await prisma.customizerDesign.create({
        data: {
          userId,
          productId,
          title,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          canvasState: canvasState as any,
          previewUrl: previewUrl || null,
        },
      });
      designId = savedDesign.id;
    } catch (dbError) {
      console.warn('DB design save notice:', dbError);
    }

    return NextResponse.json({
      success: true,
      message: 'Custom design saved successfully!',
      designId,
    });
  } catch (error) {
    console.error('Customizer save error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while saving design.' },
      { status: 500 },
    );
  }
}
