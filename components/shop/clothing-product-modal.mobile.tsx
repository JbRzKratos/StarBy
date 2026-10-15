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
  RotateCw,
} from 'lucide-react';
import type { ClothingModalState } from './clothing-product-modal.shared';
import { isBackPlacement, getPlacementRegion } from './clothing-product-modal.shared';
import type { DesignPlacementTarget } from '@/lib/clothing-designs/types';

export function ClothingProductModalMobile({ state }: { state: ClothingModalState }) {
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
    previewSide,
    setPreviewSide,
    nlpInputText,
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
      className="fixed inset-0 z-[99990] bg-[#0c0e12] flex flex-col overflow-hidden animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-modal-title"
    >
      {/* ── 1. Dedicated Header Bar (NO OVERLAPS) ────────────────────────── */}
      <header className="h-14 px-4 bg-[#111318]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[10px] text-white/50 uppercase tracking-widest truncate">
            {design.id.toUpperCase()}
          </span>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
            {artworks.length} {artworks.length === 1 ? 'Artwork' : 'Artworks'}
          </span>
        </div>

        {/* Clear, dedicated Close Button with generous touch clearance */}
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 active:bg-white/20 text-white flex items-center justify-center transition-all border border-white/15 cursor-pointer shrink-0"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* ── 2. Compact Interactive Garment Preview ────────────────────────── */}
      <section
        className="w-full relative px-4 py-3 flex flex-col items-center justify-center border-b border-white/10 flex-shrink-0 transition-colors duration-500 overflow-hidden"
        style={{ backgroundColor: selectedColor.hex === '#FFFFFF' ? '#181A20' : '#121419' }}
      >
        {/* Subtle Ambient Glow */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none transition-colors duration-500 blur-2xl"
          style={{ backgroundColor: selectedColor.hex }}
        />

        {/* Floating Front / Back Segmented Switch Inside Canvas (Top Right) */}
        <div className="absolute top-3 right-4 z-30 flex items-center gap-1 bg-black/80 backdrop-blur-md border border-white/15 p-0.5 rounded-full shadow-lg">
          <button
            type="button"
            onClick={() => setPreviewSide('front')}
            className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded-full transition-all flex items-center gap-1 ${
              previewSide === 'front'
                ? 'bg-white text-black font-bold shadow'
                : 'text-white/60 active:text-white'
            }`}
          >
            <span>Front</span>
          </button>
          <button
            type="button"
            onClick={() => setPreviewSide('back')}
            className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded-full transition-all flex items-center gap-1 ${
              previewSide === 'back'
                ? 'bg-white text-black font-bold shadow'
                : 'text-white/60 active:text-white'
            }`}
          >
            <span>Back</span>
          </button>
        </div>

        {/* 2D Canvas Mockup Plate */}
        <div
          onClick={handleGarmentMockupClick}
          className="group relative w-full h-[180px] max-w-[280px] flex items-center justify-center select-none cursor-crosshair rounded-2xl border transition-all duration-300 shadow-xl overflow-hidden"
          style={{
            backgroundColor: selectedColor.hex,
            borderColor: selectedColor.hex === '#FFFFFF' ? '#33353F' : 'rgba(255,255,255,0.08)',
          }}
        >
          {/* Subtle watermark / view text */}
          <span className="absolute top-2.5 left-3 font-mono text-[8px] text-white/30 uppercase tracking-widest pointer-events-none">
            {previewSide === 'front' ? 'FRONT VIEW' : 'BACK VIEW'}
          </span>

          {/* Interactive Hotspot Targets on Garment Panel */}
          {previewSide === 'front' ? (
            <>
              {/* Wearer Left Chest */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdatePlacement('left-chest');
                }}
                className={`absolute z-20 w-5 h-5 rounded-full border transition-all flex items-center justify-center ${
                  currentPlacement === 'left-chest'
                    ? 'bg-emerald-500 border-white text-black scale-110 shadow-lg ring-2 ring-emerald-400/50'
                    : 'bg-white/10 border-white/30 text-white/60'
                }`}
                style={{ top: '28%', left: '64%', transform: 'translate(-50%, -50%)' }}
                title="Wearer Left Chest"
              >
                <Crosshair className="w-2.5 h-2.5" />
              </button>

              {/* Front Center Chest */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdatePlacement('front-center');
                }}
                className={`absolute z-20 w-5 h-5 rounded-full border transition-all flex items-center justify-center ${
                  currentPlacement === 'front-center' || currentPlacement === 'front'
                    ? 'bg-emerald-500 border-white text-black scale-110 shadow-lg ring-2 ring-emerald-400/50'
                    : 'bg-white/10 border-white/30 text-white/60'
                }`}
                style={{ top: '46%', left: '50%', transform: 'translate(-50%, -50%)' }}
                title="Front Center"
              >
                <Crosshair className="w-2.5 h-2.5" />
              </button>

              {/* Wearer Right Chest */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdatePlacement('right-chest');
                }}
                className={`absolute z-20 w-5 h-5 rounded-full border transition-all flex items-center justify-center ${
                  currentPlacement === 'right-chest'
                    ? 'bg-emerald-500 border-white text-black scale-110 shadow-lg ring-2 ring-emerald-400/50'
                    : 'bg-white/10 border-white/30 text-white/60'
                }`}
                style={{ top: '28%', left: '36%', transform: 'translate(-50%, -50%)' }}
                title="Wearer Right Chest"
              >
                <Crosshair className="w-2.5 h-2.5" />
              </button>

              {/* Bottom Hem */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdatePlacement('bottom-hem');
                }}
                className={`absolute z-20 w-5 h-5 rounded-full border transition-all flex items-center justify-center ${
                  currentPlacement === 'bottom-hem'
                    ? 'bg-emerald-500 border-white text-black scale-110 shadow-lg ring-2 ring-emerald-400/50'
                    : 'bg-white/10 border-white/30 text-white/60'
                }`}
                style={{ top: '76%', left: '50%', transform: 'translate(-50%, -50%)' }}
                title="Bottom Hem"
              >
                <Crosshair className="w-2.5 h-2.5" />
              </button>
            </>
          ) : (
            <>
              {/* Back Collar */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdatePlacement('back-collar');
                }}
                className={`absolute z-20 w-5 h-5 rounded-full border transition-all flex items-center justify-center ${
                  currentPlacement === 'back-collar'
                    ? 'bg-emerald-500 border-white text-black scale-110 shadow-lg ring-2 ring-emerald-400/50'
                    : 'bg-white/10 border-white/30 text-white/60'
                }`}
                style={{ top: '19%', left: '50%', transform: 'translate(-50%, -50%)' }}
                title="Back Collar"
              >
                <Crosshair className="w-2.5 h-2.5" />
              </button>

              {/* Back Center */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdatePlacement('back-center');
                }}
                className={`absolute z-20 w-5 h-5 rounded-full border transition-all flex items-center justify-center ${
                  currentPlacement === 'back-center' || currentPlacement === 'back'
                    ? 'bg-emerald-500 border-white text-black scale-110 shadow-lg ring-2 ring-emerald-400/50'
                    : 'bg-white/10 border-white/30 text-white/60'
                }`}
                style={{ top: '46%', left: '50%', transform: 'translate(-50%, -50%)' }}
                title="Back Center"
              >
                <Crosshair className="w-2.5 h-2.5" />
              </button>
            </>
          )}

          {/* Render Graphic with Placement & Scale Applied */}
          {currentActiveArt && isCurrentPlacementOnCurrentSide && (
            <div
              style={getPreviewPlacementStyles(
                currentPlacement,
                currentScale,
                true,
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
                sizes="240px"
              />
            </div>
          )}

          {/* If graphic is placed on the opposite panel, show 1-tap move button */}
          {currentActiveArt && !isCurrentPlacementOnCurrentSide && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleUpdatePlacement(previewSide === 'front' ? 'front-center' : 'back-center');
              }}
              className="z-20 px-3 py-1.5 bg-neutral-900/95 border border-emerald-500/50 rounded-xl text-center flex items-center gap-1.5 cursor-pointer shadow-xl active:scale-95"
            >
              <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-[9px] text-white">
                On {previewSide === 'front' ? 'Back' : 'Front'} &bull;{' '}
                <strong className="text-emerald-400 underline">Tap to move here</strong>
              </span>
            </div>
          )}

          {/* Placement & Garment Pill */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 px-2.5 py-0.5 bg-black/85 backdrop-blur-md rounded-full border border-white/10 text-[8px] font-mono text-white/90 uppercase tracking-wider whitespace-nowrap shadow flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{currentPlacement.replace('-', ' ').toUpperCase()}</span>
            <span>&bull;</span>
            <span>{selectedGarment.name.toUpperCase()}</span>
          </div>
        </div>
      </section>

      {/* ── 3. Scrollable Configuration Area with pb-36 for Zero Overlaps ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-36 overscroll-contain">
        {/* Title and Garment Info */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest font-semibold">
              Configure Your Apparel
            </span>
          </div>
          <h2
            id="mobile-modal-title"
            className="font-mono text-lg font-bold uppercase tracking-wider text-white"
          >
            {design.name}
          </h2>
          <p className="font-mono text-[11px] text-white/50 mt-0.5">
            {selectedGarment.fabric} &bull; {selectedGarment.gsm} GSM &bull;{' '}
            {selectedGarment.description}
          </p>
        </div>

        {/* ── STEP 1: Garment Type ────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <label className="font-mono text-[10px] text-white/70 uppercase tracking-wider font-semibold">
            Apparel Type ({selectedGarment.gsm} GSM)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {APPAREL_LIST.map((apparel) => {
              const isSelected = selectedGarmentId === apparel.id;
              return (
                <button
                  key={apparel.id}
                  type="button"
                  onClick={() => setSelectedGarmentId(apparel.id)}
                  className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                    isSelected
                      ? 'bg-white/10 border-white text-white shadow'
                      : 'bg-white/5 border-white/5 text-white/70 active:bg-white/10'
                  }`}
                >
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider truncate">
                    {apparel.name}
                  </span>
                  <span className="font-mono text-[9px] text-white/40">
                    {apparel.fabric} • {apparel.gsm} GSM
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── STEP 2: Garment Color Swatches ──────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[10px] text-white/70 uppercase tracking-wider font-semibold">
              Color: <span className="text-white">{selectedColor.name}</span>
            </label>
            {currentActiveArt?.colorHint && currentActiveArt.colorHint !== 'any' && (
              <span className="font-mono text-[9px] text-emerald-400">
                ★ Best for {currentActiveArt.colorHint}
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
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0c0e12] scale-110 shadow'
                      : 'opacity-85 active:scale-105'
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

        {/* ── STEP 3: Garment Sizes ───────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <label className="font-mono text-[10px] text-white/70 uppercase tracking-wider font-semibold">
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
                      ? 'bg-white text-black font-bold shadow'
                      : 'bg-white/5 text-white/70 border border-white/5 active:bg-white/10'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── STEP 4: Artwork Files Selector ─────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[11px] text-white/80 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-white/50" />
              <span>Artwork Images in this Design ({artworks.length})</span>
            </label>
            <span className="font-mono text-[9px] text-white/40">Tap to select</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {artworks.map((art) => {
              const isActive = activeArtId === art.id;
              const isIncluded = includedArtworks.has(art.id);
              const artPlacement =
                artworkPlacements[art.id] || art.suggestedPlacement || 'front-center';

              return (
                <div
                  key={art.id}
                  onClick={() => handleSelectArtwork(art)}
                  className={`relative p-2 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                    isActive
                      ? 'bg-white/10 border-white text-white shadow-md ring-1 ring-white/50'
                      : 'bg-white/5 border-white/5 text-white/70 active:bg-white/10'
                  }`}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/40" />
                  )}

                  {/* Thumbnail */}
                  <div className="relative w-full aspect-square rounded-lg bg-black/40 overflow-hidden flex items-center justify-center p-1.5">
                    <Image
                      src={art.previewUrl}
                      alt={art.name}
                      fill
                      unoptimized
                      className="object-contain p-1"
                      sizes="120px"
                    />
                  </div>

                  {/* Name & Placement */}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-mono text-[11px] font-semibold text-white/95 truncate">
                      {art.name}
                    </span>
                    <span className="font-mono text-[9px] text-white/40 uppercase truncate">
                      {artPlacement.replace('-', ' ')}
                    </span>
                  </div>

                  {/* Front / Back Chooser */}
                  <div className="flex items-center gap-1 pt-1 border-t border-white/5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveArtId(art.id);
                        handleUpdatePlacement('front-center');
                        setPreviewSide('front');
                      }}
                      className={`flex-1 py-1 rounded text-[9px] font-mono uppercase tracking-wider text-center transition-all ${
                        !isBackPlacement(artPlacement)
                          ? 'bg-emerald-500 text-black font-bold shadow-sm'
                          : 'bg-white/5 text-white/50 active:text-white'
                      }`}
                    >
                      Front
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveArtId(art.id);
                        handleUpdatePlacement('back-center');
                        setPreviewSide('back');
                      }}
                      className={`flex-1 py-1 rounded text-[9px] font-mono uppercase tracking-wider text-center transition-all ${
                        isBackPlacement(artPlacement)
                          ? 'bg-emerald-500 text-black font-bold shadow-sm'
                          : 'bg-white/5 text-white/50 active:text-white'
                      }`}
                    >
                      Back
                    </button>
                  </div>

                  {/* Multi-artwork include checkbox */}
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
          <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-gradient-to-r from-purple-950/25 via-indigo-950/20 to-black/60 border border-purple-500/30 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  🔒 Studio Verified Placement
                </span>
              </div>
              <span className="text-[9px] font-mono text-purple-300 font-bold bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/40">
                LOCKED
              </span>
            </div>
            <p className="font-mono text-[11px] text-white/75 leading-relaxed">
              This curated artwork has been calibrated specifically for{' '}
              <strong className="text-white">{selectedGarment.name}</strong>. Position, scale, and print coordinates are locked to guarantee optimal print aesthetics.
            </p>
            <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/60">
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
            {/* ── STEP 2: Natural Language Placement Prompt ───────────────────── */}
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[10px] text-white/90 uppercase tracking-wider font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Smart AI Placement</span>
                </label>
                <span className="text-[9px] font-mono text-emerald-400">Natural Language</span>
              </div>

              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={nlpInputText}
                  onChange={(e) => handleNlpInputChange(e.target.value)}
                  placeholder='e.g. "small left chest", "big back print"...'
                  className="flex-1 bg-black/60 border border-white/15 focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-white placeholder-white/35 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (nlpInputText.trim()) handleNlpInputChange(nlpInputText);
                  }}
                  className="px-3 py-2 rounded-lg bg-emerald-500 active:bg-emerald-400 text-black font-mono text-xs font-bold uppercase tracking-wider shrink-0"
                >
                  Place
                </button>
              </div>

              {nlpParsed && (
                <div className="text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2 py-1 rounded flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>
                    Placed on: <strong>{nlpParsed.description}</strong>
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {QUICK_NLP_PROMPTS.slice(0, 4).map((prompt) => (
                  <button
                    key={prompt.text}
                    type="button"
                    onClick={() => handleApplyQuickPrompt(prompt.text)}
                    className="px-2 py-0.5 rounded-full bg-white/5 active:bg-white/15 border border-white/10 text-[9px] font-mono text-white/70"
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── STEP 3: Print Region (Front, Back, Sleeve) & Targets ────────── */}
            <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[10px] text-white/80 uppercase tracking-wider font-bold">
                  Print Placement: {getPlacementRegion(currentPlacement).toUpperCase()}
                </label>
                <span className="font-mono text-[9px] text-emerald-400 font-bold uppercase">
                  {currentPlacement.replace('-', ' ')}
                </span>
              </div>

              {/* 3 Main Region Tabs */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleUpdateSide('front')}
                  className={`py-2 px-1 rounded-lg border text-center font-mono text-[11px] uppercase tracking-wider transition-all ${
                    getPlacementRegion(currentPlacement) === 'front'
                      ? 'bg-emerald-500 border-emerald-400 text-black font-bold shadow'
                      : 'bg-white/5 border-white/10 text-white/70'
                  }`}
                >
                  👕 Front
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateSide('back')}
                  className={`py-2 px-1 rounded-lg border text-center font-mono text-[11px] uppercase tracking-wider transition-all ${
                    getPlacementRegion(currentPlacement) === 'back'
                      ? 'bg-emerald-500 border-emerald-400 text-black font-bold shadow'
                      : 'bg-white/5 border-white/10 text-white/70'
                  }`}
                >
                  🔄 Back
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateSide('sleeve')}
                  className={`py-2 px-1 rounded-lg border text-center font-mono text-[11px] uppercase tracking-wider transition-all ${
                    getPlacementRegion(currentPlacement) === 'sleeve'
                      ? 'bg-emerald-500 border-emerald-400 text-black font-bold shadow'
                      : 'bg-white/5 border-white/10 text-white/70'
                  }`}
                >
                  🦾 Sleeve
                </button>
              </div>

              {/* Placement Options for Selected Region */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {(getPlacementRegion(currentPlacement) === 'front'
                  ? [
                      { id: 'front-center', label: 'Front Center', desc: 'Standard chest' },
                      { id: 'left-chest', label: 'Left Chest', desc: 'Over heart' },
                      { id: 'right-chest', label: 'Right Chest', desc: 'Right chest' },
                      { id: 'full-front', label: 'Full Front', desc: 'Large torso' },
                      { id: 'bottom-hem', label: 'Bottom Hem', desc: 'Lower hemline' },
                    ]
                  : getPlacementRegion(currentPlacement) === 'back'
                  ? [
                      { id: 'back-center', label: 'Back Center', desc: 'Upper back' },
                      { id: 'back-collar', label: 'Back Collar', desc: 'Nape accent' },
                      { id: 'full-back', label: 'Full Back', desc: 'Large statement' },
                      { id: 'bottom-hem', label: 'Bottom Hem', desc: 'Lower hemline' },
                    ]
                  : [
                      { id: 'left-sleeve', label: 'Left Sleeve', desc: 'Left arm' },
                      { id: 'right-sleeve', label: 'Right Sleeve', desc: 'Right arm' },
                    ]
                ).map((opt) => {
                  const isSelected = currentPlacement === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleUpdatePlacement(opt.id as DesignPlacementTarget)}
                      className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 transition-all ${
                        isSelected
                          ? 'bg-white text-black border-white font-bold shadow'
                          : 'bg-white/5 border-white/5 text-white/70 active:bg-white/10'
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

            {/* ── STEP 4: Scale Presets ───────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[10px] text-white/70 uppercase tracking-wider font-semibold">
                  Design Print Scale
                </label>
                <span className="font-mono text-[9px] text-white/50 uppercase">
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
                      className={`py-2 px-2 rounded-xl border text-center flex flex-col items-center justify-center gap-0.5 transition-all ${
                        isSelected
                          ? 'bg-white text-black border-white font-bold shadow'
                          : 'bg-white/5 border-white/5 text-white/70 active:bg-white/10'
                      }`}
                    >
                      <span className="font-mono text-[10px] uppercase tracking-wider">
                        {scale.label}
                      </span>
                      <span
                        className={`font-mono text-[8px] ${
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

      {/* ── 4. Sticky Bottom Action Bar with Safe-Area Clearance ────────── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d0e12]/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 pb-[calc(14px+env(safe-area-inset-bottom,0px))] flex items-center justify-between gap-3 shadow-[0_-8px_32px_rgba(0,0,0,0.85)]">
        <div>
          <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest">
            Unit Price
          </p>
          <p className="font-mono text-xl font-bold text-white">
            ₹{unitPrice.toLocaleString()}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLaunch3D}
          className="flex-1 py-3 px-5 bg-white active:bg-white/90 text-black font-mono text-xs font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-xl cursor-pointer"
        >
          <span>OPEN IN 3D STUDIO [360°]</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
}
