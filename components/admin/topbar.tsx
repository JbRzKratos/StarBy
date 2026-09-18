'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const BREADCRUMB_MAP: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/orders': 'Orders',
  '/admin/products': 'Products',
  '/admin/categories': 'Categories',
  '/admin/customers': 'Customers',
  '/admin/coupons': 'Coupons',
  '/admin/analytics': 'Analytics',
  '/admin/staff': 'Staff',
  '/admin/settings': 'Settings',
};

interface AdminTopbarProps {
  isAdmin: boolean;
  role: string;
}

export function AdminTopbar({ isAdmin, role }: AdminTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Trigger silent background refresh
  const refreshData = useCallback(() => {
    startTransition(() => {
      router.refresh();
      setLastUpdated(new Date());
      setSecondsAgo(0);
    });
  }, [router]);

  // Realtime Polling: auto-refresh every 12 seconds when tab is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [refreshData]);

  // Refresh immediately when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      refreshData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshData]);

  // Track seconds elapsed since last update
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [lastUpdated]);

  // Build breadcrumbs
  const parts = pathname.split('/').filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [];
  let current = '';
  for (const part of parts) {
    current += `/${part}`;
    const label = BREADCRUMB_MAP[current] || part.charAt(0).toUpperCase() + part.slice(1);
    breadcrumbs.push({ label, href: current });
  }

  const lastUpdatedDisplay = secondsAgo < 5 ? 'Just now' : `${secondsAgo}s ago`;

  return (
    <header className="fixed top-0 right-0 left-0 md:left-60 h-[60px] bg-[#0E0E10]/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-3 sm:px-6 z-40 transition-[left] duration-300">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu toggle button */}
        <button
          onClick={() => window.dispatchEvent(new Event('admin-sidebar-toggle'))}
          className="md:hidden p-1.5 text-ash/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0"
          aria-label="Toggle admin menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs sm:text-sm overflow-x-auto whitespace-nowrap py-1">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-ash/40">/</span>}
              {i === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-bone">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-ash/60 hover:text-bone/80 transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Realtime Live Sync Status */}
        <div className="flex items-center gap-2 bg-[#16161A] border border-white/10 rounded-full px-2.5 py-1 text-xs font-mono shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-emerald-400 font-bold text-[10px] tracking-wider uppercase">
            Live
          </span>
          <span className="text-white/20 text-[10px]">|</span>
          <button
            onClick={refreshData}
            disabled={isPending}
            title="Click to sync data now"
            className="flex items-center gap-1 text-[11px] text-ash/70 hover:text-white transition-colors"
          >
            <svg
              className={`w-3 h-3 ${isPending ? 'animate-spin text-emerald-400' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span className="hidden sm:inline text-[10px]">
              {isPending ? 'Syncing...' : lastUpdatedDisplay}
            </span>
          </button>
        </div>

        {/* Role badge */}
        <span
          className={`hidden sm:inline-block text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
            isAdmin ? 'bg-[#3B5EFF]/10 text-[#3B5EFF]' : 'bg-amber-500/10 text-amber-400'
          }`}
        >
          {role}
        </span>

        {/* Sign out */}
        <Link
          href="/api/auth/signout"
          className="text-xs sm:text-sm text-ash/60 hover:text-bone transition-colors flex items-center gap-1.5 p-1"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="hidden sm:inline">Sign out</span>
        </Link>
      </div>
    </header>
  );
}
