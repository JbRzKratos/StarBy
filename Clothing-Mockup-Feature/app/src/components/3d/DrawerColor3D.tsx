import React from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';

interface DrawerColor3DProps {
  garmentColor: string;
  onColorChange: (color: string) => void;
  roughness: number;
  onRoughnessChange: (val: number) => void;
  metalness: number;
  onMetalnessChange: (val: number) => void;
}

const COLOR_SWATCHES = [
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Off-White / Cream', hex: '#f4f3ee' },
  { name: 'Heather Grey', hex: '#9ca3af' },
  { name: 'Charcoal', hex: '#374151' },
  { name: 'Carbon Black', hex: '#111215' },
  { name: 'Navy Blue', hex: '#1e293b' },
  { name: 'Royal Cobalt', hex: '#1d4ed8' },
  { name: 'Crimson Red', hex: '#991b1b' },
  { name: 'Burgundy', hex: '#581c87' },
  { name: 'Vintage Olive', hex: '#364032' },
  { name: 'Forest Green', hex: '#14532d' },
  { name: 'Desert Sand', hex: '#d6cbbe' },
  { name: 'Mustard Gold', hex: '#ca8a04' },
  { name: 'Terracotta', hex: '#9a3412' },
  { name: 'Dusty Rose', hex: '#f43f5e' },
  { name: 'Lavender Mist', hex: '#c084fc' },
];

export const DrawerColor3D: React.FC<DrawerColor3DProps> = ({
  garmentColor,
  onColorChange,
  roughness,
  onRoughnessChange,
  metalness,
  onMetalnessChange,
}) => {
  return (
    <div className="drawer-content" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="drawer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Palette size={18} className="text-accent" />
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Garment Color & Fabric</h2>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          PBR Surface Response
        </span>
      </div>

      {/* Swatches Grid */}
      <div>
        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
          Fabric Color Palette:
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
          }}
        >
          {COLOR_SWATCHES.map((swatch) => {
            const isSelected = garmentColor.toLowerCase() === swatch.hex.toLowerCase();
            const isLight = swatch.hex === '#ffffff' || swatch.hex === '#f4f3ee' || swatch.hex === '#d6cbbe';
            return (
              <button
                key={swatch.hex}
                onClick={() => onColorChange(swatch.hex)}
                title={swatch.name}
                style={{
                  height: '42px',
                  borderRadius: 'var(--radius-md, 8px)',
                  background: swatch.hex,
                  border: isSelected ? '2px solid var(--accent, #3B5EFF)' : '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isSelected ? '0 0 12px rgba(0,214,255,0.4)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {isSelected && (
                  <Check
                    size={16}
                    strokeWidth={3}
                    style={{ color: isLight ? '#000' : '#fff' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Input */}
      <div
        style={{
          background: 'var(--bg-card, #131722)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="color"
            value={garmentColor}
            onChange={(e) => onColorChange(e.target.value)}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              background: 'transparent',
            }}
          />
          <span style={{ fontSize: '12px', fontWeight: 600 }}>Custom Hex</span>
        </div>
        <input
          type="text"
          value={garmentColor}
          onChange={(e) => onColorChange(e.target.value)}
          style={{
            width: '90px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '12px',
            color: '#fff',
            fontFamily: 'monospace',
            textAlign: 'center',
          }}
        />
      </div>

      {/* Fabric Material Parameters */}
      <div
        style={{
          background: 'var(--bg-card, #131722)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main, #fff)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color="#3B5EFF" />
          <span>Surface & Textile Character</span>
        </div>

        {/* Fabric Character Presets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          <button
            onClick={() => {
              onRoughnessChange(0.85);
              onMetalnessChange(0.0);
            }}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              background: roughness >= 0.83 && roughness <= 0.87 ? 'rgba(0, 214, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: roughness >= 0.83 && roughness <= 0.87 ? '1px solid #3B5EFF' : '1px solid rgba(255, 255, 255, 0.1)',
              color: roughness >= 0.83 && roughness <= 0.87 ? '#3B5EFF' : '#fff',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cotton Matte
          </button>
          <button
            onClick={() => {
              onRoughnessChange(0.92);
              onMetalnessChange(0.0);
            }}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              background: roughness > 0.88 ? 'rgba(0, 214, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: roughness > 0.88 ? '1px solid #3B5EFF' : '1px solid rgba(255, 255, 255, 0.1)',
              color: roughness > 0.88 ? '#3B5EFF' : '#fff',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Fleece Sweatshirt
          </button>
          <button
            onClick={() => {
              onRoughnessChange(0.76);
              onMetalnessChange(0.02);
            }}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              background: roughness >= 0.72 && roughness <= 0.80 ? 'rgba(0, 214, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: roughness >= 0.72 && roughness <= 0.80 ? '1px solid #3B5EFF' : '1px solid rgba(255, 255, 255, 0.1)',
              color: roughness >= 0.72 && roughness <= 0.80 ? '#3B5EFF' : '#fff',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Twill / Denim
          </button>
          <button
            onClick={() => {
              onRoughnessChange(0.55);
              onMetalnessChange(0.05);
            }}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              background: roughness <= 0.65 ? 'rgba(0, 214, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: roughness <= 0.65 ? '1px solid #3B5EFF' : '1px solid rgba(255, 255, 255, 0.1)',
              color: roughness <= 0.65 ? '#3B5EFF' : '#fff',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tech Synthetic
          </button>
        </div>

        {/* Roughness */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>Fabric Roughness</span>
            <span>{Math.round(roughness * 100)}% ({roughness > 0.8 ? 'Matte' : roughness > 0.5 ? 'Standard' : 'Sheen'})</span>
          </div>
          <input
            type="range"
            min={0.2}
            max={1.0}
            step={0.02}
            value={roughness}
            onChange={(e) => onRoughnessChange(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#3B5EFF' }}
          />
        </div>

        {/* Metalness */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>Metallic Luster</span>
            <span>{Math.round(metalness * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.0}
            max={0.5}
            step={0.01}
            value={metalness}
            onChange={(e) => onMetalnessChange(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#3B5EFF' }}
          />
        </div>
      </div>
    </div>
  );
};

