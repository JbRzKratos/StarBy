import type { Metadata } from 'next';
import { CustomizerClient } from '@/components/customizer/Customizer.client';

export const metadata: Metadata = {
  title: 'Skin Customizer — Fregoro Studios',
  description: 'Design a precision-cut vinyl skin for your phone or laptop.',
};

export default function CustomizeSkinPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <CustomizerClient productId="phantom-skin" />
    </main>
  );
}
