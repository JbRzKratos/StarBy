'use client';

import { Download, FileText, Printer, Truck } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'compact';

interface DocumentButtonProps {
  orderId: string;
  className?: string;
  variant?: ButtonVariant;
  label?: string;
}

function buttonClass(variant: ButtonVariant, className: string) {
  let base =
    'inline-flex items-center justify-center gap-1.5 font-mono text-xs font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-cobalt/40 cursor-pointer';

  if (variant === 'primary') {
    base +=
      ' bg-cobalt hover:bg-cobalt/90 text-white px-3.5 py-2 shadow-md shadow-cobalt/25 active:scale-[0.98]';
  } else if (variant === 'outline') {
    base +=
      ' bg-transparent hover:bg-white/5 text-slate-200 hover:text-white border border-white/20 px-3 py-1.5 active:scale-[0.98]';
  } else if (variant === 'compact') {
    base +=
      ' bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 px-2.5 py-1.5 text-[11px] active:scale-[0.98]';
  } else {
    base +=
      ' bg-white/10 hover:bg-white/15 text-white border border-white/15 px-3.5 py-2 shadow-sm active:scale-[0.98]';
  }

  return `${base} ${className}`;
}

/** Download the customer invoice / packing slip as a PDF. */
export function AdminDownloadInvoiceButton({
  orderId,
  className = '',
  variant = 'secondary',
  label = 'Invoice PDF',
}: DocumentButtonProps) {
  return (
    <a
      href={`/api/orders/${encodeURIComponent(orderId)}/invoice`}
      download
      title="Download the invoice / packing slip PDF"
      onClick={(event) => event.stopPropagation()}
      className={buttonClass(variant, className)}
    >
      <FileText className="w-3.5 h-3.5 text-slate-300" />
      <span>{label}</span>
      <Download className="w-3 h-3 opacity-60" />
    </a>
  );
}

/** Download the 4×6 courier shipping label (ship-to, RTO return address, barcode). */
export function AdminShippingLabelButton({
  orderId,
  className = '',
  variant = 'primary',
  label = 'Shipping Label',
}: DocumentButtonProps) {
  return (
    <a
      href={`/api/orders/${encodeURIComponent(orderId)}/shipping-label`}
      download
      title="Download the 4×6 shipping label PDF"
      onClick={(event) => event.stopPropagation()}
      className={buttonClass(variant, className)}
    >
      <Truck className="w-3.5 h-3.5" />
      <span>{label}</span>
      <Download className="w-3 h-3 opacity-70" />
    </a>
  );
}

/** Open the shipping label PDF in a new tab so it can be sent to a thermal printer. */
export function AdminPrintShippingLabelButton({
  orderId,
  className = '',
  variant = 'outline',
  label = 'Print Label',
}: DocumentButtonProps) {
  return (
    <a
      href={`/api/orders/${encodeURIComponent(orderId)}/shipping-label?print=1`}
      target="_blank"
      rel="noopener noreferrer"
      title="Open the label PDF for printing on a 4×6 thermal or A4 printer"
      onClick={(event) => event.stopPropagation()}
      className={buttonClass(variant, className)}
    >
      <Printer className="w-3.5 h-3.5 text-slate-300" />
      <span>{label}</span>
    </a>
  );
}
