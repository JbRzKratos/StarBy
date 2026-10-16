import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Check,
  ArrowLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  CURATED_CLOTHING_DESIGNS,
  CLOTHING_DESIGN_CATEGORIES,
  type CuratedClothingDesign,
  type ClothingDesignArtwork,
} from '../data/clothingDesignsData';

export const CATEGORY_SYMBOLS: Record<string, string> = {
  all: '❖',
  anime: '⚡',
  marvel: '🛡️',
  automotive: '🏎️',
  gaming: '🎮',
  streetwear: '🛹',
  typography: '🔤',
  'indian-cinema': '🎬',
  humor: '🎭',
  aesthetic: '✦',
};

export interface ApplyDesignEvent {
  design: CuratedClothingDesign;
  artwork: ClothingDesignArtwork;
  targetPlacement: string; // 'front-center' | 'left-chest' | 'back-center' | 'left-sleeve' | etc.
  targetSide: 'front' | 'back';
}

interface ClothingDesignsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: '2d' | '3d';
  onApplyDesign2D?: (event: ApplyDesignEvent) => Promise<void> | void;
  onApplyDesign3D?: (event: ApplyDesignEvent) => Promise<void> | void;
  onApplyAllArtworks2D?: (design: CuratedClothingDesign) => Promise<void> | void;
  onApplyAllArtworks3D?: (design: CuratedClothingDesign) => Promise<void> | void;
}

