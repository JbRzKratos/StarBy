import React, { useState } from 'react';
import type { ArtworkLayer3D } from '../../types/threeD';
import {
  artworkSideLabel,
  getArtworkSide,
  type ArtworkSide,
} from '../../engine/3d/artworkSides';

export interface AddToCartModal3DProps {
  isOpen: boolean;
  onClose: () => void;
  garmentName: string;
  garmentColor: string;
  unitPrice?: number;
  basePrice?: number;
  /** Size the studio was opened with (from the product page / URL). */
  initialSize?: string;
  /** Authoritative price resolver — recomputes per selected size. */
  resolvePrice?: (size: string) => number;
  /** Garment-only price for the selected size (shown in the breakdown). */
  resolveBasePrice?: (size: string) => number;
  customArtworkCount?: number;
  customPrintFee?: number;
  isCuratedDesign?: boolean;
  /** Exact view the customer was looking at when they pressed Add to Bag. */
  currentSnapshotUrl: string | null;
  frontSnapshotUrl: string | null;
  backSnapshotUrl: string | null;
  leftSleeveSnapshotUrl: string | null;
  rightSleeveSnapshotUrl: string | null;
  artworkLayers: ArtworkLayer3D[];
  isGeneratingSnapshots: boolean;
  onConfirmAddToCart: (data: {
    size: string;
    quantity: number;
    printInstructions: string;
  }) => void;
}

type PreviewSide = 'current' | ArtworkSide | 'both';

interface ProofView {
  id: Exclude<PreviewSide, 'both'>;
  label: string;
  url: string | null;
  artworkCount: number;
}

const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL', '3XL'] as const;

const QUICK_INSTRUCTION_TAGS = [
  'Center Chest (10" wide)',
  'Left Chest Pocket area',
  'Large Back Graphic',
  'Front & Back Placement',
  '2 inches below neckline',
  'Subtle Minimalist DTF',
  'Oversized fit alignment',
];

