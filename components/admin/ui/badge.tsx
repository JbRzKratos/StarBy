interface BadgeProps {
  variant: 'processing' | 'placed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'low-stock' | 'out-of-stock' | 'active' | 'draft' | 'paid' | 'pending' | 'admin' | 'staff' | 'customer';
  label?: string;
}

const VARIANTS: Record<BadgeProps['variant'], string> = {
  processing: 'bg-amber-100 text-amber-800',
  placed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-700',
  'low-stock': 'bg-orange-100 text-orange-800',
  'out-of-stock': 'bg-red-100 text-red-800',
  active: 'bg-green-100 text-green-800',
  draft: 'bg-gray-100 text-gray-600',
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  admin: 'bg-[#3B5EFF]/10 text-[#3B5EFF]',
  staff: 'bg-amber-100 text-amber-700',
  customer: 'bg-gray-100 text-gray-600',
};

export function AdminBadge({ variant, label }: BadgeProps) {
  const displayLabel = label || variant.replace('-', ' ');
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${VARIANTS[variant]}`}>
      {displayLabel}
    </span>
  );
}
