'use client';

export function PrintInvoiceButton() {
  return (
    <button
      onClick={() => {
        if (typeof window !== 'undefined') window.print();
      }}
      className="bg-black text-white px-6 py-2 rounded shadow hover:bg-gray-800 transition-colors"
    >
      Print Invoice
    </button>
  );
}
