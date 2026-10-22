import React, { useState, useMemo, useEffect } from 'react';
import {
  CURATED_CLOTHING_DESIGNS,
  CLOTHING_DESIGN_CATEGORIES,
  type CuratedClothingDesign,
  type ClothingDesignArtwork,
} from '../data/clothingDesignsData';

export const CATEGORY_SYMBOLS: Record<string, string> = {
  all: '✦',
  anime: '✧',
  marvel: '◆',
  automotive: '⚙',
  gaming: '⌗',
  streetwear: '▲',
  typography: 'Aa',
  'indian-cinema': '▶',
  humor: '☺',
  aesthetic: '✿',
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
  onApplyDesign3D?: (event: ApplyDesignEvent) => Promise<void> | void;
  onApplyAllArtworks3D?: (design: CuratedClothingDesign) => Promise<void> | void;
}

type PlacementKind = 'front' | 'back' | 'sleeve';

function getPlacementKind(target: string): PlacementKind {
  const t = (target || '').toLowerCase();
  if (t.includes('back')) return 'back';
  if (t.includes('sleeve')) return 'sleeve';
  return 'front';
}

const PLACEMENT_LABEL: Record<PlacementKind, string> = {
  front: 'Front',
  back: 'Back',
  sleeve: 'Sleeve',
};

