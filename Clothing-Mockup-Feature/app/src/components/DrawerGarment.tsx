import React from 'react';
import { Palette, Check } from 'lucide-react';

interface DrawerGarmentProps {
  currentColor: string;
  onColorChange: (color: string) => void;
}

const APPAREL_PRESETS = [
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Deep Black', hex: '#141414' },
  { name: 'Heather Grey', hex: '#9ca3af' },
  { name: 'Charcoal', hex: '#374151' },
  { name: 'Vintage Navy', hex: '#1e293b' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Forest Green', hex: '#1b4332' },
  { name: 'Olive Green', hex: '#4d5d3e' },
  { name: 'Sand / Oatmeal', hex: '#d1b89d' },
  { name: 'Clay / Terra', hex: '#c86d51' },
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Burgundy', hex: '#581825' },
  { name: 'Mustard Gold', hex: '#d97706' },
  { name: 'Dusty Rose', hex: '#be8a9b' },
];

export const DrawerGarment: React.FC<DrawerGarmentProps> = ({
  currentColor,
  onColorChange,
}) => {
  return (
    <div className="drawer-panel">
      <div className="drawer-header">
        <div className="drawer-title">Garment Color</div>
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: currentColor,
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        />
      </div>

      <div className="drawer-content">
        {/* Hex Input & Color Picker */}
        <div className="control-group">
          <div className="control-label">
            <span>Hex Code</span>
            <span className="control-val">{currentColor.toUpperCase()}</span>
          </div>

          <div className="hex-input-row">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="hex-preview-box"
              style={{ cursor: 'pointer', padding: 0 }}
            />
            <input
              type="text"
              className="hex-text-input"
              value={currentColor}
              maxLength={7}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                  onColorChange(val);
                }
              }}
            />
          </div>
        </div>

        {/* Color Presets */}
        <div className="control-group">
          <div className="control-label">
            <span>Popular Apparel Colors</span>
          </div>

          <div className="color-presets-grid">
            {APPAREL_PRESETS.map((preset) => {
              const isSelected = currentColor.toLowerCase() === preset.hex.toLowerCase();
              return (
                <button
                  key={preset.hex}
                  id={`color-preset-${preset.hex.replace('#', '')}`}
                  className={`color-swatch-btn ${isSelected ? 'active' : ''}`}
                  style={{ backgroundColor: preset.hex }}
                  onClick={() => onColorChange(preset.hex)}
                  title={`${preset.name} (${preset.hex})`}
                >
                  {isSelected && (
                    <Check
                      size={14}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: ['#ffffff', '#d1b89d', '#9ca3af'].includes(preset.hex) ? '#000' : '#fff',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Shading explanation */}
        <div className="info-box">
          <Palette size={16} style={{ flexShrink: 0 }} />
          <div>
            Fabric seams, folds, and natural highlights are preserved regardless of garment color. Artwork prints remain completely color-independent.
          </div>
        </div>
      </div>
    </div>
  );
};
