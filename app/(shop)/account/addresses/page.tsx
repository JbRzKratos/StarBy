import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'edge';

export default async function AccountAddressesPage() {
  let addresses: Array<Record<string, unknown>> = [];

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    // Fallback if DB not configured yet
  }

  return (
    <main className="min-h-screen bg-charcoal text-bone pt-36 pb-24">
      <div className="section-container">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/account"
            className="font-mono text-caption text-pearl hover:text-bone transition-colors"
          >
            ← Account Dashboard
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-6 border-b border-smoke/20">
          <div>
            <span className="font-mono text-caption text-cobalt uppercase tracking-widest block mb-2">
              Management
            </span>
            <h1 className="font-display text-4xl md:text-5xl uppercase tracking-tighter">
              Saved Addresses
            </h1>
          </div>
        </div>

        {/* Addresses List */}
        {addresses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((addr, idx) => {
              const a = addr as Record<string, unknown>;
              return (
                <div
                  key={(a.id as string) || idx}
                  className="bg-graphite border border-smoke/40 p-6 rounded-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-mono text-body-sm text-bone font-bold">
                        {String(a.name || '')}
                      </h3>
                      {Boolean(a.isDefault) && (
                        <span className="px-2 py-0.5 bg-cobalt/20 text-cobalt font-mono text-[10px] uppercase rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-caption text-pearl leading-relaxed">
                      {String(a.street || '')}
                      <br />
                      {String(a.city || '')}, {String(a.state || '')} {String(a.zip || '')}
                      <br />
                      {String(a.country || '')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center border border-dashed border-smoke/30 rounded-lg p-12">
            <h3 className="font-display text-3xl text-bone mb-3">No saved addresses</h3>
            <p className="font-mono text-caption text-pearl mb-8">
              Addresses you save during checkout will appear here for fast future checkouts.
            </p>
            <Link
              href="/checkout"
              className="inline-block bg-cobalt hover:bg-cobalt/90 text-bone font-mono text-caption uppercase tracking-widest px-8 py-4 rounded transition-all hover:scale-105"
            >
              Go to Checkout →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
