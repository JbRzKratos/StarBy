import React, { useRef } from 'react';
import {
  Upload,
  Trash2,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import type {
  ArtworkLayer3D,
  Garment3DConfig,
  SurfaceProjectorConfig,
} from '../../types/threeD';

interface DrawerArtwork3DProps {
  garmentConfig: Garment3DConfig;
  artworkLayers: ArtworkLayer3D[];
  activeRegionId: string;
  onRegionChange: (regionId: string) => void;
  onAddArtwork: (layer: ArtworkLayer3D) => void;
  onUpdateLayer: (id: string, updates: Partial<ArtworkLayer3D>) => void;
  onDuplicateLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
}

export const DrawerArtwork3D: React.FC<DrawerArtwork3DProps> = ({
  garmentConfig: _garmentConfig,
  artworkLayers,
  activeRegionId,
  onRegionChange: _onRegionChange,
  onAddArtwork,
  onUpdateLayer,
  onDuplicateLayer,
  onDeleteLayer,
  selectedLayerId,
  onSelectLayer,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedLayer = artworkLayers.find((l) => l.id === selectedLayerId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newLayer: ArtworkLayer3D = {
        id: `layer-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        regionId: activeRegionId,
        imageUrl: dataUrl,
        placementMode: 'atlas',
        u: 0.25, // default on front torso
        v: 0.63,
        uvWidth: 0.35,
        uvHeight: 0.35,
        offsetX: 0,
        offsetY: 0,
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        lockAspectRatio: true,
      };
      onAddArtwork(newLayer);
      onSelectLayer(newLayer.id);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSurfacePresetChange = (preset: SurfaceProjectorConfig['preset']) => {
    if (!selectedLayer) return;

    let posX = 0.85;
    let posY = 1.60;
    let posZ = 3.2;
    let dirX = 0;
    let dirY = 0;
    let dirZ = -1;
    let sizeX = 4.4;
    let sizeY = 3.4;

    if (preset === 'chest_to_sleeve') {
      posX = 0.85;
      posY = 1.60;
      posZ = 3.2;
      dirX = 0;
      dirY = 0;
      dirZ = -1;
      sizeX = 4.4;
      sizeY = 3.4;
    } else if (preset === 'chest_to_left_sleeve') {
      posX = -0.85;
      posY = 1.60;
      posZ = 3.2;
      dirX = 0;
      dirY = 0;
      dirZ = -1;
      sizeX = 4.4;
      sizeY = 3.4;
    } else if (preset === 'torso_front') {
      posX = 0.0;
      posY = 1.20;
      posZ = 3.2;
      dirX = 0;
      dirY = 0;
      dirZ = -1;
      sizeX = 3.8;
      sizeY = 4.4;
    } else if (preset === 'torso_back') {
      posX = 0.0;
      posY = 1.20;
      posZ = -3.2;
      dirX = 0;
      dirY = 0;
      dirZ = 1;
      sizeX = 3.8;
      sizeY = 4.4;
    } else if (preset === 'sleeve_right') {
      posX = 3.0;
      posY = 1.65;
      posZ = 0.0;
      dirX = -1;
      dirY = 0;
      dirZ = 0;
      sizeX = 3.0;
      sizeY = 3.2;
    } else if (preset === 'sleeve_left') {
      posX = -3.0;
      posY = 1.65;
      posZ = 0.0;
      dirX = 1;
      dirY = 0;
      dirZ = 0;
      sizeX = 3.0;
      sizeY = 3.2;
    }

    onUpdateLayer(selectedLayer.id, {
      placementMode: 'surface',
      surfaceProjector: {
        preset,
        posX,
        posY,
        posZ,
        dirX,
        dirY,
        dirZ,
        sizeX,
        sizeY,
        facingAngle: 0.05,
        depth: 8.0,
      },
    });
  };

  return (
    <div className="drawer-content" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="drawer-header">
        <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Artwork & Graphics</h2>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Full Atlas & 3D Cross-Seam Projection
        </span>
      </div>

      {/* Upload Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed var(--border-subtle, rgba(255,255,255,0.15))',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '16px',
          textAlign: 'center',
          cursor: 'pointer',
          background: 'rgba(255, 255, 255, 0.02)',
          transition: 'all 0.15s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(59, 94, 255, 0.15)',
            color: '#3B5EFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Upload size={18} />
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main, #fff)' }}>
            Upload Custom Artwork
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            PNG, WEBP, or JPEG with transparency
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/webp,image/jpeg"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
      </div>

      {/* Layers List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Artwork Layers ({artworkLayers.length})
          </label>
        </div>

        {artworkLayers.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
            No graphics placed yet. Upload or pick a preset above.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {artworkLayers.map((layer) => {
              const isSelected = layer.id === selectedLayerId;
              const mode = layer.placementMode || 'atlas';
              return (
                <div
                  key={layer.id}
                  onClick={() => onSelectLayer(layer.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md, 8px)',
                    background: isSelected ? 'rgba(0, 214, 255, 0.12)' : 'var(--bg-card, #131722)',
                    border: isSelected
                      ? '1px solid var(--accent, #3B5EFF)'
                      : '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '4px',
                        background: '#0a0d14',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img
                        src={layer.imageUrl}
                        alt={layer.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? '#3B5EFF' : '#fff' }}>
                        {layer.name}
                      </span>
                      <span style={{ fontSize: '9px', color: mode === 'surface' ? '#38bdf8' : '#c084fc' }}>
                        {mode === 'surface' ? '3D Surface Projector' : 'Full Atlas'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateLayer(layer.id, { opacity: layer.opacity > 0 ? 0 : 1.0 });
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: layer.opacity > 0 ? '#fff' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      title={layer.opacity > 0 ? 'Hide' : 'Show'}
                    >
                      {layer.opacity > 0 ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateLayer(layer.id);
                      }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      title="Duplicate"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLayer(layer.id);
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '4px' }}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Layer Configuration Panel */}
      {selectedLayer && (
        <div
          style={{
            background: 'var(--bg-card, #131722)',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Placement Mode Selector */}
          <div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
              Placement Mode:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              <button
                onClick={() =>
                  onUpdateLayer(selectedLayer.id, {
                    placementMode: 'surface',
                    surfaceProjector:
                      selectedLayer.surfaceProjector || {
                        preset: 'chest_to_sleeve',
                        posX: 0.85,
                        posY: 1.60,
                        posZ: 3.2,
                        dirX: 0,
                        dirY: 0,
                        dirZ: -1,
                        sizeX: 4.4,
                        sizeY: 3.4,
                        facingAngle: 0.05,
                        depth: 8.0,
                      },
                  })
                }
                style={{
                  padding: '7px 8px',
                  borderRadius: '6px',
                  border:
                    selectedLayer.placementMode === 'surface'
                      ? '1px solid #3B5EFF'
                      : '1px solid rgba(255,255,255,0.1)',
                  background:
                    selectedLayer.placementMode === 'surface'
                      ? 'rgba(0, 214, 255, 0.15)'
                      : 'transparent',
                  color: selectedLayer.placementMode === 'surface' ? '#3B5EFF' : '#aaa',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <span>3D Cross-Seam</span>
                <span style={{ fontSize: '9px', opacity: 0.8 }}>Surface Projector</span>
              </button>

              <button
                onClick={() =>
                  onUpdateLayer(selectedLayer.id, {
                    placementMode: 'atlas',
                    u: selectedLayer.u !== undefined ? selectedLayer.u : 0.25,
                    v: selectedLayer.v !== undefined ? selectedLayer.v : 0.63,
                  })
                }
                style={{
                  padding: '7px 8px',
                  borderRadius: '6px',
                  border:
                    selectedLayer.placementMode === 'atlas' || !selectedLayer.placementMode
                      ? '1px solid #c084fc'
                      : '1px solid rgba(255,255,255,0.1)',
                  background:
                    selectedLayer.placementMode === 'atlas' || !selectedLayer.placementMode
                      ? 'rgba(192, 132, 252, 0.15)'
                      : 'transparent',
                  color:
                    selectedLayer.placementMode === 'atlas' || !selectedLayer.placementMode
                      ? '#c084fc'
                      : '#aaa',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <span>Full UV Atlas</span>
                <span style={{ fontSize: '9px', opacity: 0.8 }}>Unconstrained 2D</span>
              </button>
            </div>
          </div>

          {/* Surface Mode Presets & Settings */}
          {selectedLayer.placementMode === 'surface' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                Surface Projection Target:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                <button
                  className={`btn-pill ${selectedLayer.surfaceProjector?.preset === 'chest_to_sleeve' ? 'active' : ''}`}
                  onClick={() => handleSurfacePresetChange('chest_to_sleeve')}
                  style={{ fontSize: '10px', padding: '5px 6px' }}
                >
                  Chest → Right Sleeve
                </button>
                <button
                  className={`btn-pill ${selectedLayer.surfaceProjector?.preset === 'chest_to_left_sleeve' ? 'active' : ''}`}
                  onClick={() => handleSurfacePresetChange('chest_to_left_sleeve')}
                  style={{ fontSize: '10px', padding: '5px 6px' }}
                >
                  Chest → Left Sleeve
                </button>
                <button
                  className={`btn-pill ${selectedLayer.surfaceProjector?.preset === 'torso_front' ? 'active' : ''}`}
                  onClick={() => handleSurfacePresetChange('torso_front')}
                  style={{ fontSize: '10px', padding: '5px 6px' }}
                >
                  Front Torso Center
                </button>
                <button
                  className={`btn-pill ${selectedLayer.surfaceProjector?.preset === 'torso_back' ? 'active' : ''}`}
                  onClick={() => handleSurfacePresetChange('torso_back')}
                  style={{ fontSize: '10px', padding: '5px 6px' }}
                >
                  Back Torso Center
                </button>
                <button
                  className={`btn-pill ${selectedLayer.surfaceProjector?.preset === 'sleeve_right' ? 'active' : ''}`}
                  onClick={() => handleSurfacePresetChange('sleeve_right')}
                  style={{ fontSize: '10px', padding: '5px 6px' }}
                >
                  Right Sleeve Wrap
                </button>
                <button
                  className={`btn-pill ${selectedLayer.surfaceProjector?.preset === 'sleeve_left' ? 'active' : ''}`}
                  onClick={() => handleSurfacePresetChange('sleeve_left')}
                  style={{ fontSize: '10px', padding: '5px 6px' }}
                >
                  Left Sleeve Wrap
                </button>
              </div>

              {/* Facing Threshold (Prevents bleeding through to back) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  <span>Facing Angle Cutoff</span>
                  <span>{((selectedLayer.surfaceProjector?.facingAngle ?? 0.05) * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.4"
                  step="0.02"
                  value={selectedLayer.surfaceProjector?.facingAngle ?? 0.05}
                  onChange={(e) => {
                    const angle = parseFloat(e.target.value);
                    const proj = selectedLayer.surfaceProjector || {
                      preset: 'chest_to_sleeve',
                      posX: 0.85,
                      posY: 1.60,
                      posZ: 3.2,
                      dirX: 0,
                      dirY: 0,
                      dirZ: -1,
                      sizeX: 4.4,
                      sizeY: 3.4,
                      facingAngle: 0.05,
                    };
                    onUpdateLayer(selectedLayer.id, {
                      surfaceProjector: { ...proj, facingAngle: angle },
                    });
                  }}
                  style={{ width: '100%', accentColor: '#3B5EFF' }}
                />
              </div>
            </div>
          )}

          {/* Scale Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>Graphic Scale</span>
              <span>{Math.round((selectedLayer.scale ?? (selectedLayer.uvWidth ? selectedLayer.uvWidth / 0.35 : 1.0)) * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.15}
              max={3.0}
              step={0.05}
              value={selectedLayer.scale ?? (selectedLayer.uvWidth ? selectedLayer.uvWidth / 0.35 : 1.0)}
              onChange={(e) => {
                const newScale = parseFloat(e.target.value);
                const newUvW = parseFloat((0.35 * newScale).toFixed(4));
                onUpdateLayer(selectedLayer.id, {
                  scale: newScale,
                  uvWidth: newUvW,
                  uvHeight: selectedLayer.lockAspectRatio !== false ? undefined : newUvW,
                });
              }}
              style={{ width: '100%', accentColor: '#3B5EFF' }}
            />
          </div>

          {/* Rotation Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>Rotation</span>
              <span>{selectedLayer.rotation}°</span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={selectedLayer.rotation}
              onChange={(e) => onUpdateLayer(selectedLayer.id, { rotation: parseInt(e.target.value, 10) })}
              style={{ width: '100%', accentColor: '#3B5EFF' }}
            />
          </div>

          {/* Opacity Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>Ink Opacity</span>
              <span>{Math.round(selectedLayer.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={selectedLayer.opacity}
              onChange={(e) => onUpdateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: '#3B5EFF' }}
            />
          </div>

          {/* Flip Controls */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onUpdateLayer(selectedLayer.id, { flipHorizontal: !selectedLayer.flipHorizontal })}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: '6px',
                border: selectedLayer.flipHorizontal ? '1px solid #3B5EFF' : '1px solid rgba(255,255,255,0.1)',
                background: selectedLayer.flipHorizontal ? 'rgba(0,214,255,0.2)' : 'transparent',
                color: selectedLayer.flipHorizontal ? '#3B5EFF' : '#fff',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Flip Horizontal
            </button>
            <button
              onClick={() => onUpdateLayer(selectedLayer.id, { flipVertical: !selectedLayer.flipVertical })}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: '6px',
                border: selectedLayer.flipVertical ? '1px solid #3B5EFF' : '1px solid rgba(255,255,255,0.1)',
                background: selectedLayer.flipVertical ? 'rgba(0,214,255,0.2)' : 'transparent',
                color: selectedLayer.flipVertical ? '#3B5EFF' : '#fff',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Flip Vertical
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


