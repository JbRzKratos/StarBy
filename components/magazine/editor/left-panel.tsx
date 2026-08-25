'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type {
  MagazineDocument,
  MagazineElement,
  MagazineTheme,
  ElementType,
} from '@/types/magazine';
import { PRESET_THEMES } from '@/types/magazine';
import { MAGAZINE_TEMPLATES } from '@/data/magazineTemplates';

interface LeftPanelProps {
  document: MagazineDocument;
  currentPageIndex: number;
  selectedElementIds: string[];
  onSelectPage: (index: number) => void;
  onAddPage: () => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onAddElement: (element: MagazineElement) => void;
  onSelectElement: (elementId: string) => void;
  onToggleLockElement: (elementId: string) => void;
  onToggleVisibilityElement: (elementId: string) => void;
  onReorderLayer: (elementId: string, direction: 'up' | 'down') => void;
  onApplyTheme: (theme: MagazineTheme) => void;
  onApplyTemplate: (templateId: string) => void;
}

type TabType = 'pages' | 'elements' | 'layers' | 'photos' | 'themes' | 'presets';

const CURATED_EDITORIAL_PHOTOS = [
  {
    name: 'Haute Couture Silhouette',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Luxury Horology Chronograph',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Cybernetic Hardware Object',
    url: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Brutalist Architecture Form',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Monograph Minimal Landscape',
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'High Fashion Studio Portrait',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
  },
];

