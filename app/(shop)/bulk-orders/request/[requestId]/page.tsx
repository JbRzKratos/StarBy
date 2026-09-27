import type { Metadata } from 'next';
import { CustomerRequestView } from '@/components/bulk-orders/customer-request-view';

interface RequestPageProps {
  params: {
    requestId: string;
  };
}

export async function generateMetadata({ params }: RequestPageProps): Promise<Metadata> {
  return {
    title: `Bulk Request ${params.requestId} | Fregoro Studios`,
    description: `Track status, review quotations, and coordinate production for bulk order request ${params.requestId}.`,
  };
}

export default function BulkRequestPage({ params }: RequestPageProps) {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <CustomerRequestView requestId={params.requestId} />
    </main>
  );
}
