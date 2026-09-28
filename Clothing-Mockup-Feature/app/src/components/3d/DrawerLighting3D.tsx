import React from 'react';
import { Sun, Sliders } from 'lucide-react';
import type { LightingConfig3D } from '../../types/threeD';

interface DrawerLighting3DProps {
  lighting: LightingConfig3D;
  onUpdateLighting: (updates: Partial<LightingConfig3D>) => void;
}

const BACKDROP_COLORS = [
  { name: 'Studio Dark', hex: '#0a0d14' },
  { name: 'Deep Slate', hex: '#161b26' },
  { name: 'Midnight', hex: '#0f172a' },
  { name: 'Warm Charcoal', hex: '#1f1d1d' },
  { name: 'Minimal Grey', hex: '#e2e8f0' },
  { name: 'Pure White', hex: '#ffffff' },
];

export const DrawerLighting3D: React.FC<DrawerLighting3DProps> = ({
  lighting,
  onUpdateLighting,
}) => {
  const applyPreset = (preset: 'clean' | 'dramatic' | 'warm' | 'stage') => {
    switch (preset) {
      case 'clean':
        onUpdateLighting({
          hdrIntensity: 0.7,
          sunIntensity: 1.0,
          ambientIntensity: 0.15,
          sunAzimuth: 45,
          sunElevation: 45,
          shadowIntensity: 0.28,
        });
        break;
      case 'dramatic':
        onUpdateLighting({
          hdrIntensity: 0.4,
          sunIntensity: 2.2,
          ambientIntensity: 0.15,
          sunAzimuth: 110,
          sunElevation: 30,
          shadowIntensity: 0.5,
        });
        break;
      case 'warm':
        onUpdateLighting({
          hdrIntensity: 1.2,
          sunIntensity: 1.6,
          ambientIntensity: 0.5,
          sunAzimuth: 30,
          sunElevation: 25,
          shadowIntensity: 0.3,
        });
        break;
      case 'stage':
        onUpdateLighting({
          hdrIntensity: 0.2,
          sunIntensity: 2.6,
          ambientIntensity: 0.1,
          sunAzimuth: 180,
          sunElevation: 60,
          shadowIntensity: 0.6,
        });
        break;
    }
  };

  return (
    <div className="drawer-content" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="drawer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sun size={18} className="text-accent" />
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Studio Environment</h2>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          HDR Lighting & Backdrop
        </span>
      </div>

      {/* Lighting Presets */}
      <div>
        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
          Lighting Presets:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          <button
            onClick={() => applyPreset('clean')}
            className="header-btn"
            style={{ padding: '8px', textAlign: 'center', justifyContent: 'center' }}
          >
            Clean Studio
          </button>
          <button
            onClick={() => applyPreset('dramatic')}
            className="header-btn"
            style={{ padding: '8px', textAlign: 'center', justifyContent: 'center' }}
          >
            Dramatic Contrast
          </button>
          <button
            onClick={() => applyPreset('warm')}
            className="header-btn"
            style={{ padding: '8px', textAlign: 'center', justifyContent: 'center' }}
          >
            Warm Sunset
          </button>
          <button
            onClick={() => applyPreset('stage')}
            className="header-btn"
            style={{ padding: '8px', textAlign: 'center', justifyContent: 'center' }}
          >
            Dark Spotlight
          </button>
        </div>
      </div>

      {/* Light Intensity Sliders */}
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
          <Sliders size={14} color="#3B5EFF" />
          <span>Illumination Controls</span>
        </div>

        {/* HDR Intensity */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>HDR Studio Reflections</span>
            <span>{Math.round(lighting.hdrIntensity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.0}
            max={2.5}
            step={0.05}
            value={lighting.hdrIntensity}
            onChange={(e) => onUpdateLighting({ hdrIntensity: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor: '#3B5EFF' }}
          />
        </div>

        {/* Key Sun Intensity */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>Key Sun Light</span>
            <span>{Math.round(lighting.sunIntensity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.0}
            max={3.0}
            step={0.05}
            value={lighting.sunIntensity}
            onChange={(e) => onUpdateLighting({ sunIntensity: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor: '#3B5EFF' }}
          />
        </div>

        {/* Sun Angle Azimuth */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>Light Angle (Azimuth)</span>
            <span>{lighting.sunAzimuth}°</span>
          </div>
          <input
            type="range"
            min={0}
            max={360}
            step={5}
            value={lighting.sunAzimuth}
            onChange={(e) => onUpdateLighting({ sunAzimuth: parseInt(e.target.value, 10) })}
            style={{ width: '100%', accentColor: '#3B5EFF' }}
          />
        </div>

        {/* Shadow Opacity */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>Ground Contact Shadow</span>
            <span>{Math.round(lighting.shadowIntensity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.0}
            max={0.8}
            step={0.02}
            value={lighting.shadowIntensity}
            onChange={(e) => onUpdateLighting({ shadowIntensity: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor: '#3B5EFF' }}
          />
        </div>
      </div>

      {/* Backdrop Section */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 700 }}>Transparent Backdrop</span>
          <button
            onClick={() => onUpdateLighting({ isTransparentBg: !lighting.isTransparentBg })}
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              border: lighting.isTransparentBg ? '1px solid #3B5EFF' : '1px solid rgba(255,255,255,0.1)',
              background: lighting.isTransparentBg ? 'rgba(0, 214, 255, 0.2)' : 'transparent',
              color: lighting.isTransparentBg ? '#3B5EFF' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {lighting.isTransparentBg ? 'Enabled (Cutout)' : 'Disabled'}
          </button>
        </div>

        {!lighting.isTransparentBg && (
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Solid Background:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
              {BACKDROP_COLORS.map((bc) => (
                <button
                  key={bc.hex}
                  onClick={() => onUpdateLighting({ bgColor: bc.hex })}
                  title={bc.name}
                  style={{
                    height: '28px',
                    borderRadius: '6px',
                    background: bc.hex,
                    border: lighting.bgColor === bc.hex ? '2px solid #3B5EFF' : '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

