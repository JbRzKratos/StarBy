'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[UnhandledError]', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#0E0E10] text-[#F5F1EA] flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="max-w-md flex flex-col items-center gap-6">
        <span className="font-mono text-xs text-[#FF4D4D] uppercase tracking-widest px-3 py-1 bg-[#FF4D4D]/10 border border-[#FF4D4D]/30 rounded-full">
          System Exception
        </span>

        <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight uppercase text-bone">
          Something Went Wrong
        </h1>

        <p className="font-mono text-sm text-pearl leading-relaxed">
          An unexpected error occurred. You can try refreshing the page or return to the main store.
        </p>

        {error?.message && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-left max-w-full overflow-auto text-xs font-mono text-rose-300">
            <div className="font-bold mb-1">Error: {error.message}</div>
            {error.digest && <div className="text-[10px] opacity-70">Digest: {error.digest}</div>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full">
          <button
            onClick={() => reset()}
            className="w-full sm:flex-1 py-3.5 px-6 bg-cobalt text-bone font-mono text-xs uppercase tracking-widest font-bold hover:bg-cobalt/80 transition-colors rounded-sm text-center"
          >
            Try Again
          </button>

          <Link
            href="/"
            className="w-full sm:flex-1 py-3.5 px-6 border border-smoke text-pearl font-mono text-xs uppercase tracking-widest font-bold hover:border-cobalt hover:text-cobalt transition-colors rounded-sm text-center"
          >
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
