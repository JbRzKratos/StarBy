import React from 'react';
import {
  ArrowLeft,
  Download,
  RotateCcw,
  RotateCw,
  Shirt,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FolderOpen,
  Save,
  ShoppingBag,
  Sparkles,
  HelpCircle,
  Lock,
  Unlock,
} from 'lucide-react';
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
  onSaveProject,
  onLoadProject,
  onCameraPreset3D,
  onOpenAddToCart,
  onOpenDesignsLibrary,
  onOpenDesignSetup,
  onOpenInstructions,
  hasLoadedDesign,
  isDesignerAuthorized = false,
  isDesignerMode = false,
  onToggleDesignerMode,
}) => {
  return (
    <header className="app-header header-desktop">
      {/* Brand & Studio Mode Switcher */}
      <div className="brand-section">
        {/* Back to Shop Link */}
        <a
          href="/products/all"
          target="_top"
          className="header-btn header-back-btn"
          title="Return to Shop Catalog"
        >
          <ArrowLeft size={15} />
          <span className="back-text">Shop</span>
        </a>

        <a
          href="/"
          target="_top"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <div className="brand-logo">
            <Shirt size={18} />
          </div>
          <div className="brand-info">
            <div className="brand-title">
              Fregoro
              <span
                className="brand-badge"
                style={{
                  background: mode === '3d' ? '#3B5EFF' : undefined,
                  color: mode === '3d' ? '#fff' : undefined,
                }}
              >
                {mode === '3d' ? '3D' : '2D'}
              </span>
            </div>
            <div className="brand-template-name">
              {templateName}
            </div>
          </div>
        </a>

        {/* 2D / 3D Mode Toggle */}
        <div className="mode-toggle-group">
          <button
            id="btn-mode-2d"
            className={`mode-toggle-btn ${mode === '2d' ? 'active' : ''}`}
            onClick={() => onModeChange('2d')}
          >
            <span className="mode-text-full">2D Editor</span>
            <span className="mode-text-mobile">2D</span>
          </button>
          <button
            id="btn-mode-3d"
            className={`mode-toggle-btn ${mode === '3d' ? 'active' : ''}`}
            onClick={() => onModeChange('3d')}
          >
            <span className="mode-text-full">3D Studio</span>
            <span className="mode-text-mobile">3D</span>
          </button>
        </div>
      </div>

      {/* Middle Views Control */}
      {mode === '2d' ? (
        <div className="side-switcher desktop-only-preset-bar">
          <button
            id="btn-switch-front"
            className={`side-btn ${activeSide === 'front' ? 'active' : ''}`}
            onClick={() => onSideChange('front')}
          >
            <span className="side-text-full">Front View</span>
            {frontLayerCount > 0 && <span className="side-layer-count">{frontLayerCount}</span>}
          </button>
          <button
            id="btn-switch-back"
            className={`side-btn ${activeSide === 'back' ? 'active' : ''}`}
            onClick={() => onSideChange('back')}
          >
            <span className="side-text-full">Back View</span>
            {backLayerCount > 0 && <span className="side-layer-count">{backLayerCount}</span>}
          </button>
        </div>
      ) : (
        <div className="side-switcher desktop-only-preset-bar">
          <button
            className="side-btn"
            onClick={() => onCameraPreset3D && onCameraPreset3D('front')}
          >
            Front
          </button>
          <button
            className="side-btn"
            onClick={() => onCameraPreset3D && onCameraPreset3D('back')}
          >
            Back
          </button>
          <button
            className="side-btn"
            onClick={() => onCameraPreset3D && onCameraPreset3D('threeQuarter')}
          >
            3/4 View
          </button>
        </div>
      )}

      {/* History, Zoom & Actions */}
      <div className="header-actions">
        {mode === '2d' && (
          <>
            {/* Undo / Redo */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                id="btn-undo"
                className="header-btn"
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw size={15} />
              </button>
              <button
                id="btn-redo"
                className="header-btn"
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
              >
                <RotateCw size={15} />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="desktop-only-zoom" style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--bg-card)', padding: '2px 4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <button className="viewport-btn" onClick={onZoomOut} title="Zoom Out">
                <ZoomOut size={14} />
              </button>
              <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '42px', textAlign: 'center' }}>
                {Math.round(zoom * 100)}%
              </span>
              <button className="viewport-btn" onClick={onZoomIn} title="Zoom In">
                <ZoomIn size={14} />
              </button>
              <button className="viewport-btn" onClick={onZoomFit} title="Fit to View">
                <Maximize2 size={13} />
              </button>
            </div>

            {/* Project Save / Load */}
            <button id="btn-save-project" className="header-btn desktop-only-btn" onClick={onSaveProject} title="Save Project locally">
              <Save size={15} />
              <span>Save</span>
            </button>
            <button id="btn-load-project" className="header-btn desktop-only-btn" onClick={onLoadProject} title="Load Project file">
              <FolderOpen size={15} />
              <span>Load</span>
            </button>
          </>
        )}

        {/* Design Setup Quick Button */}
        {onOpenDesignSetup && hasLoadedDesign && (
          <button
            id="btn-open-design-setup"
            type="button"
            className="header-btn"
            onClick={onOpenDesignSetup}
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(20, 22, 28, 0.8) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
            }}
            title="Configure graphic placement and apparel questions"
          >
            <Sparkles size={14} style={{ color: '#34d399' }} />
            <span>Setup Graphic</span>
          </button>
        )}

        {/* StarBy Graphic Library Quick Button */}
        {onOpenDesignsLibrary && (
          <button
            id="btn-open-designs-library"
            type="button"
            className="header-btn"
            onClick={onOpenDesignsLibrary}
            style={{
              background: 'linear-gradient(135deg, rgba(59, 94, 255, 0.25) 0%, rgba(20, 22, 28, 0.8) 100%)',
              border: '1px solid rgba(59, 94, 255, 0.45)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
            }}
            title="Browse StarBy Graphic Library (96 Designs)"
          >
            <Sparkles size={14} style={{ color: '#3B5EFF' }} />
            <span>Designs</span>
            <span
              style={{
                fontSize: '9px',
                fontFamily: 'monospace',
                background: '#3B5EFF',
                color: '#fff',
                padding: '2px 5px',
                borderRadius: '4px',
              }}
            >
              96
            </span>
          </button>
        )}

        {/* 3D Studio Guide & Instructions Button */}
        {mode === '3d' && onOpenInstructions && (
          <button
            id="btn-3d-instructions"
            type="button"
            className="header-btn"
            onClick={onOpenInstructions}
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
            }}
            title="3D Placement Warning & Studio Adjustment Guide"
          >
            <HelpCircle size={14} style={{ color: '#f59e0b' }} />
            <span>3D Guide</span>
          </button>
        )}

        {/* Designer Calibration Mode Toggle */}
        {mode === '3d' && isDesignerAuthorized && onToggleDesignerMode && (
          <button
            id="btn-designer-mode-toggle"
            type="button"
            className="header-btn"
            onClick={onToggleDesignerMode}
            style={{
              background: isDesignerMode
                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.35) 0%, rgba(88, 28, 135, 0.6) 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              border: isDesignerMode
                ? '1px solid #a78bfa'
                : '1px solid rgba(255, 255, 255, 0.15)',
              color: isDesignerMode ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              boxShadow: isDesignerMode ? '0 0 14px rgba(139, 92, 246, 0.45)' : 'none',
              transition: 'all 0.15s ease',
            }}
            title={
              isDesignerMode
                ? 'Designer Mode ON: Click to test Customer View (Locked)'
                : 'Click to enter Designer Mode to adjust and calibrate artwork placement on all garment cuts'
            }
          >
            {isDesignerMode ? (
              <Unlock size={14} style={{ color: '#c4b5fd' }} />
            ) : (
              <Lock size={14} style={{ color: 'rgba(255,255,255,0.6)' }} />
            )}
            <span>{isDesignerMode ? 'Designer Mode' : 'Customer View'}</span>
          </button>
        )}

        {/* Primary Export Button */}
        <button id="btn-export-modal" className="header-btn btn-export" onClick={onOpenExport}>
          <Download size={15} />
          <span>{mode === '3d' ? 'Export 3D' : 'Export Mockup'}</span>
        </button>

        {/* Add to Cart Button */}
        {onOpenAddToCart && (
          <button
            id="btn-add-to-cart"
            className="header-btn btn-add-to-cart"
            onClick={onOpenAddToCart}
            title="Review 3D Mockup & Add to Bag"
          >
            <ShoppingBag size={15} />
            <span className="cart-text-full">Add to Bag</span>
          </button>
        )}
      </div>
    </header>
  );
};
