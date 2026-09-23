'use client';

import React, { useRef, useCallback } from 'react';
import type {
  PageWizardSchema,
  ElementWizardMeta,
  ElementRole,
  WizardContentMap,
} from '@/types/magazine';

interface ContentFormProps {
  schema: PageWizardSchema;
  contentMap: WizardContentMap;
  focusedElementId: string | null;
  onContentChange: (elementId: string, value: string) => void;
  onFocusElement: (elementId: string | null) => void;
}

const IMAGE_ROLES: ElementRole[] = [
  'hero-image',
  'portrait',
  'product-shot',
  'background-image',
  'image-placeholder',
  'logo',
];
const TEXT_ROLES: ElementRole[] = [
  'headline',
  'subheadline',
  'body',
  'caption',
  'quote',
  'author',
  'date',
  'page-number',
];

export function ContentForm({
  schema,
  contentMap,
  focusedElementId,
  onContentChange,
  onFocusElement,
}: ContentFormProps) {
  if (schema.elements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <span className="text-3xl mb-3" style={{ opacity: 0.3 }}>
          ◫
        </span>
        <p className="font-mono text-xs text-white/40 uppercase tracking-widest">
          Design only — no content to fill
        </p>
        <p className="font-mono text-[11px] text-white/25 mt-1">
          This page uses fixed design elements
        </p>
      </div>
    );
  }

  const textElements = schema.elements.filter((e) => TEXT_ROLES.includes(e.role));
  const imageElements = schema.elements.filter((e) => IMAGE_ROLES.includes(e.role));

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Image fields */}
      {imageElements.length > 0 && (
        <section>
          <SectionHeader icon="⧉" label="Photos & Images" count={imageElements.length} />
          <div className="flex flex-col gap-3 mt-3">
            {imageElements.map((el) => (
              <ImageField
                key={el.elementId}
                meta={el}
                value={contentMap[el.elementId] ?? ''}
                instructionValue={contentMap[`${el.elementId}__instructions`] ?? ''}
                isFocused={focusedElementId === el.elementId}
                onChange={(v) => onContentChange(el.elementId, v)}
                onInstructionChange={(v) => onContentChange(`${el.elementId}__instructions`, v)}
                onFocus={() => onFocusElement(el.elementId)}
                onBlur={() => onFocusElement(null)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Text fields */}
      {textElements.length > 0 && (
        <section>
          <SectionHeader icon="◈" label="Text Content" count={textElements.length} />
          <div className="flex flex-col gap-3 mt-3">
            {textElements.map((el) => (
              <TextField
                key={el.elementId}
                meta={el}
                value={contentMap[el.elementId] ?? ''}
                instructionValue={contentMap[`${el.elementId}__instructions`] ?? ''}
                isFocused={focusedElementId === el.elementId}
                onChange={(v) => onContentChange(el.elementId, v)}
                onInstructionChange={(v) => onContentChange(`${el.elementId}__instructions`, v)}
                onFocus={() => onFocusElement(el.elementId)}
                onBlur={() => onFocusElement(null)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ icon, label, count }: { icon: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-white/10">
      <span className="text-[#0057FF] font-mono text-sm">{icon}</span>
      <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-white/60">
        {label}
      </span>
      <span className="ml-auto font-mono text-[10px] text-white/30">
        {count} field{count !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

// ── Text Field ────────────────────────────────────────────────────────────────

interface FieldProps {
  meta: ElementWizardMeta;
  value: string;
  instructionValue: string;
  isFocused: boolean;
  onChange: (v: string) => void;
  onInstructionChange: (v: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}

function TextField({
  meta,
  value,
  instructionValue,
  isFocused,
  onChange,
  onInstructionChange,
  onFocus,
  onBlur,
}: FieldProps) {
  const maxChars = meta.maxChars ?? (meta.role === 'body' ? 800 : 160);
  const rows = meta.role === 'body' ? 5 : meta.role === 'quote' ? 3 : 2;
  const charCount = value.length;
  const isOverLimit = charCount > maxChars;
  const isNearLimit = charCount > maxChars * 0.85;

  return (
    <div
      onClick={onFocus}
      className={`rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer ${
        isFocused
          ? 'border-[#0057FF] shadow-[0_0_0_2px_rgba(0,87,255,0.25)] ring-1 ring-[#0057FF]'
          : isOverLimit
            ? 'border-red-500/50'
            : 'border-white/10 hover:border-white/20'
      }`}
      style={{
        background: isFocused ? 'rgba(0,87,255,0.06)' : 'rgba(255,255,255,0.04)',
      }}
    >
      {/* Field header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
          {meta.required && <span className="w-1.5 h-1.5 rounded-full bg-[#0057FF] inline-block" />}
          {meta.label}
        </label>
        <span
          className={`font-mono text-[10px] ${
            isOverLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-white/30'
          }`}
        >
          {charCount}/{maxChars}
        </span>
      </div>

      {/* Guidance */}
      {meta.guidance && (
        <p className="px-3 pb-1 font-mono text-[10px] text-white/35 leading-relaxed">
          {meta.guidance}
        </p>
      )}

      {/* Main Input */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={meta.placeholder ?? `Enter ${meta.label.toLowerCase()}...`}
        rows={rows}
        maxLength={meta.maxChars ? meta.maxChars * 1.2 : undefined} // soft limit
        className="w-full px-3 pb-2.5 bg-transparent outline-none font-mono text-base sm:text-xs text-white/90 placeholder-white/25 resize-none leading-relaxed"
      />

      {/* Optional Design Notes / Custom Preferences Box */}
      <div className="px-3 pb-3 pt-2 border-t border-white/5 bg-white/[0.015]">
        <label className="block font-mono text-[9px] font-bold uppercase tracking-wider text-white/40 mb-1">
          ✎ Custom Preferences / Changes (Optional)
        </label>
        <input
          type="text"
          value={instructionValue}
          onChange={(e) => onInstructionChange(e.target.value)}
          placeholder="e.g. Change font, larger size, change color, shift position..."
          className="w-full px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/10 font-mono text-base sm:text-[11px] text-white/80 placeholder-white/20 focus:border-[#0057FF]/60 focus:bg-white/[0.06] outline-none transition-all"
        />
      </div>
    </div>
  );
}

// ── Image Helper ─────────────────────────────────────────────────────────────

function processImageFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 1920;
        if (img.width > maxDim || img.height > maxDim) {
          const scale = maxDim / Math.max(img.width, img.height);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL(file.type || 'image/jpeg', 0.88));
            return;
          }
        }
        resolve(dataUrl);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = () => {
      // Fallback
      resolve('');
    };
    reader.readAsDataURL(file);
  });
}

// ── Image Field ───────────────────────────────────────────────────────────────

function ImageField({
  meta,
  value,
  instructionValue,
  isFocused,
  onChange,
  onInstructionChange,
  onFocus,
  onBlur,
}: FieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const dataUrl = await processImageFile(file);
      if (dataUrl) onChange(dataUrl);
    },
    [onChange],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (!file || !file.type.startsWith('image/')) return;
      const dataUrl = await processImageFile(file);
      if (dataUrl) onChange(dataUrl);
    },
    [onChange],
  );

  const aspectHint = meta.recommendedAspectRatio
    ? `Recommended: ${meta.recommendedAspectRatio}`
    : undefined;

  return (
    <div
      onClick={onFocus}
      className={`rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer ${
        isFocused
          ? 'border-[#0057FF] shadow-[0_0_0_2px_rgba(0,87,255,0.25)] ring-1 ring-[#0057FF]'
          : 'border-white/10 hover:border-white/20'
      }`}
      style={{ background: isFocused ? 'rgba(0,87,255,0.06)' : 'rgba(255,255,255,0.04)' }}
    >
      {/* Field header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
          {meta.required && <span className="w-1.5 h-1.5 rounded-full bg-[#0057FF] inline-block" />}
          {meta.label}
        </label>
        {aspectHint && <span className="font-mono text-[10px] text-white/30">{aspectHint}</span>}
      </div>

      {/* Guidance */}
      {meta.guidance && (
        <p className="px-3 pb-2 font-mono text-[10px] text-white/35 leading-relaxed">
          {meta.guidance}
        </p>
      )}

      {/* Drop zone */}
      <div
        onFocus={onFocus}
        onBlur={onBlur}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="mx-3 mb-2.5 rounded-lg cursor-pointer transition-all duration-200 overflow-hidden"
        style={{
          minHeight: value ? 120 : 80,
          background: value ? 'transparent' : 'rgba(255,255,255,0.03)',
          border: value ? 'none' : '1.5px dashed rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: value ? 'flex-start' : 'center',
        }}
      >
        {value ? (
          <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={meta.label} className="w-full h-full object-cover rounded-lg" />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
              <span className="font-mono text-xs font-bold text-white uppercase tracking-widest">
                ↑ Change Photo
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-5 px-4">
            <span className="text-2xl text-white/20">↑</span>
            <span className="font-mono text-[11px] text-white/40 text-center">
              Tap to upload or drag & drop
            </span>
            <span className="font-mono text-[10px] text-white/25">JPG, PNG, WEBP supported</span>
          </div>
        )}
      </div>

      {/* Remove photo option if value exists */}
      {value && (
        <div className="px-3 pb-2 flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="font-mono text-[10px] text-white/30 hover:text-red-400 transition-colors uppercase tracking-wider"
          >
            ✕ Remove photo
          </button>
        </div>
      )}

      {/* Optional Design Notes / Custom Preferences Box */}
      <div className="px-3 pb-3 pt-2 border-t border-white/5 bg-white/[0.015]">
        <label className="block font-mono text-[9px] font-bold uppercase tracking-wider text-white/40 mb-1">
          ✎ Custom Preferences / Changes (Optional)
        </label>
        <input
          type="text"
          value={instructionValue}
          onChange={(e) => onInstructionChange(e.target.value)}
          placeholder="e.g. Center subject, zoom in/crop, move position, black & white..."
          className="w-full px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/10 font-mono text-base sm:text-[11px] text-white/80 placeholder-white/20 focus:border-[#0057FF]/60 focus:bg-white/[0.06] outline-none transition-all"
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
