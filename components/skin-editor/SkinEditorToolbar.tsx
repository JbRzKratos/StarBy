'use client';

import React from 'react';

interface SkinEditorToolbarProps {
  hasArtwork: boolean;
  showSafeArea: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isExporting: boolean;
  onFitCover: () => void;
  onFitContain: () => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleSafeArea: () => void;
  onExport300: () => void;
  onExport600: () => void;
  onExportSVG: () => void;
}

/**
 * SkinEditorToolbar — Floating toolbar above the skin editor SVG canvas.
 *
 * Groups: Fit | Transform | Undo/Redo | Guide | Export
 */
export function SkinEditorToolbar({
  hasArtwork,
  showSafeArea,
  canUndo,
  canRedo,
  isExporting,
  onFitCover,
  onFitContain,
  onRotateCW,
  onRotateCCW,
  onFlipH,
  onFlipV,
  onUndo,
  onRedo,
  onToggleSafeArea,
  onExport300,
  onExport600,
  onExportSVG,
}: SkinEditorToolbarProps) {
  if (!hasArtwork) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Fit group */}
      <ToolGroup label="Fit">
        <ToolBtn title="Fill (Cover)" onClick={onFitCover}>
          <FitCoverIcon />
        </ToolBtn>
        <ToolBtn title="Fit (Contain)" onClick={onFitContain}>
          <FitContainIcon />
        </ToolBtn>
      </ToolGroup>

      <div className="w-px h-6 bg-white/10" />

      {/* Transform group */}
      <ToolGroup label="Transform">
        <ToolBtn title="Rotate CCW" onClick={onRotateCCW}>
          <RotateCCWIcon />
        </ToolBtn>
        <ToolBtn title="Rotate CW" onClick={onRotateCW}>
          <RotateCWIcon />
        </ToolBtn>
        <ToolBtn title="Flip Horizontal" onClick={onFlipH}>
          <FlipHIcon />
        </ToolBtn>
        <ToolBtn title="Flip Vertical" onClick={onFlipV}>
          <FlipVIcon />
        </ToolBtn>
      </ToolGroup>

      <div className="w-px h-6 bg-white/10" />

      {/* Undo / Redo */}
      <ToolGroup label="History">
        <ToolBtn title="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo}>
          <UndoIcon />
        </ToolBtn>
        <ToolBtn title="Redo (Ctrl+Shift+Z)" onClick={onRedo} disabled={!canRedo}>
          <RedoIcon />
        </ToolBtn>
      </ToolGroup>

      <div className="w-px h-6 bg-white/10" />

      {/* Safe area toggle */}
      <ToolBtn title="Toggle Print Guides" onClick={onToggleSafeArea} active={showSafeArea}>
        <GuideIcon />
        <span className="text-[9px] font-mono tracking-wider ml-1">GUIDES</span>
      </ToolBtn>

      <div className="w-px h-6 bg-white/10" />

      {/* Export group */}
      <ToolGroup label="Export">
        <button
          onClick={onExport300}
          disabled={isExporting}
          title="Export 300 DPI PNG"
          className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono tracking-widest uppercase bg-cobalt/20 hover:bg-cobalt/40 text-cobalt border border-cobalt/30 transition-colors disabled:opacity-40"
        >
          300 DPI
        </button>
        <button
          onClick={onExport600}
          disabled={isExporting}
          title="Export 600 DPI PNG"
          className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono tracking-widest uppercase bg-cobalt/20 hover:bg-cobalt/40 text-cobalt border border-cobalt/30 transition-colors disabled:opacity-40"
        >
          600 DPI
        </button>
        <button
          onClick={onExportSVG}
          title="Export SVG Vector"
          className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono tracking-widest uppercase bg-white/5 hover:bg-white/10 text-pearl border border-white/10 transition-colors"
        >
          SVG
        </button>
      </ToolGroup>
    </div>
  );
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function ToolGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-0.5" title={label}>
      {children}
    </div>
  );
}

function ToolBtn({
  title,
  onClick,
  children,
  disabled,
  active,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center w-7 h-7 rounded transition-colors
        ${
          active
            ? 'bg-cobalt/30 text-cobalt border border-cobalt/50'
            : 'bg-white/5 hover:bg-white/10 text-pearl border border-white/10'
        }
        disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

// ─── Icons (inline SVG, 12px) ─────────────────────────────────────────────────

const s = {
  width: 12,
  height: 12,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function FitCoverIcon() {
  return (
    <svg {...s}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <rect x="6" y="6" width="12" height="12" fill="currentColor" fillOpacity={0.3} />
    </svg>
  );
}
function FitContainIcon() {
  return (
    <svg {...s}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <rect x="8" y="8" width="8" height="8" />
    </svg>
  );
}
function RotateCWIcon() {
  return (
    <svg {...s}>
      <path d="M21 2v6h-6" />
      <path d="M21 8C18.8 5 15.6 3 12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}
function RotateCCWIcon() {
  return (
    <svg {...s}>
      <path d="M3 2v6h6" />
      <path d="M3 8C5.2 5 8.4 3 12 3a9 9 0 1 1-9 9" />
    </svg>
  );
}
function FlipHIcon() {
  return (
    <svg {...s}>
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M16 7l4 5-4 5" />
      <path d="M8 7l-4 5 4 5" />
    </svg>
  );
}
function FlipVIcon() {
  return (
    <svg {...s}>
      <line x1="3" y1="12" x2="21" y2="12" />
      <path d="M7 16l5 4 5-4" />
      <path d="M7 8l5-4 5 4" />
    </svg>
  );
}
function UndoIcon() {
  return (
    <svg {...s}>
      <path d="M3 7v6h6" />
      <path d="M3 13C5.5 6 14 4 20 8" />
    </svg>
  );
}
function RedoIcon() {
  return (
    <svg {...s}>
      <path d="M21 7v6h-6" />
      <path d="M21 13C18.5 6 10 4 4 8" />
    </svg>
  );
}
function GuideIcon() {
  return (
    <svg {...s}>
      <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" />
      <rect x="7" y="7" width="10" height="10" strokeDasharray="3 1.5" />
    </svg>
  );
}
