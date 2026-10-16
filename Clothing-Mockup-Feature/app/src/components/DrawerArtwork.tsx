import React, { useRef, useState } from 'react';
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
  Sparkles,
} from 'lucide-react';
import type { ArtworkLayer, GarmentSide } from '../types/mockup';
import { checkEffectiveResolution } from '../engine/validation';
import { parseNaturalLanguagePlacement } from '../engine/3d/placementParser';

interface DrawerArtworkProps {
  side: GarmentSide;
  layers: ArtworkLayer[];
  allLayers?: { front: ArtworkLayer[]; back: ArtworkLayer[] };
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
  onOpenLibrary?: () => void;
  onSideChange?: (side: GarmentSide) => void;
  onApplyPlacement?: (
    layerId: string,
    placementTextOrTarget: string,
    scalePreset?: 'compact' | 'standard' | 'oversized'
  ) => void;
  onMoveLayerToSide?: (layerId: string, targetSide: GarmentSide) => void;
  isCuratedDesign?: boolean;
  isDesignerMode?: boolean;
}

export const DrawerArtwork: React.FC<DrawerArtworkProps> = ({
  side,
  layers,
  allLayers,
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
  onOpenLibrary,
  onSideChange,
  onApplyPlacement,
  onMoveLayerToSide,
  isCuratedDesign = false,
  isDesignerMode = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nlpInput, setNlpInput] = useState<string>('');
  const [activeRegion, setActiveRegion] = useState<'front' | 'back' | 'sleeve'>(
    side === 'back' ? 'back' : 'front'
  );
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Find selected layer from current side, or across all layers
  const allArtworkItems = [
    ...(allLayers?.front.map((l) => ({ ...l, viewSide: 'front' as GarmentSide })) || []),
    ...(allLayers?.back.map((l) => ({ ...l, viewSide: 'back' as GarmentSide })) || []),
  ];

  const selectedLayer =
    layers.find((l) => l.id === selectedLayerId) ||
    allArtworkItems.find((l) => l.id === selectedLayerId) ||
    null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) => onUploadFile(file));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => onUploadFile(file));
    }
    e.target.value = '';
  };

  const handleSelectRegion = (region: 'front' | 'back' | 'sleeve') => {
    setActiveRegion(region);
    if (!selectedLayer) return;

    const targetSide: GarmentSide = region === 'back' ? 'back' : 'front';
    if (onSideChange && side !== targetSide) {
      onSideChange(targetSide);
    }

    const defaultSpot =
      region === 'front' ? 'front-center' : region === 'back' ? 'back-center' : 'left-sleeve';

    if (onApplyPlacement) {
      onApplyPlacement(selectedLayer.id, defaultSpot);
      setFeedbackMsg(`✓ Placed on ${region.toUpperCase()} (${defaultSpot.replace('-', ' ')})`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else if (onMoveLayerToSide) {
      onMoveLayerToSide(selectedLayer.id, targetSide);
    }
  };

  const handleApplyTargetSpot = (
    targetSpot: string,
    scalePreset?: 'compact' | 'standard' | 'oversized'
  ) => {
    if (!selectedLayer) return;

    if (onApplyPlacement) {
      onApplyPlacement(selectedLayer.id, targetSpot, scalePreset);
      setFeedbackMsg(`✓ Placed on ${targetSpot.replace(/-/g, ' ').toUpperCase()}`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleApplyNlpPlacement = (text: string) => {
    if (!selectedLayer) return;
    const clean = text.trim();
    if (!clean) return;

    const parsed = parseNaturalLanguagePlacement(clean);
    const isBack = parsed.placement.includes('back');
    const isSleeve = parsed.placement.includes('sleeve');
    const targetRegion: 'front' | 'back' | 'sleeve' = isBack ? 'back' : isSleeve ? 'sleeve' : 'front';
    setActiveRegion(targetRegion);

    const targetSide: GarmentSide = isBack ? 'back' : 'front';
    if (onSideChange && side !== targetSide) {
      onSideChange(targetSide);
    }

    if (onApplyPlacement) {
      onApplyPlacement(selectedLayer.id, clean, parsed.scale);
      setFeedbackMsg(
        `✓ Placed on ${parsed.placement.replace(/-/g, ' ').toUpperCase()} (${parsed.scale.toUpperCase()})`
      );
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const getLayerPlacementLabel = (layer: ArtworkLayer) => {
    const isBack = layer.y < 650 && layer.x > 900 && layer.x < 1150;
    if (layer.x < 650) return 'Left Sleeve';
    if (layer.x > 1400) return 'Right Sleeve';
    if (layer.x < 900 && layer.y < 850) return 'Left Chest';
    if (layer.x > 1150 && layer.y < 850) return 'Right Chest';
    if (layer.y > 1300) return 'Bottom Hem';
    if (isBack) return 'Back Collar';
    return 'Center';
  };

  return (
    <div className="drawer-inner-content">
      <div className="drawer-header">
        <div className="drawer-title">Artwork & Prints (2D)</div>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'capitalize' }}>
          {side} View ({layers.length})
        </span>
      </div>

      <div className="drawer-content">
        {/* 2D View Switcher (Front vs Back) */}
        {onSideChange && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
            <button
              type="button"
              onClick={() => onSideChange('front')}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: side === 'front' ? '1.5px solid var(--accent, #3B5EFF)' : '1px solid rgba(255,255,255,0.1)',
                background: side === 'front' ? 'rgba(59, 94, 255, 0.2)' : 'rgba(255,255,255,0.03)',
                color: side === 'front' ? '#fff' : 'rgba(255,255,255,0.6)',
                fontWeight: side === 'front' ? 700 : 500,
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s',
              }}
            >
              <span>👕 Front View</span>
              <span style={{ fontSize: '10px', opacity: 0.75 }}>
                ({allLayers?.front.length ?? (side === 'front' ? layers.length : 0)})
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSideChange('back')}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: side === 'back' ? '1.5px solid var(--accent, #3B5EFF)' : '1px solid rgba(255,255,255,0.1)',
                background: side === 'back' ? 'rgba(59, 94, 255, 0.2)' : 'rgba(255,255,255,0.03)',
                color: side === 'back' ? '#fff' : 'rgba(255,255,255,0.6)',
                fontWeight: side === 'back' ? 700 : 500,
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s',
              }}
            >
              <span>🔄 Back View</span>
              <span style={{ fontSize: '10px', opacity: 0.75 }}>
                ({allLayers?.back.length ?? (side === 'back' ? layers.length : 0)})
              </span>
            </button>
          </div>
        )}

        {/* StarBy Curated Designs Library Button */}
        {onOpenLibrary && (
          <button
            type="button"
            onClick={onOpenLibrary}
            style={{
              background: 'linear-gradient(135deg, rgba(59, 94, 255, 0.22) 0%, rgba(20, 22, 28, 0.95) 100%)',
              border: '1px solid rgba(59, 94, 255, 0.4)',
              borderRadius: '12px',
              padding: '10px 12px',
              cursor: 'pointer',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              transition: 'all 0.2s',
              boxShadow: '0 4px 16px rgba(59, 94, 255, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'rgba(59, 94, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#A5B4FC',
                }}
              >
                <Sparkles size={15} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>
                  StarBy Graphic Library
                </div>
                <div style={{ fontSize: '9.5px', color: 'rgba(255, 255, 255, 0.65)' }}>
                  96 Curated Designs
                </div>
              </div>
            </div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#fff',
                background: '#3B5EFF',
                padding: '4px 8px',
                borderRadius: '6px',
              }}
            >
              Browse →
            </div>
          </button>
        )}

        {/* Upload Dropzone */}
        {(!isCuratedDesign || isDesignerMode) && (
          <div
            id="artwork-dropzone"
            className="dropzone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{ marginBottom: '10px', padding: '12px' }}
          >
            <div className="dropzone-icon">
              <Upload size={18} />
            </div>
            <div>
              <div className="dropzone-title" style={{ fontSize: '12px' }}>Upload Design</div>
              <div className="dropzone-subtitle" style={{ fontSize: '10px' }}>PNG, JPG, SVG or WebP</div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.svg,.webp"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
          </div>
        )}

        {/* Validation Warning Alert */}
        {uploadWarning && (
          <div className="warning-box">
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <div>{uploadWarning}</div>
          </div>
        )}

        {/* Choose WHICH Artwork to Position */}
        {allArtworkItems.length > 0 && (
          <div className="control-group" style={{ marginBottom: '10px' }}>
            <div className="control-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Select Artwork to Position</span>
              <span style={{ fontSize: '10px', color: 'var(--accent, #3B5EFF)', fontWeight: 700 }}>
                {allArtworkItems.length} Graphics
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              {allArtworkItems.map((art) => {
                const isSelected = art.id === selectedLayerId;
                const spot = getLayerPlacementLabel(art);

                return (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => {
                      onSelectLayer(art.id);
                      if (onSideChange && side !== art.viewSide) {
                        onSideChange(art.viewSide);
                      }
                      setActiveRegion(art.viewSide === 'back' ? 'back' : 'front');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: isSelected ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                      color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
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
                        <img src={art.src} alt={art.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: isSelected ? 700 : 600 }}>{art.name}</div>
                        <div style={{ fontSize: '9px', color: isSelected ? '#34d399' : 'rgba(255,255,255,0.45)' }}>
                          {art.viewSide === 'back' ? '🔄 Back' : '👕 Front'} &bull; {spot}
                        </div>
                      </div>
                    </div>

                    {isSelected ? (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          background: '#10b981',
                          color: '#000',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        ACTIVE
                      </span>
                    ) : (
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>Select →</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Placement Section when layer is selected */}
        {selectedLayer && (
          <div
            style={{
              background: 'var(--bg-card, #131722)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '12px',
              boxShadow: '0 4px 18px rgba(0,0,0,0.4)',
            }}
          >
            {/* 1. REGION SELECTOR: FRONT, BACK, SLEEVE */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                  Step 1: Choose Apparel Region
                </span>
                <span style={{ fontSize: '9px', color: '#10b981', fontFamily: 'monospace', fontWeight: 600 }}>
                  Active: {activeRegion.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[
                  { id: 'front', label: '👕 FRONT' },
                  { id: 'back', label: '🔄 BACK' },
                  { id: 'sleeve', label: '🦾 SLEEVE' },
                ].map((reg) => {
                  const isSelected = activeRegion === reg.id;
                  return (
                    <button
                      key={reg.id}
                      type="button"
                      onClick={() => handleSelectRegion(reg.id as any)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '6px',
                        border: isSelected ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.12)',
                        background: isSelected ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255,255,255,0.03)',
                        color: isSelected ? '#34d399' : '#aaa',
                        fontWeight: 700,
                        fontSize: '11px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      {reg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. TARGET SPOTS (ONLY for the chosen region!) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
                  Step 2: Choose Target Spot ({activeRegion.toUpperCase()})
                </span>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>Filtered</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {activeRegion === 'front' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleApplyTargetSpot('front-center', 'standard')}
                      className="btn-card-subtle"
                      style={{ padding: '7px 8px', fontSize: '10.5px', fontWeight: 600, textAlign: 'left', borderRadius: '6px' }}
                    >
                      👕 Front Center
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTargetSpot('left-chest', 'compact')}
                      className="btn-card-subtle"
                      style={{ padding: '7px 8px', fontSize: '10.5px', fontWeight: 600, textAlign: 'left', borderRadius: '6px' }}
                    >
                      🫀 Left Chest (Pocket)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTargetSpot('right-chest', 'compact')}
                      className="btn-card-subtle"
                      style={{ padding: '7px 8px', fontSize: '10.5px', fontWeight: 600, textAlign: 'left', borderRadius: '6px' }}
                    >
                      🎯 Right Chest
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTargetSpot('full-front', 'oversized')}
                      className="btn-card-subtle"
                      style={{ padding: '7px 8px', fontSize: '10.5px', fontWeight: 600, textAlign: 'left', borderRadius: '6px' }}
                    >
                      ⚡ Full Front Print
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTargetSpot('bottom-hem', 'standard')}
                      className="btn-card-subtle"
                      style={{ padding: '7px 8px', fontSize: '10.5px', fontWeight: 600, textAlign: 'left', borderRadius: '6px', gridColumn: 'span 2' }}
                    >
                      📍 Bottom Hem
                    </button>
                  </>
                )}

                {activeRegion === 'back' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleApplyTargetSpot('back-center', 'standard')}
                      className="btn-card-subtle"
                      style={{ padding: '7px 8px', fontSize: '10.5px', fontWeight: 600, textAlign: 'left', borderRadius: '6px' }}
                    >
                      🔄 Back Center
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTargetSpot('back-collar', 'compact')}
                      className="btn-card-subtle"
                      style={{ padding: '7px 8px', fontSize: '10.5px', fontWeight: 600, textAlign: 'left', borderRadius: '6px' }}
                    >
                      🏷️ Back Collar (Nape)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTargetSpot('full-back', 'oversized')}
                      className="btn-card-subtle"
                      style={{ padding: '7px 8px', fontSize: '10.5px', fontWeight: 600, textAlign: 'left', borderRadius: '6px' }}
                    >
                      🔥 Full Back Statement
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTargetSpot('bottom-hem', 'standard')}
                      className="btn-card-subtle"
                      style={{ padding: '7px 8px', fontSize: '10.5px', fontWeight: 600, textAlign: 'left', borderRadius: '6px' }}
                    >
                      📍 Bottom Hem
                    </button>
                  </>
                )}

                {activeRegion === 'sleeve' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleApplyTargetSpot('left-sleeve', 'standard')}
                      className="btn-card-subtle"
                      style={{ padding: '7px 8px', fontSize: '10.5px', fontWeight: 600, textAlign: 'left', borderRadius: '6px' }}
                    >
                      🦾 Left Sleeve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyTargetSpot('right-sleeve', 'standard')}
                      className="btn-card-subtle"
                      style={{ padding: '7px 8px', fontSize: '10.5px', fontWeight: 600, textAlign: 'left', borderRadius: '6px' }}
                    >
                      🦾 Right Sleeve
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 3. VISIBLE TEXT INPUT AREA FOR NATURAL LANGUAGE PLACEMENT */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} />
                  <span>Type Placement Place</span>
                </span>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                  Natural Language
                </span>
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="text"
                  value={nlpInput}
                  onChange={(e) => setNlpInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleApplyNlpPlacement(nlpInput);
                    }
                  }}
                  placeholder='e.g. "small left chest", "big back print", "bottom hem"...'
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    fontSize: '11px',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleApplyNlpPlacement(nlpInput)}
                  style={{
                    padding: '6px 12px',
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

              {/* Quick suggestion chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                {(activeRegion === 'front'
                  ? ['small left chest', 'front center', 'full front print', 'bottom hem']
                  : activeRegion === 'back'
                  ? ['back center', 'back collar nape', 'big full back print', 'bottom hem']
                  : ['left sleeve', 'right sleeve']
                ).map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setNlpInput(chip);
                      handleApplyNlpPlacement(chip);
                    }}
                    style={{
                      padding: '3px 6px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: '9.5px',
                      cursor: 'pointer',
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {feedbackMsg && (
                <div
                  style={{
                    marginTop: '6px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    fontSize: '10px',
                    fontWeight: 600,
                  }}
                >
                  {feedbackMsg}
                </div>
              )}
            </div>

            {/* Scale Preset Buttons */}
            <div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Scale Preset
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const nw = selectedLayer.naturalWidth || 1000;
                    const nh = selectedLayer.naturalHeight || 1000;
                    const aspect = nw / nh;
                    const dim = 340;
                    onUpdateLayer(selectedLayer.id, {
                      width: aspect >= 1 ? dim : Math.round(dim * aspect),
                      height: aspect >= 1 ? Math.round(dim / aspect) : dim,
                    });
                  }}
                  className="btn-card-subtle"
                  style={{ padding: '5px', fontSize: '10px', textAlign: 'center' }}
                >
                  Compact
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nw = selectedLayer.naturalWidth || 1000;
                    const nh = selectedLayer.naturalHeight || 1000;
                    const aspect = nw / nh;
                    const dim = 600;
                    onUpdateLayer(selectedLayer.id, {
                      width: aspect >= 1 ? dim : Math.round(dim * aspect),
                      height: aspect >= 1 ? Math.round(dim / aspect) : dim,
                    });
                  }}
                  className="btn-card-subtle"
                  style={{ padding: '5px', fontSize: '10px', textAlign: 'center' }}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nw = selectedLayer.naturalWidth || 1000;
                    const nh = selectedLayer.naturalHeight || 1000;
                    const aspect = nw / nh;
                    const dim = 800;
                    onUpdateLayer(selectedLayer.id, {
                      width: aspect >= 1 ? dim : Math.round(dim * aspect),
                      height: aspect >= 1 ? Math.round(dim / aspect) : dim,
                    });
                  }}
                  className="btn-card-subtle"
                  style={{ padding: '5px', fontSize: '10px', textAlign: 'center' }}
                >
                  Oversized
                </button>
              </div>
            </div>

            {/* Fine-Tuning Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>Fine Adjustment</span>
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
              <div className="warning-box" style={{ marginBottom: '10px' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <div>{resCheck.warning}</div>
              </div>
            );
          }
          return null;
        })()}

        {/* Layers Stack List */}
        <div className="control-group">
          <div className="control-label">
            <span>Layers Stack ({side} view)</span>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Top to Bottom</span>
          </div>

          {layers.length === 0 ? (
            <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
              No graphics added to {side} view yet.
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
                        {layer.naturalWidth}×{layer.naturalHeight}px &bull; {getLayerPlacementLabel(layer)}
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
        <div className="info-box" style={{ marginTop: '12px' }}>
          <Info size={16} style={{ flexShrink: 0 }} />
          <div>Original artwork pixels are preserved cleanly. Click and drag handles on the canvas to move, rotate, and scale.</div>
        </div>
      </div>
    </div>
  );
};
