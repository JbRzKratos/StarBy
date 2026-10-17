import React from 'react';
import type { HeaderProps } from './HeaderDesktop';

export const HeaderMobile: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  onOpenExport,
  onOpenAddToCart,
  onOpenDesignSetup,
  onOpenInstructions,
  hasLoadedDesign,
  isDesignerAuthorized = false,
  isDesignerMode = false,
  onToggleDesignerMode,
  price,
}) => {
  return (
    <header className="app-header header-mobile" aria-label="Mobile Navigation Header">
      {/* ── Left Side: Back Arrow, Brand & 2D/3D Mode Pill ── */}
      <div className="mobile-header-left">
        {/* Back to Shop */}
        <a
          href="/products/all"
          target="_top"
          className="mobile-header-back-btn"
          title="Return to Shop Catalog"
          aria-label="Return to Shop"
        >
          <span className="symbol-icon">←</span>
        </a>

        {/* Brand Link with Official Logo */}
        <a
          href="/"
          target="_top"
          className="mobile-header-brand"
          title="Return to Home"
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >
          <img
            src="/images/fregoro-logo.png"
            alt="StarBy Logo"
            style={{
              height: '22px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
              display: 'block',
            }}
          />
        </a>

        {/* Compact Mode Pill (2D / 3D) */}
        <div className="mobile-mode-switcher" role="tablist" aria-label="Editor Mode">
          <button
            type="button"
            id="mobile-btn-mode-2d"
            className={`mobile-mode-btn ${mode === '2d' ? 'active' : ''}`}
            onClick={() => onModeChange('2d')}
            role="tab"
            aria-selected={mode === '2d'}
          >
            2D
          </button>
          <button
            type="button"
            id="mobile-btn-mode-3d"
            className={`mobile-mode-btn ${mode === '3d' ? 'active' : ''}`}
            onClick={() => onModeChange('3d')}
            role="tab"
            aria-selected={mode === '3d'}
          >
            3D
          </button>
        </div>
      </div>

      {/* ── Right Side: Action Icons & Prominent Add to Bag ── */}
      <div className="mobile-header-right">
        {/* 3D Placement & Studio Guide button */}
        {mode === '3d' && onOpenInstructions && (
          <button
            type="button"
            id="mobile-btn-3d-instructions"
            className="mobile-icon-btn guide-btn"
            onClick={onOpenInstructions}
            title="Help & Studio Guide"
            aria-label="Help & Studio Guide"
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
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </button>
        )}

        {/* Setup Graphic button (only for authorized designers in designer mode) */}
        {onOpenDesignSetup && hasLoadedDesign && isDesignerAuthorized && isDesignerMode && (
          <button
            type="button"
            id="mobile-btn-design-setup"
            className="mobile-icon-btn setup-btn"
            onClick={onOpenDesignSetup}
            title="Configure graphic placement"
            aria-label="Setup Graphic"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="21" x2="4" y2="14"></line>
              <line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line>
              <line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="1" y1="14" x2="7" y2="14"></line>
              <line x1="9" y1="8" x2="15" y2="8"></line>
              <line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
          </button>
        )}

        {/* Designer Mode icon button on Mobile */}
        {mode === '3d' && isDesignerAuthorized && onToggleDesignerMode && (
          <button
            type="button"
            id="mobile-btn-designer-mode"
            className="mobile-icon-btn"
            onClick={onToggleDesignerMode}
            style={{
              background: isDesignerMode ? 'rgba(139, 92, 246, 0.35)' : 'rgba(255, 255, 255, 0.08)',
              border: isDesignerMode ? '1px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.15)',
              color: isDesignerMode ? '#c4b5fd' : '#ffffff',
            }}
            title={isDesignerMode ? 'Designer Mode ON' : 'Customer View'}
            aria-label="Toggle Designer Mode"
          >
            <span style={{ fontSize: '12px' }}>{isDesignerMode ? '🔓' : '🔒'}</span>
          </button>
        )}

        {/* Export / Download button */}
        <button
          type="button"
          id="mobile-btn-export"
          className="mobile-icon-btn export-btn"
          onClick={onOpenExport}
          title={mode === '3d' ? 'Download / Export 3D Render' : 'Export Mockup'}
          aria-label="Download / Export"
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
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>

        {/* Add to Bag — Always visible, prominent call-to-action */}
        {onOpenAddToCart && (
          <button
            type="button"
            id="mobile-btn-add-to-cart"
            className="mobile-add-to-cart-btn"
            onClick={onOpenAddToCart}
            title="Add Mockup to Shopping Bag"
            aria-label="Add to Bag"
          >
            <svg
              width="14"
              height="14"
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
            <span style={{ fontWeight: 700, letterSpacing: '0.02em' }}>
              {typeof price === 'number' && price > 0 ? `Add · ₹${price}` : 'Add to Bag'}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};
