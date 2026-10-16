'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AdminErrorBoundary] Caught unhandled admin error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="max-w-md w-full bg-[#121216] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="w-12 h-12 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center justify-center mx-auto text-rose-400">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold font-mono text-bone tracking-tight uppercase">
            Admin View Exception
          </h2>
          <p className="text-xs text-ash/80 font-mono leading-relaxed">
            The data service or database experienced a transient connection delay while loading this section.
          </p>
        </div>

        {error?.digest && (
          <div className="p-2.5 bg-black/40 border border-white/5 rounded-lg text-left text-[11px] font-mono text-ash/60">
            <span>Reference ID: </span>
            <code className="text-rose-400 font-bold">{error.digest}</code>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:flex-1 py-2.5 px-4 bg-[#3B5EFF] hover:bg-[#2e4de0] text-white font-mono text-xs uppercase tracking-wider font-bold rounded-lg transition-colors shadow-lg shadow-[#3B5EFF]/20"
          >
            Retry Section
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full sm:flex-1 py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors border border-white/10"
          >
            Reload Page
          </button>
        </div>

        <div className="pt-2 border-t border-white/5">
          <Link
            href="/admin"
            className="text-xs font-mono text-[#3B5EFF] hover:underline"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
