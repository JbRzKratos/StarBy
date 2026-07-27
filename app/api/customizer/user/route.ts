import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const designs = await prisma.customizerDesign.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        productId: true,
        title: true,
        previewUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, designs });
  } catch (error) {
    console.error('Failed to fetch user designs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch designs' }, { status: 500 });
  }
}

const deleteSchema = z.object({
  id: z.string(),
});

export async function DELETE(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = deleteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }

    // Delete only if it belongs to the user
    await prisma.customizerDesign.deleteMany({
      where: { id: result.data.id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete design:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete design' }, { status: 500 });
  }
}
