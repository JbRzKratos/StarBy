import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const savedWall = await prisma.savedWall.findFirst({
      where: {
        OR: [{ id: params.id }, { shareCode: params.id }],
      },
    });

    if (!savedWall) {
      return NextResponse.json(
        { success: false, message: 'Saved wall not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, savedWall });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve saved wall', error: String(error) },
      { status: 500 },
    );
  }
}
