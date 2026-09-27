'use client';

import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface CustomQuantityStepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomQuantityStepper({
  value = 0,
  onChange,
  min = 0,
  max = 100000,
  step = 1,
  size = 'md',
  label,
  className = '',
  disabled = false,
}: CustomQuantityStepperProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = raw === '' ? min : Math.min(max, Math.max(min, parseInt(raw, 10)));
    onChange(num);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(Math.max(min, value - step));
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(Math.min(max, value + step));
  };

  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-11 px-3 text-sm',
    lg: 'h-14 px-4 text-base',
  };

  const btnSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-mono text-pearl/70 uppercase tracking-wider font-semibold">
          {label}
        </label>
      )}

      <div
        className={`inline-flex items-center rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 focus-within:border-[#3B5EFF] focus-within:shadow-[0_0_15px_rgba(59,94,255,0.2)] transition-all ${
          sizeClasses[size]
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className={`${btnSizes[size]} rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-white/5 text-pearl hover:text-white flex items-center justify-center transition-colors cursor-pointer select-none`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          className="w-16 text-center font-mono font-bold text-white bg-transparent focus:outline-none"
        />

        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className={`${btnSizes[size]} rounded-lg bg-white/5 hover:bg-[#3B5EFF] disabled:opacity-30 disabled:hover:bg-white/5 text-pearl hover:text-white flex items-center justify-center transition-colors cursor-pointer select-none`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
