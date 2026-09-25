'use client';

import { useState, useRef, useMemo } from 'react';
import { useWallStudioStore } from '@/lib/wall-studio/store';
import { assessImageResolution } from '@/lib/wall-studio/split-engine';
import type { ResolutionAssessment } from '@/lib/wall-studio/split-engine';
import type { CropData } from '@/lib/wall-studio/types';
import { X, Upload, ZoomIn, RotateCw, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';

export const CustomImageModal: React.FC = () => {
  const {
    isCustomUploadModalOpen,
    activeSlotId,
    currentLayout,
    closeCustomUpload,
    setCustomPhoto,
  } = useWallStudioStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [pixelDimensions, setPixelDimensions] = useState<{ width: number; height: number }>({
    width: 3000,
    height: 2000,
  });
  const [zoom, setZoom] = useState<number>(1.0);
  const [focusX, setFocusX] = useState<number>(0.5);
  const [focusY, setFocusY] = useState<number>(0.5);
  const [rotation, setRotation] = useState<number>(0);
  const fitMode: 'fill' | 'fit' = 'fill';
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Active slot and split group context
  const currentSlot = useMemo(() => {
    return currentLayout.slots.find((s) => s.id === activeSlotId) || currentLayout.slots[0];
  }, [currentLayout, activeSlotId]);

  const splitGroup = useMemo(() => {
    return currentSlot?.splitGroupId
      ? currentLayout.splitGroups.find((g) => g.splitGroupId === currentSlot.splitGroupId)
      : undefined;
  }, [currentLayout, currentSlot]);

  const isSplit = !!currentSlot?.splitGroupId && !!splitGroup;
  const panelCount = splitGroup ? splitGroup.panelCount : 1;

  // Resolution evaluation
  const resolution: ResolutionAssessment = useMemo(() => {
    return assessImageResolution(
      pixelDimensions.width,
      pixelDimensions.height,
      currentSlot?.size || 'A3',
      isSplit,
      panelCount,
    );
  }, [pixelDimensions, currentSlot?.size, isSplit, panelCount]);

  // Handle local file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Local preview & image dimensions
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => {
          setPixelDimensions({ width: img.naturalWidth, height: img.naturalHeight });
          setPreviewSrc(objectUrl);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = objectUrl;
      });

      // 1. Request presigned URL from server (bypasses Vercel 4.5MB payload limit)
      const presignRes = await fetch('/api/wall-studio/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'presign',
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          physicalSize: currentSlot?.size || 'A3',
          isSplit,
          panelCount,
          pixelWidth: img.naturalWidth || 2400,
          pixelHeight: img.naturalHeight || 1800,
        }),
      });

      if (presignRes.ok) {
        const data = await presignRes.json();
        if (data.success && data.uploadUrl) {
          // Direct PUT to Cloudflare R2
          try {
            const r2Put = await fetch(data.uploadUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': file.type,
              },
              body: file,
            });

            if (r2Put.ok && data.publicUrl) {
              setPreviewSrc(data.publicUrl);
              if (data.pixelWidth && data.pixelHeight) {
                setPixelDimensions({ width: data.pixelWidth, height: data.pixelHeight });
              }
              return;
            }
          } catch (r2Err) {
            console.warn(
              'Direct R2 PUT failed (likely CORS or network), keeping local preview:',
              r2Err,
            );
          }
        }
      }

      // 2. Fallback for smaller files if presigned failed
      if (file.size <= 4 * 1024 * 1024) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('physicalSize', currentSlot?.size || 'A3');
        formData.append('isSplit', isSplit ? 'true' : 'false');
        formData.append('panelCount', String(panelCount));

        const res = await fetch('/api/wall-studio/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.publicUrl) {
          setPreviewSrc(data.publicUrl);
          if (data.pixelWidth && data.pixelHeight) {
            setPixelDimensions({ width: data.pixelWidth, height: data.pixelHeight });
          }
        }
      }
    } catch (err: unknown) {
      console.warn('Upload API fallback to object URL:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Rotate 90 deg
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Apply to Wall Studio
  const handleApply = () => {
    if (!previewSrc || !currentSlot) return;

    const cropData: CropData = {
      focusX,
      focusY,
      zoom,
      rotation,
      fitMode,
    };

    setCustomPhoto(currentSlot.id, previewSrc, isSplit, cropData);
  };

  if (!isCustomUploadModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upload Custom Photo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <div className="relative w-full max-w-2xl bg-[#111215] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#3B5EFF] font-bold">
                {isSplit ? `Multi-Panel Split (${panelCount} Pieces)` : 'Individual Print'}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                {currentSlot?.size} • {currentSlot?.orientation}
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {isSplit ? 'Upload & Crop Split Photo' : 'Upload Custom Poster Photo'}
            </h2>
          </div>

          <button
            type="button"
            onClick={closeCustomUpload}
            className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {/* Upload Drop Area */}
          {!previewSrc ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 hover:border-[#3B5EFF] rounded-xl p-8 text-center cursor-pointer bg-white/[0.02] hover:bg-[#3B5EFF]/5 transition-all group"
            >
              <Upload className="w-10 h-10 mx-auto text-white/40 group-hover:text-[#3B5EFF] transition-colors mb-3" />
              <p className="text-sm font-semibold text-white">
                Click to upload high-resolution photo
              </p>
              <p className="text-xs text-white/50 font-mono mt-1">
                Supports JPG, PNG, WEBP (Up to 25 MB)
              </p>
              {isSplit && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-300 font-mono bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Will be continuously sliced across {panelCount} panels</span>
                </div>
              )}
            </div>
          ) : (
            /* Interactive Cropping & Split Preview Viewport */
            <div className="space-y-4">
              <div
                className="relative w-full bg-black/90 rounded-xl overflow-hidden border border-white/15 flex items-center justify-center"
                style={{ aspectRatio: '16/10' }}
              >
                {/* Print Safe Area dashed guide */}
                <div className="absolute inset-4 border border-dashed border-white/25 pointer-events-none z-20 flex items-start justify-end p-1.5">
                  <span className="text-[8px] font-mono text-white/40 bg-black/60 px-1 py-0.5 rounded">
                    Print Safe Area
                  </span>
                </div>

                {/* Slicing Vertical Divider Lines for Split Mode */}
                {isSplit && (
                  <div className="absolute inset-0 pointer-events-none z-20 flex">
                    {Array.from({ length: panelCount - 1 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-full border-r-2 border-amber-400/60 shadow-[0_0_8px_rgba(255,193,7,0.5)] flex flex-col justify-between"
                        style={{ width: `${100 / panelCount}%` }}
                      >
                        <span className="text-[9px] font-mono font-bold text-amber-300 bg-black/80 px-1 rounded-bl self-end">
                          Panel {i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Image Element with dynamic transform */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewSrc}
                  alt="Custom Crop Preview"
                  className="w-full h-full object-cover transition-transform duration-100"
                  style={{
                    objectPosition: `${focusX * 100}% ${focusY * 100}%`,
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  }}
                />
              </div>

              {/* Resolution Assessment Badge */}
              <div
                className={`p-3 rounded-xl border flex items-start gap-3 ${
                  resolution.quality === 'excellent'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : resolution.quality === 'good'
                      ? 'bg-[#3B5EFF]/10 border-[#3B5EFF]/30 text-[#3B5EFF]'
                      : resolution.quality === 'low'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                {resolution.quality === 'excellent' || resolution.quality === 'good' ? (
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold uppercase tracking-wider">
                      Print Quality: {resolution.quality.replace('-', ' ')}
                    </span>
                    <span>•</span>
                    <span>
                      ~{resolution.dpi} DPI ({pixelDimensions.width} × {pixelDimensions.height} px)
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-0.5">{resolution.message}</p>
                </div>
              </div>

              {/* Controls: Zoom, Pan X/Y, Rotation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white/5 rounded-xl border border-white/5 text-xs font-mono">
                {/* Zoom */}
                <div className="space-y-1">
                  <div className="flex justify-between text-white/60 text-[11px]">
                    <span className="flex items-center gap-1">
                      <ZoomIn className="w-3 h-3" /> Zoom
                    </span>
                    <span>{zoom.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-[#3B5EFF]"
                  />
                </div>

                {/* Pan Focus X */}
                <div className="space-y-1">
                  <div className="flex justify-between text-white/60 text-[11px]">
                    <span>Pan Horizontal</span>
                    <span>{Math.round(focusX * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.02"
                    value={focusX}
                    onChange={(e) => setFocusX(parseFloat(e.target.value))}
                    className="w-full accent-[#3B5EFF]"
                  />
                </div>

                {/* Rotate & Reset */}
                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rotate 90°</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1.0);
                      setFocusX(0.5);
                      setFocusY(0.5);
                      setRotation(0);
                    }}
                    className="text-[11px] text-white/40 hover:text-white underline"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Replace file button */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-[#3B5EFF] hover:underline font-mono"
                >
                  Choose a different photo
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/60">
          <button
            type="button"
            onClick={closeCustomUpload}
            className="px-4 py-2 rounded-xl text-xs font-mono text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!previewSrc || isUploading}
            onClick={handleApply}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B5EFF] text-white font-semibold text-xs shadow-lg shadow-[#3B5EFF]/25 hover:bg-[#2B4EFF] disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <span>Apply to Wall</span>
          </button>
        </div>
      </div>
    </div>
  );
};
