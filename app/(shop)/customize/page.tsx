import type { Metadata } from 'next';
import { CustomizerHubClient } from '@/components/customizer-hub/CustomizerHub.client';

export const metadata: Metadata = {
  title: 'Customize — StarBy',
  description: 'Upload your photo and preview it across our entire custom product catalog.',
};

export default function CustomizerHubPage() {
  return (
    <main className="min-h-screen bg-charcoal">
      <CustomizerHubClient />
    </main>
  );
}
