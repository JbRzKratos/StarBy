'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

  // Build breadcrumb
  const parts = pathname.split('/').filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [];
  let current = '';
  for (const part of parts) {
    current += `/${part}`;
    const label = BREADCRUMB_MAP[current] || part.charAt(0).toUpperCase() + part.slice(1);
    breadcrumbs.push({ label, href: current });
  }

  return (
    <header className="fixed top-0 right-0 left-60 h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40 transition-[left] duration-300">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-300">/</span>}
            {i === breadcrumbs.length - 1 ? (
              <span className="font-semibold text-gray-900">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Role badge */}
        <span
          className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
            isAdmin ? 'bg-[#3B5EFF]/10 text-[#3B5EFF]' : 'bg-amber-100 text-amber-700'
          }`}
        >
          {role}
        </span>

        {/* Sign out */}
        <Link
          href="/api/auth/signout"
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1.5"
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
          Sign out
        </Link>
      </div>
    </header>
  );
}
