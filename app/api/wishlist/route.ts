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
    const items = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: { id: true, name: true, slug: true, basePrice: true, categorySlug: true },
        },
      },
    });

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Wishlist GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wishlist' },
      { status: 500 },
    );
  }
}

const postSchema = z.object({
  productIds: z.array(z.string()),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = postSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }

    const { productIds } = result.data;

    // Sync productIds to database - insert ignore basically, but prisma uses createMany with skipDuplicates
    if (productIds.length > 0) {
      await prisma.wishlistItem.createMany({
        data: productIds.map((id) => ({ userId: user.id, productId: id })),
        skipDuplicates: true,
      });
    }

    const updatedItems = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      select: { productId: true },
    });

    return NextResponse.json({ success: true, items: updatedItems.map((i) => i.productId) });
  } catch (error) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update wishlist' },
      { status: 500 },
    );
  }
}

const deleteSchema = z.object({
  productId: z.string(),
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

    await prisma.wishlistItem.deleteMany({
      where: { userId: user.id, productId: result.data.productId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Wishlist DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove from wishlist' },
      { status: 500 },
    );
  }
}
