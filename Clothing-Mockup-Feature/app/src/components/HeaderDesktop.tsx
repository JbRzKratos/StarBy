import React from 'react';

export interface HeaderProps {
  templateName: string;
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
  isAddingToCart?: boolean;
}

export const HeaderDesktop: React.FC<HeaderProps> = ({
  templateName,
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
  isAddingToCart = false,
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
                  background: 'var(--accent, #3B5EFF)',
                  color: '#fff',
                  fontSize: '9.5px',
                  padding: '1px 7px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                3D STUDIO
              </span>
            </div>
            <div className="brand-template-name" style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
              {templateName}
            </div>
          </div>
        </a>
      </div>

      {/* ── Right: Tool Actions & Primary CTA ── */}
      <div className="header-actions">
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
        {onOpenInstructions && (
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
        {isDesignerAuthorized && onToggleDesignerMode && (
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
            disabled={isAddingToCart}
            title={isAddingToCart ? 'Adding to Shopping Bag...' : 'Review & Add to Bag'}
            style={isAddingToCart ? { opacity: 0.75, cursor: 'wait' } : undefined}
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
              className={`shrink-0 ${isAddingToCart ? 'animate-spin' : ''}`}
            >
              {isAddingToCart ? (
                <>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </>
              ) : (
                <>
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </>
              )}
            </svg>
            <span className="cart-text-full">
              {isAddingToCart
                ? 'Adding to Bag...'
                : `Add to Bag ${typeof price === 'number' && price > 0 ? `· ₹${price.toLocaleString('en-IN')}` : ''}`}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};