export const ClothingDesignsDrawer: React.FC<ClothingDesignsDrawerProps> = ({
  isOpen,
  onClose,
  mode,
  onApplyDesign2D,
  onApplyDesign3D,
  onApplyAllArtworks2D,
  onApplyAllArtworks3D,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeDesign, setActiveDesign] = useState<CuratedClothingDesign | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [appliedDesignId, setAppliedDesignId] = useState<string | null>(null);
  const [appliedArtId, setAppliedArtId] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (activeDesign) {
          setActiveDesign(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeDesign, onClose]);

  // Filtered designs
  const filteredDesigns = useMemo(() => {
    let list = CURATED_CLOTHING_DESIGNS;

    if (selectedCategory !== 'all') {
      list = list.filter((d) => d.themeCategory === selectedCategory || d.tags.includes(selectedCategory));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q) ||
          d.folder.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)) ||
          d.artworks.some((a) => a.name.toLowerCase().includes(q))
      );
    }

    return list;
  }, [selectedCategory, searchQuery]);

  const handleApplyArtwork = async (
    design: CuratedClothingDesign,
    artwork: ClothingDesignArtwork,
    placement?: string
  ) => {
    const finalPlacement = placement || artwork.suggestedPlacement || 'front-center';
    const isBack = finalPlacement.includes('back');
    const targetSide: 'front' | 'back' = isBack ? 'back' : 'front';

    const event: ApplyDesignEvent = {
      design,
      artwork,
      targetPlacement: finalPlacement,
      targetSide,
    };

    if (mode === '2d' && onApplyDesign2D) {
      await onApplyDesign2D(event);
      setFeedbackMessage(`✓ Placed "${artwork.name}" on ${targetSide.toUpperCase()} view!`);
    } else if (mode === '3d' && onApplyDesign3D) {
      await onApplyDesign3D(event);
      setFeedbackMessage(`✓ Placed "${artwork.name}" on 3D garment!`);
    }

    setAppliedArtId(`${artwork.id}-${finalPlacement}`);
    setTimeout(() => {
      setAppliedArtId((curr) => (curr === `${artwork.id}-${finalPlacement}` ? null : curr));
    }, 2000);

    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);

    // Auto close drawer so user can immediately view their selected design in 3D
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleApplyAllArtworks = async (design: CuratedClothingDesign) => {
    if (mode === '3d' && onApplyAllArtworks3D) {
      await onApplyAllArtworks3D(design);
      setFeedbackMessage(`✓ Applied "${design.name}" complete set (Front, Back & Sleeves) on 3D garment!`);
    } else if (mode === '2d' && onApplyAllArtworks2D) {
      await onApplyAllArtworks2D(design);
      setFeedbackMessage(`✓ Applied "${design.name}" all artworks to 2D editor!`);
    }

    setAppliedDesignId(design.id);
    setTimeout(() => {
      setAppliedDesignId((curr) => (curr === design.id ? null : curr));
    }, 2200);

    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);

    // Auto close drawer so user can immediately view their selected design in 3D
    setTimeout(() => {
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ── Backdrop Overlay (Click canvas to close) ── */}
      <div
        className="clothing-drawer-backdrop"
        onClick={onClose}
        title="Click canvas to close library"
        aria-hidden="true"
      />

      {/* ── Main Sidebar Drawer ── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="StarBy Graphic Library"
        className="clothing-designs-drawer"
      >
        {/* ── Header ── */}
        <div className="clothing-drawer-header">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10a2 2 0 002 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
                  <circle cx="12" cy="13" r="2.5" fill="currentColor" fillOpacity="0.4" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold tracking-wide text-white">
                    StarBy Graphic Library
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                    {CURATED_CLOTHING_DESIGNS.length} Designs
                  </span>
                </div>
                <p className="text-[11px] text-white/50 leading-tight mt-0.5">
                  Official apparel collections calibrated for 360° Studio
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Close library (Esc)"
              aria-label="Close library"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by anime, character, automotive, streetwear, quotes..."
              className="clothing-drawer-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="clothing-drawer-categories">
            {CLOTHING_DESIGN_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const count =
                cat.id === 'all'
                  ? CURATED_CLOTHING_DESIGNS.length
                  : CURATED_CLOTHING_DESIGNS.filter(
                      (d) => d.themeCategory === cat.id || d.tags.includes(cat.id)
                    ).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setActiveDesign(null);
                  }}
                  className={`clothing-drawer-cat-btn ${isActive ? 'active' : ''}`}
                >
                  <span className="text-[11px] opacity-90">{CATEGORY_SYMBOLS[cat.id] || '❖'}</span>
                  <span>{cat.label}</span>
                  <span className="text-[9.5px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Feedback Toast ── */}
        {feedbackMessage && (
          <div className="clothing-drawer-toast">
            <Check size={14} className="text-emerald-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* ── Content View Area ── */}
        <div className="clothing-drawer-body hide-scrollbar">
          {activeDesign ? (
            /* ── DETAIL BREAKDOWN VIEW (When a design is opened) ── */
            <div className="clothing-drawer-detail-view">
              <button
                type="button"
                onClick={() => setActiveDesign(null)}
                className="clothing-drawer-back-btn"
              >
                <ArrowLeft size={13} />
                <span>Back to Graphic Library</span>
              </button>

              {/* Design Hero Card */}
              <div className="clothing-detail-hero-card">
                <div className="clothing-detail-hero-thumb">
                  <img
                    src={activeDesign.previewUrl}
                    alt={activeDesign.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold uppercase tracking-wider border border-sky-500/30">
                      {activeDesign.themeCategory}
                    </span>
                    <span className="text-[10px] text-indigo-300 font-mono bg-indigo-500/15 border border-indigo-500/25 px-2 py-0.5 rounded">
                      {activeDesign.artworks.length} {activeDesign.artworks.length === 1 ? 'Artwork' : 'Artworks'} Set
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1.5 truncate">{activeDesign.name}</h3>
                  <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
                    {activeDesign.artworks.map((a) => a.name).join(' • ')}
                  </p>
                </div>
              </div>

              {/* Primary "Apply Complete Design" Action Button */}
              <button
                type="button"
                onClick={() => handleApplyAllArtworks(activeDesign)}
                className={`clothing-detail-apply-all-btn ${appliedDesignId === activeDesign.id ? 'applied' : ''}`}
              >
                {appliedDesignId === activeDesign.id ? (
                  <>
                    <Check size={16} />
                    <span>Applied Complete Set to 3D Garment!</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10a2 2 0 002 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
                      <circle cx="12" cy="13" r="2.5" fill="currentColor" fillOpacity="0.8" />
                    </svg>
                    <span>
                      Apply Complete Set ({activeDesign.artworks.length > 1 ? 'Front & Back' : 'Single Placement'})
                    </span>
                  </>
                )}
              </button>

              {/* Studio Adjustment Helper Card */}
              <div
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '12px',
                  padding: '11px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                <p style={{ margin: 0, fontSize: '11px', lineHeight: '1.45', color: 'rgba(255, 255, 255, 0.75)' }}>
                  Artworks are pre-calibrated for Front Chest, Full Back & Sleeves. You can apply the full set above, or place individual pieces below.
                </p>
              </div>

              {/* Individual Artworks List */}
              <div className="flex flex-col gap-2.5 mt-1">
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-white/50 px-1">
                  Individual Artworks in this Set ({activeDesign.artworks.length})
                </h4>

                {activeDesign.artworks.map((art) => {
                  const target = art.suggestedPlacement || 'front-center';
                  const isBack = target.includes('back');
                  const isSleeve = target.includes('sleeve');
                  const placementBadge = isBack ? 'Back Placement' : isSleeve ? 'Sleeve Graphic' : 'Front Placement';
                  const actionTarget = isBack ? 'Back' : isSleeve ? 'Sleeve' : 'Front';
                  const artActionKey = `${art.id}-${target}`;
                  const isArtApplied = appliedArtId === artActionKey;

                  return (
                    <div
                      key={art.id}
                      className="clothing-detail-art-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="clothing-detail-art-thumb">
                          <img
                            src={art.previewUrl}
                            alt={art.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                              display: 'block',
                            }}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-semibold text-white truncate">{art.name}</h5>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span
                              style={{
                                fontSize: '9px',
                                fontFamily: 'monospace',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: isBack ? 'rgba(56, 189, 248, 0.15)' : isSleeve ? 'rgba(168, 85, 247, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                color: isBack ? '#38bdf8' : isSleeve ? '#c084fc' : '#34d399',
                                border: `1px solid ${isBack ? 'rgba(56, 189, 248, 0.3)' : isSleeve ? 'rgba(168, 85, 247, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                                fontWeight: 700,
                              }}
                            >
                              {placementBadge}
                            </span>
                            {art.colorHint !== 'any' && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                                Best on {art.colorHint}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Row for Individual Artwork */}
                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        {/* Primary default placement button */}
                        <button
                          type="button"
                          onClick={() => handleApplyArtwork(activeDesign, art, target)}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: isArtApplied
                              ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                              : isBack
                              ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                              : isSleeve
                              ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
                              : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isArtApplied ? (
                            <>
                              <Check size={12} />
                              <span>Placed on {actionTarget}!</span>
                            </>
                          ) : (
                            <>
                              <span className="text-xs">
                                {isBack ? '👕' : isSleeve ? '🦾' : '🎽'}
                              </span>
                              <span>Apply to {actionTarget}</span>
                            </>
                          )}
                        </button>

                        {/* Optional alternate side override */}
                        {isBack ? (
                          <button
                            type="button"
                            onClick={() => handleApplyArtwork(activeDesign, art, 'front-center')}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: 'rgba(255, 255, 255, 0.8)',
                              fontSize: '10.5px',
                              fontWeight: 600,
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              cursor: 'pointer',
                            }}
                            title="Place this graphic on Front instead"
                          >
                            + Put on Front
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApplyArtwork(activeDesign, art, 'back-center')}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: 'rgba(255, 255, 255, 0.8)',
                              fontSize: '10.5px',
                              fontWeight: 600,
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              cursor: 'pointer',
                            }}
                            title="Place this graphic on Back instead"
                          >
                            + Put on Back
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── GRID CATALOG VIEW ── */
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between text-[11px] text-white/50 mb-3 px-1 font-mono">
                <span>
                  Showing {filteredDesigns.length} of {CURATED_CLOTHING_DESIGNS.length} Designs
                </span>
                {selectedCategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="text-indigo-400 hover:text-indigo-300 hover:underline font-semibold"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {filteredDesigns.length > 0 ? (
                <div className="clothing-drawer-grid">
                  {filteredDesigns.map((design) => {
                    const artCount = design.artworks.length;
                    const isApplied = appliedDesignId === design.id;

                    return (
                      <div
                        key={design.id}
                        className="clothing-design-grid-card group"
                        onClick={() => setActiveDesign(design)}
                      >
                        {/* Artwork Thumbnail Container */}
                        <div className="clothing-design-thumb-wrap">
                          <img
                            src={design.previewUrl}
                            alt={design.name}
                            loading="lazy"
                            className="clothing-design-thumb-img"
                            style={{
                              width: '100%',
                              height: '100%',
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                            }}
                          />
                          <span className="clothing-design-cat-badge">
                            <span className="opacity-90">{CATEGORY_SYMBOLS[design.themeCategory] || '❖'}</span>
                            <span>{design.themeCategory}</span>
                          </span>
                          <span className="clothing-design-arts-badge">
                            <span className="opacity-70">⊞</span> {artCount} {artCount === 1 ? 'Artwork' : 'Artworks'}
                          </span>
                        </div>

                        {/* Title & Included Art Summary */}
                        <div className="p-2.5 flex flex-col gap-0.5 flex-1">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                            {design.name}
                          </h4>
                          <span className="text-[10px] text-white/40 truncate font-mono">
                            {design.artworks.map((a) => a.name).join(' • ')}
                          </span>
                        </div>

                        {/* Card Actions (Proper, high-quality, fully functioning buttons) */}
                        <div className="clothing-design-card-actions">
                          {/* 1-Tap Complete Set Placement Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyAllArtworks(design);
                            }}
                            className={`clothing-design-apply-btn ${isApplied ? 'applied' : ''}`}
                            title={`Apply full ${design.name} configuration`}
                          >
                            {isApplied ? (
                              <>
                                <Check size={13} />
                                <span>Applied!</span>
                              </>
                            ) : (
                              <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                  <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10a2 2 0 002 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
                                  <circle cx="12" cy="13" r="2.5" fill="currentColor" fillOpacity="0.8" />
                                </svg>
                                <span>Apply Design</span>
                              </>
                            )}
                          </button>

                          {/* Detail View Trigger */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDesign(design);
                            }}
                            className="clothing-design-view-btn"
                            title="Inspect individual artworks and customize placement"
                          >
                            <span>View Artworks ({artCount})</span>
                            <ChevronRight size={12} className="opacity-60" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
                  <p className="text-sm text-white/70">No designs match your search.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="text-xs text-indigo-400 underline mt-1"
                  >
                    Clear search filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Drawer Footer ── */}
        <div className="clothing-drawer-footer">
          <span className="flex items-center gap-1.5 font-medium text-[11px] text-white/70">
            <span className="text-emerald-400 text-sm">🏷️</span>
            <span>StarBy Official Collections</span>
          </span>
          <span className="font-mono text-[10px] text-sky-400/90 flex items-center gap-1.5 font-semibold">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 11-9-9c2.52 0 4.8 1.03 6.45 2.7L21 8" />
              <polyline points="21 3 21 8 16 8" />
            </svg>
            <span>360° Studio Ready</span>
          </span>
        </div>
      </aside>
    </>
  );
};
