import React from 'react';
import type { GarmentSide } from '../types/mockup';

export interface HeaderProps {
  mode: '2d' | '3d';
  onModeChange: (mode: '2d' | '3d') => void;
  templateName: string;
  activeSide: GarmentSide;
  onSideChange: (side: GarmentSide) => void;
  frontLayerCount: number;
  backLayerCount: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onOpenExport: () => void;
  onSaveProject: () => void;
  onLoadProject: () => void;
  onCameraPreset3D?: (preset: 'front' | 'back' | 'threeQuarter') => void;
  onOpenAddToCart?: () => void;
  onOpenDesignsLibrary?: () => void;
  onOpenDesignSetup?: () => void;
  onOpenInstructions?: () => void;
  hasLoadedDesign?: boolean;
  isDesignerAuthorized?: boolean;
  isDesignerMode?: boolean;
  onToggleDesignerMode?: () => void;
  price?: number;
}

export const HeaderDesktop: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  templateName,
  activeSide,
  onSideChange,
  frontLayerCount,
  backLayerCount,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onOpenExport,
  onSaveProject: _onSaveProject,
  onLoadProject: _onLoadProject,
  onCameraPreset3D: _onCameraPreset3D,
  onOpenAddToCart,
  onOpenDesignsLibrary,
  onOpenDesignSetup: _onOpenDesignSetup,
  onOpenInstructions,
  hasLoadedDesign: _hasLoadedDesign,
  isDesignerAuthorized = false,
  isDesignerMode = false,
  onToggleDesignerMode,
  price,
}) => {
  return (
    <header className="app-header header-desktop">
      {/* ── Left: Brand & Garment Context ── */}
      <div className="brand-section">
        <a
          href="/products/all"
          target="_top"
          className="header-btn header-back-btn"
          title="Return to Shop"
        >
          <span className="symbol-icon">←</span>
          <span className="back-text">Shop</span>
        </a>

        <a
          href="/"
          target="_top"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}
          title="Return to Home"
        >
          <img
            src="/images/fregoro-logo.png"
            alt="StarBy Logo"
            style={{
              height: '28px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
              display: 'block',
            }}
          />
          <div className="brand-info" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                className="brand-badge"
                style={{
                  background: mode === '3d' ? 'var(--accent, #3B5EFF)' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '9.5px',
                  padding: '1px 7px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                {mode === '3d' ? '3D STUDIO' : '2D STUDIO'}
              </span>
            </div>
            <div className="brand-template-name" style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
              {templateName}
            </div>
          </div>
        </a>
      </div>

      {/* ── Center: Unified Mode & View Capsule ── */}
      <div className="header-center-capsule">
        {/* 2D / 3D Switcher */}
        <div className="mode-toggle-group">
          <button
            id="btn-mode-2d"
            type="button"
            className={`mode-toggle-btn ${mode === '2d' ? 'active' : ''}`}
            onClick={() => onModeChange('2d')}
          >
            <span>2D</span>
          </button>
          <button
            id="btn-mode-3d"
            type="button"
            className={`mode-toggle-btn ${mode === '3d' ? 'active' : ''}`}
            onClick={() => onModeChange('3d')}
          >
            <span>3D</span>
          </button>
        </div>

        {/* 2D Canvas Side Switcher (Only in 2D; in 3D, camera presets are in the floating viewport bar) */}
        {mode === '2d' && (
          <div className="side-switcher">
            <button
              id="btn-switch-front"
              type="button"
              className={`side-btn ${activeSide === 'front' ? 'active' : ''}`}
              onClick={() => onSideChange('front')}
            >
              <span>Front</span>
              {frontLayerCount > 0 && <span className="side-layer-count">{frontLayerCount}</span>}
            </button>
            <button
              id="btn-switch-back"
              type="button"
              className={`side-btn ${activeSide === 'back' ? 'active' : ''}`}
              onClick={() => onSideChange('back')}
            >
              <span>Back</span>
              {backLayerCount > 0 && <span className="side-layer-count">{backLayerCount}</span>}
            </button>
          </div>
        )}
      </div>

      {/* ── Right: Tool Actions & Primary CTA ── */}
      <div className="header-actions">
        {mode === '2d' && (
          <>
            {/* History Controls */}
            <div style={{ display: 'flex', gap: '3px' }}>
              <button
                id="btn-undo"
                type="button"
                className="header-btn header-btn-icon"
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo"
              >
                <span className="symbol-icon">↶</span>
              </button>
              <button
                id="btn-redo"
                type="button"
                className="header-btn header-btn-icon"
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo"
              >
                <span className="symbol-icon">↷</span>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="desktop-only-zoom" style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--bg-card)', padding: '2px 5px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <button type="button" className="viewport-btn" onClick={onZoomOut} title="Zoom Out">
                <span className="symbol-icon">－</span>
              </button>
              <span style={{ fontSize: '11px', fontWeight: 600, minWidth: '38px', textAlign: 'center', fontFamily: 'monospace' }}>
                {Math.round(zoom * 100)}%
              </span>
              <button type="button" className="viewport-btn" onClick={onZoomIn} title="Zoom In">
                <span className="symbol-icon">＋</span>
              </button>
              <button type="button" className="viewport-btn" onClick={onZoomFit} title="Fit to View">
                <span className="symbol-icon">⤢</span>
              </button>
            </div>
          </>
        )}

        {/* Graphic Library Button */}
        {onOpenDesignsLibrary && (
          <button
            id="btn-open-designs-library"
            type="button"
            className="header-btn header-btn-library"
            onClick={onOpenDesignsLibrary}
            title="Browse Graphic Library"
          >
            <span className="symbol-icon" style={{ color: 'var(--accent, #3B5EFF)' }}>✦</span>
            <span>Library</span>
          </button>
        )}

        {/* Guide / Info Tooltip Trigger */}
        {mode === '3d' && onOpenInstructions && (
          <button
            id="btn-3d-instructions"
            type="button"
            className="header-btn header-btn-icon"
            onClick={onOpenInstructions}
            title="Studio Quality & Placement Guide"
          >
            <span className="symbol-icon" style={{ color: '#fbbf24', fontWeight: 700 }}>?</span>
          </button>
        )}

        {/* Designer Mode Unlock Trigger */}
        {mode === '3d' && isDesignerAuthorized && onToggleDesignerMode && (
          <button
            id="btn-designer-mode-toggle"
            type="button"
            className={`header-btn ${isDesignerMode ? 'designer-active' : ''}`}
            onClick={onToggleDesignerMode}
            title={isDesignerMode ? 'Designer Mode Active' : 'Switch to Designer Mode'}
          >
            <span className="symbol-icon">{isDesignerMode ? '🔓' : '🔒'}</span>
            <span style={{ fontSize: '11px' }}>{isDesignerMode ? 'Calibrating' : 'Locked'}</span>
          </button>
        )}

        {/* Export Button */}
        <button id="btn-export-modal" type="button" className="header-btn btn-export" onClick={onOpenExport} title="Export Mockup">
          <span className="symbol-icon">⤓</span>
          <span>Export</span>
        </button>

        {/* Add to Bag (High-Contrast Primary Action) */}
        {onOpenAddToCart && (
          <button
            id="btn-add-to-cart"
            type="button"
            className="header-btn btn-add-to-cart"
            onClick={onOpenAddToCart}
            title="Review & Add to Bag"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span className="cart-text-full">
              Add to Bag {typeof price === 'number' && price > 0 ? `· ₹${price.toLocaleString('en-IN')}` : ''}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};
