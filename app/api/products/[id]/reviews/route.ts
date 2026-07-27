import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const ReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().max(100).optional(),
  text: z.string().max(1000).optional(),
});

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: params.id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const aggregate = await prisma.review.aggregate({
      where: { productId: params.id },
      _avg: { rating: true },
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      reviews,
      stats: {
        averageRating: aggregate._avg.rating || 0,
        totalReviews: aggregate._count.id,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'You must be logged in to leave a review.' },
        { status: 401 },
      );
    }

    // Verify if user bought the product
    const hasBought = await prisma.orderItem.findFirst({
      where: {
        productId: params.id,
        order: {
          userId: user.id,
          status: { not: 'cancelled' },
        },
      },
    });

    if (!hasBought) {
      return NextResponse.json(
        { success: false, message: 'You can only review products you have purchased.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validation = ReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid review data', errors: validation.error.flatten() },
        { status: 400 },
      );
    }

    const review = await prisma.review.create({
      data: {
        rating: validation.data.rating,
        title: validation.data.title ?? null,
        text: validation.data.text ?? null,
        productId: params.id,
        userId: user.id,
      },
      include: {
        user: { select: { fullName: true } },
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
