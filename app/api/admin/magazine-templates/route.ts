import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const templates = await prisma.magazineTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(templates);
  } catch (error) {
    // DB table may not exist yet (schema not pushed) — return empty array so the
    // client can still spread it safely and fall back to hardcoded templates.
    console.error('MagazineTemplate fetch error (table may not exist yet):', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category, description, coverImage, pages, styleTags, badge } = body;

    const newTemplate = await prisma.magazineTemplate.create({
      data: {
        name,
        category,
        description,
        coverImage,
        pages,
        styleTags: styleTags || [],
        badge,
      },
    });

    return NextResponse.json(newTemplate);
  } catch (error) {
    console.error('Error creating magazine template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
