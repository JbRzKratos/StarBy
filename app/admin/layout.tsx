import type { ReactNode } from 'react';
import { requireStaff } from './lib/auth';
import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminTopbar } from '@/components/admin/topbar';

export const metadata = { title: 'Admin — StarBy' };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Server-side RBAC gate — CUSTOMER users are redirected to /
  const user = await requireStaff();

  return (
    <div className="admin-root min-h-screen bg-gray-50 font-sans">
      {/* Fixed sidebar */}
      <AdminSidebar isAdmin={user.isAdmin} userEmail={user.email} userName={user.fullName || ''} />

      {/* Fixed topbar (offset by sidebar width) */}
      <AdminTopbar isAdmin={user.isAdmin} role={user.role} />

      {/* Main content — offset left by sidebar, top by topbar */}
      <main className="ml-60 mt-[60px] min-h-[calc(100vh-60px)] p-6">{children}</main>
    </div>
  );
}
