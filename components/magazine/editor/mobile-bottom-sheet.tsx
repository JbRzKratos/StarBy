'use client';

import React, { useEffect } from 'react';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string | undefined;
  children: React.ReactNode;
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: MobileBottomSheetProps) {
  // Prevent body scrolling when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* ── Transparent Backdrop (Allows Canvas to be clearly seen) ── */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[1.5px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Glassmorphic Bottom Sheet Drawer ── */}
      <div
        className="relative z-10 w-full max-h-[56vh] h-auto bg-[#0E0E12]/80 backdrop-blur-2xl border-t border-white/20 rounded-t-3xl shadow-[0_-12px_45px_rgba(0,0,0,0.65)] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 ease-out"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Grab Handle */}
        <div className="w-full flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/30" />
        </div>

        {/* Sheet Header */}
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div>
            <h2 className="font-display font-bold text-sm text-white">{title}</h2>
            {subtitle && <p className="text-[10px] font-mono text-[#F5F1EA]/60">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center text-xs font-bold transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
