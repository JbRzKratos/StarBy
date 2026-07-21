'use client';

import type { PrintStyle } from '@/store/customizer';

interface PrintStyleSelectorProps {
  value: PrintStyle;
  onChange: (style: PrintStyle) => void;
}

const PRINT_STYLES: { id: PrintStyle; label: string; desc: string; preview: string }[] = [
  {
    id: 'standard',
    label: 'Standard',
    desc: 'Clean full-color print',
    preview: 'none',
  },
  {
    id: 'vintage',
    label: 'Vintage',
    desc: 'Distressed, worn-in look',
    preview: 'sepia(0.45) contrast(1.1) brightness(0.92)',
  },
  {
    id: 'metallic',
    label: 'Metallic Foil',
    desc: 'Silver chrome finish',
    preview: 'saturate(0) brightness(1.5) contrast(1.2)',
  },
  {
    id: 'embroidered',
    label: 'Embroidered',
    desc: '3D stitched texture',
    preview: 'contrast(1.4) saturate(0.7) brightness(0.95)',
  },
];

export function PrintStyleSelector({ value, onChange }: PrintStyleSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-mono text-caption text-bone uppercase tracking-widest">Print Style</h3>
      <div className="grid grid-cols-2 gap-2">
        {PRINT_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onChange(style.id)}
            className={`relative flex flex-col gap-1 p-3 rounded-sm border text-left transition-all ${
              value === style.id
                ? 'border-cobalt bg-cobalt/10'
                : 'border-smoke/40 bg-charcoal hover:border-smoke'
            }`}
          >
            {/* Tiny preview swatch */}
            <div
              className="w-full h-8 rounded-sm mb-1 overflow-hidden relative"
              style={{
                background: 'linear-gradient(135deg, #C45D3E 0%, #3B5EFF 50%, #0E0E0F 100%)',
              }}
            >
              <div
                className="absolute inset-0"
                style={{ filter: style.preview === 'none' ? undefined : style.preview }}
              >
                <div className="w-full h-full" style={{ background: 'inherit' }} />
              </div>
              {/* Embroidered pattern overlay */}
              {style.id === 'embroidered' && (
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.15) 3px, rgba(255,255,255,0.15) 4px), repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.15) 3px, rgba(255,255,255,0.15) 4px)',
                  }}
                />
              )}
              {/* Metallic shimmer */}
              {style.id === 'metallic' && (
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    background:
                      'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%)',
                  }}
                />
              )}
            </div>
            <span
              className={`font-mono text-[10px] uppercase tracking-widest ${value === style.id ? 'text-cobalt' : 'text-pearl'}`}
            >
              {style.label}
            </span>
            <span className="font-mono text-[9px] text-ash">{style.desc}</span>
            {value === style.id && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cobalt" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// CSS filter map — used by the canvas to apply the print style
export const PRINT_STYLE_FILTERS: Record<PrintStyle, string> = {
  standard: 'none',
  vintage: 'sepia(0.45) contrast(1.1) brightness(0.92)',
  metallic: 'saturate(0) brightness(1.5) contrast(1.2)',
  embroidered: 'contrast(1.4) saturate(0.7) brightness(0.95)',
};
