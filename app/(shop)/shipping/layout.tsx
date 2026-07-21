import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping',
  description: 'StarBy shipping information, delivery times, and policies.',
};

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
