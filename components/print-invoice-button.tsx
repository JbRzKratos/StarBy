'use client';

import { useEffect } from 'react';

export function PrintInvoiceButton() {
  return (
    <button
      onClick={() => {
        if (typeof window !== 'undefined') window.print();
      }}
      className="bg-black text-white px-6 py-2 rounded shadow hover:bg-gray-800 transition-colors cursor-pointer"
    >
      Print Invoice
    </button>
  );
}

export function AutoPrintTrigger({ enabled }: { enabled?: boolean }) {
  useEffect(() => {
    if (enabled && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [enabled]);

  return null;
}
