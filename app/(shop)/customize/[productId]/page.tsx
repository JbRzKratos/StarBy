import type { Metadata } from 'next';
import { CustomizerClient } from '@/components/customizer/Customizer.client';


interface CustomizePageProps {
  params: { productId: string };
}

export async function generateMetadata({ params }: CustomizePageProps): Promise<Metadata> {
  return {
    title: `Customize — ${params.productId}`,
    description: 'Design your own. Use our live customizer.',
  };
}

export default function CustomizePage({ params }: CustomizePageProps) {
  return (
    <main className="min-h-screen bg-charcoal">
      <CustomizerClient productId={params.productId} />
    </main>
  );
}
