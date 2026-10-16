import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/app/admin/lib/auth';
import {
  AdminContactClient,
  type AdminContactSubmission,
} from '@/components/admin/contact/admin-contact-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contact Enquiries — Admin Fregoro Studios',
};

export default async function AdminContactPage() {
  await requireStaff();

  let formatted: AdminContactSubmission[] = [];

  try {
    const submissions = await prisma.contactSubmission.findMany({
      orderBy: { createdAt: 'desc' },
    });

    formatted = (Array.isArray(submissions) ? submissions : []).map((sub) => ({
      id: sub.id,
      name: sub.name || '—',
      email: sub.email || '—',
      phone: sub.phone,
      company: sub.company,
      subject: sub.subject || 'No Subject',
      message: sub.message || '',
      status: sub.status || 'UNREAD',
      emailStatus: sub.emailStatus,
      emailError: sub.emailError,
      createdAt: sub.createdAt ? sub.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: sub.updatedAt ? sub.updatedAt.toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error('[AdminContactPage] Error loading contact submissions:', err);
  }

  return <AdminContactClient initialSubmissions={formatted} />;
}
