'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import type {
  MagazineDocument,
  MagazineElement,
  MagazineTheme,
  AlignAction,
} from '@/types/magazine';
import { PRESET_THEMES } from '@/types/magazine';
import { MAGAZINE_TEMPLATES } from '@/data/magazineTemplates';

// ─── 1. Add Sheet ─────────────────────────────────────────────────────────────

interface AddSheetContentProps {
  onAddElement: (element: MagazineElement) => void;
  uploadedImages: string[];
  uploadError?: string | null;
  onUploadImage?: (file: File) => Promise<string | null>;
  onClose: () => void;
}

const CURATED_PHOTOS = [
  {
    name: 'Haute Couture',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Luxury Horology',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Cyber Hardware',
    url: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Brutalist Form',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Minimal Landscape',
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Studio Portrait',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
  },
];

export function AddSheetContent({
  onAddElement,
  uploadedImages,
  uploadError,
  onUploadImage,
  onClose,
}: AddSheetContentProps) {
  const [tab, setTab] = useState<'text' | 'photos' | 'shapes'>('text');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateText = (variant: 'heading' | 'subheading' | 'body' | 'quote') => {
    const configs = {
      heading: {
        content: 'HEADLINE TITLE',
        fontSize: 32,
        fontFamily: 'Playfair Display, serif',
        fontWeight: 700,
        w: 80,
        h: 12,
      },
      subheading: {
        content: 'Editorial Subtitle Here',
        fontSize: 18,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        w: 70,
        h: 8,
      },
      body: {
        content:
          'Enter editorial body paragraph text here. High quality typography and layout styling.',
        fontSize: 11,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 400,
        w: 60,
        h: 18,
      },
      quote: {
        content: '“Style is a way to say who you are without having to speak.”',
        fontSize: 20,
        fontFamily: 'Playfair Display, serif',
        fontWeight: 600,
        w: 75,
        h: 14,
      },
    };

    const cfg = configs[variant];
    const newEl: MagazineElement = {
      id: `el-text-${Date.now()}`,
      type: 'text',
      name: `Text ${variant}`,
      frame: { x: 10, y: 35, width: cfg.w, height: cfg.h, rotation: 0, zIndex: 10 },
      content: cfg.content,
      textStyle: {
        fontFamily: cfg.fontFamily,
        fontSize: cfg.fontSize,
        fontWeight: cfg.fontWeight,
        color: '#FFFFFF',
        textAlign: 'left',
        lineHeight: 1.3,
      },
      opacity: 1,
      locked: false,
      visible: true,
    };
    onAddElement(newEl);
    onClose();
  };

  const handleCreateShape = (shapeType: 'shape' | 'circle' | 'line') => {
    const newEl: MagazineElement = {
      id: `el-shape-${Date.now()}`,
      type: shapeType,
      name: shapeType === 'circle' ? 'Circle' : shapeType === 'line' ? 'Divider Line' : 'Rectangle',
      frame: {
        x: 25,
        y: 35,
        width: shapeType === 'line' ? 50 : 35,
        height: shapeType === 'line' ? 1 : 25,
        rotation: 0,
        zIndex: 5,
      },
      content: '',
      shapeStyle: {
        fillColor: shapeType === 'line' ? '#0057FF' : '#0057FF',
        strokeColor: '#0057FF',
        strokeWidth: shapeType === 'line' ? 2 : 0,
        borderRadius: shapeType === 'circle' ? 9999 : 4,
      },
      opacity: 0.9,
      locked: false,
      visible: true,
    };
    onAddElement(newEl);
    onClose();
  };

  const handleInsertPhoto = (url: string) => {
    const newEl: MagazineElement = {
      id: `el-img-${Date.now()}`,
      type: 'image',
      name: 'Editorial Photo',
      frame: { x: 15, y: 25, width: 70, height: 45, rotation: 0, zIndex: 5 },
      content: url,
      imageStyle: {
        borderRadius: 8,
        objectFit: 'cover',
      },
      opacity: 1,
      locked: false,
      visible: true,
    };
    onAddElement(newEl);
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadImage) return;

    setIsUploading(true);
    try {
      const url = await onUploadImage(file);
      if (url) {
        handleInsertPhoto(url);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Tabs (Text / Photos / Shapes) ── */}
      <div className="flex bg-white/[0.06] backdrop-blur-md rounded-xl p-1 border border-white/10">
        <button
          onClick={() => setTab('text')}
          className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            tab === 'text'
              ? 'bg-[#0057FF] text-white shadow-md'
              : 'text-[#F5F1EA]/60 hover:text-white'
          }`}
        >
          Text
        </button>
        <button
          onClick={() => setTab('photos')}
          className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            tab === 'photos'
              ? 'bg-[#0057FF] text-white shadow-md'
              : 'text-[#F5F1EA]/60 hover:text-white'
          }`}
        >
          Photos
        </button>
        <button
          onClick={() => setTab('shapes')}
          className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
            tab === 'shapes'
              ? 'bg-[#0057FF] text-white shadow-md'
              : 'text-[#F5F1EA]/60 hover:text-white'
          }`}
        >
          Shapes
        </button>
      </div>

      {/* ── Text Options ── */}
      {tab === 'text' && (
        <div className="grid grid-cols-1 gap-2.5">
          <button
            onClick={() => handleCreateText('heading')}
            className="p-3.5 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md rounded-xl border border-white/10 text-left transition-all active:scale-[0.99] flex items-center justify-between"
          >
            <div>
              <div className="font-display font-black text-lg text-white">Headline Title</div>
              <div className="text-[10px] font-mono text-[#F5F1EA]/50">32pt Playfair Display</div>
            </div>
            <span className="text-[#0057FF] font-mono text-xs font-bold">＋ ADD</span>
          </button>

          <button
            onClick={() => handleCreateText('subheading')}
            className="p-3 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md rounded-xl border border-white/10 text-left transition-all active:scale-[0.99] flex items-center justify-between"
          >
            <div>
              <div className="font-sans font-bold text-sm text-white">Editorial Subheading</div>
              <div className="text-[10px] font-mono text-[#F5F1EA]/50">18pt Inter Bold</div>
            </div>
            <span className="text-[#0057FF] font-mono text-xs font-bold">＋ ADD</span>
          </button>

          <button
            onClick={() => handleCreateText('body')}
            className="p-3 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md rounded-xl border border-white/10 text-left transition-all active:scale-[0.99] flex items-center justify-between"
          >
            <div>
              <div className="font-sans text-xs text-[#F5F1EA]/90">
                Body paragraph text for articles & captions
              </div>
              <div className="text-[10px] font-mono text-[#F5F1EA]/50">11pt Inter Regular</div>
            </div>
            <span className="text-[#0057FF] font-mono text-xs font-bold">＋ ADD</span>
          </button>

          <button
            onClick={() => handleCreateText('quote')}
            className="p-3 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md rounded-xl border border-white/10 text-left transition-all active:scale-[0.99] flex items-center justify-between"
          >
            <div>
              <div className="font-serif italic text-sm text-white">
                “Pull quote or standout phrase”
              </div>
              <div className="text-[10px] font-mono text-[#F5F1EA]/50">20pt Playfair Italic</div>
            </div>
            <span className="text-[#0057FF] font-mono text-xs font-bold">＋ ADD</span>
          </button>
        </div>
      )}

      {/* ── Photo Options ── */}
      {tab === 'photos' && (
        <div className="space-y-3">
          {/* Device Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full py-3 bg-[#0057FF] hover:bg-[#0046CC] text-white rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0057FF]/30 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <span>↑</span>
            <span>{isUploading ? 'Uploading...' : 'Upload From Phone / Gallery'}</span>
          </button>

          {uploadError && (
            <p className="text-[11px] font-mono text-rose-400 text-center">{uploadError}</p>
          )}

          {/* User Uploads Row (if any) */}
          {uploadedImages.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase text-[#F5F1EA]/50 mb-1.5">
                Your Uploads
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {uploadedImages.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => handleInsertPhoto(url)}
                    className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#F5F1EA]/20 shrink-0 active:scale-95 transition-all"
                  >
                    <Image
                      src={url}
                      alt="Uploaded"
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Curated Editorial Photos Grid */}
          <div>
            <div className="text-[10px] font-mono uppercase text-[#F5F1EA]/50 mb-1.5">
              Curated Editorial Photos
            </div>
            <div className="grid grid-cols-3 gap-2">
              {CURATED_PHOTOS.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => handleInsertPhoto(photo.url)}
                  className="relative aspect-square rounded-xl overflow-hidden border border-[#F5F1EA]/10 group active:scale-95 transition-all"
                >
                  <Image
                    src={photo.url}
                    alt={photo.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="120px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                    <span className="text-[9px] font-mono font-bold text-white truncate">
                      {photo.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Shape Options ── */}
      {tab === 'shapes' && (
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => handleCreateShape('shape')}
            className="p-4 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md rounded-xl border border-white/10 flex flex-col items-center gap-2 active:scale-95 transition-all"
          >
            <div className="w-12 h-8 rounded bg-[#0057FF]" />
            <span className="text-xs font-mono font-bold text-white">Rectangle</span>
          </button>

          <button
            onClick={() => handleCreateShape('circle')}
            className="p-4 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md rounded-xl border border-white/10 flex flex-col items-center gap-2 active:scale-95 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-[#0057FF]" />
            <span className="text-xs font-mono font-bold text-white">Circle</span>
          </button>

          <button
            onClick={() => handleCreateShape('line')}
            className="p-4 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md rounded-xl border border-white/10 flex flex-col items-center gap-2 active:scale-95 transition-all"
          >
            <div className="w-12 h-1 bg-[#0057FF] my-4" />
            <span className="text-xs font-mono font-bold text-white">Divider Line</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── 2. Pages Sheet ───────────────────────────────────────────────────────────

interface PagesSheetContentProps {
  document: MagazineDocument;
  currentPageIndex: number;
  onSelectPage: (index: number) => void;
  onAddPage: () => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onClose: () => void;
}

export function PagesSheetContent({
  document: doc,
  currentPageIndex,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onClose,
}: PagesSheetContentProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-[#F5F1EA]/60">
          Total: <strong className="text-white">{doc.pages.length} Pages</strong>
        </span>
        <button
          onClick={() => {
            onAddPage();
            onClose();
          }}
          className="px-3 py-1.5 rounded-lg bg-[#0057FF] text-white font-mono text-xs font-bold flex items-center gap-1 shadow-md shadow-[#0057FF]/30 active:scale-95 transition-all"
        >
          <span>＋</span>
          <span>Add Page</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 max-h-[42vh] overflow-y-auto pr-1">
        {doc.pages.map((page, idx) => {
          const isActive = idx === currentPageIndex;
          return (
            <div
              key={page.id}
              onClick={() => {
                onSelectPage(idx);
                onClose();
              }}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between backdrop-blur-md ${
                isActive
                  ? 'bg-[#0057FF]/20 border-[#0057FF] ring-2 ring-[#0057FF]/30'
                  : 'bg-white/[0.05] border-white/10 hover:border-white/30'
              }`}
            >
              {/* Mini page mockup */}
              <div
                className="w-full aspect-[3/4] rounded-lg mb-2 relative flex items-center justify-center overflow-hidden border border-[#F5F1EA]/10"
                style={{ backgroundColor: page.backgroundColor || '#0E0E10' }}
              >
                <span className="text-[10px] font-mono text-[#F5F1EA]/40 select-none">
                  {page.elements.length} elements
                </span>
              </div>

              {/* Page footer controls */}
              <div className="flex items-center justify-between pt-1 border-t border-[#F5F1EA]/10">
                <span
                  className={`text-xs font-mono font-bold ${isActive ? 'text-[#0057FF]' : 'text-white'}`}
                >
                  Page {idx + 1}
                </span>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onDuplicatePage(idx)}
                    title="Duplicate Page"
                    className="p-1 rounded text-[#F5F1EA]/60 hover:text-white text-xs"
                  >
                    ❐
                  </button>
                  {doc.pages.length > 1 && (
                    <button
                      onClick={() => onDeletePage(idx)}
                      title="Delete Page"
                      className="p-1 rounded text-rose-400/70 hover:text-rose-400 text-xs"
                    >
                      ⌫
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 3. Templates & Themes Sheet ──────────────────────────────────────────────

interface TemplatesSheetContentProps {
  onApplyTemplate: (templateId: string) => void;
  onApplyTheme: (theme: MagazineTheme) => void;
  onClose: () => void;
}

export function TemplatesSheetContent({
  onApplyTemplate,
  onApplyTheme,
  onClose,
}: TemplatesSheetContentProps) {
  const [activeSubTab, setActiveSubTab] = useState<'templates' | 'themes'>('templates');

  return (
    <div className="space-y-4">
      {/* Subtab */}
      <div className="flex bg-white/[0.06] backdrop-blur-md rounded-xl p-1 border border-white/10">
        <button
          onClick={() => setActiveSubTab('templates')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
            activeSubTab === 'templates'
              ? 'bg-[#0057FF] text-white shadow-md'
              : 'text-[#F5F1EA]/60 hover:text-white'
          }`}
        >
          Templates
        </button>
        <button
          onClick={() => setActiveSubTab('themes')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
            activeSubTab === 'themes'
              ? 'bg-[#0057FF] text-white shadow-md'
              : 'text-[#F5F1EA]/60 hover:text-white'
          }`}
        >
          Color Themes
        </button>
      </div>

      {activeSubTab === 'templates' && (
        <div className="space-y-2 max-h-[44vh] overflow-y-auto pr-1">
          {MAGAZINE_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => {
                onApplyTemplate(tpl.id);
                onClose();
              }}
              className="w-full p-3 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md rounded-xl border border-white/10 text-left flex items-center justify-between transition-all active:scale-[0.99]"
            >
              <div>
                <div className="font-display font-bold text-sm text-white">{tpl.name}</div>
                <div className="text-[10px] font-mono text-[#F5F1EA]/50">
                  {tpl.pages.length} Pages · {tpl.dimensionKey}
                </div>
              </div>
              <span className="text-[#0057FF] font-mono text-xs font-bold">Apply →</span>
            </button>
          ))}
        </div>
      )}

      {activeSubTab === 'themes' && (
        <div className="grid grid-cols-2 gap-2 max-h-[44vh] overflow-y-auto pr-1">
          {PRESET_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                onApplyTheme(theme);
                onClose();
              }}
              className="p-3 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md rounded-xl border border-white/10 text-left transition-all active:scale-95"
            >
              <div className="font-display font-bold text-xs text-white mb-2">{theme.name}</div>
              <div className="flex gap-1.5">
                <div
                  className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: theme.primaryColor }}
                />
                <div
                  className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: theme.secondaryColor }}
                />
                <div
                  className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: theme.accentColor }}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 4. Page Background Sheet ─────────────────────────────────────────────────

