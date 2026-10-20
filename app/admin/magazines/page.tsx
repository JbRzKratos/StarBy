import Link from 'next/link';
import { FileText, Plus, Sparkles } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '../lib/auth';
import { MAGAZINE_TEMPLATE_CATALOG } from '@/data/magazineTemplates/catalog';

export const dynamic = 'force-dynamic';

interface MagazineTemplateRow {
  id: string;
  name: string;
  category: string;
  pageCount: number;
  price: number;
  coverImage?: string;
  source: 'database' | 'catalogue';
}

function readTemplateRows(): Promise<MagazineTemplateRow[]> {
  return prisma.storedFile
    .findMany({ where: { fileType: 'magazine_template' }, orderBy: { createdAt: 'desc' } })
    .then((files) =>
      files.flatMap((file) => {
        const data =
          file.metadata && typeof file.metadata === 'object' && !Array.isArray(file.metadata)
            ? (file.metadata as Record<string, unknown>)
            : null;
        if (!data || typeof data.id !== 'string' || typeof data.name !== 'string') return [];
        return [
          {
            id: data.id,
            name: data.name,
            category: typeof data.category === 'string' ? data.category : 'fashion',
            pageCount: typeof data.pageCount === 'number' ? data.pageCount : 0,
            price: typeof data.price === 'number' ? data.price : 499,
            coverImage: typeof data.coverImage === 'string' ? data.coverImage : undefined,
            source: 'database' as const,
          },
        ];
      }),
    );
}

export default async function AdminMagazinesPage() {
  await requireStaff();

  let templates: MagazineTemplateRow[] = [];
  try {
    templates = await readTemplateRows();
  } catch (err) {
    console.error('[AdminMagazinesPage] Could not load templates:', err);
  }

  const catalogue: MagazineTemplateRow[] = MAGAZINE_TEMPLATE_CATALOG.map((template) => ({
    id: template.id,
    name: template.name,
    category: template.category,
    pageCount: template.pageCount,
    price: template.price ?? 499,
    coverImage: template.coverImage,
    source: 'catalogue',
  }));

  const knownIds = new Set(templates.map((template) => template.id));
  const allTemplates = [...templates, ...catalogue.filter((template) => !knownIds.has(template.id))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-bone">Magazine Templates</h1>
          <p className="text-sm text-ash/60">
            Templates saved from the Magazine Builder are stored in the database and are
            immediately available in the storefront editor.
          </p>
        </div>
        <Link
          href="/admin/magazine-builder"
          className="inline-flex items-center gap-2 rounded-lg bg-[#0057FF] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0046CC]"
        >
          <Plus className="h-4 w-4" />
          Build a template
        </Link>
      </div>

      <div className="flex items-center gap-2 text-xs font-mono text-ash/70">
        <span className="rounded-full bg-white/5 px-3 py-1">
          {templates.length} saved template{templates.length === 1 ? '' : 's'}
        </span>
        <span className="rounded-full bg-white/5 px-3 py-1">
          {catalogue.length} built-in template{catalogue.length === 1 ? '' : 's'}
        </span>
      </div>

      {allTemplates.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-black/20 p-10 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-ash/50" />
          <p className="text-sm text-ash/70">
            No magazine templates yet. Create the first one in the builder.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {allTemplates.map((template) => (
            <div
              key={`${template.source}-${template.id}`}
              className="flex gap-4 rounded-xl border border-white/10 bg-black/20 p-4"
            >
              <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
                {template.coverImage ? (
                  // Admin previews intentionally use the raw asset URL.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={template.coverImage}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ash/40">
                    <FileText className="h-6 w-6" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide text-ash/70">
                    {template.category}
                  </span>
                  {template.source === 'database' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                      <Sparkles className="h-3 w-3" /> Live
                    </span>
                  )}
                </div>
                <h2 className="truncate text-sm font-semibold text-bone">{template.name}</h2>
                <p className="mt-1 text-xs font-mono text-ash/60">
                  {template.pageCount} pages · ₹{template.price.toLocaleString('en-IN')}
                </p>
                <Link
                  href={`/magazine/editor?template=${encodeURIComponent(template.id)}`}
                  className="mt-3 inline-block text-xs font-semibold text-[#4C7DFF] hover:text-[#7BA0FF]"
                >
                  Open in editor →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
