import React from 'react';

interface DrawerGarmentProps {
  currentColor: string;
  garmentId?: string;
  templateId?: number;
  onColorChange: (color: string) => void;
  onGarmentChange?: (garmentId: string, templateId: number) => void;
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

const GARMENT_CUT_OPTIONS = [
  { id: 'regular-t-shirt', templateId: 24, name: 'Regular T-Shirt', badge: '180 GSM' },
  { id: 'oversized-t-shirt', templateId: 18, name: 'Oversized Tee', badge: '240 GSM' },
  { id: 'acid-wash-t-shirt', templateId: 22, name: 'Acid Wash Tee', badge: 'Vintage' },
  { id: 'hoodie', templateId: 14, name: 'Pullover Hoodie', badge: '380 GSM' },
];

function getApprovedColors(garmentId?: string, templateId?: number) {
  if (garmentId) {
    const norm = garmentId.toLowerCase();
    if (norm.includes('acid')) return { id: 'acid-wash-t-shirt', name: 'Acid Wash Tee', list: APPAREL_APPROVED_COLORS['acid-wash-t-shirt'] };
    if (norm.includes('oversized')) return { id: 'oversized-t-shirt', name: 'Oversized Tee', list: APPAREL_APPROVED_COLORS['oversized-t-shirt'] };
    if (norm.includes('hoodie')) return { id: 'hoodie', name: 'Pullover Hoodie', list: APPAREL_APPROVED_COLORS['hoodie'] };
    return { id: 'regular-t-shirt', name: 'Regular T-Shirt', list: APPAREL_APPROVED_COLORS['regular-t-shirt'] };
  }
  if (templateId === 14) return { id: 'hoodie', name: 'Hoodie', list: APPAREL_APPROVED_COLORS['hoodie'] };
  if (templateId === 18) return { id: 'oversized-t-shirt', name: 'Oversized Tee', list: APPAREL_APPROVED_COLORS['oversized-t-shirt'] };
  if (templateId === 22 || templateId === 11) return { id: 'acid-wash-t-shirt', name: 'Acid Wash Tee', list: APPAREL_APPROVED_COLORS['acid-wash-t-shirt'] };
  return { id: 'regular-t-shirt', name: 'Regular Tee', list: APPAREL_APPROVED_COLORS['regular-t-shirt'] };
}

export const DrawerGarment: React.FC<DrawerGarmentProps> = ({
  currentColor,
  garmentId,
  templateId,
  onColorChange,
  onGarmentChange,
}) => {
  const { id: activeCutId, name: cutName, list: activeSwatches } = getApprovedColors(garmentId, templateId);

  const handleSelectCut = (targetGarmentId: string, targetTemplateId: number) => {
    if (onGarmentChange) {
      onGarmentChange(targetGarmentId, targetTemplateId);
    }
    const newSwatches = APPAREL_APPROVED_COLORS[targetGarmentId] || APPAREL_APPROVED_COLORS['regular-t-shirt'];
    const matches = newSwatches.some((s) => s.hex.toLowerCase() === currentColor.toLowerCase());
    if (!matches && newSwatches.length > 0) {
      onColorChange(newSwatches[0].hex);
    }
  };

  return (
    <div className="drawer-inner-content">
      <div className="drawer-header">
        <div className="drawer-title">Garment Cut & Color</div>
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
        {/* Cloth Type Selector */}
        <div className="control-group">
          <div className="control-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Cloth Type / Cut</span>
            <span style={{ fontSize: '10px', color: 'var(--accent, #3B5EFF)', fontWeight: 700 }}>
              {cutName}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '6px',
              marginTop: '6px',
            }}
          >
            {GARMENT_CUT_OPTIONS.map((cut) => {
              const isSelected = activeCutId === cut.id;
              return (
                <button
                  key={cut.id}
                  type="button"
                  onClick={() => handleSelectCut(cut.id, cut.templateId)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: isSelected ? '1.5px solid var(--accent, #3B5EFF)' : '1px solid rgba(255,255,255,0.1)',
                    background: isSelected ? 'rgba(59, 94, 255, 0.18)' : 'rgba(255,255,255,0.03)',
                    color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: isSelected ? 700 : 500 }}>{cut.name}</div>
                  <div style={{ fontSize: '9px', color: isSelected ? 'var(--accent, #3B5EFF)' : 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                    {cut.badge}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Approved Color Palette for this Cut */}
        <div className="control-group" style={{ marginTop: '10px' }}>
          <div className="control-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Approved Colors for {cutName}</span>
            <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>
              {activeSwatches.length} Available
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
              gap: '8px',
              marginTop: '6px',
            }}
          >
            {activeSwatches.map((preset) => {
              const isSelected = currentColor.toLowerCase() === preset.hex.toLowerCase();
              const isLight = ['#ffffff', '#e5e5e5', '#d4c5b9', '#f4f3ee'].includes(preset.hex.toLowerCase());
              return (
                <button
                  key={preset.hex}
                  id={`color-preset-${preset.hex.replace('#', '')}`}
                  className={`color-swatch-btn ${isSelected ? 'active' : ''}`}
                  style={{
                    backgroundColor: preset.hex,
                    height: '42px',
                    borderRadius: '8px',
                    position: 'relative',
                    border: isSelected ? '2px solid var(--accent, #3B5EFF)' : '1px solid rgba(255,255,255,0.15)',
                    boxShadow: isSelected ? '0 0 10px rgba(59, 94, 255, 0.4)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => onColorChange(preset.hex)}
                  title={`${preset.name} (${preset.hex})`}
                >
                  {isSelected && (
                    <span
                      style={{
                        color: isLight ? '#000' : '#fff',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        lineHeight: 1,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
            {activeSwatches.map((preset) => (
              <span
                key={preset.hex}
                style={{
                  fontSize: '9.5px',
                  color: currentColor.toLowerCase() === preset.hex.toLowerCase() ? 'var(--accent, #3B5EFF)' : 'rgba(255,255,255,0.5)',
                  fontFamily: 'monospace',
                }}
              >
                {preset.name} &bull;
              </span>
            ))}
          </div>
        </div>

        {/* Custom Hex Input & Color Picker */}
        <div className="control-group" style={{ marginTop: '12px' }}>
          <div className="control-label">
            <span>Custom Hex Code</span>
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

        {/* Shading explanation */}
        <div className="info-box">
          <span style={{ flexShrink: 0, fontSize: '15px' }}>●</span>
          <div>
            Fabric seams, folds, and natural highlights are preserved regardless of garment color. Artwork prints remain completely color-independent.
          </div>
        </div>
      </div>
    </div>
  );
};
