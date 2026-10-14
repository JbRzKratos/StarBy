import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Sparkles,
  Check,
  ArrowLeft,
  Shirt,
} from 'lucide-react';
import {
  CURATED_CLOTHING_DESIGNS,
  CLOTHING_DESIGN_CATEGORIES,
  type CuratedClothingDesign,
  type ClothingDesignArtwork,
} from '../data/clothingDesignsData';

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
  onApplyDesign2D?: (event: ApplyDesignEvent) => void;
  onApplyDesign3D?: (event: ApplyDesignEvent) => void;
  onApplyAllArtworks2D?: (design: CuratedClothingDesign) => void;
  onApplyAllArtworks3D?: (design: CuratedClothingDesign) => void;
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

  const handleApplyArtwork = (
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
      onApplyDesign2D(event);
      setFeedbackMessage(`✓ Placed "${artwork.name}" on ${targetSide.toUpperCase()} view!`);
    } else if (mode === '3d' && onApplyDesign3D) {
      onApplyDesign3D(event);
      setFeedbackMessage(`✓ Placed "${artwork.name}" on 3D garment!`);
    }

    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  const handleApplyAllArtworks = (design: CuratedClothingDesign) => {
    if (mode === '3d' && onApplyAllArtworks3D) {
      onApplyAllArtworks3D(design);
      setFeedbackMessage(`✓ Placed all ${design.artworks.length} artworks (Front & Back) on 3D garment!`);
    } else if (mode === '2d' && onApplyAllArtworks2D) {
      onApplyAllArtworks2D(design);
      setFeedbackMessage(`✓ Placed all ${design.artworks.length} artworks on 2D editor!`);
    }

    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ── Backdrop Overlay (Click to close) ── */}
      <div
        className="clothing-drawer-backdrop"
        onClick={onClose}
        title="Click canvas to close library"
        aria-hidden="true"
      />

      {/* ── Main Sidebar Drawer (Docked inside canvas, never overlaps topbar) ── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="StarBy Graphic Library"
        className="clothing-designs-drawer animate-slide-in"
      >
        {/* Desktop Quick Tab Close Button */}
        <button
          type="button"
          onClick={onClose}
          title="Close sidebar (Esc)"
          className="clothing-drawer-edge-close"
        >
          <X size={16} />
        </button>

        {/* ── Header ── */}
        <div className="clothing-drawer-header">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                StarBy Graphic Library
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                {CURATED_CLOTHING_DESIGNS.length} Designs
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-[11px] text-white/50 leading-relaxed mt-1">
            Browse official designs across Anime, Cars, Streetwear, Marvel &amp; Quotes. Click any design to apply to your garment in {mode.toUpperCase()} mode.
          </p>

          {/* Search Input */}
          <div className="relative mt-2">
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
          <div className="clothing-drawer-categories hide-scrollbar">
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
                  <span>{cat.label}</span>
                  <span className="text-[9px] opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Feedback Toast ── */}
        {feedbackMessage && (
          <div className="clothing-drawer-toast animate-fade-in">
            <Check size={14} className="text-emerald-400" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* ── Content View Area ── */}
        <div className="clothing-drawer-body hide-scrollbar">
          {activeDesign ? (
            /* ── DETAIL VIEW (When a design is clicked) ── */
            <div className="p-4 flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setActiveDesign(null)}
                className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors self-start"
              >
                <ArrowLeft size={14} />
                <span>Back to Catalog</span>
              </button>

              <div className="flex gap-4 items-start bg-white/[0.03] border border-white/10 rounded-xl p-3.5">
                <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center p-1.5">
                  <img
                    src={activeDesign.previewUrl}
                    alt={activeDesign.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold uppercase tracking-wider">
                      {activeDesign.themeCategory}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">
                      {activeDesign.artworks.length} {activeDesign.artworks.length === 1 ? 'Artwork' : 'Artworks'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1 truncate">{activeDesign.name}</h3>
                  <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
                    {activeDesign.description}
                  </p>
                </div>
              </div>

              {/* Prominent Multi-Artwork "Place All Artworks" Button */}
              {activeDesign.artworks.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleApplyAllArtworks(activeDesign)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #3B5EFF 0%, #10b981 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(59, 94, 255, 0.4)',
                    transition: 'transform 0.15s ease, filter 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1.0)')}
                >
                  <Sparkles size={14} />
                  <span>Place All {activeDesign.artworks.length} Artworks (Front &amp; Back)</span>
                </button>
              )}

              {/* Warning & 3D Adjustment Instructions Banner */}
              <div
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.85)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>
                  <span>⚠️</span>
                  <span>Placement Notice &amp; 3D Adjustment</span>
                </div>
                <p style={{ margin: 0, fontSize: '10.5px', lineHeight: '1.45', color: 'rgba(255, 255, 255, 0.8)' }}>
                  Automated placement is an initial alignment. Because graphic shapes and apparel cuts differ, you may want to fine-tune the placement directly in the 3D Studio:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '10px', color: 'rgba(255, 255, 255, 0.65)', paddingLeft: '4px' }}>
                  <div>• <strong>Click on the graphic</strong> on the 3D shirt to select it</div>
                  <div>• <strong>Drag</strong> to move it anywhere across chest, back, or sleeves</div>
                  <div>• <strong>Drag corner handles</strong> to scale up or down</div>
                  <div>• <strong>Drag top circular handle</strong> to rotate</div>
                  <div>• Switch views using <strong>Front / Back / 3/4 View</strong> buttons above</div>
                </div>
              </div>

              {/* Artworks List */}
              <div className="flex flex-col gap-2.5">
                <h4 className="text-[11px] font-mono uppercase tracking-widest text-white/60">
                  Or Place Individual Artworks ({activeDesign.artworks.length})
                </h4>

                {activeDesign.artworks.map((art) => {
                  const isBack = art.suggestedPlacement.includes('back');
                  const isSleeve = art.suggestedPlacement.includes('sleeve');
                  const placementLabel = isBack ? 'Back Placement' : isSleeve ? 'Sleeve Placement' : 'Front Placement';

                  return (
                    <div
                      key={art.id}
                      className="bg-[#14161C] border border-white/10 hover:border-white/25 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 shrink-0 rounded-lg bg-black/80 border border-white/10 p-1 flex items-center justify-center">
                          <img
                            src={art.previewUrl}
                            alt={art.name}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="min-w-0">
                          <h5 className="text-xs font-semibold text-white truncate">{art.name}</h5>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                              {placementLabel}
                            </span>
                            {art.colorHint !== 'any' && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                                Best on {art.colorHint}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleApplyArtwork(activeDesign, art, 'front-center')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-500/40 text-[11px] font-mono font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95"
                          title="Place this graphic on the FRONT of the garment"
                        >
                          <Sparkles size={11} />
                          <span>+ Front</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyArtwork(activeDesign, art, 'back-center')}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500/40 text-[11px] font-mono font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95"
                          title="Place this graphic on the BACK of the garment"
                        >
                          <Sparkles size={11} />
                          <span>+ Back</span>
                        </button>
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
                    className="text-[#3B5EFF] hover:underline"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {filteredDesigns.length > 0 ? (
                <div className="clothing-drawer-grid">
                  {filteredDesigns.map((design) => {
                    const artCount = design.artworks.length;
                    return (
                      <div
                        key={design.id}
                        onClick={() => setActiveDesign(design)}
                        className="clothing-design-grid-card group"
                      >
                        <div className="clothing-design-thumb-wrap">
                          <img
                            src={design.previewUrl}
                            alt={design.name}
                            loading="lazy"
                            className="clothing-design-thumb-img"
                          />
                          <span className="clothing-design-cat-badge">
                            {design.themeCategory}
                          </span>
                          <span className="clothing-design-arts-badge">
                            {artCount} {artCount === 1 ? 'Art' : 'Arts'}
                          </span>
                        </div>

                        <div className="p-2.5 flex flex-col gap-0.5">
                          <h4 className="text-xs font-semibold text-white truncate group-hover:text-[#3B5EFF] transition-colors">
                            {design.name}
                          </h4>
                          <span className="text-[10px] text-white/40 truncate font-mono">
                            {design.artworks.map((a) => a.name).join(' • ')}
                          </span>
                        </div>

                        {/* Customer 1-tap placement buttons */}
                        <div className="px-2 pb-2 pt-0 flex items-center gap-1 border-t border-white/5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyArtwork(design, design.artworks[0], 'front-center');
                            }}
                            className="flex-1 py-1 px-1 rounded bg-white/5 hover:bg-emerald-500 hover:text-black text-white/80 text-[10px] font-mono font-semibold text-center transition-all"
                            title="Place directly on Front"
                          >
                            + Front
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyArtwork(design, design.artworks[0], 'back-center');
                            }}
                            className="flex-1 py-1 px-1 rounded bg-white/5 hover:bg-cyan-500 hover:text-black text-white/80 text-[10px] font-mono font-semibold text-center transition-all"
                            title="Place directly on Back"
                          >
                            + Back
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
                    className="text-xs text-[#3B5EFF] underline mt-1"
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
          <div className="flex items-center justify-between text-[11px] text-white/60">
            <span className="flex items-center gap-1.5">
              <Shirt size={13} className="text-emerald-400" />
              <span>Compatible with Tees & Hoodies</span>
            </span>
            <span className="font-mono text-[10px] text-white/40">Fregoro Studios</span>
          </div>
        </div>
      </aside>
    </>
  );
};
