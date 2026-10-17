import React, { useRef, useState } from 'react';
import type {
  ArtworkLayer3D,
  Garment3DConfig,
  SurfaceProjectorConfig,
} from '../../types/threeD';
import {
  buildLayerFromPlacement,
  parseNaturalLanguagePlacement,
} from '../../engine/3d/placementParser';
import { readOptimizedImageDataUrl } from '../../engine/validation';

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
  onOpenLibrary?: () => void;
  isDesignerAuthorized?: boolean;
  isDesignerMode?: boolean;
  isCuratedDesign?: boolean;
  onToggleDesignerMode?: () => void;
  customArtworkCount?: number;
  customPrintFee?: number;
  basePrice?: number;
}

export const DrawerArtwork3D: React.FC<DrawerArtwork3DProps> = ({
  garmentConfig,
  artworkLayers,
  activeRegionId,
  onRegionChange,
  onAddArtwork,
  onUpdateLayer,
  onDuplicateLayer,
  onDeleteLayer,
  selectedLayerId,
  onSelectLayer,
  onOpenLibrary,
  isDesignerAuthorized = false,
  isDesignerMode = false,
  isCuratedDesign = false,
  onToggleDesignerMode,
  customArtworkCount = 0,
  customPrintFee = 0,
  basePrice,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nlpInput, setNlpInput] = useState<string>('');

  const selectedLayer = artworkLayers.find((l) => l.id === selectedLayerId);

  const handleApplySmartPlacement = (text: string) => {
    if (!selectedLayer) return;
    const clean = text.trim();
    if (!clean) return;

    const parsed = parseNaturalLanguagePlacement(clean);
    const updatedLayer = buildLayerFromPlacement(garmentConfig.id, {
      id: selectedLayer.id,
      name: selectedLayer.name,
      imageUrl: selectedLayer.imageUrl,
      placementTextOrTarget: parsed.placement,
      scalePresetOrText: parsed.scale,
    });

    onUpdateLayer(selectedLayer.id, {
      placementMode: 'atlas',
      u: updatedLayer.u,
      v: updatedLayer.v,
      uvWidth: updatedLayer.uvWidth,
      uvHeight: updatedLayer.uvHeight,
      offsetX: updatedLayer.offsetX,
      offsetY: updatedLayer.offsetY,
      scale: updatedLayer.scale,
      regionId: updatedLayer.regionId,
      placementTarget: updatedLayer.placementTarget,
      scalePreset: updatedLayer.scalePreset,
    });

    if (updatedLayer.regionId && onRegionChange) {
      onRegionChange(updatedLayer.regionId);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      try {
        const dataUrl = await readOptimizedImageDataUrl(file, 1600);
        const newLayer: ArtworkLayer3D = {
          id: `layer-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
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
        if (idx === files.length - 1) {
          onSelectLayer(newLayer.id);
        }
      } catch (err) {
        console.error('Failed to process uploaded artwork:', err);
      }
    }
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

      {/* StarBy Curated Designs Library Button */}
      {onOpenLibrary && (
        <button
          type="button"
          onClick={onOpenLibrary}
          style={{
            background: 'linear-gradient(135deg, rgba(59, 94, 255, 0.22) 0%, rgba(20, 22, 28, 0.95) 100%)',
            border: '1px solid rgba(59, 94, 255, 0.45)',
            borderRadius: '12px',
            padding: '12px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            transition: 'all 0.2s',
            boxShadow: '0 4px 16px rgba(59, 94, 255, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(59, 94, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#A5B4FC',
              }}
            >
              <span style={{ fontSize: '16px' }}>✦</span>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                StarBy Graphic Library
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.65)' }}>
                96 Curated Designs (Anime, Cars, Marvel, Quotes)
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#fff',
              background: '#3B5EFF',
              padding: '5px 9px',
              borderRadius: '6px',
              letterSpacing: '0.5px',
            }}
          >
            Browse →
          </div>
        </button>
      )}

      {/* Custom Print Pricing Notice (Shown for custom/plain tee mode) */}
      {!isCuratedDesign && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            borderRadius: '10px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ✦ Custom Print Pricing
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
              +₹119 / design
            </span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.82)', lineHeight: 1.4 }}>
            Each design you upload adds ₹119 to the base tee. Place graphics on front, back, or sleeves!
          </div>
          {customArtworkCount > 0 ? (
            <div style={{ marginTop: '2px', fontSize: '11px', color: '#34d399', fontWeight: 700 }}>
              ✓ {customArtworkCount} design{customArtworkCount > 1 ? 's' : ''} added (+₹{customPrintFee || customArtworkCount * 119})
            </div>
          ) : (
            <div style={{ marginTop: '2px', fontSize: '10px', color: '#94a3b8' }}>
              Base Tee: ₹{basePrice || 799} · 0 designs added
            </div>
          )}
        </div>
      )}

      {/* Upload Dropzone (Only shown for blank apparel or when creator is in designer mode) */}
      {!isCuratedDesign || isDesignerMode ? (
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
            <span style={{ fontSize: '18px' }}>↑</span>
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
            multiple
            accept="image/png,image/webp,image/jpeg"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
      ) : (
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ color: '#38bdf8', flexShrink: 0, fontSize: '16px' }}>✦</span>
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.4 }}>
            You are viewing a <strong>StarBy Curated Design</strong>. Calibrated placements are locked for production quality. Browse our library above if you want to switch designs!
          </div>
        </div>
      )}

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
                    {layer.locked && !isDesignerMode ? (
                      <span
                        style={{
                          fontSize: '9px',
                          color: '#38bdf8',
                          padding: '3px 7px',
                          borderRadius: '4px',
                          background: 'rgba(56, 189, 248, 0.12)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                        }}
                        title="Placement locked by designer"
                      >
                        🔒 LOCKED
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextHidden = layer.opacity > 0;
                            onUpdateLayer(layer.id, { opacity: nextHidden ? 0 : 1.0, hidden: nextHidden });
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
                          {layer.opacity > 0 ? <span style={{ fontSize: '13px' }}>👁</span> : <span style={{ fontSize: '13px', opacity: 0.5 }}>✕</span>}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateLayer(layer.id);
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                          title="Duplicate"
                        >
                          <span style={{ fontSize: '13px' }}>⧉</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteLayer(layer.id);
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '4px' }}
                          title="Delete"
                        >
                          <span style={{ fontSize: '13px' }}>✕</span>
                        </button>
                      </>
                    )}
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
          {selectedLayer.locked && !isDesignerMode ? (
            /* ── Verified Locked Artwork Details for Customers ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                <span style={{ fontSize: '18px' }}>🔒</span>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Studio Verified Placement
                  </div>
                  <div style={{ fontSize: '9.5px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Original artwork tailored specifically for {garmentConfig.name}
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: '11px',
                  lineHeight: '1.5',
                  color: 'rgba(255, 255, 255, 0.85)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#ffffff' }}>
                  This artwork placement and scale are locked so your printed garment matches the creator's exact design specifications.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10.5px', color: '#94a3b8' }}>
                  <div>• <strong>All Garment Cuts:</strong> Change apparel below (Regular, Oversized, Acid Wash, Hoodie) to preview all looks in 3D.</div>
                  <div>• <strong>Approved Fabric Colors:</strong> Switch colors to see how the print looks on dark &amp; light fabrics.</div>
                  <div>• <strong>360° Inspection:</strong> Drag anywhere across the 3D model to inspect print details and seams.</div>
                </div>
              </div>

              {isDesignerAuthorized && onToggleDesignerMode && (
                <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    type="button"
                    onClick={onToggleDesignerMode}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(139, 92, 246, 0.18)',
                      border: '1px solid rgba(139, 92, 246, 0.45)',
                      borderRadius: '6px',
                      color: '#c4b5fd',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>🎨 Switch to Designer Mode (Adjust Placement)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Unlocked Controls (Custom Uploads or Designer Mode) ── */
            <>
              {isDesignerAuthorized && isDesignerMode && (
                <div
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: 'rgba(139, 92, 246, 0.2)',
                    border: '1px solid rgba(139, 92, 246, 0.5)',
                    fontSize: '10px',
                    color: '#c4b5fd',
                    fontWeight: 800,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  🛠️ Designer Placement Mode Active
                </div>
              )}
          {/* Customer Print Surface Selector: FRONT vs BACK vs SLEEVE */}
          {(() => {
            const isBack = selectedLayer.regionId === 'back' || (selectedLayer.placementTarget && selectedLayer.placementTarget.includes('back'));
            const isSleeve = (selectedLayer.placementTarget && selectedLayer.placementTarget.includes('sleeve'));
            const activeRegion: 'front' | 'back' | 'sleeve' = isBack ? 'back' : isSleeve ? 'sleeve' : 'front';

            return (
              <div
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                    Step 1: Apparel Region
                  </span>
                  <span style={{ fontSize: '9px', color: '#10b981', fontFamily: 'monospace', fontWeight: 600 }}>
                    {activeRegion.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = buildLayerFromPlacement(garmentConfig.id, {
                        id: selectedLayer.id,
                        name: selectedLayer.name,
                        imageUrl: selectedLayer.imageUrl,
                        placementTextOrTarget: 'front-center',
                        scalePresetOrText: selectedLayer.scalePreset || 'standard',
                      });
                      onUpdateLayer(selectedLayer.id, {
                        placementMode: 'atlas',
                        u: updated.u,
                        v: updated.v,
                        uvWidth: updated.uvWidth,
                        uvHeight: updated.uvHeight,
                        offsetX: updated.offsetX,
                        offsetY: updated.offsetY,
                        scale: updated.scale,
                        regionId: 'front',
                        placementTarget: 'front-center',
                      });
                      if (onRegionChange) onRegionChange('front');
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '6px',
                      border: activeRegion === 'front' ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.12)',
                      background: activeRegion === 'front' ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255,255,255,0.03)',
                      color: activeRegion === 'front' ? '#34d399' : '#aaa',
                      fontWeight: 700,
                      fontSize: '11px',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <span>👕 FRONT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = buildLayerFromPlacement(garmentConfig.id, {
                        id: selectedLayer.id,
                        name: selectedLayer.name,
                        imageUrl: selectedLayer.imageUrl,
                        placementTextOrTarget: 'back-center',
                        scalePresetOrText: selectedLayer.scalePreset || 'standard',
                      });
                      onUpdateLayer(selectedLayer.id, {
                        placementMode: 'atlas',
                        u: updated.u,
                        v: updated.v,
                        uvWidth: updated.uvWidth,
                        uvHeight: updated.uvHeight,
                        offsetX: updated.offsetX,
                        offsetY: updated.offsetY,
                        scale: updated.scale,
                        regionId: 'back',
                        placementTarget: 'back-center',
                      });
                      if (onRegionChange) onRegionChange('back');
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '6px',
                      border: activeRegion === 'back' ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.12)',
                      background: activeRegion === 'back' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255,255,255,0.03)',
                      color: activeRegion === 'back' ? '#38bdf8' : '#aaa',
                      fontWeight: 700,
                      fontSize: '11px',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <span>🔄 BACK</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = buildLayerFromPlacement(garmentConfig.id, {
                        id: selectedLayer.id,
                        name: selectedLayer.name,
                        imageUrl: selectedLayer.imageUrl,
                        placementTextOrTarget: 'left-sleeve',
                        scalePresetOrText: selectedLayer.scalePreset || 'standard',
                      });
                      onUpdateLayer(selectedLayer.id, {
                        placementMode: 'atlas',
                        u: updated.u,
                        v: updated.v,
                        uvWidth: updated.uvWidth,
                        uvHeight: updated.uvHeight,
                        offsetX: updated.offsetX,
                        offsetY: updated.offsetY,
                        scale: updated.scale,
                        regionId: 'front',
                        placementTarget: 'left-sleeve',
                      });
                      if (onRegionChange) onRegionChange('front');
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '6px',
                      border: activeRegion === 'sleeve' ? '1.5px solid #a855f7' : '1px solid rgba(255,255,255,0.12)',
                      background: activeRegion === 'sleeve' ? 'rgba(168, 85, 247, 0.22)' : 'rgba(255,255,255,0.03)',
                      color: activeRegion === 'sleeve' ? '#c084fc' : '#aaa',
                      fontWeight: 700,
                      fontSize: '11px',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <span>🦾 SLEEVE</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Smart AI Natural Language Placement & Presets */}
          {(() => {
            const isBack = selectedLayer.regionId === 'back' || (selectedLayer.placementTarget && selectedLayer.placementTarget.includes('back'));
            const isSleeve = (selectedLayer.placementTarget && selectedLayer.placementTarget.includes('sleeve'));
            const activeRegion: 'front' | 'back' | 'sleeve' = isBack ? 'back' : isSleeve ? 'sleeve' : 'front';

            const targetSpots =
              activeRegion === 'front'
                ? [
                    { label: 'Front Center', text: 'front center standard' },
                    { label: 'Left Chest', text: 'small left chest' },
                    { label: 'Right Chest', text: 'right chest' },
                    { label: 'Full Front', text: 'oversized full front' },
                    { label: 'Bottom Hem', text: 'bottom hem' },
                  ]
                : activeRegion === 'back'
                ? [
                    { label: 'Back Center', text: 'back center' },
                    { label: 'Back Collar', text: 'back collar nape' },
                    { label: 'Full Back', text: 'big full back print' },
                    { label: 'Bottom Hem', text: 'bottom hem' },
                  ]
                : [
                    { label: 'Left Sleeve', text: 'left sleeve' },
                    { label: 'Right Sleeve', text: 'right sleeve' },
                  ];

            return (
              <div
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 94, 255, 0.08) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px' }}>✦</span>
                    <span>Step 2: Target Spot ({activeRegion.toUpperCase()})</span>
                  </span>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                    Filtered
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {targetSpots.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setNlpInput(p.text);
                        handleApplySmartPlacement(p.text);
                      }}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '10.5px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Natural Language Placement Input Box */}
                <div style={{ marginTop: '4px' }}>
                  <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Step 3: Or Type Placement Place
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      value={nlpInput}
                      onChange={(e) => setNlpInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleApplySmartPlacement(nlpInput);
                        }
                      }}
                      placeholder='e.g. "small left chest", "big back print", "bottom hem"...'
                      style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        borderRadius: '6px',
                        padding: '5px 8px',
                        fontSize: '11px',
                        color: '#fff',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleApplySmartPlacement(nlpInput)}
                      style={{
                        padding: '5px 10px',
                        background: '#10b981',
                        color: '#000',
                        fontWeight: 700,
                        fontSize: '10px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Place
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

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
            </>
          )}
        </div>
      )}
    </div>
  );
};


