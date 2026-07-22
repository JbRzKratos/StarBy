import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';



export default async function AccountPage() {
  let user = null;
  let orderCount = 0;
  let addressCount = 0;
  let designCount = 0;

  try {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      redirect('/login');
    }

    user = authUser;

    // Fetch counts from DB
    orderCount = await prisma.order.count({ where: { userId: user.id } });
    addressCount = await prisma.address.count({ where: { userId: user.id } });
    designCount = await prisma.customizerDesign.count({ where: { userId: user.id } });
  } catch {
    // Graceful fallback if auth/DB not configured
  }

  return (
    <main className="min-h-screen bg-charcoal text-bone pt-36 pb-24">
      <div className="section-container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-8 border-b border-smoke/20">
          <div>
            <span className="font-mono text-caption text-cobalt uppercase tracking-widest block mb-2">
              Customer Portal
            </span>
            <h1 className="font-display text-4xl md:text-5xl uppercase tracking-tighter">
              Account Overview
            </h1>
            <p className="font-mono text-body-sm text-pearl mt-2">
              Logged in as <span className="text-bone">{user?.email || 'Guest User'}</span>
            </p>
          </div>

          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="bg-smoke/20 hover:bg-smoke/40 text-bone border border-smoke/40 font-mono text-caption uppercase tracking-widest px-6 py-3 rounded transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Link
            href="/account/orders"
            className="group bg-graphite border border-smoke/40 hover:border-cobalt p-8 rounded-lg transition-all duration-300 flex flex-col justify-between h-48"
          >
            <div>
              <span className="font-mono text-caption text-pearl uppercase tracking-widest block mb-2">
                Purchases
              </span>
              <h3 className="font-display text-3xl text-bone group-hover:text-cobalt transition-colors">
                Order History
              </h3>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-smoke/20">
              <span className="font-mono text-2xl font-bold text-bone">{orderCount}</span>
              <span className="font-mono text-caption text-pearl group-hover:translate-x-1 transition-transform">
                View Orders →
              </span>
            </div>
          </Link>

          <Link
            href="/account/addresses"
            className="group bg-graphite border border-smoke/40 hover:border-cobalt p-8 rounded-lg transition-all duration-300 flex flex-col justify-between h-48"
          >
            <div>
              <span className="font-mono text-caption text-pearl uppercase tracking-widest block mb-2">
                Shipping
              </span>
              <h3 className="font-display text-3xl text-bone group-hover:text-cobalt transition-colors">
                Saved Addresses
              </h3>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-smoke/20">
              <span className="font-mono text-2xl font-bold text-bone">{addressCount}</span>
              <span className="font-mono text-caption text-pearl group-hover:translate-x-1 transition-transform">
                Manage Addresses →
              </span>
            </div>
          </Link>

          <Link
            href="/customize"
            className="group bg-graphite border border-smoke/40 hover:border-cobalt p-8 rounded-lg transition-all duration-300 flex flex-col justify-between h-48"
          >
            <div>
              <span className="font-mono text-caption text-pearl uppercase tracking-widest block mb-2">
                Studio
              </span>
              <h3 className="font-display text-3xl text-bone group-hover:text-cobalt transition-colors">
                Saved Designs
              </h3>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-smoke/20">
              <span className="font-mono text-2xl font-bold text-bone">{designCount}</span>
              <span className="font-mono text-caption text-pearl group-hover:translate-x-1 transition-transform">
                Create Design →
              </span>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
