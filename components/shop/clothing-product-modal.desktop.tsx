'use client';

import React from 'react';
import Image from 'next/image';
import {
  X,
  Sparkles,
  Check,
  ArrowRight,
  Layers,
  Crosshair,
  MousePointerClick,
  RotateCw,
} from 'lucide-react';
import type { ClothingModalState } from './clothing-product-modal.shared';
import { isBackPlacement, getPlacementRegion } from './clothing-product-modal.shared';
import type { DesignPlacementTarget } from '@/lib/clothing-designs/types';

export function ClothingProductModalDesktop({ state }: { state: ClothingModalState }) {
  const {
    design,
    artworks,
    selectedGarmentId,
    setSelectedGarmentId,
    selectedGarment,
    unitPrice,
    selectedColor,
    setSelectedColor,
    selectedSize,
    setSelectedSize,
    activeArtId,
    setActiveArtId,
    artworkPlacements,
    artworkCalibratedCoords,
    includedArtworks,
    setIncludedArtworks,
    previewSide,
    setPreviewSide,
    nlpInputText,
    setNlpInputText,
    nlpParsed,
    currentActiveArt,
    currentPlacement,
    currentScale,
    isCurrentPlacementOnCurrentSide,
    handleSelectArtwork,
    handleUpdatePlacement,
    handleUpdateSide,
    handleUpdateScale,
    handleNlpInputChange,
    handleApplyQuickPrompt,
    handleToggleInclude,
    handleGarmentMockupClick,
    handleLaunch3D,
    getPreviewPlacementStyles,
    onClose,
    APPAREL_LIST,
    SCALE_PRESETS,
    QUICK_NLP_PROMPTS,
    isCuratedDesign,
  } = state;

  if (!design) return null;

  return (
    <div
      className="fixed inset-0 z-[99990] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-xl animate-fadeIn overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      <div
        className="relative w-full max-w-5xl bg-[#111216] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-row max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-40 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md border border-white/15 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── Left Side: Interactive Mockup Visualizer with Click-to-Place ────── */}
        <div
          className="w-[45%] p-6 flex flex-col justify-between items-center border-r border-white/10 relative overflow-hidden transition-colors duration-500"
          style={{ backgroundColor: selectedColor.hex === '#FFFFFF' ? '#181A20' : '#14161B' }}
        >
          {/* Subtle Ambient Color Glow */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none transition-colors duration-500 blur-3xl"
            style={{ backgroundColor: selectedColor.hex }}
          />

          {/* Top Bar: Design ID & Side Flip Toggle */}
          <div className="w-full flex items-center justify-between z-10 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-white/50 uppercase tracking-widest">
                {design.id.toUpperCase()}
              </span>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {artworks.length} {artworks.length === 1 ? 'Design File' : 'Artwork Files'}
              </span>
            </div>

            {/* Front / Back preview flip button */}
            <div className="flex items-center gap-1 bg-black/60 border border-white/10 p-0.5 rounded-full">
              <button
                type="button"
                onClick={() => setPreviewSide('front')}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-full transition-all flex items-center gap-1 ${
                  previewSide === 'front'
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <span>Front</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewSide('back')}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-full transition-all flex items-center gap-1 ${
                  previewSide === 'back'
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <span>Back</span>
              </button>
            </div>
          </div>

          {/* Canvas Preview Area with Click-to-Pinpoint Hotspots */}
          <div
            onClick={handleGarmentMockupClick}
            className="group relative w-full aspect-square max-w-[340px] my-auto flex items-center justify-center select-none cursor-crosshair"
            title="Click anywhere on the shirt to position the graphic"
          >
            {/* Simulated Garment Background Plate */}
            <div
              className="absolute inset-0 rounded-3xl border transition-all duration-300 shadow-2xl overflow-hidden flex items-center justify-center pointer-events-none"
              style={{
                backgroundColor: selectedColor.hex,
                borderColor: selectedColor.hex === '#FFFFFF' ? '#33353F' : 'rgba(255,255,255,0.08)',
              }}
            >
              <div
                className="absolute inset-0 opacity-[0.06] pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.4) 0%, transparent 70%)',
                }}
              />

              <span className="absolute top-3 left-4 font-mono text-[9px] text-white/30 uppercase tracking-widest pointer-events-none">
                {previewSide === 'front' ? 'FRONT VIEW' : 'BACK VIEW'}
              </span>

              <div className="absolute top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded-full text-[8px] font-mono text-emerald-300 pointer-events-none">
                <MousePointerClick className="w-2.5 h-2.5" />
                <span>Click to place</span>
              </div>
            </div>

            {/* Interactive Hotspot Targets */}
            {previewSide === 'front' ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdatePlacement('left-chest');
                  }}
                  className={`absolute z-20 w-6 h-6 rounded-full border transition-all flex items-center justify-center ${
                    currentPlacement === 'left-chest'
                      ? 'bg-emerald-500 border-white text-black scale-110 shadow-lg ring-2 ring-emerald-400/50'
                      : 'bg-white/10 border-white/30 text-white/60 hover:bg-white/30 hover:scale-105'
                  }`}
                  style={{ top: '28%', left: '64%', transform: 'translate(-50%, -50%)' }}
                  title="Wearer Left Chest Pocket"
                >
                  <Crosshair className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdatePlacement('front-center');
                  }}
                  className={`absolute z-20 w-6 h-6 rounded-full border transition-all flex items-center justify-center ${
                    currentPlacement === 'front-center' || currentPlacement === 'front'
                      ? 'bg-emerald-500 border-white text-black scale-110 shadow-lg ring-2 ring-emerald-400/50'
                      : 'bg-white/10 border-white/30 text-white/60 hover:bg-white/30 hover:scale-105'
                  }`}
                  style={{ top: '46%', left: '50%', transform: 'translate(-50%, -50%)' }}
                  title="Front Center Chest"
                >
                  <Crosshair className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdatePlacement('right-chest');
                  }}
                  className={`absolute z-20 w-6 h-6 rounded-full border transition-all flex items-center justify-center ${
                    currentPlacement === 'right-chest'
                      ? 'bg-emerald-500 border-white text-black scale-110 shadow-lg ring-2 ring-emerald-400/50'
                      : 'bg-white/10 border-white/30 text-white/60 hover:bg-white/30 hover:scale-105'
                  }`}
                  style={{ top: '28%', left: '36%', transform: 'translate(-50%, -50%)' }}
                  title="Wearer Right Chest"
                >
                  <Crosshair className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdatePlacement('bottom-hem');
                  }}
                  className={`absolute z-20 w-6 h-6 rounded-full border transition-all flex items-center justify-center ${
                    currentPlacement === 'bottom-hem'
                      ? 'bg-emerald-500 border-white text-black scale-110 shadow-lg ring-2 ring-emerald-400/50'
                      : 'bg-white/10 border-white/30 text-white/60 hover:bg-white/30 hover:scale-105'
                  }`}
                  style={{ top: '76%', left: '50%', transform: 'translate(-50%, -50%)' }}
                  title="Bottom Hem Accent"
                >
                  <Crosshair className="w-3 h-3" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdatePlacement('back-collar');
                  }}
                  className={`absolute z-20 w-6 h-6 rounded-full border transition-all flex items-center justify-center ${
                    currentPlacement === 'back-collar'
                      ? 'bg-emerald-500 border-white text-black scale-110 shadow-lg ring-2 ring-emerald-400/50'
                      : 'bg-white/10 border-white/30 text-white/60 hover:bg-white/30 hover:scale-105'
                  }`}
                  style={{ top: '19%', left: '50%', transform: 'translate(-50%, -50%)' }}
                  title="Back Collar (Nape)"
                >
                  <Crosshair className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdatePlacement('back-center');
                  }}
                  className={`absolute z-20 w-6 h-6 rounded-full border transition-all flex items-center justify-center ${
                    currentPlacement === 'back-center' || currentPlacement === 'back'
                      ? 'bg-emerald-500 border-white text-black scale-110 shadow-lg ring-2 ring-emerald-400/50'
                      : 'bg-white/10 border-white/30 text-white/60 hover:bg-white/30 hover:scale-105'
                  }`}
                  style={{ top: '46%', left: '50%', transform: 'translate(-50%, -50%)' }}
                  title="Back Center"
                >
                  <Crosshair className="w-3 h-3" />
                </button>
              </>
            )}

            {/* Render Graphic with Placement & Scale Applied */}
            {currentActiveArt && isCurrentPlacementOnCurrentSide && (
              <div
                style={getPreviewPlacementStyles(
                  currentPlacement,
                  currentScale,
                  false,
                  artworkCalibratedCoords[currentActiveArt.id]
                )}
                className="z-10 flex items-center justify-center transition-all duration-300 drop-shadow-xl pointer-events-none"
              >
                <Image
                  src={currentActiveArt.previewUrl}
                  alt={currentActiveArt.name}
                  fill
                  unoptimized
                  className="object-contain"
                  sizes="320px"
                />
              </div>
            )}

            {/* Opposite side notice */}
            {currentActiveArt && !isCurrentPlacementOnCurrentSide && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdatePlacement(previewSide === 'front' ? 'front-center' : 'back-center');
                }}
                className="z-20 px-3.5 py-2 bg-neutral-900/95 border border-emerald-500/50 rounded-xl text-center flex items-center gap-2 cursor-pointer shadow-2xl hover:bg-emerald-950/60 hover:border-emerald-400 transition-all scale-100 hover:scale-105"
                title={`Click to move this artwork to the ${previewSide === 'front' ? 'Front' : 'Back'}`}
              >
                <RotateCw className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-[10px] text-white">
                  Placed on {previewSide === 'front' ? 'Back' : 'Front'} &bull;{' '}
                  <strong className="text-emerald-400 underline">Tap to move here</strong>
                </span>
              </div>
            )}

            {/* Print Configuration Pill Label */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-black/85 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-mono text-white/90 uppercase tracking-wider whitespace-nowrap shadow-lg flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{currentPlacement.replace('-', ' ').toUpperCase()}</span>
              <span>&bull;</span>
              <span>{currentScale.toUpperCase()}</span>
              <span>&bull;</span>
              <span>{selectedGarment.name.toUpperCase()}</span>
            </div>
          </div>

          {/* Bottom Info Pill */}
          <div className="w-full z-10 mt-2 flex items-center justify-center gap-2 text-white/40 font-mono text-[10px] uppercase tracking-wider">
            <span>Accurate 3D Coordinate Mapping</span>
            <span>&bull;</span>
            <span>Interactive Studio Ready</span>
          </div>
        </div>

        {/* ── Right Side: Comprehensive Configuration Controls ───────────────── */}
        <div className="w-[55%] flex flex-col justify-between overflow-hidden max-h-[90vh]">
          {/* Scrollable Configuration Controls */}
          <div className="flex-1 overflow-y-auto p-7 space-y-6">
            <div className="flex flex-col gap-5">
              {/* Header with clearance from close button */}
              <div className="pr-12">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest font-semibold">
                    Configure Your Apparel
                  </span>
                </div>
                <h2
                  id="modal-headline"
                  className="font-mono text-2xl font-bold uppercase tracking-wider text-white"
                >
                  {design.name}
                </h2>
                <p className="font-mono text-xs text-white/50 mt-1">
                  {selectedGarment.description}
                </p>
              </div>

              {/* STEP 1: Garment Type & GSM */}
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[11px] text-white/70 uppercase tracking-wider font-semibold">
                  Select Apparel Type ({selectedGarment.gsm} GSM)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {APPAREL_LIST.map((apparel) => {
                    const isSelected = selectedGarmentId === apparel.id;
                    return (
                      <button
                        key={apparel.id}
                        type="button"
                        onClick={() => setSelectedGarmentId(apparel.id)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                          isSelected
                            ? 'bg-white/10 border-white text-white shadow-md'
                            : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                          {apparel.name}
                        </span>
                        <span className="font-mono text-[10px] text-white/40">
                          {apparel.fabric} • {apparel.gsm} GSM
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: Color Swatches */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] text-white/70 uppercase tracking-wider font-semibold">
                    Garment Color: <span className="text-white">{selectedColor.name}</span>
                  </label>
                  {currentActiveArt?.colorHint && currentActiveArt.colorHint !== 'any' && (
                    <span className="font-mono text-[10px] text-emerald-400">
                      ★ Graphic optimized for {currentActiveArt.colorHint}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {selectedGarment.colors.map((color) => {
                    const isSelected = selectedColor.name === color.name;
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`group relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111216] scale-110 shadow-lg'
                            : 'opacity-85 hover:opacity-100 hover:scale-105'
                        }`}
                        style={{
                          backgroundColor: color.hex,
                          border:
                            color.hex === '#FFFFFF'
                              ? '1px solid #444'
                              : '1px solid rgba(255,255,255,0.1)',
                        }}
                        title={color.name}
                        aria-label={color.name}
                      >
                        {isSelected && (
                          <Check
                            className={`w-4 h-4 ${
                              color.hex === '#FFFFFF' ||
                              color.hex === '#D4C5B9' ||
                              color.hex === '#E5E5E5'
                                ? 'text-black'
                                : 'text-white'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 3: Sizes */}
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[11px] text-white/70 uppercase tracking-wider font-semibold">
                  Garment Size
                </label>
                <div className="flex items-center gap-2">
                  {selectedGarment.sizes.map((size) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`flex-1 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all ${
                          isSelected
                            ? 'bg-white text-black font-bold shadow-md'
                            : 'bg-white/5 text-white/70 border border-white/5 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 4: Multi-Image Artwork Gallery Selector */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] text-white/70 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-white/50" />
                    <span>Artwork Images in this Design ({artworks.length})</span>
                  </label>
                  <span className="font-mono text-[10px] text-white/40">
                    Select to position &amp; customize
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {artworks.map((art) => {
                    const isActive = activeArtId === art.id;
                    const isIncluded = includedArtworks.has(art.id);
                    const artPlacement =
                      artworkPlacements[art.id] || art.suggestedPlacement || 'front-center';

                    return (
                      <div
                        key={art.id}
                        onClick={() => handleSelectArtwork(art)}
                        className={`relative p-2.5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 ${
                          isActive
                            ? 'bg-white/10 border-white text-white shadow-lg ring-1 ring-white/50'
                            : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/40" />
                        )}

                        <div className="relative w-full aspect-square rounded-xl bg-black/40 overflow-hidden flex items-center justify-center p-2">
                          <Image
                            src={art.previewUrl}
                            alt={art.name}
                            fill
                            unoptimized
                            className="object-contain p-1"
                            sizes="120px"
                          />
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-[11px] font-semibold text-white/90 truncate">
                            {art.name}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[9px] text-white/40 uppercase">
                              {artPlacement.replace('-', ' ')}
                            </span>
                            {art.colorHint && art.colorHint !== 'any' && (
                              <span
                                className={`text-[8px] font-mono px-1.5 py-0.2 rounded ${
                                  art.colorHint === 'black'
                                    ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                                    : 'bg-white/20 text-white'
                                }`}
                              >
                                for {art.colorHint} tees
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Front / Back Toggle for this Artwork */}
                        <div className="flex items-center gap-1 mt-1 pt-1 border-t border-white/5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveArtId(art.id);
                              setIncludedArtworks((prev: Set<string>) => new Set(prev).add(art.id));
                              handleUpdatePlacement('front-center');
                              setPreviewSide('front');
                            }}
                            className={`flex-1 py-1 rounded text-[9px] font-mono uppercase tracking-wider text-center transition-all ${
                              !isBackPlacement(artPlacement)
                                ? 'bg-emerald-500 text-black font-bold shadow-sm'
                                : 'bg-white/5 text-white/50 hover:bg-white/15 hover:text-white'
                            }`}
                          >
                            Front
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveArtId(art.id);
                              setIncludedArtworks((prev: Set<string>) => new Set(prev).add(art.id));
                              handleUpdatePlacement('back-center');
                              setPreviewSide('back');
                            }}
                            className={`flex-1 py-1 rounded text-[9px] font-mono uppercase tracking-wider text-center transition-all ${
                              isBackPlacement(artPlacement)
                                ? 'bg-emerald-500 text-black font-bold shadow-sm'
                                : 'bg-white/5 text-white/50 hover:bg-white/15 hover:text-white'
                            }`}
                          >
                            Back
                          </button>
                        </div>

                        {/* Include Checkbox */}
                        {artworks.length > 1 && (
                          <div
                            className="pt-1 mt-auto border-t border-white/5 flex items-center justify-between"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleInclude(art.id);
                            }}
                          >
                            <span className="font-mono text-[9px] text-white/50">Print on tee</span>
                            <div
                              className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                                isIncluded
                                  ? 'bg-emerald-500 border-emerald-400 text-black'
                                  : 'bg-transparent border-white/20'
                              }`}
                            >
                              {isIncluded && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Curated Studio Placement vs Custom User Upload Controls */}
              {isCuratedDesign ? (
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-950/25 via-indigo-950/20 to-black/60 border border-purple-500/30 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                      <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                        🔒 Studio Verified Placement
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300 font-bold bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-500/40">
                      DESIGN LOCKED
                    </span>
                  </div>
                  <p className="font-mono text-xs text-white/75 leading-relaxed">
                    This curated artwork has been calibrated by the designer specifically for{' '}
                    <strong className="text-white">{selectedGarment.name}</strong>. Position, scale, and print coordinates are studio-verified to ensure optimal look and feel when printed.
                  </p>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/60">
                    <span>
                      Placement: <strong className="text-purple-300 uppercase">{currentPlacement.replace('-', ' ')}</strong>
                    </span>
                    <span>
                      Cut: <strong className="text-white">{selectedGarment.name}</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* STEP 5: Natural Language Input Bar */}
                  <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-white/[0.03] to-cyan-950/20 border border-white/10">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-[11px] text-white/90 uppercase tracking-wider font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Type where you want it placed</span>
                      </label>
                      <span className="text-[10px] font-mono text-emerald-400 font-medium">
                        Smart AI Placement
                      </span>
                    </div>

                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={nlpInputText}
                          onChange={(e) => handleNlpInputChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (nlpInputText.trim()) handleNlpInputChange(nlpInputText);
                            }
                          }}
                          placeholder='e.g. "small left chest", "big back print", "back collar"...'
                          className="w-full bg-black/60 border border-white/15 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/35 focus:outline-none transition-colors font-mono"
                        />
                        {nlpInputText && (
                          <button
                            type="button"
                            onClick={() => setNlpInputText('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1"
                            title="Clear input"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (nlpInputText.trim()) handleNlpInputChange(nlpInputText);
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Place</span>
                      </button>
                    </div>

                    {nlpParsed && (
                      <div className="flex items-center gap-2 text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2.5 py-1.5 rounded-lg">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>
                          Understood: <strong>{nlpParsed.description}</strong>
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[9px] font-mono text-white/40">Popular:</span>
                      {QUICK_NLP_PROMPTS.map((prompt) => (
                        <button
                          key={prompt.text}
                          type="button"
                          onClick={() => handleApplyQuickPrompt(prompt.text)}
                          className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-[9px] font-mono text-white/70 hover:text-white transition-all"
                        >
                          {prompt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* STEP 6: Placement Region & Precise Target */}
                  <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-[11px] text-white/90 uppercase tracking-wider font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Choose Where to Print This Artwork</span>
                      </label>
                      <span className="font-mono text-[10px] text-emerald-400 uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        {currentPlacement.replace('-', ' ')}
                      </span>
                    </div>

                    {/* 1. Main Region Chooser */}
                    <div className="flex flex-col gap-1.5">
                      <span className="font-mono text-[9px] text-white/50 uppercase tracking-wider font-semibold">
                        1. Select Print Region:
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateSide('front')}
                          className={`py-3 px-2 rounded-xl border text-center flex items-center justify-center gap-1.5 font-mono text-xs uppercase tracking-wider transition-all ${
                            getPlacementRegion(currentPlacement) === 'front'
                              ? 'bg-emerald-500 border-emerald-400 text-black font-bold shadow-lg ring-2 ring-emerald-400/30'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>👕 FRONT</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateSide('back')}
                          className={`py-3 px-2 rounded-xl border text-center flex items-center justify-center gap-1.5 font-mono text-xs uppercase tracking-wider transition-all ${
                            getPlacementRegion(currentPlacement) === 'back'
                              ? 'bg-emerald-500 border-emerald-400 text-black font-bold shadow-lg ring-2 ring-emerald-400/30'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>🔄 BACK</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateSide('sleeve')}
                          className={`py-3 px-2 rounded-xl border text-center flex items-center justify-center gap-1.5 font-mono text-xs uppercase tracking-wider transition-all ${
                            getPlacementRegion(currentPlacement) === 'sleeve'
                              ? 'bg-emerald-500 border-emerald-400 text-black font-bold shadow-lg ring-2 ring-emerald-400/30'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>🦾 SLEEVE</span>
                        </button>
                      </div>
                    </div>

                    {/* 2. Specific Placement Targets */}
                    <div className="flex flex-col gap-1.5 pt-1">
                      <span className="font-mono text-[9px] text-white/50 uppercase tracking-wider font-semibold">
                        2. Pick Exact Placement on {getPlacementRegion(currentPlacement).toUpperCase()}:
                      </span>
                      <div
                        className={`grid gap-1.5 ${
                          getPlacementRegion(currentPlacement) === 'sleeve'
                            ? 'grid-cols-2'
                            : 'grid-cols-2 sm:grid-cols-3'
                        }`}
                      >
                        {(getPlacementRegion(currentPlacement) === 'front'
                          ? [
                              { id: 'front-center', label: 'Front Center', desc: 'Standard chest' },
                              { id: 'left-chest', label: 'Left Chest', desc: 'Over heart / pocket' },
                              { id: 'right-chest', label: 'Right Chest', desc: 'Wearer right chest' },
                              { id: 'full-front', label: 'Full Front', desc: 'Oversized torso' },
                              { id: 'bottom-hem', label: 'Bottom Hem', desc: 'Lower waistline' },
                            ]
                          : getPlacementRegion(currentPlacement) === 'back'
                          ? [
                              { id: 'back-center', label: 'Back Center', desc: 'Centered upper back' },
                              { id: 'back-collar', label: 'Back Collar', desc: 'Nape of neck' },
                              { id: 'full-back', label: 'Full Back', desc: 'Oversized statement' },
                              { id: 'bottom-hem', label: 'Bottom Hem', desc: 'Lower hemline' },
                            ]
                          : [
                              { id: 'left-sleeve', label: 'Left Sleeve', desc: 'Left arm / bicep' },
                              { id: 'right-sleeve', label: 'Right Sleeve', desc: 'Right arm / bicep' },
                            ]
                        ).map((opt) => {
                          const isSelected = currentPlacement === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleUpdatePlacement(opt.id as DesignPlacementTarget)}
                              className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                                isSelected
                                  ? 'bg-white text-black border-white font-bold shadow-md'
                                  : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <span className="font-mono text-[10px] uppercase tracking-wider">
                                {opt.label}
                              </span>
                              <span
                                className={`font-mono text-[8px] truncate ${
                                  isSelected ? 'text-black/60' : 'text-white/40'
                                }`}
                              >
                                {opt.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* STEP 7: Scale */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-[11px] text-white/70 uppercase tracking-wider font-semibold">
                        Design Print Scale
                      </label>
                      <span className="font-mono text-[10px] text-white/50 uppercase">
                        {currentScale} scale
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {SCALE_PRESETS.map((scale) => {
                        const isSelected = currentScale === scale.id;
                        return (
                          <button
                            key={scale.id}
                            type="button"
                            onClick={() => handleUpdateScale(scale.id)}
                            className={`py-2 px-3 rounded-xl border text-center flex flex-col items-center justify-center gap-0.5 transition-all ${
                              isSelected
                                ? 'bg-white text-black border-white font-bold shadow-md'
                                : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <span className="font-mono text-[11px] uppercase tracking-wider">
                              {scale.label}
                            </span>
                            <span
                              className={`font-mono text-[9px] ${
                                isSelected ? 'text-black/60' : 'text-white/40'
                              }`}
                            >
                              {scale.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sticky Bottom Bar */}
          <div className="p-6 bg-[#0D0E12] border-t border-white/10 flex items-center justify-between gap-4 flex-shrink-0 z-20">
            <div>
              <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest">
                Unit Price
              </p>
              <p className="font-mono text-2xl font-bold text-white">
                ₹{unitPrice.toLocaleString()}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLaunch3D}
              className="flex-1 py-3.5 px-6 bg-white hover:bg-white/90 text-black font-mono text-xs font-bold uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-xl hover:shadow-white/10 cursor-pointer"
            >
              <span>OPEN IN 3D STUDIO [360°]</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
