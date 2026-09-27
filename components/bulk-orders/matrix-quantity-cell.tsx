'use client';

import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

interface MatrixQuantityCellProps {
  value: number | undefined;
  onChange: (newValue: number) => void;
  sizeLabel: string;
  colorName: string;
}

export function MatrixQuantityCell({
  value = 0,
  onChange,
  sizeLabel,
  colorName,
}: MatrixQuantityCellProps) {
  const [isFocused, setIsFocused] = useState(false);
  const qty = Number(value) || 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = raw === '' ? 0 : Math.max(0, parseInt(raw, 10));
    onChange(num);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const step = e.shiftKey ? 5 : 1;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(qty + step);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(0, qty - step));
    }
  };

  const increment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(qty + 1);
  };

  const decrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(Math.max(0, qty - 1));
  };

  const hasValue = qty > 0;

  return (
    <div
      className={`group relative inline-flex items-center justify-center rounded-xl transition-all duration-200 ${
        hasValue
          ? 'bg-[#3B5EFF]/15 border border-[#3B5EFF]/60 shadow-[0_0_12px_rgba(59,94,255,0.18)]'
          : 'bg-black/50 border border-white/10 hover:border-white/20'
      } ${isFocused ? 'ring-2 ring-[#3B5EFF] border-transparent' : ''}`}
    >
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={`${colorName} ${sizeLabel} quantity`}
        placeholder="0"
        value={qty === 0 ? '' : qty}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-14 sm:w-16 h-10 px-1 text-center font-mono text-xs font-semibold focus:outline-none bg-transparent transition-colors ${
          hasValue ? 'text-white font-bold' : 'text-pearl/40 placeholder-pearl/20'
        }`}
      />

      {/* Micro Stepper Buttons (+ / -) appearing on hover/focus */}
      <div className="absolute right-0.5 top-1/2 -translate-y-1/2 hidden group-hover:flex group-focus-within:flex flex-col gap-0.5 pr-0.5 select-none z-10">
        <button
          type="button"
          tabIndex={-1}
          onClick={increment}
          className="w-3.5 h-3.5 rounded bg-white/10 hover:bg-[#3B5EFF] text-pearl hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          title={`Increase ${sizeLabel}`}
        >
          <Plus className="w-2.5 h-2.5" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onClick={decrement}
          disabled={qty <= 0}
          className="w-3.5 h-3.5 rounded bg-white/10 hover:bg-rose-500/80 disabled:opacity-30 disabled:hover:bg-white/10 text-pearl hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          title={`Decrease ${sizeLabel}`}
        >
          <Minus className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}
