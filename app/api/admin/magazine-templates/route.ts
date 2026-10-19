import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MAGAZINE_TEMPLATES } from '@/data/magazineTemplates';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { categorySlug: 'magazine' },
      select: {
        id: true,
        slug: true,
        name: true,
        basePrice: true,
        description: true,
      },
    });

    const productMap = new Map<string, { id: string; name: string; basePrice: number; description: string }>();
    for (const p of products) {
      productMap.set(p.id, p);
      if (p.slug) productMap.set(p.slug, p);
    }

    const liveTemplates = MAGAZINE_TEMPLATES.map((tpl) => {
      const match = productMap.get(tpl.id) || productMap.get(tpl.slug);
      return {
        ...tpl,
        name: match?.name || tpl.name,
        price: match?.basePrice ?? (tpl.id === 'tpl_fashion_1' ? 1 : 499),
        description: match?.description || tpl.description,
      };
    });

    return NextResponse.json(liveTemplates, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch (err) {
    console.error('[MagazineTemplatesAPI] Error merging live DB data:', err);
    return NextResponse.json(MAGAZINE_TEMPLATES, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  }
}
