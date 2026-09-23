'use client';

import { useState } from 'react';
import { Printer, Loader2, Check } from 'lucide-react';

interface AdminPrintInvoiceButtonProps {
  orderId: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'compact';
  label?: string;
}

export function AdminPrintInvoiceButton({
  orderId,
  className = '',
  variant = 'secondary',
  label = 'Print Invoice',
}: AdminPrintInvoiceButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [justPrinted, setJustPrinted] = useState(false);

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPrinting) return;
    setIsPrinting(true);

    try {
      // Create hidden iframe to trigger seamless print on the connected PC printer
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      iframe.setAttribute('aria-hidden', 'true');
      iframe.src = `/account/orders/${encodeURIComponent(orderId)}/invoice?print=1`;

      let hasTriggered = false;

      const executePrint = () => {
        if (hasTriggered) return;
        hasTriggered = true;

        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } else {
            throw new Error('No contentWindow available');
          }
        } catch (err) {
          console.warn('Iframe print access failed, opening invoice in new tab:', err);
          window.open(`/account/orders/${encodeURIComponent(orderId)}/invoice?print=1`, '_blank');
        } finally {
          setIsPrinting(false);
          setJustPrinted(true);
          setTimeout(() => setJustPrinted(false), 2500);

          // Clean up DOM iframe after print dialog opens
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 4000);
        }
      };

      iframe.onload = () => {
        // Allow invoice typography, styles, and tables to settle
        setTimeout(executePrint, 350);
      };

      // Failsafe timeout in case iframe onload does not fire
      setTimeout(() => {
        if (!hasTriggered) {
          executePrint();
        }
      }, 3500);

      document.body.appendChild(iframe);
    } catch (err) {
      console.error('Error triggering invoice print:', err);
      window.open(`/account/orders/${encodeURIComponent(orderId)}/invoice?print=1`, '_blank');
      setIsPrinting(false);
    }
  };

  let baseStyle =
    'inline-flex items-center justify-center gap-1.5 font-mono text-xs font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-cobalt/40 disabled:opacity-50 cursor-pointer';

  if (variant === 'primary') {
    baseStyle +=
      ' bg-cobalt hover:bg-cobalt/90 text-white px-3.5 py-2 shadow-md shadow-cobalt/25 active:scale-[0.98]';
  } else if (variant === 'outline') {
    baseStyle +=
      ' bg-transparent hover:bg-white/5 text-slate-200 hover:text-white border border-white/20 px-3 py-1.5 active:scale-[0.98]';
  } else if (variant === 'compact') {
    baseStyle +=
      ' bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 px-2.5 py-1.5 text-[11px] active:scale-[0.98]';
  } else {
    // secondary default
    baseStyle +=
      ' bg-white/10 hover:bg-white/15 text-white border border-white/15 px-3.5 py-2 shadow-sm active:scale-[0.98]';
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      disabled={isPrinting}
      title="Print invoice to connected printer"
      className={`${baseStyle} ${className}`}
    >
      {isPrinting ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-cobalt" />
          <span>Sending to Printer…</span>
        </>
      ) : justPrinted ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Printed ✓</span>
        </>
      ) : (
        <>
          <Printer className="w-3.5 h-3.5 text-slate-300" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
