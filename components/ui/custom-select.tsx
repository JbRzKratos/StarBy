'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface CustomSelectProps {
  value?: string;
  onChange: (val: string) => void;
  options: Array<SelectOption | string>;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  label,
  required = false,
  className = '',
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to { value, label, description }
  const normalizedOptions: SelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((o) => o.value === value);

  // Vertical flip detection if space below is limited
  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const menuHeight = 280;
      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className} ${isOpen ? 'z-40' : 'z-10'}`}
    >
      {label && (
        <label className="block text-xs font-mono text-pearl/70 uppercase tracking-wider font-semibold mb-2">
          {label} {required && <span className="text-[#3B5EFF]">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-4 py-3.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-[#18181B] border-[#3B5EFF] shadow-[0_0_15px_rgba(59,94,255,0.25)]'
            : 'bg-white/[0.04] hover:bg-white/[0.06] border-white/10 hover:border-white/20'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`truncate font-mono text-sm ${
            selectedOption ? 'text-white font-medium' : 'text-pearl/40'
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <ChevronDown
          className={`w-4 h-4 text-pearl/50 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#3B5EFF]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          className={`absolute ${
            openUpward ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]'
          } left-0 z-[90] w-full max-h-64 overflow-y-auto p-1.5 rounded-2xl bg-[#121214] border border-white/15 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 space-y-1`}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-left font-mono text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#3B5EFF]/20 text-white font-bold'
                    : 'text-pearl/80 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="truncate">
                  <div className="truncate">{opt.label}</div>
                  {opt.description && (
                    <div className="text-[10px] text-pearl/40 font-sans font-normal truncate mt-0.5">
                      {opt.description}
                    </div>
                  )}
                </div>

                {isSelected && <Check className="w-4 h-4 text-[#3B5EFF] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
