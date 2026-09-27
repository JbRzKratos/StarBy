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

  const submissions = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const formatted: AdminContactSubmission[] = submissions.map((sub) => ({
    id: sub.id,
    name: sub.name,
    email: sub.email,
    phone: sub.phone,
    company: sub.company,
    subject: sub.subject,
    message: sub.message,
    status: sub.status,
    emailStatus: sub.emailStatus,
    emailError: sub.emailError,
    createdAt: sub.createdAt.toISOString(),
    updatedAt: sub.updatedAt.toISOString(),
  }));

  return <AdminContactClient initialSubmissions={formatted} />;
}
