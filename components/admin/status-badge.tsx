export type StatusVariant = 'success' | 'pending' | 'info' | 'danger' | 'default';

export interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
}

export function getStatusVariant(status: string): StatusVariant {
  const s = status.toLowerCase();

  // Success
  if (['delivered', 'paid', 'completed', 'in_stock', 'active'].includes(s)) {
    return 'success';
  }

  // Pending
  if (['processing', 'pending', 'pending_payment', 'low_stock'].includes(s)) {
    return 'pending';
  }

  // Info
  if (['shipped', 'out_for_delivery', 'placed'].includes(s)) {
    return 'info';
  }

  // Danger
  if (['cancelled', 'refunded', 'failed', 'out_of_stock', 'inactive'].includes(s)) {
    return 'danger';
  }

  return 'default';
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const activeVariant = variant || getStatusVariant(status);

  const baseClasses =
    'px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest rounded-sm border whitespace-nowrap';

  const variantClasses = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    pending: 'bg-[#ED9518]/10 text-[#ED9518] border-[#ED9518]/20',
    info: 'bg-cobalt/10 text-cobalt border-cobalt/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    default: 'bg-smoke/10 text-pearl border-smoke/20',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[activeVariant]}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
