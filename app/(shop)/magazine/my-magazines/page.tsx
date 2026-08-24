'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MagazineDocument } from '@/types/magazine';
import { downloadMagazinePdf } from '@/lib/magazine/pdf-generator';
import { useCartStore } from '@/lib/stores/cart-store';

export default function MyMagazinesDashboard() {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [magazines, setMagazines] = useState<MagazineDocument[]>([]);

  useEffect(() => {
    try {
      const items: MagazineDocument[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fregoro_mag_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            items.push(JSON.parse(raw));
          }
        }
      }
      setMagazines(
        items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
      );
    } catch {
      // ignore
    }
  }, []);

  const handleDelete = (id: string) => {
    try {
      localStorage.removeItem(`fregoro_mag_${id}`);
      setMagazines((prev) => prev.filter((m) => m.id !== id));
    } catch {
      // ignore
    }
  };

  const handleOrder = (doc: MagazineDocument) => {
    addItem({
      productId: 'prod_mag_01',
      variantId: 'v_mag_12p',
      name: `FREGORO Magazine · ${doc.title}`,
      price: 499,
      image:
        doc.pages[0]?.elements?.find((e) => e.type === 'image')?.content ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      quantity: 1,
      size: 'A4 Portrait',
      customization: {
        magazineId: doc.id,
        magazineTitle: doc.title,
        pageCount: doc.pages.length,
      },
    });
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-[#0D0D0E] text-[#F5F1EA] pt-28 pb-24">
      <div className="section-container max-w-5xl space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[#F5F1EA]/10">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#0057FF] uppercase font-bold mb-1">
              <Link href="/magazine" className="hover:text-white transition-colors">
                Magazine Studio
              </Link>
              <span>/</span>
              <span>My Projects</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-black uppercase text-white">
              My Magazines & Drafts
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[#F5F1EA]/70 mt-1">
              Manage your saved publication drafts, download print-ready PDFs, or place print
              orders.
            </p>
          </div>

          <Link
            href="/magazine/templates"
            className="px-6 py-3.5 rounded-xl bg-[#0057FF] hover:bg-[#0046CC] font-mono text-xs font-bold text-white uppercase tracking-wider shadow-lg shadow-[#0057FF]/30 transition-all text-center"
          >
            + Create New Magazine
          </Link>
        </div>

        {/* Project List / Empty State */}
        {magazines.length === 0 ? (
          <div className="text-center py-20 bg-[#141418] rounded-2xl border border-[#F5F1EA]/10 space-y-4">
            <span className="text-4xl">📚</span>
            <h3 className="font-display text-2xl font-bold text-white">No Magazines Yet</h3>
            <p className="font-mono text-xs text-[#F5F1EA]/60 max-w-md mx-auto leading-relaxed">
              Create your first magazine using a professional FREGORO template or upload your
              existing print PDF.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                href="/magazine/templates"
                className="px-6 py-3 rounded-xl bg-[#0057FF] font-mono text-xs font-bold text-white uppercase"
              >
                Browse Templates →
              </Link>
              <Link
                href="/magazine/upload-pdf"
                className="px-6 py-3 rounded-xl bg-[#1A1A1E] font-mono text-xs font-bold text-white uppercase"
              >
                Upload PDF
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {magazines.map((doc) => (
              <div
                key={doc.id}
                className="bg-[#141418] border border-[#F5F1EA]/10 hover:border-[#0057FF]/40 rounded-2xl p-5 space-y-4 transition-all shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="aspect-[3/4] relative w-full rounded-xl bg-[#0A0A0C] border border-[#F5F1EA]/10 overflow-hidden flex items-center justify-center p-4">
                    <div className="text-center space-y-1">
                      <span className="font-display text-lg font-bold text-white line-clamp-2">
                        {doc.title || 'Untitled Publication'}
                      </span>
                      <span className="font-mono text-[11px] text-[#F5F1EA]/50 block">
                        {doc.pages.length} Pages · A4
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display text-base font-bold text-white truncate">
                      {doc.title}
                    </h3>
                    <p className="font-mono text-[10px] text-[#F5F1EA]/50 mt-0.5">
                      Last edited {new Date(doc.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F5F1EA]/5 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/magazine/editor/${doc.id}`}
                      className="py-2.5 rounded-lg bg-[#0057FF] hover:bg-[#0046CC] font-mono text-xs font-bold text-white uppercase text-center transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => downloadMagazinePdf(doc)}
                      className="py-2.5 rounded-lg bg-[#1A1A1E] hover:bg-[#25252E] font-mono text-xs font-bold text-[#F5F1EA] uppercase transition-colors"
                    >
                      PDF
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleOrder(doc)}
                      className="font-mono text-xs text-[#0057FF] hover:text-white font-bold uppercase transition-colors"
                    >
                      Order Print →
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="font-mono text-[11px] text-rose-400/60 hover:text-rose-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
