interface BadgeProps {
  variant:
    | 'processing'
    | 'placed'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded'
    | 'low-stock'
    | 'out-of-stock'
    | 'active'
    | 'draft'
    | 'paid'
    | 'pending'
    | 'admin'
    | 'staff'
    | 'customer';
  label?: string;
}

const VARIANTS: Record<BadgeProps['variant'], string> = {
  processing: 'bg-amber-500/15 text-amber-400',
  placed: 'bg-blue-500/15 text-blue-400',
  shipped: 'bg-indigo-500/15 text-indigo-400',
  delivered: 'bg-green-500/15 text-green-400',
  cancelled: 'bg-red-500/15 text-red-400',
  refunded: 'bg-white/5 text-ash',
  'low-stock': 'bg-orange-500/15 text-orange-400',
  'out-of-stock': 'bg-red-500/15 text-red-400',
  active: 'bg-green-500/15 text-green-400',
  draft: 'bg-white/5 text-ash/80',
  paid: 'bg-green-500/15 text-green-400',
  pending: 'bg-amber-500/15 text-amber-400',
  admin: 'bg-[#3B5EFF]/10 text-[#3B5EFF]',
  staff: 'bg-amber-500/15 text-amber-400',
  customer: 'bg-white/5 text-ash/80',
};

export function AdminBadge({ variant, label }: BadgeProps) {
  const displayLabel = label || variant.replace('-', ' ');
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${VARIANTS[variant]}`}
    >
      {displayLabel}
    </span>
  );
}
