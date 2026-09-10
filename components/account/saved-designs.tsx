'use client';

import Link from 'next/link';

export function SavedDesigns() {
  return (
    <div className="bg-graphite border border-smoke p-8 text-center rounded-sm">
      <h3 className="font-mono text-pearl mb-2">No saved designs</h3>
      <p className="text-ash mb-6">No custom designs are saved.</p>
      <Link
        href="/products/all"
        className="inline-block px-6 py-2 border border-cobalt text-cobalt font-mono hover:bg-cobalt hover:text-bone transition-colors"
      >
        Browse Catalog
      </Link>
    </div>
  );
}
