'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CustomDatePickerProps {
  value?: string; // ISO date string 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS_OF_WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function CustomDatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select date (DD / MM / YYYY)',
  label,
  required = false,
  className = '',
  disabled = false,
}: CustomDatePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);

  // Parse initial date or default to current date
  const selectedDate = value ? new Date(value + 'T00:00:00') : null;
  const initialDisplayDate =
    selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate : minDate || new Date();

  const [viewYear, setViewYear] = useState(initialDisplayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDisplayDate.getMonth()); // 0-indexed

  // Smart vertical position calculation for desktop popover
  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const calendarHeight = 420; // Height of calendar popover including presets
      if (spaceBelow < calendarHeight && spaceAbove > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, []);

  // Update position on open and scroll/resize
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

  // Lock body scroll on mobile viewports when open
  useEffect(() => {
    if (isOpen && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close calendar popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Update calendar view when value changes from outside
  useEffect(() => {
    if (value) {
      const parsed = new Date(value + 'T00:00:00');
      if (!isNaN(parsed.getTime())) {
        setViewYear(parsed.getFullYear());
        setViewMonth(parsed.getMonth());
      }
    }
  }, [value]);

  // Helper to format date display (e.g., "15 Oct 2026")
  const formatDisplay = (date: Date | null) => {
    if (!date || isNaN(date.getTime())) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = MONTH_NAMES[date.getMonth()].slice(0, 3);
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Navigate months
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Generate calendar days matrix
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfWeek = (year: number, month: number) => {
    // 0 is Sunday, 1 is Monday ... convert to Monday = 0
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInCurrentMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOffset = getFirstDayOfWeek(viewYear, viewMonth);

  // Days from previous month to fill the first row
  const prevMonthDays = getDaysInMonth(
    viewMonth === 0 ? viewYear - 1 : viewYear,
    viewMonth === 0 ? 11 : viewMonth - 1,
  );

  const handleSelectDate = (year: number, month: number, day: number) => {
    const formatted = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  // Check if date is disabled (before minDate or after maxDate)
  const isDateDisabled = (year: number, month: number, day: number) => {
    const target = new Date(year, month, day, 23, 59, 59, 999);
    if (minDate) {
      const min = new Date(minDate);
      min.setHours(0, 0, 0, 0);
      if (target < min) return true;
    }
    if (maxDate) {
      const max = new Date(maxDate);
      max.setHours(23, 59, 59, 999);
      if (target > max) return true;
    }
    return false;
  };

  const isToday = (year: number, month: number, day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  const isSelected = (year: number, month: number, day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
  };

  // Quick preset actions (+7 days, +14 days, +30 days)
  const setQuickPreset = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const formatted = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    onChange(formatted);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setIsOpen(false);
  };

  // Reusable Calendar Inner Component
  const renderCalendarContent = () => (
    <>
      {/* Calendar Header Month & Year */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 sm:p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-pearl/70 hover:text-white transition-colors cursor-pointer"
          title="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="text-center font-mono">
          <span className="text-xs uppercase font-bold text-white tracking-wider">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 sm:p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-pearl/70 hover:text-white transition-colors cursor-pointer"
          title="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {DAYS_OF_WEEK.map((day) => (
          <span
            key={day}
            className="font-mono text-[10px] text-pearl/50 uppercase font-semibold py-1"
          >
            {day}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
        {/* Previous month padding days */}
        {Array.from({ length: firstDayOffset }).map((_, i) => {
          const dayNum = prevMonthDays - firstDayOffset + i + 1;
          return (
            <div
              key={`prev-${i}`}
              className="py-2.5 sm:py-2 text-pearl/20 text-[11px] cursor-not-allowed select-none"
            >
              {dayNum}
            </div>
          );
        })}

        {/* Current month days */}
        {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
          const dayNum = i + 1;
          const disabledDay = isDateDisabled(viewYear, viewMonth, dayNum);
          const selected = isSelected(viewYear, viewMonth, dayNum);
          const today = isToday(viewYear, viewMonth, dayNum);

          return (
            <button
              key={`curr-${dayNum}`}
              type="button"
              disabled={disabledDay}
              onClick={() => handleSelectDate(viewYear, viewMonth, dayNum)}
              className={`py-2.5 sm:py-2 px-1 rounded-xl text-xs font-mono font-medium transition-all relative cursor-pointer ${
                disabledDay
                  ? 'text-pearl/20 cursor-not-allowed'
                  : selected
                    ? 'bg-[#3B5EFF] text-white font-bold shadow-lg shadow-[#3B5EFF]/40 scale-105 z-10'
                    : today
                      ? 'border border-[#3B5EFF]/50 text-white hover:bg-white/10'
                      : 'text-pearl/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{dayNum}</span>
              {today && !selected && (
                <span className="w-1 h-1 rounded-full bg-[#3B5EFF] absolute bottom-1 left-1/2 -translate-x-1/2" />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Preset Buttons */}
      <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
        <span className="font-mono text-[9px] uppercase tracking-wider text-pearl/40 block">
          Quick Timelines:
        </span>
        <div className="grid grid-cols-3 gap-2 sm:gap-1.5 font-mono text-[10px]">
          <button
            type="button"
            onClick={() => setQuickPreset(7)}
            className="py-2 sm:py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-pearl/80 hover:text-white transition-colors cursor-pointer text-center"
          >
            +1 Week
          </button>
          <button
            type="button"
            onClick={() => setQuickPreset(14)}
            className="py-2 sm:py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-pearl/80 hover:text-white transition-colors cursor-pointer text-center"
          >
            +2 Weeks
          </button>
          <button
            type="button"
            onClick={() => setQuickPreset(30)}
            className="py-2 sm:py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-pearl/80 hover:text-white transition-colors cursor-pointer text-center"
          >
            +1 Month
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className} ${isOpen ? 'z-50' : 'z-10'}`}
    >
      {label && (
        <label className="block text-xs font-mono text-pearl/70 uppercase tracking-wider font-semibold mb-2">
          {label} {required && <span className="text-[#3B5EFF]">*</span>}
        </label>
      )}

      {/* Input Trigger Button */}
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
        <div className="flex items-center gap-3 overflow-hidden">
          <CalendarIcon
            className={`w-4 h-4 shrink-0 transition-colors ${
              selectedDate ? 'text-[#3B5EFF]' : 'text-pearl/40'
            }`}
          />
          {selectedDate ? (
            <span className="font-mono text-sm font-semibold text-white tracking-wide">
              {formatDisplay(selectedDate)}
            </span>
          ) : (
            <span className="text-sm font-mono text-pearl/40">{placeholder}</span>
          )}
        </div>

        {value && !disabled && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="p-1 rounded-md text-pearl/40 hover:text-white hover:bg-white/10 transition-colors"
            title="Clear date"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {/* DESKTOP POPOVER (Anchored, auto flips vertically if near screen bottom) */}
      {isOpen && (
        <div
          className={`hidden sm:block absolute ${
            openUpward ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'
          } left-0 z-[100] w-[340px] p-4 rounded-2xl bg-[#121214] border border-white/20 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150`}
        >
          {renderCalendarContent()}
        </div>
      )}

      {/* MOBILE MODAL DIALOG (Centered, with backdrop to guarantee zero overlap/clipping on any phone screen) */}
      {isOpen && (
        <div
          className="sm:hidden fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-[340px] p-5 rounded-3xl bg-[#121214] border border-white/20 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="font-mono text-[9px] text-[#3B5EFF] uppercase font-bold tracking-widest block">
                  Delivery Target
                </span>
                <span className="font-mono text-xs font-bold text-white uppercase">
                  Select Required Date
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-pearl/60 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {renderCalendarContent()}
          </div>
        </div>
      )}
    </div>
  );
}
