import React from 'react';
import { Sparkles, Info } from 'lucide-react';
import type { WarpSettings } from '../types/mockup';

interface DrawerFabricProps {
  warp: WarpSettings;
  onUpdateWarp: (updates: Partial<WarpSettings>) => void;
}

export const DrawerFabric: React.FC<DrawerFabricProps> = ({
  warp,
  onUpdateWarp,
}) => {
  return (
    <div className="drawer-inner-content">
      <div className="drawer-header">
        <div className="drawer-title">Fabric Warp & Shading</div>
      </div>

      <div className="drawer-content">
        {/* Toggle Switch */}
        <div
          id="toggle-fabric-warp"
          className="toggle-row"
          onClick={() => onUpdateWarp({ enabled: !warp.enabled })}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Fabric Warp</span>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Displace artwork along fabric folds
            </span>
          </div>

          <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={warp.enabled}
              onChange={(e) => onUpdateWarp({ enabled: e.target.checked })}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {/* Warp Strength Slider */}
        <div className="control-group" style={{ opacity: warp.enabled ? 1 : 0.4 }}>
          <div className="control-label">
            <span>Warp Displacement Strength</span>
            <span className="control-val">{warp.strength.toFixed(1)}×</span>
          </div>
          <input
            id="slider-warp-strength"
            type="range"
            min="0"
            max="50"
            disabled={!warp.enabled}
            value={Math.round(warp.strength * 10)}
            onChange={(e) => onUpdateWarp({ strength: parseInt(e.target.value, 10) / 10.0 })}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)' }}>
            <span>Subtle (0.5×)</span>
            <span>Standard (2.0×)</span>
            <span>Pronounced (5.0×)</span>
          </div>
        </div>

        {/* Ambient Shading Slider */}
        <div className="control-group">
          <div className="control-label">
            <span>Ambient Crease & Fold Shading</span>
            <span className="control-val">{Math.round(warp.blendFactor * 100)}%</span>
          </div>
          <input
            id="slider-warp-blend"
            type="range"
            min="0"
            max="100"
            value={Math.round(warp.blendFactor * 100)}
            onChange={(e) => onUpdateWarp({ blendFactor: parseInt(e.target.value, 10) / 100.0 })}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)' }}>
            <span>0% (Flat Ink)</span>
            <span>50% (Natural Fabric)</span>
            <span>100% (Deep Folds)</span>
          </div>
        </div>

        {/* Information Callout */}
        <div className="info-box">
          <Sparkles size={16} style={{ flexShrink: 0 }} />
          <div>
            Fabric warping dynamically maps print pixels across natural wrinkles. Original artwork pixels remain 100% intact; toggling warp on or off never degrades your source design.
          </div>
        </div>

        <div className="info-box" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.25)', color: '#6ee7b7' }}>
          <Info size={16} style={{ flexShrink: 0 }} />
          <div>
            Authentic ink integration: artwork responds naturally to macroscopic garment folds, cotton weave micro-texture, and environmental lighting while maintaining true pigment colors.
          </div>
        </div>
      </div>
    </div>
  );
};
