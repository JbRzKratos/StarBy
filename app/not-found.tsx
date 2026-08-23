import Link from 'next/link';

export const metadata = {
  title: '404 — Page Not Found | Fregoro Studios',
  description: 'The page you are looking for does not exist or has been moved.',
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0E0E10] text-[#F5F1EA] flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="max-w-md flex flex-col items-center gap-6">
        <span className="font-mono text-xs text-[#00F0FF] uppercase tracking-widest px-3 py-1 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-full">
          404 Error
        </span>

        <h1 className="font-display text-6xl md:text-8xl font-bold tracking-tight uppercase text-bone">
          Lost in Space
        </h1>

        <p className="font-mono text-sm text-pearl leading-relaxed">
          The object or page you are trying to reach doesn't exist, has been moved, or is
          temporarily unavailable.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full">
          <Link
            href="/"
            className="w-full sm:flex-1 py-3.5 px-6 bg-bone text-charcoal font-mono text-xs uppercase tracking-widest font-bold hover:bg-cobalt hover:text-bone transition-colors rounded-sm text-center"
          >
            Return Home
          </Link>

          <Link
            href="/products/all"
            className="w-full sm:flex-1 py-3.5 px-6 border border-smoke text-pearl font-mono text-xs uppercase tracking-widest font-bold hover:border-cobalt hover:text-cobalt transition-colors rounded-sm text-center"
          >
            Explore Shop
          </Link>
        </div>
      </div>
    </main>
  );
}