export const AddToCartModal3D: React.FC<AddToCartModal3DProps> = ({
  isOpen,
  onClose,
  garmentName,
  garmentColor,
  unitPrice: propUnitPrice,
  basePrice,
  initialSize,
  resolvePrice,
  resolveBasePrice,
  customArtworkCount = 0,
  customPrintFee,
  isCuratedDesign = false,
  currentSnapshotUrl,
  frontSnapshotUrl,
  backSnapshotUrl,
  leftSleeveSnapshotUrl,
  rightSleeveSnapshotUrl,
  artworkLayers,
  isGeneratingSnapshots,
  onConfirmAddToCart,
}) => {
  const [selectedSide, setSelectedSide] = useState<PreviewSide>('current');
  const [selectedSize, setSelectedSize] = useState<string>(initialSize || 'L');
  const [quantity, setQuantity] = useState<number>(1);
  const [instructions, setInstructions] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState<boolean>(false);

  if (!isOpen) return null;

  const layersBySide = artworkLayers.reduce<Record<ArtworkSide, ArtworkLayer3D[]>>(
    (acc, layer) => {
      acc[getArtworkSide(layer)].push(layer);
      return acc;
    },
    { front: [], back: [], 'left-sleeve': [], 'right-sleeve': [] },
  );

  const hasLeftSleeveArtwork = layersBySide['left-sleeve'].length > 0;
  const hasRightSleeveArtwork = layersBySide['right-sleeve'].length > 0;

  const proofViews: ProofView[] = [
    {
      id: 'current',
      label: 'Studio View',
      url: currentSnapshotUrl,
      artworkCount: artworkLayers.length,
    },
    {
      id: 'front',
      label: 'Front',
      url: frontSnapshotUrl,
      artworkCount: layersBySide.front.length,
    },
    {
      id: 'back',
      label: 'Back',
      url: backSnapshotUrl,
      artworkCount: layersBySide.back.length,
    },
  ];

  if (hasLeftSleeveArtwork || leftSleeveSnapshotUrl) {
    proofViews.push({
      id: 'left-sleeve',
      label: 'Left Sleeve',
      url: leftSleeveSnapshotUrl,
      artworkCount: layersBySide['left-sleeve'].length,
    });
  }
  if (hasRightSleeveArtwork || rightSleeveSnapshotUrl) {
    proofViews.push({
      id: 'right-sleeve',
      label: 'Right Sleeve',
      url: rightSleeveSnapshotUrl,
      artworkCount: layersBySide['right-sleeve'].length,
    });
  }

  const allProofs = proofViews.filter((proof) => proof.id !== 'current');
  const activeProof =
    proofViews.find((proof) => proof.id === selectedSide) || proofViews[0];

  const handleAppendInstruction = (tag: string) => {
    setInstructions((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return tag;
      if (trimmed.includes(tag)) return prev;
      return `${trimmed}; ${tag}`;
    });
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onConfirmAddToCart({
      size: selectedSize,
      quantity,
      printInstructions: instructions.trim() || 'Print as aligned in 3D mockup reference.',
    });
    // Brief timeout before closing
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  const is3XL = selectedSize === '3XL' || selectedSize === 'XXXL';
  const lowerGarmentName = garmentName.toLowerCase();
  const isTShirtGarment =
    /regular|oversized|acid/.test(lowerGarmentName) && !lowerGarmentName.includes('hoodie');
  let adjustedBasePrice =
    typeof resolveBasePrice === 'function'
      ? resolveBasePrice(selectedSize)
      : typeof basePrice === 'number' && basePrice > 0
        ? basePrice
        : 639;
  if (typeof resolveBasePrice !== 'function' && is3XL && !isCuratedDesign) {
    if (lowerGarmentName.includes('oversized')) adjustedBasePrice = 709;
    else if (lowerGarmentName.includes('acid')) adjustedBasePrice = 720;
    else if (lowerGarmentName.includes('hoodie')) adjustedBasePrice = 849;
    else adjustedBasePrice = 659;
  }

  const effectivePrintFee =
    typeof customPrintFee === 'number'
      ? customPrintFee
      : isCuratedDesign
        ? isTShirtGarment && customArtworkCount >= 2
          ? 40
          : 0
        : customArtworkCount * 49;
  const unitPrice =
    typeof resolvePrice === 'function'
      ? resolvePrice(selectedSize)
      : isCuratedDesign
        ? typeof propUnitPrice === 'number' && propUnitPrice >= 0
          ? propUnitPrice
          : adjustedBasePrice + effectivePrintFee
        : adjustedBasePrice + effectivePrintFee;
  const totalPrice = unitPrice * quantity;
  const zoomUrl =
    selectedSide === 'both'
      ? frontSnapshotUrl || allProofs.find((proof) => proof.url)?.url || null
      : activeProof?.url || null;

  return (
    <div
      className="add-to-cart-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-to-cart-title"
    >
      <div className="add-to-cart-modal">
        {/* Header */}
        <div className="add-to-cart-header">
          <div className="add-to-cart-title-wrap">
            <div className="add-to-cart-badge">
              <span>👕</span>
              <span>3D Studio Order</span>
            </div>
            <h2 id="add-to-cart-title" className="add-to-cart-title">
              Review Design &amp; Add to Bag
            </h2>
            <p className="add-to-cart-subtitle">
              Verify your 3D mockup placement and uploaded design files before sending to Fregoro Studios.
            </p>
          </div>
          <button
            className="add-to-cart-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
          >
            <span>✕</span>
          </button>
        </div>

        {/* Modal Body: Two Columns */}
        <div className="add-to-cart-body">
          {/* Left Column: 3D Mockup Visual Proof & Uploaded Files */}
          <div className="add-to-cart-preview-col">
            <div className="preview-view-toggle">
              {proofViews.map((proof) => (
                <button
                  key={proof.id}
                  type="button"
                  className={`preview-tab-btn ${selectedSide === proof.id ? 'active' : ''}`}
                  onClick={() => setSelectedSide(proof.id)}
                >
                  <span>{proof.label}</span>
                  {proof.artworkCount > 0 && (
                    <span className="tab-pill-badge">Art</span>
                  )}
                </button>
              ))}
              <button
                type="button"
                className={`preview-tab-btn ${selectedSide === 'both' ? 'active' : ''}`}
                onClick={() => setSelectedSide('both')}
              >
                <span>All Proofs</span>
              </button>
            </div>

            {/* Visual Viewport Canvas / Snapshot */}
            <div className="preview-canvas-container">
              {isGeneratingSnapshots ? (
                <div className="preview-loading-state">
                  <span className="animate-spin text-accent" style={{ fontSize: '28px', display: 'inline-block' }}>⟳</span>
                  <p className="preview-loading-text">Rendering 3D Mockup Snapshots…</p>
                  <span className="preview-loading-sub">
                    Capturing your exact studio view, front, back and sleeve proofs
                  </span>
                </div>
              ) : selectedSide === 'both' ? (
                <div className={`preview-both-grid ${allProofs.length > 2 ? 'four-up' : ''}`}>
                  {allProofs.map((proof) => (
                    <div key={proof.id} className="preview-both-card">
                      <div className="preview-card-tag">{proof.label} 3D Proof</div>
                      {proof.url ? (
                        <img
                          src={proof.url}
                          alt={`${proof.label} 3D Mockup`}
                          className="preview-img"
                        />
                      ) : (
                        <div className="preview-empty">No preview available</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="preview-single-wrapper">
                  <div className="preview-side-indicator">
                    {activeProof?.id === 'current'
                      ? 'Studio View · Exact 3D Preview'
                      : `${activeProof?.label || 'Front'} 3D View`}
                  </div>
                  {activeProof?.url ? (
                    <img
                      src={activeProof.url}
                      alt={`${activeProof.label} 3D Mockup Preview`}
                      className="preview-img"
                    />
                  ) : (
                    <div className="preview-empty">
                      {isGeneratingSnapshots
                        ? `Generating ${activeProof?.label || 'front'} 3D snapshot…`
                        : 'No preview available for this angle'}
                    </div>
                  )}

                  {activeProof?.url && (
                    <button
                      type="button"
                      className="preview-zoom-btn"
                      onClick={() => setIsZoomModalOpen(true)}
                      title="Enlarge proof preview"
                    >
                      <span>⤢</span>
                      <span>Inspect</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Uploaded Artwork Assets Section */}
            <div className="uploaded-artworks-section">
              <div className="uploaded-artworks-title">
                <span className="text-accent">✦</span>
                <span>Original Uploaded Design Files ({artworkLayers.length})</span>
              </div>
              {artworkLayers.length === 0 ? (
                <p className="no-artwork-notice">
                  Plain garment selected (no artwork layers placed). If you wish to print a design, please upload an image in the artwork drawer.
                </p>
              ) : (
                <div className="artwork-mini-list">
                  {artworkLayers.map((layer, idx) => {
                    const side = getArtworkSide(layer);
                    return (
                      <div key={layer.id || idx} className="artwork-mini-card">
                        <div className="artwork-mini-thumb">
                          <img src={layer.imageUrl} alt={layer.name || `Artwork ${idx + 1}`} />
                        </div>
                        <div className="artwork-mini-info">
                          <span className="artwork-mini-name">{layer.name || `Graphic #${idx + 1}`}</span>
                          <div className="artwork-mini-tags">
                            <span className="artwork-tag-pill">
                              {artworkSideLabel(side)} View
                            </span>
                            <span className="artwork-tag-pill subtle">Original File</span>
                          </div>
                        </div>
                        <a
                          href={layer.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="artwork-mini-link"
                          title="View full source image"
                        >
                          <span>👁</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Studio Disclosure, Print Instructions & Options */}
          <div className="add-to-cart-form-col">
            {/* 1. Crucial Warning / Notice Box for Fregoro Studios */}
            <div className="studio-warning-box">
              <div className="studio-warning-header">
                <span className="studio-warning-icon" style={{ fontSize: '15px' }}>⚠</span>
                <span className="studio-warning-title">Notice for Fregoro Studios Production</span>
              </div>
              <p className="studio-warning-text">
                The image(s) you uploaded will be sent directly to <strong>Fregoro Studios</strong> for printing your tees, and the <strong>3D mockup</strong> you created in 3D studio will also go to Fregoro Studios to ensure exact placement, sizing, and alignment on your garment.
              </p>
            </div>

            {/* 2. Custom Print & Placement Instructions */}
            <div className="form-group-block">
              <div className="form-label-row">
                <label htmlFor="print-instructions-input" className="form-group-label">
                  Print Instructions &amp; Placement Area:
                </label>
                <span className="form-optional-tag">Recommended</span>
              </div>
              <p className="form-field-helper">
                Specify how and where your design should be printed (e.g. print placement, size scale, chest vs back neck, finish):
              </p>

              {/* Quick Suggestion Chips */}
              <div className="instruction-chips-wrap">
                {QUICK_INSTRUCTION_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="instruction-chip-btn"
                    onClick={() => handleAppendInstruction(tag)}
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              <textarea
                id="print-instructions-input"
                className="print-instructions-textarea"
                rows={3}
                placeholder="e.g., Print front artwork 10 inches wide centered across chest; position back graphic 2.5 inches below collar. Keep vibrant matte colors."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            {/* 3. Garment Specs: Name, Color Swatch, Size */}
            <div className="garment-summary-card">
              <div className="garment-summary-info">
                <span className="garment-type-label">Product Garment</span>
                <span className="garment-name-val">{garmentName}</span>
              </div>
              <div className="garment-color-badge">
                <span
                  className="garment-color-dot"
                  style={{ backgroundColor: garmentColor }}
                />
                <span className="garment-color-hex">{garmentColor}</span>
              </div>
            </div>

            {/* Size Selector */}
            <div className="form-group-block">
              <label className="form-group-label">Select Garment Size:</label>
              <div className="size-selector-grid">
                {SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`size-pill-btn ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Stepper & Price Summary */}
            <div className="qty-price-row">
              <div className="qty-control-block">
                <label className="form-group-label">Quantity:</label>
                <div className="qty-stepper">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span className="qty-number">{quantity}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="price-summary-block">
                <span className="price-label">Total Price:</span>
                <span className="price-val">₹{totalPrice.toLocaleString('en-IN')}</span>
                {(typeof resolveBasePrice === 'function' || typeof basePrice === 'number') && (
                  <div style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 2px 0', lineHeight: '1.4' }}>
                    <div>
                      {isCuratedDesign ? 'Garment' : 'Base Garment'} ({selectedSize}):{' '}
                      <strong style={{ color: '#e2e8f0' }}>₹{adjustedBasePrice}</strong>
                    </div>
                    {isCuratedDesign && (
                      <div style={{ color: '#64748b' }}>Curated design price includes this garment</div>
                    )}
                    {isCuratedDesign && isTShirtGarment ? (
                      effectivePrintFee > 0 ? (
                        <div style={{ color: '#38bdf8' }}>
                          Curated artwork surcharge (2+ prints):{' '}
                          <strong style={{ color: '#38bdf8' }}>+₹{effectivePrintFee}</strong>
                        </div>
                      ) : (
                        <div style={{ color: '#64748b' }}>
                          Curated artwork surcharge ({customArtworkCount} print
                          {customArtworkCount === 1 ? '' : 's'}): +₹0
                        </div>
                      )
                    ) : !isCuratedDesign ? (
                      customArtworkCount > 0 ? (
                        <div style={{ color: '#38bdf8' }}>
                          Custom Prints ({customArtworkCount} × ₹49):{' '}
                          <strong style={{ color: '#38bdf8' }}>+₹{effectivePrintFee}</strong>
                        </div>
                      ) : (
                        <div style={{ color: '#64748b' }}>No custom prints uploaded yet (+₹0)</div>
                      )
                    ) : null}
                  </div>
                )}
                <span className="price-sub">₹{unitPrice} / {garmentName.toLowerCase().includes('hoodie') ? 'hoodie' : 'tee'} · Inclusive of all taxes</span>
              </div>
            </div>

            {/* Studio Guarantee Badge */}
            <div className="studio-guarantee-pill">
              <span className="text-emerald">✓</span>
              <span>Includes Free Shipping &amp; Studio Print Quality Check</span>
            </div>

            {/* Action Buttons */}
            <div className="modal-actions-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Back to Studio
              </button>
              <button
                type="button"
                id="btn-confirm-add-to-cart"
                className="btn-modal-submit"
                onClick={handleSubmit}
                disabled={isSubmitting || isGeneratingSnapshots}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin" style={{ display: 'inline-block' }}>⟳</span>
                    <span>Adding to Bag…</span>
                  </>
                ) : (
                  <>
                    <span>🛍</span>
                    <span>Add to Bag &amp; Send to Studio</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inspect / Enlarge Modal */}
      {isZoomModalOpen && zoomUrl && (
        <div
          className="zoom-overlay"
          onClick={() => setIsZoomModalOpen(false)}
          role="dialog"
        >
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="zoom-close-btn"
              onClick={() => setIsZoomModalOpen(false)}
              aria-label="Close zoom"
            >
              <span>✕</span>
            </button>
            <img
              src={zoomUrl}
              alt="High-Res 3D Mockup Proof"
              className="zoom-img"
            />
          </div>
        </div>
      )}
    </div>
  );
};
