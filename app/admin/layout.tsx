import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser || dbUser.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-graphite flex pt-20">
      <aside className="w-64 bg-charcoal border-r border-smoke p-6 flex-shrink-0">
        <h2 className="font-display text-body-lg font-bold text-bone mb-8 tracking-widest uppercase">
          Admin Panel
        </h2>
        <nav className="flex flex-col gap-4">
          <Link
            href="/admin"
            className="font-mono text-body-sm text-pearl hover:text-cobalt transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/products"
            className="font-mono text-body-sm text-pearl hover:text-cobalt transition-colors"
          >
            Products Manager
          </Link>
          <Link
            href="/admin/orders"
            className="font-mono text-body-sm text-pearl hover:text-cobalt transition-colors"
          >
            Orders Manager
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
