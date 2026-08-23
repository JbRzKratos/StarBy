import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping — Fregoro Studios',
  description: 'Fregoro Studios shipping information, delivery times, and policies.',
};

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