export const ClothingDesignsDrawer: React.FC<ClothingDesignsDrawerProps> = ({
  isOpen,
  onClose,
  onApplyDesign3D,
  onApplyAllArtworks3D,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeDesign, setActiveDesign] = useState<CuratedClothingDesign | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [appliedDesignId, setAppliedDesignId] = useState<string | null>(null);
  const [appliedArtId, setAppliedArtId] = useState<string | null>(null);

  // Close on Escape key (first Escape leaves the detail view, second closes)
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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: CURATED_CLOTHING_DESIGNS.length };
    for (const cat of CLOTHING_DESIGN_CATEGORIES) {
      if (cat.id === 'all') continue;
      counts[cat.id] = CURATED_CLOTHING_DESIGNS.filter(
        (d) => d.themeCategory === cat.id || d.tags.includes(cat.id)
      ).length;
    }
    return counts;
  }, []);

  // Pre-warm the artwork bitmaps so clicks feel instant
  useEffect(() => {
    if (!activeDesign) return;
    activeDesign.artworks.forEach((art) => {
      const url = art.studioPreviewUrl || art.previewUrl;
      if (url) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
      }
    });
  }, [activeDesign]);

  // Pre-warm the first batch of designs when the drawer opens (both the grid
  // thumbnail and the full studio bitmap) so the first click feels instant.
  useEffect(() => {
    if (!isOpen) return;
    CURATED_CLOTHING_DESIGNS.slice(0, 12).forEach((d) => {
      const urls = [d.previewUrl, ...d.artworks.map((art) => art.studioPreviewUrl || art.previewUrl)];
      urls.forEach((url) => {
        if (!url) return;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
      });
    });
  }, [isOpen]);

  const flash = (message: string) => {
    setFeedbackMessage(message);
    window.setTimeout(() => setFeedbackMessage(null), 3200);
  };

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

    if (onApplyDesign3D) {
      await onApplyDesign3D(event);
      flash(`“${artwork.name}” placed on the ${PLACEMENT_LABEL[getPlacementKind(finalPlacement)].toLowerCase()}`);
    }

    const artKey = `${artwork.id}-${finalPlacement}`;
    setAppliedArtId(artKey);
    window.setTimeout(() => {
      setAppliedArtId((curr) => (curr === artKey ? null : curr));
    }, 1800);

    // On mobile close promptly so the user sees the garment; on desktop keep
    // the drawer open so different graphics can be tried quickly.
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      window.setTimeout(onClose, 120);
    }
  };

  const handleApplyAllArtworks = async (design: CuratedClothingDesign) => {
    if (onApplyAllArtworks3D) {
      await onApplyAllArtworks3D(design);
      flash(`“${design.name}” applied — ${design.artworks.length} artwork${design.artworks.length === 1 ? '' : 's'} placed`);
    }

    setAppliedDesignId(design.id);
    window.setTimeout(() => {
      setAppliedDesignId((curr) => (curr === design.id ? null : curr));
    }, 2000);

    // Close so the user immediately sees the applied design in the studio
    window.setTimeout(onClose, 160);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="clothing-drawer-backdrop"
        onClick={onClose}
        title="Click the canvas to close the library"
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Graphic Library"
        className="clothing-designs-drawer"
      >
        {/* ── Header ── */}
        <div className="library-header">
          <div className="library-header-row">
            <span className="library-logo" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10a2 2 0 002 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
                <circle cx="12" cy="13" r="2.4" fill="currentColor" fillOpacity="0.35" />
              </svg>
            </span>

            <div className="library-header-copy">
              <h2 className="library-title">Graphic Library</h2>
              <p className="library-subtitle">
                {CURATED_CLOTHING_DESIGNS.length} designs · studio-calibrated
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="library-icon-btn"
              title="Close library (Esc)"
              aria-label="Close library"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="library-search">
            <svg className="library-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.2-3.2" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search designs, characters, styles…"
              className="library-search-input"
              aria-label="Search designs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="library-search-clear"
                aria-label="Clear search"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Category filters */}
          <div className="library-filters" role="tablist" aria-label="Design categories">
            {CLOTHING_DESIGN_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] ?? 0;
              if (count === 0) return null;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setActiveDesign(null);
                  }}
                  className={`library-chip ${isActive ? 'is-active' : ''}`}
                >
                  <span className="library-chip-symbol">{CATEGORY_SYMBOLS[cat.id] || '✦'}</span>
                  <span>{cat.label}</span>
                  <span className="library-chip-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Toast ── */}
        {feedbackMessage && (
          <div className="library-toast" role="status">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* ── Body ── */}
        <div className="library-body hide-scrollbar">
          {activeDesign ? (
            /* ── Design detail ── */
            <div className="library-detail">
              <button type="button" onClick={() => setActiveDesign(null)} className="library-back">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M11 18l-6-6 6-6" />
                </svg>
                <span>All designs</span>
              </button>

              <div className="library-detail-hero">
                <div className="library-detail-thumb">
                  <img
                    src={activeDesign.previewUrl}
                    alt={activeDesign.name}
                    loading="lazy"
                    onLoad={(e) => { e.currentTarget.classList.add('is-loaded'); e.currentTarget.parentElement?.classList.add('is-loaded'); }}
                  />
                </div>
                <div className="library-detail-copy">
                  <span className="library-tag">{activeDesign.themeCategory}</span>
                  <h3 className="library-detail-title">{activeDesign.name}</h3>
                  <p className="library-detail-meta">
                    {activeDesign.artworks.length} artwork{activeDesign.artworks.length === 1 ? '' : 's'} ·{' '}
                    {activeDesign.artworks
                      .map((a) => PLACEMENT_LABEL[getPlacementKind(a.suggestedPlacement || 'front-center')])
                      .join(' · ')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleApplyAllArtworks(activeDesign)}
                className={`library-btn library-btn--primary library-btn--lg ${appliedDesignId === activeDesign.id ? 'is-done' : ''}`}
              >
                {appliedDesignId === activeDesign.id ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span>Applied to 3D garment</span>
                  </>
                ) : (
                  <>
                    <span>Apply complete set</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </>
                )}
              </button>

              <p className="library-hint">
                Apply the complete set or a single artwork. Every graphic keeps its saved side and
                artist-calibrated placement — placements are view-only for customers.
              </p>

              <div className="library-section-title">Individual artworks</div>

              <div className="library-art-list">
                {activeDesign.artworks.map((art) => {
                  const target = art.suggestedPlacement || 'front-center';
                  const kind = getPlacementKind(target);
                  const artKey = `${art.id}-${target}`;
                  const isApplied = appliedArtId === artKey;

                  return (
                    <div key={art.id} className="library-art-row">
                      <div className="library-art-thumb">
                        <img
                          src={art.previewUrl}
                          alt={art.name}
                          loading="lazy"
                          onLoad={(e) => { e.currentTarget.classList.add('is-loaded'); e.currentTarget.parentElement?.classList.add('is-loaded'); }}
                        />
                      </div>

                      <div className="library-art-copy">
                        <strong>{art.name}</strong>
                        <span className={`library-tag library-tag--${kind}`}>{PLACEMENT_LABEL[kind]}</span>
                        {art.colorHint !== 'any' && (
                          <span className="library-art-hint">Best on {art.colorHint}</span>
                        )}
                      </div>

                      <div className="library-art-actions">
                        <button
                          type="button"
                          onClick={() => handleApplyArtwork(activeDesign, art, target)}
                          className={`library-btn library-btn--soft ${isApplied ? 'is-done' : ''}`}
                          title={`Apply using the saved ${PLACEMENT_LABEL[kind]} placement`}
                        >
                          {isApplied ? 'Applied' : `Apply ${PLACEMENT_LABEL[kind]}`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── Catalog grid ── */
            <div className="library-grid-wrap">
              <div className="library-results">
                <span>
                  {filteredDesigns.length} of {CURATED_CLOTHING_DESIGNS.length} designs
                </span>
                {(selectedCategory !== 'all' || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                    className="library-reset"
                  >
                    Reset filters
                  </button>
                )}
              </div>

              {filteredDesigns.length > 0 ? (
                <div className="library-grid">
                  {filteredDesigns.map((design) => {
                    const artCount = design.artworks.length;
                    const isApplied = appliedDesignId === design.id;

                    return (
                      <article key={design.id} className="library-card">
                        <button
                          type="button"
                          className="library-card-media"
                          onClick={() => setActiveDesign(design)}
                          aria-label={`View ${design.name}`}
                        >
                          <img
                            src={design.previewUrl}
                            alt={design.name}
                            loading="lazy"
                            onLoad={(e) => { e.currentTarget.classList.add('is-loaded'); e.currentTarget.parentElement?.classList.add('is-loaded'); }}
                          />
                          <span className="library-tag library-tag--float">{design.themeCategory}</span>
                          <span className="library-card-count">
                            {artCount} {artCount === 1 ? 'art' : 'arts'}
                          </span>
                        </button>

                        <div className="library-card-body">
                          <h3 className="library-card-title" title={design.name}>
                            {design.name}
                          </h3>
                          <p className="library-card-meta">
                            {design.artworks
                              .map((a) => PLACEMENT_LABEL[getPlacementKind(a.suggestedPlacement || 'front-center')])
                              .join(' · ')}
                          </p>

                          <div className="library-card-actions">
                            <button
                              type="button"
                              onClick={() => handleApplyAllArtworks(design)}
                              className={`library-btn library-btn--primary library-btn--sm ${isApplied ? 'is-done' : ''}`}
                            >
                              {isApplied ? 'Applied' : 'Apply set'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveDesign(design)}
                              className="library-btn library-btn--ghost library-btn--sm"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="library-empty">
                  <p>No designs match “{searchQuery}”.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="library-btn library-btn--ghost library-btn--sm"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="library-footer">
          <span>StarBy Official Collections</span>
          <span className="library-footer-sep" />
          <span>360° studio ready</span>
        </div>
      </aside>
    </>
  );
};
