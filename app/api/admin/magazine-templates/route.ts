import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getAdminUser } from '@/app/admin/lib/auth';
import { MAGAZINE_TEMPLATE_CATALOG } from '@/data/magazineTemplates/catalog';
import type { MagazineCategory, MagazineTemplateMeta } from '@/types/magazine';

export const dynamic = 'force-dynamic';

function asRecord(value: Prisma.JsonValue | null | undefined): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toTemplateMeta(value: Prisma.JsonValue | null | undefined): MagazineTemplateMeta | null {
  const data = asRecord(value);
  if (!data) return null;

  const id = typeof data.id === 'string' ? data.id : null;
  const name = typeof data.name === 'string' ? data.name : null;
  const coverImage = typeof data.coverImage === 'string' ? data.coverImage : '';
  if (!id || !name) return null;

  return {
    id,
    slug: typeof data.slug === 'string' ? data.slug : id,
    name,
    category: (typeof data.category === 'string' ? data.category : 'fashion') as MagazineCategory,
    subcategory: typeof data.subcategory === 'string' ? data.subcategory : undefined,
    description: typeof data.description === 'string' ? data.description : '',
    styleTags: Array.isArray(data.styleTags)
      ? data.styleTags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    pageCount: typeof data.pageCount === 'number' ? data.pageCount : 0,
    dimensionKey: typeof data.dimensionKey === 'string' ? data.dimensionKey : 'a4-portrait',
    coverImage,
    spreadPreviews: Array.isArray(data.spreadPreviews)
      ? data.spreadPreviews.filter((url): url is string => typeof url === 'string')
      : [],
    featured: Boolean(data.featured),
    badge: typeof data.badge === 'string' ? data.badge : undefined,
    price: typeof data.price === 'number' ? data.price : 499,
  };
}

function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || `template-${Date.now()}`;
}

async function getStoredTemplates() {
  return prisma.storedFile.findMany({
    where: { fileType: 'magazine_template' },
    orderBy: { createdAt: 'desc' },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedId = searchParams.get('id');
    const includeFull = searchParams.get('full') === '1';

    const stored = await getStoredTemplates();
    const storedMetas = stored
      .map((file) => toTemplateMeta(file.metadata))
      .filter((meta): meta is MagazineTemplateMeta => Boolean(meta));

    // Full template lookup for the editor. Pages live in StoredFile.metadata,
    // so no heavy template tree is ever shipped to the landing page.
    if (requestedId) {
      const file = stored.find((entry) => {
        const meta = asRecord(entry.metadata);
        return meta?.id === requestedId || meta?.slug === requestedId;
      });
      if (!file) {
        return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
      }
      const data = asRecord(file.metadata) || {};
      return NextResponse.json({
        success: true,
        template: includeFull ? data : toTemplateMeta(file.metadata),
      });
    }

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

    const liveTemplates: MagazineTemplateMeta[] = MAGAZINE_TEMPLATE_CATALOG.map((tpl) => {
      const match = productMap.get(tpl.id) || productMap.get(tpl.slug);
      return {
        ...tpl,
        name: match?.name || tpl.name,
        price: match?.basePrice ?? (tpl.id === 'tpl_fashion_1' ? 1 : 499),
        description: match?.description || tpl.description,
      };
    });

    const knownIds = new Set(liveTemplates.map((tpl) => tpl.id));
    for (const meta of storedMetas) {
      if (!knownIds.has(meta.id)) {
        liveTemplates.push(meta);
        knownIds.add(meta.id);
      }
    }

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

export async function POST(request: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const category = typeof body.category === 'string' ? body.category : 'fashion';
    const description = typeof body.description === 'string' ? body.description : '';
    const coverImage = typeof body.coverImage === 'string' ? body.coverImage : '';
    const pages = Array.isArray(body.pages) ? body.pages : [];

    if (!name || !coverImage || pages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Name, cover image and at least one page are required.' },
        { status: 400 },
      );
    }

    const baseSlug = slugify(name);
    const existingSlugs = new Set((await getStoredTemplates()).map((file) => file.originalFilename));
    let slug = baseSlug;
    let suffix = 1;
    while (existingSlugs.has(`${slug}.json`)) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const now = new Date().toISOString();
    const template = {
      id: `tpl_${slug.replace(/-/g, '_')}`,
      slug,
      name,
      category: category as MagazineCategory,
      subcategory: category,
      description,
      styleTags: Array.isArray(body.styleTags)
        ? body.styleTags.filter((tag: unknown): tag is string => typeof tag === 'string')
        : [category, 'magazine'],
      pageCount: pages.length,
      dimensionKey: typeof body.dimensionKey === 'string' ? body.dimensionKey : 'a4-portrait',
      coverImage,
      spreadPreviews: Array.isArray(body.spreadPreviews) ? body.spreadPreviews : [],
      featured: Boolean(body.featured),
      badge: typeof body.badge === 'string' ? body.badge : 'NEW',
      price: typeof body.price === 'number' ? body.price : 499,
      pages,
      createdAt: now,
      updatedAt: now,
    };

    const serialized = JSON.stringify(template);
    // Strip any undefined optional fields before Prisma serialises the JSON.
    const metadata = JSON.parse(serialized) as Prisma.InputJsonValue;

    await prisma.storedFile.create({
      data: {
        fileType: 'magazine_template',
        storageProvider: 'database',
        bucket: 'postgres',
        objectKey: `magazine-template/${slug}.json`,
        originalFilename: `${slug}.json`,
        mimeType: 'application/json',
        fileSize: Buffer.byteLength(serialized, 'utf8'),
        isPrivate: false,
        metadata,
      },
    });

    revalidatePath('/api/admin/magazine-templates');
    revalidatePath('/magazine');
    revalidatePath('/magazine/templates');

    return NextResponse.json({
      success: true,
      template: toTemplateMeta(template as unknown as Prisma.JsonValue),
    });
  } catch (err) {
    console.error('[MagazineTemplatesAPI] Error saving template:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to save magazine template.' },
      { status: 500 },
    );
  }
}
