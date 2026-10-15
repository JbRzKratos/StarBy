import React from 'react';
import {
  ArrowLeft,
  Download,
  Shirt,
  ShoppingBag,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import type { HeaderProps } from './HeaderDesktop';

export const HeaderMobile: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  onOpenExport,
  onOpenAddToCart,
  onOpenDesignSetup,
  onOpenInstructions,
  hasLoadedDesign,
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
          <ArrowLeft size={16} />
        </a>

        {/* Brand Link */}
        <a
          href="/"
          target="_top"
          className="mobile-header-brand"
          title="StarBy / Fregoro Studio Home"
        >
          <div className="mobile-brand-icon">
            <Shirt size={14} />
          </div>
          <span className="mobile-brand-name">Fregoro</span>
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
            title="3D Placement Notice & Studio Guide"
            aria-label="3D Studio Guide"
          >
            <HelpCircle size={15} />
          </button>
        )}

        {/* Setup Graphic button if design is active */}
        {onOpenDesignSetup && hasLoadedDesign && (
          <button
            type="button"
            id="mobile-btn-design-setup"
            className="mobile-icon-btn setup-btn"
            onClick={onOpenDesignSetup}
            title="Configure graphic placement and apparel questions"
            aria-label="Setup Graphic"
          >
            <Sparkles size={14} />
          </button>
        )}

        {/* Export Modal button */}
        <button
          type="button"
          id="mobile-btn-export"
          className="mobile-icon-btn export-btn"
          onClick={onOpenExport}
          title={mode === '3d' ? 'Export 3D Render' : 'Export Mockup'}
          aria-label="Export"
        >
          <Download size={15} />
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
            <ShoppingBag size={14} />
            <span>Bag</span>
          </button>
        )}
      </div>
    </header>
  );
};
