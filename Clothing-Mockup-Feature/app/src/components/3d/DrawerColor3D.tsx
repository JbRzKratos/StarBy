import React from 'react';

interface DrawerColor3DProps {
  garmentId?: string;
  garmentColor: string;
  onColorChange: (color: string) => void;
  roughness: number;
  onRoughnessChange: (val: number) => void;
  metalness: number;
  onMetalnessChange: (val: number) => void;
}

const APPAREL_APPROVED_COLORS: Record<string, { name: string; hex: string }[]> = {
  'regular-t-shirt': [
    { name: 'White', hex: '#ffffff' },
    { name: 'Black', hex: '#111215' },
    { name: 'Olive Green', hex: '#3b443b' },
    { name: 'C.Brown', hex: '#5a3825' },
    { name: 'Maroon', hex: '#800000' },
  ],
  'oversized-t-shirt': [
    { name: 'White', hex: '#ffffff' },
    { name: 'Black', hex: '#111215' },
    { name: 'Dusky Pink', hex: '#d8a1a8' },
    { name: 'Beige', hex: '#d4c5b9' },
    { name: 'Navy Blue', hex: '#1b263b' },
  ],
  'acid-wash-t-shirt': [
    { name: 'Black', hex: '#2b2b2b' },
    { name: 'White', hex: '#e5e5e5' },
    { name: 'Violet', hex: '#5e4b8b' },
  ],
  'hoodie': [
    { name: 'Black', hex: '#111215' },
    { name: 'White', hex: '#ffffff' },
  ],
};

export const DrawerColor3D: React.FC<DrawerColor3DProps> = ({
  garmentId = 'regular-t-shirt',
  garmentColor,
  onColorChange,
  roughness,
  onRoughnessChange,
  metalness,
  onMetalnessChange,
}) => {
  const activeSwatches = APPAREL_APPROVED_COLORS[garmentId] || APPAREL_APPROVED_COLORS['regular-t-shirt'];
  return (
    <div className="drawer-content" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="drawer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px', color: 'var(--accent, #3B5EFF)' }}>●</span>
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
          {activeSwatches.map((swatch) => {
            const isSelected = garmentColor.toLowerCase() === swatch.hex.toLowerCase();
            const isLight = swatch.hex === '#ffffff' || swatch.hex === '#f4f3ee' || swatch.hex === '#d4c5b9' || swatch.hex === '#e5e5e5';
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
                  <span style={{ color: isLight ? '#000' : '#fff', fontWeight: 900, fontSize: '15px' }}>✓</span>
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

      {/* 3D Color Contrast Notice & Print Quality Guarantee */}
      <div
        style={{
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '10px',
          padding: '10px 12px',
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.85)',
          lineHeight: 1.45,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: 700 }}>
          <span>✦</span>
          <span>Color &amp; Print Quality Guarantee</span>
        </div>
        <div style={{ color: '#fbbf24', fontSize: '10.5px' }}>
          <em>Note:</em> Real-time 3D lighting simulation on certain colors may show softer contrast on screen. Our dev team is fine-tuning this shading.
        </div>
        <div style={{ color: '#34d399', fontSize: '10.5px' }}>
          ✨ <strong>Delivered Tees:</strong> Physical garments feature ultra-vibrant, opaque high-density direct-to-garment (DTG) printing with a razor-sharp premium finish on every fabric color!
        </div>
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
          <span style={{ color: '#3B5EFF' }}>✦</span>
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

