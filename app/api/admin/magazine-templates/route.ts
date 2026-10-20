import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MAGAZINE_TEMPLATE_CATALOG } from '@/data/magazineTemplates/catalog';

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

    const productMap = new Map<
      string,
      { id: string; name: string; basePrice: number; description: string }
    >();
    for (const p of products) {
      productMap.set(p.id, p);
      if (p.slug) productMap.set(p.slug, p);
    }

    // Metadata only — never ship the full template page trees to the landing page.
    const liveTemplates = MAGAZINE_TEMPLATE_CATALOG.map((tpl) => {
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
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    console.error('[MagazineTemplatesAPI] Error merging live DB data:', err);
    return NextResponse.json(MAGAZINE_TEMPLATE_CATALOG, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  }
}
