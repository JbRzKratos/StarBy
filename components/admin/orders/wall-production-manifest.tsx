'use client';

import { useState } from 'react';
import { Download, CheckCircle2, Layers, FileJson } from 'lucide-react';

interface CustomizationSlot {
  id: string;
  slotType?: string;
  size?: string;
  orientation?: string;
  physicalWidthMm?: number;
  physicalHeightMm?: number;
  splitGroupId?: string;
  panelIndex?: number;
  panelCount?: number;
}

interface CustomizationSelection {
  poster?: {
    title?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    size?: string;
    orientation?: string;
    theme?: string;
  };
  customImage?: {
    url?: string;
    crop?: Record<string, unknown> | null;
  };
  splitGroupId?: string;
  panelIndex?: number;
}

interface WallProductionManifestProps {
  orderId: string;
  customization?: {
    isWallProduct?: boolean;
    layoutId?: string;
    layoutName?: string;
    layoutVersion?: number;
    physicalPrintCount?: number;
    logicalArtworkCount?: number;
    coverageLabel?: string;
    selections?: Record<string, CustomizationSelection>;
    slots?: CustomizationSlot[];
    [key: string]: unknown;
  } | null;
}

export function WallProductionManifest({ orderId, customization }: WallProductionManifestProps) {
  const [checkedPanels, setCheckedPanels] = useState<Record<number, boolean>>({});

  if (!customization || !customization.isWallProduct) {
    return null;
  }

  const {
    layoutId = 'stepped-hero',
    layoutName = 'Stepped Hero',
    layoutVersion = 1,
    physicalPrintCount = 15,
    logicalArtworkCount = 13,
    coverageLabel = '160 × 105 cm',
    selections = {},
    slots = [],
  } = customization;

  // Build the list of physical prints from slots & selections
  const printsList: Array<{
    panelNumber: number;
    slotId: string;
    slotType: string;
    size: string;
    orientation: string;
    physicalWidthMm?: number;
    physicalHeightMm?: number;
    title: string;
    imageUrl: string;
    splitGroupId?: string;
    panelIndex?: number;
    panelCount?: number;
    isCustomUpload: boolean;
    crop?: Record<string, unknown> | null;
    theme?: string;
  }> = [];

  // If slots array exists in customization snapshot:
  if (Array.isArray(slots) && slots.length > 0) {
    slots.forEach((slot, idx) => {
      const sel = selections[slot.id];
      const isCustom = Boolean(sel?.customImage);
      const artwork = sel?.poster;
      const imageUrl =
        sel?.customImage?.url || artwork?.imageUrl || artwork?.thumbnailUrl || '/placeholder.png';
      const title = sel?.customImage
        ? 'Custom Customer Upload'
        : artwork?.title ||
          (slot.splitGroupId
            ? `Split Hero Panel ${slot.panelIndex !== undefined ? slot.panelIndex + 1 : idx + 1}`
            : `Poster ${idx + 1}`);

      printsList.push({
        panelNumber: idx + 1,
        slotId: slot.id,
        slotType: slot.slotType || 'support',
        size: slot.size || 'A4',
        orientation: slot.orientation || 'portrait',
        physicalWidthMm: slot.physicalWidthMm,
        physicalHeightMm: slot.physicalHeightMm,
        title,
        imageUrl,
        splitGroupId: slot.splitGroupId,
        panelIndex: slot.panelIndex,
        isCustomUpload: isCustom,
        crop: sel?.customImage?.crop,
        theme: artwork?.theme,
      });
    });
  } else {
    // Fallback: derive from selections map keys
    const selKeys = Object.keys(selections);
    selKeys.forEach((key, idx) => {
      const sel = selections[key];
      const isCustom = Boolean(sel?.customImage);
      const artwork = sel?.poster;
      const imageUrl =
        sel?.customImage?.url || artwork?.imageUrl || artwork?.thumbnailUrl || '/placeholder.png';
      const title = sel?.customImage
        ? 'Custom Customer Upload'
        : artwork?.title || `Panel ${idx + 1}`;

      printsList.push({
        panelNumber: idx + 1,
        slotId: key,
        slotType: sel?.splitGroupId ? 'hero-panel' : 'support',
        size: artwork?.size || 'A4',
        orientation: artwork?.orientation || 'portrait',
        title,
        imageUrl,
        splitGroupId: sel?.splitGroupId,
        panelIndex: sel?.panelIndex,
        isCustomUpload: isCustom,
        crop: sel?.customImage?.crop,
        theme: artwork?.theme,
      });
    });
  }

  const toggleCheck = (idx: number) => {
    setCheckedPanels((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleDownloadJsonManifest = () => {
    const manifest = {
      orderId,
      exportedAt: new Date().toISOString(),
      type: 'FREGORO_WALL_STUDIO_PRODUCTION_MANIFEST',
      layout: {
        id: layoutId,
        name: layoutName,
        version: layoutVersion,
        coverage: coverageLabel,
        physicalPrints: printsList.length || physicalPrintCount,
        logicalArtworks: logicalArtworkCount,
      },
      physicalPrints: printsList.map((p) => ({
        printNumber: p.panelNumber,
        slotId: p.slotId,
        role: p.slotType,
        size: p.size,
        orientation: p.orientation,
        dimensionsMm:
          p.physicalWidthMm && p.physicalHeightMm
            ? `${p.physicalWidthMm} × ${p.physicalHeightMm} mm`
            : undefined,
        artworkTitle: p.title,
        imageUrl: p.imageUrl,
        isCustomUpload: p.isCustomUpload,
        cropData: p.crop || null,
        splitGroup: p.splitGroupId
          ? {
              groupId: p.splitGroupId,
              panelIndex: p.panelIndex,
            }
          : null,
      })),
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-${orderId}-wall-production-manifest.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllImages = () => {
    // Collect unique image URLs
    const uniqueImages = Array.from(
      new Set(
        printsList
          .map((p) => p.imageUrl)
          .filter((url) => Boolean(url) && !url.includes('placeholder')),
      ),
    );
    if (uniqueImages.length === 0) {
      alert('No high-resolution artwork files found to download.');
      return;
    }
    // Open all images in tabs or trigger save
    uniqueImages.forEach((url, i) => {
      setTimeout(() => {
        window.open(url, '_blank');
      }, i * 250);
    });
  };

  return (
    <div className="mt-4 p-5 bg-[#0F0F12] border border-[#3B5EFF]/30 rounded-xl space-y-5 font-mono shadow-2xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B5EFF] animate-pulse" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              FREGORO WALL STUDIO — PRODUCTION MANIFEST
            </h3>
          </div>
          <p className="text-xs text-ash/80 mt-1">
            Order #{orderId.slice(0, 10)} · Layout:{' '}
            <strong className="text-white font-sans">{layoutName}</strong> (v{layoutVersion})
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadJsonManifest}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs rounded-lg transition-colors border border-white/10 inline-flex items-center gap-1.5"
            title="Download JSON print specification for the factory floor"
          >
            <FileJson size={14} className="text-[#3B5EFF]" />
            Download Print Manifest
          </button>
          <button
            onClick={handleDownloadAllImages}
            className="px-3 py-1.5 bg-[#3B5EFF] hover:bg-[#2d4de0] text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow"
            title="Open all high-res assets in separate tabs"
          >
            <Download size={14} />
            Download Image Package
          </button>
        </div>
      </div>

      {/* Meta Specs Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/40 p-3.5 rounded-lg border border-white/5 text-xs">
        <div>
          <span className="text-ash/60 text-[10px] uppercase block">Physical Prints</span>
          <span className="text-base font-bold text-white">
            {printsList.length || physicalPrintCount} Prints
          </span>
        </div>
        <div>
          <span className="text-ash/60 text-[10px] uppercase block">Logical Artworks</span>
          <span className="text-base font-bold text-ash">{logicalArtworkCount} Groups</span>
        </div>
        <div>
          <span className="text-ash/60 text-[10px] uppercase block">Wall Coverage</span>
          <span className="text-base font-bold text-white">{coverageLabel}</span>
        </div>
        <div>
          <span className="text-ash/60 text-[10px] uppercase block">Factory Status</span>
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-1">
            <CheckCircle2 size={13} /> Ready for Print
          </span>
        </div>
      </div>

      {/* Physical Prints Manifest List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-ash/80 border-b border-white/5 pb-1">
          <span className="uppercase text-[11px] font-bold text-white flex items-center gap-1.5">
            <Layers size={13} className="text-[#3B5EFF]" /> Physical Prints Manifest (Sequential
            Packing Order)
          </span>
          <span className="text-[10px] text-ash/60">
            {Object.values(checkedPanels).filter(Boolean).length} / {printsList.length} verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
          {printsList.map((print) => {
            const isChecked = Boolean(checkedPanels[print.panelNumber]);
            const panelNumStr = String(print.panelNumber).padStart(2, '0');

            return (
              <div
                key={print.panelNumber}
                onClick={() => toggleCheck(print.panelNumber)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex gap-3 ${
                  isChecked
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-white'
                }`}
              >
                {/* Print Thumbnail */}
                <div className="w-16 h-20 bg-black/60 rounded border border-white/10 overflow-hidden flex-shrink-0 relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={print.imageUrl}
                    alt={print.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1 bg-black/80 px-1 py-0.5 rounded text-[9px] font-bold text-white">
                    #{panelNumStr}
                  </div>
                </div>

                {/* Print Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between text-xs">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-semibold text-white truncate text-[13px]">{print.title}</p>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-white/30 text-emerald-600 focus:ring-0 mt-0.5"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-ash">
                      <span className="px-1.5 py-0.5 bg-white/10 rounded font-bold text-white">
                        {print.size}
                      </span>
                      <span className="capitalize text-ash/80">({print.orientation})</span>
                      {print.physicalWidthMm && print.physicalHeightMm && (
                        <span className="text-[10px] text-ash/60">
                          {print.physicalWidthMm} × {print.physicalHeightMm} mm
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1.5 text-[10px]">
                    <div>
                      {print.splitGroupId ? (
                        <span className="px-1.5 py-0.5 bg-[#3B5EFF]/20 text-[#3B5EFF] border border-[#3B5EFF]/30 rounded">
                          Split Panel {(print.panelIndex ?? 0) + 1}
                        </span>
                      ) : (
                        <span className="text-ash/60 uppercase">{print.slotType} slot</span>
                      )}
                      {print.isCustomUpload && (
                        <span className="ml-1.5 px-1 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                          Custom Photo
                        </span>
                      )}
                    </div>

                    <a
                      href={print.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#3B5EFF] hover:underline flex items-center gap-1 font-semibold"
                    >
                      Artwork ↗
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
