'use client';

import React from 'react';

export interface Guide {
  type: 'horizontal' | 'vertical';
  position: number; // percentage (0 - 100)
  label?: string;
}

interface SmartGuidesProps {
  guides: Guide[];
}

export function SmartGuidesOverlay({ guides }: SmartGuidesProps) {
  if (guides.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {guides.map((guide, idx) => {
        const isHorizontal = guide.type === 'horizontal';

        return (
          <div
            key={idx}
            className="absolute flex items-center justify-center"
            style={
              isHorizontal
                ? {
                    top: `${guide.position}%`,
                    left: 0,
                    right: 0,
                    height: '1px',
                  }
                : {
                    left: `${guide.position}%`,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                  }
            }
          >
            <div
              className={`bg-fuchsia-500 shadow-[0_0_4px_rgba(217,70,239,0.8)] ${
                isHorizontal ? 'w-full h-[1px]' : 'h-full w-[1px]'
              }`}
            />
            {guide.label && (
              <span
                className={`absolute bg-fuchsia-600 text-white font-mono text-[8px] px-1 py-0.2 rounded font-bold uppercase shadow ${
                  isHorizontal ? 'right-2 -top-3' : 'top-2 -left-3'
                }`}
              >
                {guide.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
