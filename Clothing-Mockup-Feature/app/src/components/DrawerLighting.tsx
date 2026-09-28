import React, { useRef } from 'react';
import { Play, Pause, Upload, Sparkles } from 'lucide-react';
import type { BackgroundSettings, LightingSettings } from '../types/mockup';
import { assetManager } from '../engine/assetManager';

interface DrawerLightingProps {
  background: BackgroundSettings;
  lighting: LightingSettings;
  onUpdateBackground: (updates: Partial<BackgroundSettings>) => void;
  onUpdateLighting: (updates: Partial<LightingSettings>) => void;
}

export const DrawerLighting: React.FC<DrawerLightingProps> = ({
  background,
  lighting,
  onUpdateBackground,
  onUpdateLighting,
}) => {
  const bgUploadRef = useRef<HTMLInputElement>(null);

  const handleCustomBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      try {
        const img = await assetManager.loadImage(url);
        onUpdateBackground({
          type: 'custom',
          customImageUrl: url,
          customImageElement: img,
        });
      } catch (err) {
        console.error('Failed to load custom background:', err);
      }
    }
  };

  return (
    <div className="drawer-panel">
      <div className="drawer-header">
        <div className="drawer-title">Background & Lighting</div>
      </div>

      <div className="drawer-content">
        {/* Background Style Selection */}
        <div className="control-group">
          <div className="control-label">
            <span>Background Surface</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <button
              id="bg-btn-concrete1"
              className={`catalog-card ${background.type === 'concrete1' ? 'active' : ''}`}
              onClick={() => onUpdateBackground({ type: 'concrete1' })}
              style={{ padding: '6px' }}
            >
              <div style={{ height: '56px', borderRadius: '4px', overflow: 'hidden', background: '#333' }}>
                <img
                  src="/backgrounds/Concrete1.jpg"
                  alt="Concrete 1"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff', textAlign: 'center' }}>
                Concrete 1
              </span>
            </button>

            <button
              id="bg-btn-concrete2"
              className={`catalog-card ${background.type === 'concrete2' ? 'active' : ''}`}
              onClick={() => onUpdateBackground({ type: 'concrete2' })}
              style={{ padding: '6px' }}
            >
              <div style={{ height: '56px', borderRadius: '4px', overflow: 'hidden', background: '#333' }}>
                <img
                  src="/backgrounds/Concrete2.jpg"
                  alt="Concrete 2"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff', textAlign: 'center' }}>
                Concrete 2
              </span>
            </button>

            <button
              id="bg-btn-solid"
              className={`catalog-card ${background.type === 'solid' ? 'active' : ''}`}
              onClick={() => onUpdateBackground({ type: 'solid' })}
              style={{ padding: '6px' }}
            >
              <div style={{ height: '56px', borderRadius: '4px', background: background.color || '#222222', border: '1px solid var(--border-subtle)' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff', textAlign: 'center' }}>
                Solid Studio
              </span>
            </button>

            <button
              id="bg-btn-custom"
              className={`catalog-card ${background.type === 'custom' ? 'active' : ''}`}
              onClick={() => bgUploadRef.current?.click()}
              style={{ padding: '6px' }}
            >
              <div style={{ height: '56px', borderRadius: '4px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-medium)' }}>
                <Upload size={18} style={{ color: 'var(--text-dim)' }} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff', textAlign: 'center' }}>
                Custom Upload
              </span>
            </button>
            <input
              ref={bgUploadRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              style={{ display: 'none' }}
              onChange={handleCustomBgUpload}
            />
          </div>
        </div>

        {/* Solid Background Color Picker (if solid) */}
        {background.type === 'solid' && (
          <div className="control-group">
            <div className="control-label">
              <span>Backdrop Hex Color</span>
              <span className="control-val">{background.color.toUpperCase()}</span>
            </div>
            <div className="hex-input-row">
              <input
                type="color"
                value={background.color}
                onChange={(e) => onUpdateBackground({ color: e.target.value })}
                className="hex-preview-box"
                style={{ cursor: 'pointer', padding: 0 }}
              />
              <input
                type="text"
                className="hex-text-input"
                value={background.color}
                maxLength={7}
                onChange={(e) => onUpdateBackground({ color: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Environmental Lighting (Gobo Tree Shadows) */}
        <div className="control-group">
          <div className="control-label">
            <span>Environmental Light Strength</span>
            <span className="control-val">{lighting.amount}%</span>
          </div>
          <input
            id="slider-lighting-amount"
            type="range"
            min="0"
            max="100"
            value={lighting.amount}
            onChange={(e) => onUpdateLighting({ amount: parseInt(e.target.value, 10) })}
          />
        </div>

        {/* Lighting Animation Toggle */}
        <div
          id="toggle-lighting-animation"
          className="toggle-row"
          onClick={() => onUpdateLighting({ animated: !lighting.animated })}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {lighting.animated ? (
              <Play size={16} style={{ color: 'var(--success)' }} />
            ) : (
              <Pause size={16} style={{ color: 'var(--text-dim)' }} />
            )}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Moving Sun Shadows</div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                {lighting.animated ? 'Playing 180-frame loop (30 FPS)' : 'Paused'}
              </div>
            </div>
          </div>

          <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={lighting.animated}
              onChange={(e) => onUpdateLighting({ animated: e.target.checked })}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {/* Frame Scrubber (active when paused or to preview specific frame) */}
        <div className="control-group">
          <div className="control-label">
            <span>Lighting Timeline Frame</span>
            <span className="control-val">
              {lighting.frameIndex || 0} / 179
            </span>
          </div>
          <input
            id="slider-lighting-frame"
            type="range"
            min="0"
            max="179"
            value={lighting.frameIndex || 0}
            onChange={(e) => onUpdateLighting({ frameIndex: parseInt(e.target.value, 10) })}
          />
        </div>

        {/* Brightness Slider */}
        <div className="control-group">
          <div className="control-label">
            <span>Brightness</span>
            <span className="control-val">
              {lighting.brightness > 0 ? `+${lighting.brightness}` : lighting.brightness}
            </span>
          </div>
          <input
            id="slider-lighting-brightness"
            type="range"
            min="-10"
            max="10"
            value={lighting.brightness}
            onChange={(e) => onUpdateLighting({ brightness: parseInt(e.target.value, 10) })}
          />
        </div>

        {/* Contrast Slider */}
        <div className="control-group">
          <div className="control-label">
            <span>Contrast</span>
            <span className="control-val">
              {lighting.contrast > 0 ? `+${lighting.contrast}` : lighting.contrast}
            </span>
          </div>
          <input
            id="slider-lighting-contrast"
            type="range"
            min="-10"
            max="10"
            value={lighting.contrast}
            onChange={(e) => onUpdateLighting({ contrast: parseInt(e.target.value, 10) })}
          />
        </div>

        {/* Lighting Info */}
        <div className="info-box">
          <Sparkles size={16} style={{ flexShrink: 0 }} />
          <div>
            The 180-frame tree shadow sequence naturally passes sunlight across the garment and backdrop. Exports capture the exact selected frame.
          </div>
        </div>
      </div>
    </div>
  );
};
