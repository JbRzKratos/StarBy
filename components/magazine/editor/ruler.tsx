'use client';

import React from 'react';

interface RulerProps {
  orientation: 'horizontal' | 'vertical';
  lengthMm: number;
  zoom?: number | undefined;
  cursorPosMm?: number | undefined;
}

export function CanvasRuler({ orientation, lengthMm, cursorPosMm }: RulerProps) {
  const isHorizontal = orientation === 'horizontal';

  // Generate tick marks in 10mm increments
  const step = 10; // mm
  const ticks = [];
  for (let mm = 0; mm <= lengthMm; mm += step) {
    const isMajor = mm % 50 === 0;
    ticks.push({ mm, isMajor });
  }

  return (
    <div
      className={`select-none bg-[#0E0E10] text-[#F5F1EA]/50 font-mono text-[8px] border-[#F5F1EA]/10 relative overflow-hidden ${
        isHorizontal
          ? 'h-5 w-full border-b flex items-end'
          : 'w-5 h-full border-r flex flex-col items-end'
      }`}
    >
      {ticks.map(({ mm, isMajor }) => {
        const percent = (mm / lengthMm) * 100;

        return (
          <div
            key={mm}
            className="absolute flex items-center justify-center pointer-events-none"
            style={
              isHorizontal
                ? { left: `${percent}%`, bottom: 0, height: isMajor ? '12px' : '6px' }
                : { top: `${percent}%`, right: 0, width: isMajor ? '12px' : '6px' }
            }
          >
            <div
              className={`bg-[#F5F1EA]/30 ${isHorizontal ? 'w-[1px] h-full' : 'h-[1px] w-full'}`}
            />
            {isMajor && mm > 0 && mm < lengthMm && (
              <span
                className={`absolute text-[7px] text-[#F5F1EA]/60 font-semibold ${
                  isHorizontal ? 'bottom-2 -left-2' : 'right-2 -top-1.5'
                }`}
              >
                {mm}
              </span>
            )}
          </div>
        );
      })}

      {/* ── Active Cursor Guide Indicator ── */}
      {cursorPosMm !== undefined && cursorPosMm >= 0 && cursorPosMm <= lengthMm && (
        <div
          className={`absolute pointer-events-none bg-[#0057FF] z-20 ${
            isHorizontal ? 'w-[1.5px] h-full top-0' : 'h-[1.5px] w-full left-0'
          }`}
          style={
            isHorizontal
              ? { left: `${(cursorPosMm / lengthMm) * 100}%` }
              : { top: `${(cursorPosMm / lengthMm) * 100}%` }
          }
        />
      )}
    </div>
  );
}
