import React, { useRef } from 'react';
import {
  Upload,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  AlignCenter,
  AlignVerticalJustifyCenter,
  AlertTriangle,
  Info,
} from 'lucide-react';
import type { ArtworkLayer, GarmentSide } from '../types/mockup';
import { checkEffectiveResolution } from '../engine/validation';

interface DrawerArtworkProps {
  side: GarmentSide;
  layers: ArtworkLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUploadFile: (file: File) => void;
  onUpdateLayer: (id: string, updates: Partial<ArtworkLayer>) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onMoveLayerUp: (id: string) => void;
  onMoveLayerDown: (id: string) => void;
  onCenterHorizontal: (id: string) => void;
  onCenterVertical: (id: string) => void;
  uploadWarning?: string | null;
}

export const DrawerArtwork: React.FC<DrawerArtworkProps> = ({
  side,
  layers,
  selectedLayerId,
  onSelectLayer,
  onUploadFile,
  onUpdateLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onMoveLayerUp,
  onMoveLayerDown,
  onCenterHorizontal,
  onCenterVertical,
  uploadWarning,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  return (
    <div className="drawer-panel">
      <div className="drawer-header">
        <div className="drawer-title">Artwork & Prints</div>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'capitalize' }}>
          {side} View ({layers.length})
        </span>
      </div>

      <div className="drawer-content">
        {/* Upload Dropzone */}
        <div
          id="artwork-dropzone"
          className="dropzone"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="dropzone-icon">
            <Upload size={20} />
          </div>
          <div>
            <div className="dropzone-title">Upload Design</div>
            <div className="dropzone-subtitle">PNG, JPG, SVG or WebP up to 25MB</div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg,.webp"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
        </div>


        {/* Validation Warning Alert */}
        {uploadWarning && (
          <div className="warning-box">
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <div>{uploadWarning}</div>
          </div>
        )}

        {/* Selected Layer Resolution Warning */}
        {selectedLayer && (() => {
          const resCheck = checkEffectiveResolution(
            selectedLayer.naturalWidth,
            selectedLayer.naturalHeight,
            selectedLayer.width * Math.abs(selectedLayer.scaleX),
            selectedLayer.height * Math.abs(selectedLayer.scaleY)
          );
          if (resCheck.dpiQuality === 'low') {
            return (
              <div className="warning-box">
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <div>{resCheck.warning}</div>
              </div>
            );
          }
          return null;
        })()}

        {/* Selected Layer Quick Properties */}
        {selectedLayer && (
          <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Selected: {selectedLayer.name}</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  className="layer-action-btn"
                  title="Center Horizontally"
                  onClick={() => onCenterHorizontal(selectedLayer.id)}
                >
                  <AlignCenter size={14} />
                </button>
                <button
                  className="layer-action-btn"
                  title="Center Vertically"
                  onClick={() => onCenterVertical(selectedLayer.id)}
                >
                  <AlignVerticalJustifyCenter size={14} />
                </button>
              </div>
            </div>

            {/* Scale Slider */}
            <div className="control-group">
              <div className="control-label">
                <span>Scale</span>
                <span className="control-val">{Math.round(Math.abs(selectedLayer.scaleX) * 100)}%</span>
              </div>
              <input
                id="slider-layer-scale"
                type="range"
                min="20"
                max="300"
                value={Math.round(Math.abs(selectedLayer.scaleX) * 100)}
                onChange={(e) => {
                  const s = parseInt(e.target.value, 10) / 100.0;
                  onUpdateLayer(selectedLayer.id, {
                    scaleX: selectedLayer.flipX ? -s : s,
                    scaleY: selectedLayer.flipY ? -s : s,
                  });
                }}
              />
            </div>

            {/* Rotation Slider */}
            <div className="control-group">
              <div className="control-label">
                <span>Rotation</span>
                <span className="control-val">{Math.round(selectedLayer.rotation)}°</span>
              </div>
              <input
                id="slider-layer-rotation"
                type="range"
                min="-180"
                max="180"
                value={Math.round(selectedLayer.rotation)}
                onChange={(e) => {
                  onUpdateLayer(selectedLayer.id, { rotation: parseInt(e.target.value, 10) });
                }}
              />
            </div>

            {/* Opacity Slider */}
            <div className="control-group">
              <div className="control-label">
                <span>Opacity</span>
                <span className="control-val">{Math.round(selectedLayer.opacity * 100)}%</span>
              </div>
              <input
                id="slider-layer-opacity"
                type="range"
                min="10"
                max="100"
                value={Math.round(selectedLayer.opacity * 100)}
                onChange={(e) => {
                  onUpdateLayer(selectedLayer.id, { opacity: parseInt(e.target.value, 10) / 100.0 });
                }}
              />
            </div>
          </div>
        )}

        {/* Layers Stack List */}
        <div className="control-group">
          <div className="control-label">
            <span>Layers Stack</span>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Top to Bottom</span>
          </div>

          {layers.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' }}>
              No artwork added to {side} view yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[...layers].reverse().map((layer, index) => {
                const isSelected = layer.id === selectedLayerId;
                const originalIndex = layers.length - 1 - index;

                return (
                  <div
                    key={layer.id}
                    id={`layer-item-${layer.id}`}
                    className={`layer-item ${isSelected ? 'active' : ''}`}
                    onClick={() => onSelectLayer(layer.id)}
                  >
                    <img src={layer.src} alt={layer.name} className="layer-thumbnail" />
                    <div className="layer-info">
                      <div className="layer-name">{layer.name}</div>
                      <div className="layer-meta">
                        {layer.naturalWidth}×{layer.naturalHeight}px
                      </div>
                    </div>

                    <div className="layer-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="layer-action-btn"
                        title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                        onClick={() => onUpdateLayer(layer.id, { visible: !layer.visible })}
                      >
                        {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>

                      <button
                        className="layer-action-btn"
                        title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                        onClick={() => onUpdateLayer(layer.id, { locked: !layer.locked })}
                      >
                        {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                      </button>

                      <button
                        className="layer-action-btn"
                        title="Bring Forward"
                        disabled={originalIndex === layers.length - 1}
                        onClick={() => onMoveLayerUp(layer.id)}
                      >
                        <ChevronUp size={14} />
                      </button>

                      <button
                        className="layer-action-btn"
                        title="Send Backward"
                        disabled={originalIndex === 0}
                        onClick={() => onMoveLayerDown(layer.id)}
                      >
                        <ChevronDown size={14} />
                      </button>

                      <button
                        className="layer-action-btn"
                        title="Duplicate"
                        onClick={() => onDuplicateLayer(layer.id)}
                      >
                        <Copy size={14} />
                      </button>

                      <button
                        className="layer-action-btn btn-delete-layer"
                        title="Delete"
                        data-testid="btn-delete-layer"
                        onClick={() => onDeleteLayer(layer.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tip */}
        <div className="info-box">
          <Info size={16} style={{ flexShrink: 0 }} />
          <div>Original artwork pixels are preserved cleanly. Click and drag handles on the canvas to move, rotate, and scale.</div>
        </div>
      </div>
    </div>
  );
};