interface BackgroundSheetContentProps {
  backgroundColor: string;
  onUpdatePageBackground: (color: string) => void;
  onClose: () => void;
}

const PRESET_BG_COLORS = [
  { name: 'Dark Void', hex: '#0E0E10' },
  { name: 'Charcoal', hex: '#1A1A1E' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Warm Paper', hex: '#F5F1EA' },
  { name: 'Cream Silk', hex: '#FAF6F0' },
  { name: 'Midnight Navy', hex: '#0B132B' },
  { name: 'Deep Forest', hex: '#0D211A' },
  { name: 'Burgundy', hex: '#2A0C16' },
  { name: 'Cobalt Blue', hex: '#0057FF' },
  { name: 'Ember Red', hex: '#FF3333' },
];

export function BackgroundSheetContent({
  backgroundColor,
  onUpdatePageBackground,
  onClose,
}: BackgroundSheetContentProps) {
  return (
    <div className="space-y-4">
      <div className="text-xs font-mono text-[#F5F1EA]/60">Select page background color:</div>

      <div className="grid grid-cols-5 gap-3">
        {PRESET_BG_COLORS.map((bg) => (
          <button
            key={bg.hex}
            onClick={() => {
              onUpdatePageBackground(bg.hex);
              onClose();
            }}
            className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
          >
            <div
              className={`w-12 h-12 rounded-full border-2 shadow-md transition-all ${
                backgroundColor === bg.hex
                  ? 'border-[#0057FF] ring-2 ring-[#0057FF]/40 scale-110'
                  : 'border-white/20'
              }`}
              style={{ backgroundColor: bg.hex }}
            />
            <span className="text-[9px] font-mono text-[#F5F1EA]/60 truncate w-full text-center">
              {bg.name}
            </span>
          </button>
        ))}
      </div>

      {/* Custom Color Input */}
      <div className="pt-2 border-t border-[#F5F1EA]/10 flex items-center gap-2">
        <span className="text-xs font-mono text-[#F5F1EA]/60">Custom:</span>
        <input
          type="color"
          value={backgroundColor.startsWith('#') ? backgroundColor : '#0E0E10'}
          onChange={(e) => onUpdatePageBackground(e.target.value)}
          className="w-10 h-8 rounded bg-transparent border-0 cursor-pointer"
        />
        <input
          type="text"
          value={backgroundColor}
          onChange={(e) => onUpdatePageBackground(e.target.value)}
          className="flex-1 bg-white/[0.06] border border-white/15 px-3 py-1.5 rounded-lg font-mono text-xs text-white outline-none backdrop-blur-md"
          placeholder="#0E0E10"
        />
      </div>
    </div>
  );
}

// ─── 5. Transform / Geometry Sliders Sheet ─────────────────────────────────────

interface TransformSheetContentProps {
  element: MagazineElement;
  onUpdateElementLive: (id: string, updates: Partial<MagazineElement>) => void;
  onUpdateElement: (id: string, updates: Partial<MagazineElement>) => void;
}

export function TransformSheetContent({
  element,
  onUpdateElementLive,
  onUpdateElement,
}: TransformSheetContentProps) {
  const frame = element.frame;

  return (
    <div className="space-y-4">
      {/* X Position */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#F5F1EA]/70">Position X (%):</span>
          <span className="font-bold text-white">{Math.round(frame.x)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={frame.x}
            onChange={(e) =>
              onUpdateElementLive(element.id, {
                frame: { ...element.frame, x: Number(e.target.value) },
              })
            }
            onMouseUp={(e) =>
              onUpdateElement(element.id, {
                frame: {
                  ...element.frame,
                  x: Number((e.target as HTMLInputElement).value),
                },
              })
            }
            onTouchEnd={(e) =>
              onUpdateElement(element.id, {
                frame: {
                  ...element.frame,
                  x: Number((e.target as HTMLInputElement).value),
                },
              })
            }
            className="flex-1 accent-[#0057FF] h-2 bg-white/15 rounded-lg cursor-pointer"
          />
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(frame.x)}
            onChange={(e) =>
              onUpdateElement(element.id, {
                frame: { ...element.frame, x: Number(e.target.value) },
              })
            }
            className="w-14 bg-white/[0.08] border border-white/20 rounded-lg px-2 py-1 text-center font-mono text-xs text-white backdrop-blur-md"
          />
        </div>
      </div>

      {/* Y Position */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#F5F1EA]/70">Position Y (%):</span>
          <span className="font-bold text-white">{Math.round(frame.y)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={frame.y}
            onChange={(e) =>
              onUpdateElementLive(element.id, {
                frame: { ...element.frame, y: Number(e.target.value) },
              })
            }
            onMouseUp={(e) =>
              onUpdateElement(element.id, {
                frame: {
                  ...element.frame,
                  y: Number((e.target as HTMLInputElement).value),
                },
              })
            }
            onTouchEnd={(e) =>
              onUpdateElement(element.id, {
                frame: {
                  ...element.frame,
                  y: Number((e.target as HTMLInputElement).value),
                },
              })
            }
            className="flex-1 accent-[#0057FF] h-2 bg-white/15 rounded-lg cursor-pointer"
          />
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(frame.y)}
            onChange={(e) =>
              onUpdateElement(element.id, {
                frame: { ...element.frame, y: Number(e.target.value) },
              })
            }
            className="w-14 bg-white/[0.08] border border-white/20 rounded-lg px-2 py-1 text-center font-mono text-xs text-white backdrop-blur-md"
          />
        </div>
      </div>

      {/* Width */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#F5F1EA]/70">Width (%):</span>
          <span className="font-bold text-white">{Math.round(frame.width)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={2}
            max={100}
            step={0.5}
            value={frame.width}
            onChange={(e) =>
              onUpdateElementLive(element.id, {
                frame: { ...element.frame, width: Number(e.target.value) },
              })
            }
            onMouseUp={(e) =>
              onUpdateElement(element.id, {
                frame: {
                  ...element.frame,
                  width: Number((e.target as HTMLInputElement).value),
                },
              })
            }
            onTouchEnd={(e) =>
              onUpdateElement(element.id, {
                frame: {
                  ...element.frame,
                  width: Number((e.target as HTMLInputElement).value),
                },
              })
            }
            className="flex-1 accent-[#0057FF] h-2 bg-white/15 rounded-lg cursor-pointer"
          />
          <input
            type="number"
            min={2}
            max={100}
            value={Math.round(frame.width)}
            onChange={(e) =>
              onUpdateElement(element.id, {
                frame: { ...element.frame, width: Number(e.target.value) },
              })
            }
            className="w-14 bg-white/[0.08] border border-white/20 rounded-lg px-2 py-1 text-center font-mono text-xs text-white backdrop-blur-md"
          />
        </div>
      </div>

      {/* Height */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#F5F1EA]/70">Height (%):</span>
          <span className="font-bold text-white">{Math.round(frame.height)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={100}
            step={0.5}
            value={frame.height}
            onChange={(e) =>
              onUpdateElementLive(element.id, {
                frame: { ...element.frame, height: Number(e.target.value) },
              })
            }
            onMouseUp={(e) =>
              onUpdateElement(element.id, {
                frame: {
                  ...element.frame,
                  height: Number((e.target as HTMLInputElement).value),
                },
              })
            }
            onTouchEnd={(e) =>
              onUpdateElement(element.id, {
                frame: {
                  ...element.frame,
                  height: Number((e.target as HTMLInputElement).value),
                },
              })
            }
            className="flex-1 accent-[#0057FF] h-2 bg-white/15 rounded-lg cursor-pointer"
          />
          <input
            type="number"
            min={1}
            max={100}
            value={Math.round(frame.height)}
            onChange={(e) =>
              onUpdateElement(element.id, {
                frame: { ...element.frame, height: Number(e.target.value) },
              })
            }
            className="w-14 bg-white/[0.08] border border-white/20 rounded-lg px-2 py-1 text-center font-mono text-xs text-white backdrop-blur-md"
          />
        </div>
      </div>

      {/* Rotation */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#F5F1EA]/70">Rotation (°):</span>
          <span className="font-bold text-white">{frame.rotation || 0}°</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={frame.rotation || 0}
            onChange={(e) =>
              onUpdateElementLive(element.id, {
                frame: { ...element.frame, rotation: Number(e.target.value) },
              })
            }
            onMouseUp={(e) =>
              onUpdateElement(element.id, {
                frame: {
                  ...element.frame,
                  rotation: Number((e.target as HTMLInputElement).value),
                },
              })
            }
            onTouchEnd={(e) =>
              onUpdateElement(element.id, {
                frame: {
                  ...element.frame,
                  rotation: Number((e.target as HTMLInputElement).value),
                },
              })
            }
            className="flex-1 accent-[#0057FF] h-2 bg-white/15 rounded-lg cursor-pointer"
          />
          <input
            type="number"
            min={0}
            max={360}
            value={frame.rotation || 0}
            onChange={(e) =>
              onUpdateElement(element.id, {
                frame: { ...element.frame, rotation: Number(e.target.value) },
              })
            }
            className="w-14 bg-white/[0.08] border border-white/20 rounded-lg px-2 py-1 text-center font-mono text-xs text-white backdrop-blur-md"
          />
        </div>
      </div>

      {/* Opacity */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#F5F1EA]/70">Opacity (%):</span>
          <span className="font-bold text-white">{Math.round((element.opacity ?? 1) * 100)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round((element.opacity ?? 1) * 100)}
            onChange={(e) =>
              onUpdateElementLive(element.id, {
                opacity: Number(e.target.value) / 100,
              })
            }
            onMouseUp={(e) =>
              onUpdateElement(element.id, {
                opacity: Number((e.target as HTMLInputElement).value) / 100,
              })
            }
            onTouchEnd={(e) =>
              onUpdateElement(element.id, {
                opacity: Number((e.target as HTMLInputElement).value) / 100,
              })
            }
            className="flex-1 accent-[#0057FF] h-2 bg-white/15 rounded-lg cursor-pointer"
          />
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round((element.opacity ?? 1) * 100)}
            onChange={(e) =>
              onUpdateElement(element.id, {
                opacity: Number(e.target.value) / 100,
              })
            }
            className="w-14 bg-white/[0.08] border border-white/20 rounded-lg px-2 py-1 text-center font-mono text-xs text-white backdrop-blur-md"
          />
        </div>
      </div>
    </div>
  );
}

// ─── 6. Style & Color Sheet ───────────────────────────────────────────────────

interface StyleSheetContentProps {
  element: MagazineElement;
  onUpdateElement: (id: string, updates: Partial<MagazineElement>) => void;
}

export function StyleSheetContent({ element, onUpdateElement }: StyleSheetContentProps) {
  const isText =
    element.type === 'text' || element.type === 'quote-block' || element.type === 'page-number';
  const isShape = element.type === 'shape' || element.type === 'circle' || element.type === 'line';
  const isImage = element.type === 'image';

  return (
    <div className="space-y-4">
      {/* ── Text Specific Controls ── */}
      {isText && (
        <>
          {/* Text Content Input */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-[#F5F1EA]/60">Text Content:</label>
            <textarea
              value={element.content || ''}
              onChange={(e) => onUpdateElement(element.id, { content: e.target.value })}
              rows={2}
              className="w-full bg-white/[0.06] border border-white/15 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#0057FF] backdrop-blur-md"
            />
          </div>

          {/* Font Family & Size */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#F5F1EA]/60">Font:</label>
              <select
                value={element.textStyle?.fontFamily || 'Inter, sans-serif'}
                onChange={(e) =>
                  onUpdateElement(element.id, {
                    textStyle: {
                      fontFamily: e.target.value,
                      fontSize: element.textStyle?.fontSize || 16,
                      fontWeight: element.textStyle?.fontWeight || 400,
                      color: element.textStyle?.color || '#FFFFFF',
                      textAlign: element.textStyle?.textAlign || 'left',
                    },
                  })
                }
                className="w-full bg-[#1A1A22] border border-white/20 rounded-lg px-2.5 py-2 text-xs text-white outline-none"
              >
                <option value="Playfair Display, serif">Playfair Display</option>
                <option value="Cinzel, serif">Cinzel (Editorial)</option>
                <option value="Inter, sans-serif">Inter (Sans)</option>
                <option value="Space Mono, monospace">Space Mono</option>
                <option value="Bebas Neue, sans-serif">Bebas Neue</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#F5F1EA]/60">Size (pt):</label>
              <input
                type="number"
                min={8}
                max={120}
                value={element.textStyle?.fontSize || 16}
                onChange={(e) =>
                  onUpdateElement(element.id, {
                    textStyle: {
                      fontFamily: element.textStyle?.fontFamily || 'Inter, sans-serif',
                      fontSize: Number(e.target.value),
                      fontWeight: element.textStyle?.fontWeight || 400,
                      color: element.textStyle?.color || '#FFFFFF',
                      textAlign: element.textStyle?.textAlign || 'left',
                    },
                  })
                }
                className="w-full bg-white/[0.08] border border-white/20 rounded-lg px-2.5 py-2 text-xs text-white outline-none backdrop-blur-md"
              />
            </div>
          </div>

          {/* Alignment & Color */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex bg-white/[0.06] backdrop-blur-md rounded-lg p-0.5 border border-white/10">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() =>
                    onUpdateElement(element.id, {
                      textStyle: {
                        fontFamily: element.textStyle?.fontFamily || 'Inter, sans-serif',
                        fontSize: element.textStyle?.fontSize || 16,
                        fontWeight: element.textStyle?.fontWeight || 400,
                        color: element.textStyle?.color || '#FFFFFF',
                        textAlign: align,
                      },
                    })
                  }
                  className={`px-3 py-1 rounded text-xs capitalize ${
                    element.textStyle?.textAlign === align
                      ? 'bg-[#0057FF] text-white font-bold'
                      : 'text-[#F5F1EA]/60'
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>

            {/* Text Color */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-[#F5F1EA]/60">Color:</span>
              <input
                type="color"
                value={element.textStyle?.color || '#FFFFFF'}
                onChange={(e) =>
                  onUpdateElement(element.id, {
                    textStyle: {
                      fontFamily: element.textStyle?.fontFamily || 'Inter, sans-serif',
                      fontSize: element.textStyle?.fontSize || 16,
                      fontWeight: element.textStyle?.fontWeight || 400,
                      color: e.target.value,
                      textAlign: element.textStyle?.textAlign || 'left',
                    },
                  })
                }
                className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
              />
            </div>
          </div>
        </>
      )}

      {/* ── Shape Specific Controls ── */}
      {isShape && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-mono text-[#F5F1EA]/60">Fill Color:</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={element.shapeStyle?.fillColor || '#0057FF'}
                  onChange={(e) =>
                    onUpdateElement(element.id, {
                      shapeStyle: { ...element.shapeStyle, fillColor: e.target.value },
                    })
                  }
                  className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
                />
                <span className="font-mono text-xs text-white">
                  {element.shapeStyle?.fillColor}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-[#F5F1EA]/60">Stroke Color:</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={element.shapeStyle?.strokeColor || '#000000'}
                  onChange={(e) =>
                    onUpdateElement(element.id, {
                      shapeStyle: { ...element.shapeStyle, strokeColor: e.target.value },
                    })
                  }
                  className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
                />
                <span className="font-mono text-xs text-white">
                  {element.shapeStyle?.strokeColor}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-[#F5F1EA]/60">Corner Radius (px):</label>
            <input
              type="range"
              min={0}
              max={50}
              value={element.shapeStyle?.borderRadius || 0}
              onChange={(e) =>
                onUpdateElement(element.id, {
                  shapeStyle: { ...element.shapeStyle, borderRadius: Number(e.target.value) },
                })
              }
              className="w-full accent-[#0057FF]"
            />
          </div>
        </>
      )}

      {/* ── Image Specific Controls ── */}
      {isImage && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-mono text-[#F5F1EA]/60">Corner Radius (px):</label>
            <input
              type="range"
              min={0}
              max={40}
              value={element.imageStyle?.borderRadius || 0}
              onChange={(e) =>
                onUpdateElement(element.id, {
                  imageStyle: {
                    objectFit: element.imageStyle?.objectFit || 'cover',
                    borderRadius: Number(e.target.value),
                  },
                })
              }
              className="w-full accent-[#0057FF]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-[#F5F1EA]/60">Object Fit:</label>
            <div className="flex bg-white/[0.06] backdrop-blur-md rounded-lg p-0.5 border border-white/10">
              {(['cover', 'contain', 'fill'] as const).map((fit) => (
                <button
                  key={fit}
                  onClick={() =>
                    onUpdateElement(element.id, {
                      imageStyle: {
                        borderRadius: element.imageStyle?.borderRadius || 0,
                        objectFit: fit,
                      },
                    })
                  }
                  className={`flex-1 py-1.5 rounded text-xs capitalize ${
                    element.imageStyle?.objectFit === fit
                      ? 'bg-[#0057FF] text-white font-bold'
                      : 'text-[#F5F1EA]/60'
                  }`}
                >
                  {fit}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 7. Layer & Alignment Sheet ───────────────────────────────────────────────

interface LayerSheetContentProps {
  element: MagazineElement;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onToggleLock: (id: string) => void;
  onAlign: (action: AlignAction) => void;
}

export function LayerSheetContent({
  element,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onToggleLock,
  onAlign,
}: LayerSheetContentProps) {
  return (
    <div className="space-y-4">
      {/* Layer Hierarchy Actions */}
      <div className="space-y-1.5">
        <label className="text-xs font-mono text-[#F5F1EA]/60">Layer Order:</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onBringForward}
            className="p-3 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md rounded-xl border border-white/10 text-xs font-mono font-bold text-white flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span>▲</span>
            <span>Bring Forward</span>
          </button>
          <button
            onClick={onSendBackward}
            className="p-3 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md rounded-xl border border-white/10 text-xs font-mono font-bold text-white flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span>▼</span>
            <span>Send Backward</span>
          </button>
          <button
            onClick={onBringToFront}
            className="p-3 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md rounded-xl border border-white/10 text-xs font-mono font-bold text-white flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span>⤒</span>
            <span>Bring to Front</span>
          </button>
          <button
            onClick={onSendToBack}
            className="p-3 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md rounded-xl border border-white/10 text-xs font-mono font-bold text-white flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span>⤓</span>
            <span>Send to Back</span>
          </button>
        </div>
      </div>

      {/* Alignment Actions */}
      <div className="space-y-1.5 pt-2 border-t border-[#F5F1EA]/10">
        <label className="text-xs font-mono text-[#F5F1EA]/60">Align on Page:</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onAlign('left')}
            className="p-2.5 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md rounded-lg border border-white/10 text-xs font-mono text-white active:scale-95"
          >
            Left
          </button>
          <button
            onClick={() => onAlign('center')}
            className="p-2.5 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md rounded-lg border border-white/10 text-xs font-mono text-white active:scale-95"
          >
            Center
          </button>
          <button
            onClick={() => onAlign('right')}
            className="p-2.5 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md rounded-lg border border-white/10 text-xs font-mono text-white active:scale-95"
          >
            Right
          </button>
          <button
            onClick={() => onAlign('top')}
            className="p-2.5 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md rounded-lg border border-white/10 text-xs font-mono text-white active:scale-95"
          >
            Top
          </button>
          <button
            onClick={() => onAlign('middle')}
            className="p-2.5 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md rounded-lg border border-white/10 text-xs font-mono text-white active:scale-95"
          >
            Middle
          </button>
          <button
            onClick={() => onAlign('bottom')}
            className="p-2.5 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md rounded-lg border border-white/10 text-xs font-mono text-white active:scale-95"
          >
            Bottom
          </button>
        </div>
      </div>

      {/* Lock Element */}
      <div className="pt-2 border-t border-[#F5F1EA]/10">
        <button
          onClick={() => onToggleLock(element.id)}
          className={`w-full py-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 active:scale-98 transition-all backdrop-blur-md ${
            element.locked
              ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
              : 'bg-white/[0.05] border-white/10 text-[#F5F1EA]'
          }`}
        >
          <span>{element.locked ? '●' : '○'}</span>
          <span>{element.locked ? 'Unlock Element' : 'Lock Element'}</span>
        </button>
      </div>
    </div>
  );
}
