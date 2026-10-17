import React, { useState } from 'react';
import type { ArtworkLayer3D, Garment3DConfig } from '../../types/threeD';

interface DesignerPlacementBarProps {
  activeDesignName: string;
  activeDesignId?: string | null;
  garmentConfig: Garment3DConfig;
  selectedLayer: ArtworkLayer3D | null;
  isDesignerAuthorized?: boolean;
  isDesignerMode: boolean;
  onToggleDesignerMode: () => void;
  onSelectGarment: (garmentId: string) => void;
  onUpdateLayer: (id: string, updates: Partial<ArtworkLayer3D>) => void;
  onSavePlacement: () => void;
  onResetPlacement?: () => void;
  onApplyPreset?: (target: string) => void;
}

const GARMENTS = [
  { id: 'regular-t-shirt', label: 'Regular Tee' },
  { id: 'oversized-t-shirt', label: 'Oversized Tee' },
  { id: 'acid-wash-t-shirt', label: 'Acid Wash Tee' },
  { id: 'hoodie', label: 'Hoodie' },
];

export const DesignerPlacementBar: React.FC<DesignerPlacementBarProps> = ({
  activeDesignName,
  activeDesignId,
  garmentConfig,
  selectedLayer,
  isDesignerAuthorized = false,
  isDesignerMode,
  onToggleDesignerMode,
  onSelectGarment,
  onUpdateLayer,
  onSavePlacement,
  onResetPlacement,
  onApplyPreset,
}) => {
  const [copied, setCopied] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isDesignerAuthorized || !isDesignerMode) return null;

  const handleCopyJson = () => {
    if (!selectedLayer) return;
    const config = {
      designId: activeDesignId || 'curated-design',
      garmentId: garmentConfig.id,
      placementTarget: selectedLayer.placementTarget || 'front-center',
      u: selectedLayer.u !== undefined ? parseFloat(selectedLayer.u.toFixed(5)) : 0.25,
      v: selectedLayer.v !== undefined ? parseFloat(selectedLayer.v.toFixed(5)) : 0.63,
      uvWidth: selectedLayer.uvWidth !== undefined ? parseFloat(selectedLayer.uvWidth.toFixed(5)) : 0.26,
      scale: selectedLayer.scale !== undefined ? parseFloat(selectedLayer.scale.toFixed(5)) : 0.74,
      rotation: selectedLayer.rotation || 0,
      regionId: selectedLayer.regionId || 'front',
    };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSavePlacement();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const nudge = (du: number, dv: number) => {
    if (!selectedLayer) return;
    const curU = selectedLayer.u !== undefined ? selectedLayer.u : 0.25;
    const curV = selectedLayer.v !== undefined ? selectedLayer.v : 0.63;
    const newU = parseFloat((curU + du).toFixed(4));
    const newV = parseFloat((curV + dv).toFixed(4));
    onUpdateLayer(selectedLayer.id, {
      u: newU,
      v: newV,
      offsetX: parseFloat(((newU - 0.5) * 2).toFixed(3)),
      offsetY: parseFloat(((newV - 0.5) * 2).toFixed(3)),
    });
  };

  const scaleBy = (dw: number) => {
    if (!selectedLayer) return;
    const curW = selectedLayer.uvWidth !== undefined ? selectedLayer.uvWidth : 0.26;
    const newW = Math.max(0.04, Math.min(0.85, parseFloat((curW + dw).toFixed(4))));
    const newScale = parseFloat((newW / 0.35).toFixed(4));
    onUpdateLayer(selectedLayer.id, {
      uvWidth: newW,
      scale: newScale,
      uvHeight: selectedLayer.lockAspectRatio !== false ? undefined : newW,
    });
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        width: 'calc(100% - 24px)',
        maxWidth: '820px',
        backgroundColor: 'rgba(15, 17, 23, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(139, 92, 246, 0.55)',
        borderRadius: '14px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(139, 92, 246, 0.25)',
        padding: '10px 14px',
        color: '#ffffff',
        fontFamily: 'monospace',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top Header Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.5)',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: 800,
              color: '#c4b5fd',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span style={{ color: '#a78bfa', fontSize: '11px' }}>✦</span>
            <span>Designer Mode</span>
          </span>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#ffffff',
              maxWidth: '220px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={activeDesignName}
          >
            {activeDesignName}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: '5px 11px',
              backgroundColor: '#10b981',
              color: '#000000',
              fontWeight: 800,
              fontSize: '10.5px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
            }}
            title="Save this placement for this garment cut"
          >
            {savedToast ? <span>✓</span> : <span>💾</span>}
            <span>{savedToast ? 'SAVED!' : 'SAVE PLACEMENT'}</span>
          </button>

          {/* Copy JSON */}
          <button
            type="button"
            onClick={handleCopyJson}
            style={{
              padding: '5px 9px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Copy calibrated coordinates JSON"
          >
            {copied ? <span style={{ color: '#34d399' }}>✓</span> : <span>⧉</span>}
            <span>{copied ? 'COPIED' : 'COPY JSON'}</span>
          </button>

          {/* Reset Placement */}
          {onResetPlacement && (
            <button
              type="button"
              onClick={onResetPlacement}
              style={{
                padding: '5px 9px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.75)',
                fontWeight: 600,
                fontSize: '10px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Reset placement to default calibration"
            >
              <span>⟳</span>
              <span>RESET</span>
            </button>
          )}

          {/* Customer View Toggle (Test lock) */}
          <button
            type="button"
            onClick={onToggleDesignerMode}
            style={{
              padding: '5px 10px',
              backgroundColor: 'rgba(59, 94, 255, 0.2)',
              border: '1px solid rgba(59, 94, 255, 0.5)',
              color: '#93c5fd',
              fontWeight: 700,
              fontSize: '10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title="Switch to customer mode to verify lock and 360 view"
          >
            <span>👁</span>
            <span>CUSTOMER VIEW</span>
          </button>

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '12px',
            }}
            title={isCollapsed ? 'Expand calibration bar' : 'Collapse bar'}
          >
            {isCollapsed ? <span>▾</span> : <span>▴</span>}
          </button>
        </div>
      </div>

      {/* Expanded Controls */}
      {!isCollapsed && (
        <div
          style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* Garment Cut Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase' }}>
              Cut:
            </span>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {GARMENTS.map((g) => {
                const isActive = garmentConfig.id === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onSelectGarment(g.id)}
                    style={{
                      padding: '4px 9px',
                      borderRadius: '5px',
                      fontSize: '10px',
                      fontWeight: isActive ? 800 : 500,
                      backgroundColor: isActive ? '#8b5cf6' : 'rgba(255, 255, 255, 0.06)',
                      border: isActive ? '1px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.12)',
                      color: isActive ? '#ffffff' : '#cccccc',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>

            {/* Quick Spots */}
            {onApplyPreset && (
              <>
                <span
                  style={{
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.4)',
                    marginLeft: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Spot:
                </span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Chest Center', target: 'front-center' },
                    { label: 'Left Pocket', target: 'left-chest' },
                    { label: 'Back Center', target: 'back-center' },
                    { label: 'Back Collar', target: 'back-collar' },
                  ].map((p) => (
                    <button
                      key={p.target}
                      type="button"
                      onClick={() => onApplyPreset(p.target)}
                      style={{
                        padding: '3px 7px',
                        borderRadius: '4px',
                        fontSize: '9.5px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Coordinate Readout & Micro-Nudge Row */}
          {selectedLayer && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap',
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* Live Coordinates */}
              <div style={{ display: 'flex', gap: '12px', fontSize: '10px', color: '#93c5fd' }}>
                <span>
                  U: <strong>{(selectedLayer.u ?? 0.25).toFixed(3)}</strong>
                </span>
                <span>
                  V: <strong>{(selectedLayer.v ?? 0.63).toFixed(3)}</strong>
                </span>
                <span>
                  W: <strong>{(selectedLayer.uvWidth ?? 0.26).toFixed(3)}</strong>
                </span>
                <span>
                  Rot: <strong>{selectedLayer.rotation ?? 0}°</strong>
                </span>
              </div>

              {/* Nudge & Scale Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Position Nudge Arrows */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <button
                    type="button"
                    onClick={() => nudge(-0.005, 0)}
                    style={nudgeBtnStyle}
                    title="Nudge Left"
                  >
                    <span>←</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => nudge(0.005, 0)}
                    style={nudgeBtnStyle}
                    title="Nudge Right"
                  >
                    <span>→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => nudge(0, 0.005)}
                    style={nudgeBtnStyle}
                    title="Nudge Up"
                  >
                    <span>↑</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => nudge(0, -0.005)}
                    style={nudgeBtnStyle}
                    title="Nudge Down"
                  >
                    <span>↓</span>
                  </button>
                </div>

                {/* Scale buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginRight: '2px' }}>
                    SIZE:
                  </span>
                  <button
                    type="button"
                    onClick={() => scaleBy(-0.01)}
                    style={nudgeBtnStyle}
                    title="Make Smaller"
                  >
                    <span>−</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => scaleBy(0.01)}
                    style={nudgeBtnStyle}
                    title="Make Bigger"
                  >
                    <span>+</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const nudgeBtnStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '4px',
  color: '#ffffff',
  cursor: 'pointer',
  padding: 0,
};