export function LeftPanel({
  document: doc,
  currentPageIndex,
  selectedElementIds,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onAddElement,
  onSelectElement,
  onToggleLockElement,
  onToggleVisibilityElement,
  onReorderLayer,
  onApplyTheme,
  onApplyTemplate,
}: LeftPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('pages');
  const activePage = doc.pages[currentPageIndex] || doc.pages[0];

  // Helper to add different element types
  const handleCreateElement = (type: ElementType, preset?: string) => {
    const id = `el-${Date.now()}`;
    let newElement: MagazineElement;

    if (type === 'text') {
      if (preset === 'masthead') {
        newElement = {
          id,
          type: 'text',
          name: 'Editorial Masthead',
          frame: { x: 8, y: 8, width: 84, height: 14, zIndex: 30 },
          content: 'FREGORO',
          textStyle: {
            fontFamily: 'Playfair Display, serif',
            fontSize: 46,
            fontWeight: 900,
            color: doc.theme.primaryColor || '#F5F1EA',
            textAlign: 'center',
            letterSpacing: 2,
          },
        };
      } else if (preset === 'headline') {
        newElement = {
          id,
          type: 'text',
          name: 'Article Headline',
          frame: { x: 10, y: 16, width: 80, height: 12, zIndex: 25 },
          content: 'ARCHITECTURAL SILHOUETTES',
          textStyle: {
            fontFamily: 'Playfair Display, serif',
            fontSize: 24,
            fontWeight: 700,
            color: doc.theme.primaryColor || '#F5F1EA',
            textAlign: 'left',
            letterSpacing: 1,
          },
        };
      } else if (preset === 'quote') {
        newElement = {
          id,
          type: 'quote-block',
          name: 'Editorial Pull Quote',
          frame: { x: 12, y: 38, width: 76, height: 16, zIndex: 20 },
          content: '“Design is the silent ambassador of quiet conviction.”',
          textStyle: {
            fontFamily: 'Playfair Display, serif',
            fontSize: 18,
            fontWeight: 600,
            fontStyle: 'italic',
            color: doc.theme.accentColor || '#0057FF',
            textAlign: 'center',
          },
        };
      } else if (preset === 'specs') {
        newElement = {
          id,
          type: 'text',
          name: 'Technical Specs Grid',
          frame: { x: 10, y: 65, width: 80, height: 20, zIndex: 15 },
          content:
            'SPECIFICATIONS\n— CHASSIS: Matte Titanium\n— WEIGHT: 320g\n— RUNTIME: 24h Continuous',
          textStyle: {
            fontFamily: 'Space Mono, monospace',
            fontSize: 11,
            fontWeight: 400,
            color: doc.theme.secondaryColor || '#A09FA6',
            textAlign: 'left',
            lineHeight: 1.6,
          },
        };
      } else {
        newElement = {
          id,
          type: 'text',
          name: 'Body Paragraph',
          frame: { x: 10, y: 32, width: 80, height: 24, zIndex: 15 },
          content:
            'In this definitive monograph, FREGORO examines the intersection of modern utilitarian streetwear, precision chronography, and architectural spaces.',
          textStyle: {
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            fontWeight: 400,
            color: doc.theme.textColor || '#F5F1EA',
            textAlign: 'left',
            lineHeight: 1.5,
          },
        };
      }
    } else if (type === 'image') {
      newElement = {
        id,
        type: 'image',
        name: 'Image Frame',
        frame: { x: 10, y: 15, width: 80, height: 50, zIndex: 10 },
        content:
          preset ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        originalDpi: 300,
        imageStyle: {
          objectFit: 'cover',
          borderRadius: 4,
        },
      };
    } else if (type === 'circle') {
      newElement = {
        id,
        type: 'circle',
        name: 'Graphic Circle',
        frame: { x: 30, y: 30, width: 40, height: 30, zIndex: 5 },
        content: '',
        shapeStyle: {
          fillColor: doc.theme.accentColor || '#0057FF',
          opacity: 0.85,
        },
      };
    } else if (type === 'line' || type === 'divider') {
      newElement = {
        id,
        type: 'line',
        name: 'Hairline Divider',
        frame: { x: 10, y: 28, width: 80, height: 1, zIndex: 10 },
        content: '',
        shapeStyle: {
          fillColor: doc.theme.accentColor || '#0057FF',
          strokeWidth: 2,
        },
      };
    } else if (type === 'barcode') {
      newElement = {
        id,
        type: 'barcode',
        name: 'Editorial Barcode',
        frame: { x: 10, y: 88, width: 30, height: 6, zIndex: 25 },
        content: 'FREGORO-2026-ISSUE',
      };
    } else {
      // Regular shape rectangle
      newElement = {
        id,
        type: 'shape',
        name: 'Surface Accent Block',
        frame: { x: 8, y: 8, width: 84, height: 35, zIndex: 2 },
        content: '',
        shapeStyle: {
          fillColor: doc.theme.surfaceColor || '#16161A',
          borderRadius: 8,
        },
      };
    }

    onAddElement(newElement);
  };

  return (
    <div className="flex h-full bg-[#121214] border-r border-[#F5F1EA]/10 select-none z-30">
      {/* ── VERTICAL TAB BAR (FAR LEFT) ── */}
      <div className="w-16 bg-[#0E0E10] border-r border-[#F5F1EA]/10 flex flex-col items-center py-4 gap-3 shrink-0">
        {[
          { id: 'pages', label: 'Pages', icon: '📑' },
          { id: 'elements', label: 'Elements', icon: '＋' },
          { id: 'layers', label: 'Layers', icon: '☷' },
          { id: 'photos', label: 'Photos', icon: '🖼' },
          { id: 'themes', label: 'Themes', icon: '🎨' },
          { id: 'presets', label: 'Presets', icon: '⚡' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === tab.id
                ? 'bg-[#0057FF] text-white shadow-lg shadow-[#0057FF]/35 scale-105'
                : 'text-[#F5F1EA]/50 hover:text-white hover:bg-[#1A1A22]'
            }`}
          >
            <span className="text-sm font-bold leading-none">{tab.icon}</span>
            <span className="font-mono text-[8px] uppercase font-bold tracking-tight">
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── DRAWER CONTENT ── */}
      <div className="w-[calc(100vw-4.5rem)] max-w-xs sm:w-72 xl:w-80 bg-[#121214] flex flex-col h-full overflow-hidden text-[#F5F1EA]">
        {/* ── 1. PAGES TAB: VISUAL MINIATURES & REORDERING ── */}
        {activeTab === 'pages' && (
          <div className="flex flex-col h-full p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F1EA]/10">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#0057FF] font-bold">
                  DOCUMENT PAGES
                </span>
                <h3 className="font-display text-sm font-bold">
                  Page Overview ({doc.pages.length})
                </h3>
              </div>
              <button
                onClick={onAddPage}
                className="px-3 py-1.5 rounded-lg bg-[#0057FF] hover:bg-[#0046CC] font-mono text-xs font-bold text-white uppercase shadow-sm"
              >
                + Add Page
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {doc.pages.map((page, idx) => {
                const isActive = idx === currentPageIndex;

                return (
                  <div
                    key={page.id}
                    onClick={() => onSelectPage(idx)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-[#1A1A24] border-[#0057FF] shadow-md ring-1 ring-[#0057FF]'
                        : 'bg-[#16161A] border-[#F5F1EA]/10 hover:border-[#F5F1EA]/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-14 rounded-md bg-[#0A0A0C] border border-[#F5F1EA]/15 flex items-center justify-center font-mono text-[11px] font-bold text-[#0057FF] shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="font-display text-xs font-bold text-white block truncate">
                          {page.title || `Page ${idx + 1}`}
                        </span>
                        <span className="font-mono text-[10px] text-[#F5F1EA]/50">
                          {idx === 0
                            ? 'Front Cover'
                            : idx === doc.pages.length - 1
                              ? 'Back Cover'
                              : 'Spread Page'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicatePage(idx);
                        }}
                        title="Duplicate Page"
                        className="p-1.5 rounded hover:bg-[#25252E] text-[#F5F1EA]/60 hover:text-white text-xs font-mono"
                      >
                        ❐
                      </button>
                      {doc.pages.length > 2 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePage(idx);
                          }}
                          title="Delete Page"
                          className="p-1.5 rounded hover:bg-rose-500/20 text-rose-400/60 hover:text-rose-400 text-xs font-mono"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 2. ELEMENTS TAB: CLICK TO ADD OBJECTS ── */}
        {activeTab === 'elements' && (
          <div className="p-4 space-y-5 overflow-y-auto">
            <div className="pb-3 border-b border-[#F5F1EA]/10">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#0057FF] font-bold">
                ADD DESIGN OBJECTS
              </span>
              <h3 className="font-display text-sm font-bold">Click to Insert on Page</h3>
            </div>

            {/* Typography Section */}
            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase font-bold text-[#F5F1EA]/50">
                Typography
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCreateElement('text', 'masthead')}
                  className="p-3 bg-[#16161A] hover:bg-[#1F1F26] border border-[#F5F1EA]/10 hover:border-[#0057FF] rounded-xl text-left transition-all"
                >
                  <span className="font-serif text-lg font-black text-white block">Heading 1</span>
                  <span className="font-mono text-[9px] text-[#F5F1EA]/50">Masthead</span>
                </button>
                <button
                  onClick={() => handleCreateElement('text', 'headline')}
                  className="p-3 bg-[#16161A] hover:bg-[#1F1F26] border border-[#F5F1EA]/10 hover:border-[#0057FF] rounded-xl text-left transition-all"
                >
                  <span className="font-serif text-sm font-bold text-white block">Heading 2</span>
                  <span className="font-mono text-[9px] text-[#F5F1EA]/50">Article Title</span>
                </button>
                <button
                  onClick={() => handleCreateElement('text', 'body')}
                  className="p-3 bg-[#16161A] hover:bg-[#1F1F26] border border-[#F5F1EA]/10 hover:border-[#0057FF] rounded-xl text-left transition-all"
                >
                  <span className="font-sans text-xs text-white block">Body Text</span>
                  <span className="font-mono text-[9px] text-[#F5F1EA]/50">Paragraph</span>
                </button>
                <button
                  onClick={() => handleCreateElement('text', 'quote')}
                  className="p-3 bg-[#16161A] hover:bg-[#1F1F26] border border-[#F5F1EA]/10 hover:border-[#0057FF] rounded-xl text-left transition-all"
                >
                  <span className="font-serif text-xs italic text-[#0057FF] block">
                    “Pull Quote”
                  </span>
                  <span className="font-mono text-[9px] text-[#F5F1EA]/50">Highlight</span>
                </button>
              </div>
            </div>

            {/* Shapes & Media Section */}
            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase font-bold text-[#F5F1EA]/50">
                Shapes & Frames
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCreateElement('image')}
                  className="p-3 bg-[#16161A] hover:bg-[#1F1F26] border border-[#F5F1EA]/10 hover:border-[#0057FF] rounded-xl text-left transition-all"
                >
                  <span className="text-base block">🖼</span>
                  <span className="font-display text-xs font-bold text-white block">
                    Image Frame
                  </span>
                  <span className="font-mono text-[9px] text-[#F5F1EA]/50">Media</span>
                </button>
                <button
                  onClick={() => handleCreateElement('shape')}
                  className="p-3 bg-[#16161A] hover:bg-[#1F1F26] border border-[#F5F1EA]/10 hover:border-[#0057FF] rounded-xl text-left transition-all"
                >
                  <span className="text-base block">◼</span>
                  <span className="font-display text-xs font-bold text-white block">Rectangle</span>
                  <span className="font-mono text-[9px] text-[#F5F1EA]/50">Color Block</span>
                </button>
                <button
                  onClick={() => handleCreateElement('circle')}
                  className="p-3 bg-[#16161A] hover:bg-[#1F1F26] border border-[#F5F1EA]/10 hover:border-[#0057FF] rounded-xl text-left transition-all"
                >
                  <span className="text-base block">●</span>
                  <span className="font-display text-xs font-bold text-white block">Circle</span>
                  <span className="font-mono text-[9px] text-[#F5F1EA]/50">Badge</span>
                </button>
                <button
                  onClick={() => handleCreateElement('line')}
                  className="p-3 bg-[#16161A] hover:bg-[#1F1F26] border border-[#F5F1EA]/10 hover:border-[#0057FF] rounded-xl text-left transition-all"
                >
                  <span className="text-base block">―</span>
                  <span className="font-display text-xs font-bold text-white block">Divider</span>
                  <span className="font-mono text-[9px] text-[#F5F1EA]/50">Hairline</span>
                </button>
              </div>
            </div>

            {/* Accents Section */}
            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase font-bold text-[#F5F1EA]/50">
                Editorial Accents
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCreateElement('barcode')}
                  className="p-3 bg-[#16161A] hover:bg-[#1F1F26] border border-[#F5F1EA]/10 hover:border-[#0057FF] rounded-xl text-left transition-all"
                >
                  <span className="font-mono text-xs font-bold text-white block">||||| |||</span>
                  <span className="font-mono text-[9px] text-[#F5F1EA]/50">Issue Barcode</span>
                </button>
                <button
                  onClick={() => handleCreateElement('text', 'specs')}
                  className="p-3 bg-[#16161A] hover:bg-[#1F1F26] border border-[#F5F1EA]/10 hover:border-[#0057FF] rounded-xl text-left transition-all"
                >
                  <span className="font-mono text-xs text-white block">Specs Table</span>
                  <span className="font-mono text-[9px] text-[#F5F1EA]/50">Technical Data</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. LAYERS TREE TAB ── */}
        {activeTab === 'layers' && (
          <div className="flex flex-col h-full p-4 space-y-4">
            <div className="pb-3 border-b border-[#F5F1EA]/10">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#0057FF] font-bold">
                PAGE LAYERS
              </span>
              <h3 className="font-display text-sm font-bold">
                Layer Stack (Page {currentPageIndex + 1})
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {[...(activePage?.elements || [])].reverse().map((el) => {
                const isSelected = selectedElementIds.includes(el.id);

                return (
                  <div
                    key={el.id}
                    onClick={() => onSelectElement(el.id)}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#1A1A24] border-[#0057FF] shadow-sm ring-1 ring-[#0057FF]'
                        : 'bg-[#16161A] border-[#F5F1EA]/10 hover:border-[#F5F1EA]/25'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] text-[#0057FF] font-bold uppercase">
                        {el.type === 'text' ? 'T' : el.type === 'image' ? 'IMG' : 'OBJ'}
                      </span>
                      <span className="font-display text-xs text-white truncate">{el.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReorderLayer(el.id, 'up');
                        }}
                        title="Bring Forward"
                        className="p-1 rounded hover:bg-[#25252E] text-xs font-mono text-[#F5F1EA]/60 hover:text-white"
                      >
                        ▲
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReorderLayer(el.id, 'down');
                        }}
                        title="Send Backward"
                        className="p-1 rounded hover:bg-[#25252E] text-xs font-mono text-[#F5F1EA]/60 hover:text-white"
                      >
                        ▼
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLockElement(el.id);
                        }}
                        title={el.locked ? 'Unlock' : 'Lock'}
                        className={`p-1 rounded text-xs font-mono ${
                          el.locked ? 'text-amber-400' : 'text-[#F5F1EA]/50 hover:text-white'
                        }`}
                      >
                        {el.locked ? '🔒' : '🔓'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleVisibilityElement(el.id);
                        }}
                        title={el.visible === false ? 'Show' : 'Hide'}
                        className={`p-1 rounded text-xs font-mono ${
                          el.visible === false
                            ? 'text-rose-400'
                            : 'text-[#F5F1EA]/50 hover:text-white'
                        }`}
                      >
                        {el.visible === false ? '👁‍🗨' : '👁'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 4. PHOTOS TAB: CURATED GALLERY ── */}
        {activeTab === 'photos' && (
          <div className="p-4 space-y-4 overflow-y-auto">
            <div className="pb-3 border-b border-[#F5F1EA]/10">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#0057FF] font-bold">
                HIGH-RESOLUTION MEDIA
              </span>
              <h3 className="font-display text-sm font-bold">Curated Photography</h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {CURATED_EDITORIAL_PHOTOS.map((photo, i) => (
                <div
                  key={i}
                  onClick={() => handleCreateElement('image', photo.url)}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-[#16161A] border border-[#F5F1EA]/10 hover:border-[#0057FF] cursor-pointer transition-all"
                >
                  <Image
                    src={photo.url}
                    alt={photo.name}
                    fill
                    sizes="160px"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="font-mono text-[10px] text-white font-bold uppercase bg-[#0057FF] px-2 py-1 rounded">
                      + Insert
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 5. THEMES TAB: PALETTES ── */}
        {activeTab === 'themes' && (
          <div className="p-4 space-y-4 overflow-y-auto">
            <div className="pb-3 border-b border-[#F5F1EA]/10">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#0057FF] font-bold">
                COLOR PALETTES
              </span>
              <h3 className="font-display text-sm font-bold">Global Theme Presets</h3>
            </div>

            <div className="space-y-3">
              {PRESET_THEMES.map((theme) => {
                const isCurrent = doc.theme.id === theme.id;

                return (
                  <button
                    key={theme.id}
                    onClick={() => onApplyTheme(theme)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all space-y-2 ${
                      isCurrent
                        ? 'bg-[#1A1A22] border-[#0057FF] ring-1 ring-[#0057FF]'
                        : 'bg-[#16161A] border-[#F5F1EA]/10 hover:border-[#F5F1EA]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xs font-bold text-white">
                        {theme.name}
                      </span>
                      {isCurrent && (
                        <span className="font-mono text-[9px] text-[#0057FF] font-bold uppercase">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      {[
                        theme.backgroundColor,
                        theme.surfaceColor,
                        theme.accentColor,
                        theme.textColor,
                      ].map((color, cIdx) => (
                        <div
                          key={cIdx}
                          className="flex-1 h-5 rounded-md border border-white/10"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 6. PRESETS TAB: LOAD LAYOUT ── */}
        {activeTab === 'presets' && (
          <div className="p-4 space-y-4 overflow-y-auto">
            <div className="pb-3 border-b border-[#F5F1EA]/10">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#0057FF] font-bold">
                FREGORO PRESETS
              </span>
              <h3 className="font-display text-sm font-bold">Load Curated Layout</h3>
            </div>

            <div className="space-y-3">
              {MAGAZINE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => onApplyTemplate(tpl.id)}
                  className="w-full text-left p-3 rounded-xl bg-[#16161A] hover:bg-[#1F1F26] border border-[#F5F1EA]/10 hover:border-[#0057FF] transition-all flex items-center gap-3"
                >
                  <div className="w-12 h-16 rounded-md bg-[#0A0A0C] border border-[#F5F1EA]/15 relative overflow-hidden shrink-0">
                    {tpl.coverImage && (
                      <Image src={tpl.coverImage} alt={tpl.name} fill className="object-cover" />
                    )}
                  </div>
                  <div>
                    <span className="font-display text-xs font-bold text-white block">
                      {tpl.name}
                    </span>
                    <span className="font-mono text-[10px] text-[#F5F1EA]/50">
                      {tpl.pageCount} Pages · {tpl.subcategory}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
