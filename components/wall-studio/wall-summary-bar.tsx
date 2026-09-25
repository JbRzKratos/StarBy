'use client';

import React, { useMemo, useState } from 'react';
import { useWallStudioStore } from '@/lib/wall-studio/store';
import { useCartStore } from '@/lib/stores/cart-store';
import { ShoppingBag, AlertCircle, Sparkles } from 'lucide-react';

export const WallSummaryBar: React.FC = () => {
  const { currentLayout, selections, pricing, getSnapshot, themeFill } = useWallStudioStore();
  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useCartStore((state) => state.setCartOpen);

  const [isAdding, setIsAdding] = useState(false);
  const [showIncompleteNotice, setShowIncompleteNotice] = useState(false);

  // Logical artwork filled count
  // Note: All panels of a split group represent 1 logical artwork
  const { filledLogicalCount, totalLogicalCount, emptySlotsCount } = useMemo(() => {
    const countedSplitGroups = new Set<string>();
    let filled = 0;

    currentLayout.slots.forEach((slot) => {
      const sel = selections[slot.id];
      if (slot.splitGroupId) {
        if (!countedSplitGroups.has(slot.splitGroupId)) {
          countedSplitGroups.add(slot.splitGroupId);
          if (sel?.imageUrl) filled += 1;
        }
      } else {
        if (sel?.imageUrl) filled += 1;
      }
    });

    return {
      filledLogicalCount: filled,
      totalLogicalCount: currentLayout.logicalArtworkCount,
      emptySlotsCount: currentLayout.slots.filter((s) => !selections[s.id]?.imageUrl).length,
    };
  }, [currentLayout, selections]);

  const handleAddToCart = () => {
    if (emptySlotsCount > 0) {
      setShowIncompleteNotice(true);
      return;
    }

    executeAddToCart();
  };

  const executeAddToCart = () => {
    setIsAdding(true);
    const snapshot = getSnapshot();

    // Use a preview thumbnail from hero slot if available
    const heroSlot = currentLayout.slots.find(
      (s) => s.slotType === 'hero' || s.slotType === 'hero-panel',
    );
    const heroImage =
      (heroSlot && selections[heroSlot.id]?.imageUrl) ||
      Object.values(selections)[0]?.imageUrl ||
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80';

    addItem({
      productId: `wall_${currentLayout.slug}`,
      variantId: `v_${currentLayout.version}`,
      name: `${currentLayout.name} Wall Setup`,
      price: pricing.finalPrice,
      quantity: 1,
      size: currentLayout.coverageLabel,
      image: heroImage,
      customization: {
        isWallProduct: true,
        wallConfigurationId: snapshot.wallConfigurationId,
        layoutId: snapshot.layoutId,
        layoutSlug: snapshot.layoutSlug,
        layoutName: snapshot.layoutName,
        layoutVersion: snapshot.layoutVersion,
        wallWidthMm: snapshot.wallWidthMm,
        wallHeightMm: snapshot.wallHeightMm,
        coverageLabel: snapshot.coverageLabel,
        physicalPrintCount: snapshot.physicalPrintCount,
        logicalArtworkCount: snapshot.logicalArtworkCount,
        sizeBreakdown: snapshot.sizeBreakdown,
        slots: snapshot.slots,
        splitGroups: snapshot.splitGroups,
        previewFileUrl: heroImage,
      },
    });

    setIsAdding(false);
    setShowIncompleteNotice(false);
    setCartOpen(true);
  };

  return (
    <>
      <div className="relative z-30 w-full bg-[#0A0B0E]/95 backdrop-blur-xl border-t border-white/10 px-3 sm:px-4 md:px-8 py-2.5 md:py-3.5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:pb-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 md:gap-4 shrink-0 select-none">
        {/* ─── TIER 1 (mobile) / LEFT (desktop): SPEC & LAYOUT INFO ─── */}
        <div className="flex items-center justify-between md:justify-start gap-2 sm:gap-4 min-w-0">
          <div className="min-w-0 flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate max-w-[130px] xs:max-w-[170px] sm:max-w-[240px] md:max-w-none leading-snug">
              {currentLayout.name}
            </span>
            <span className="text-[10px] font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded border border-white/10 shrink-0">
              {currentLayout.coverageLabel}
            </span>
          </div>

          {/* Subtitle / Artwork fill status badge */}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono shrink-0">
            {currentLayout.category === 'split' ? (
              <span className="text-white/80 bg-white/[0.06] border border-white/10 px-2 py-0.5 rounded">
                {currentLayout.physicalPrintCount}-Panel Split
              </span>
            ) : currentLayout.category === 'hybrid' ? (
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded hidden xs:inline-flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  Split + Frames
                </span>
                <span className="text-white/80 bg-white/[0.06] border border-white/10 px-2 py-0.5 rounded">
                  {filledLogicalCount}/{totalLogicalCount} Artworks
                </span>
              </div>
            ) : (
              <span className="text-white/80 bg-white/[0.06] border border-white/10 px-2 py-0.5 rounded">
                {filledLogicalCount}/{totalLogicalCount} Artworks
              </span>
            )}
          </div>

          {/* Size breakdown pill badges on desktop only */}
          <div className="hidden lg:flex items-center gap-1.5 font-mono text-[11px] shrink-0">
            {Object.entries(pricing.sizeCounts).map(([size, count]) => {
              if (count === 0) return null;
              return (
                <span
                  key={size}
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70"
                >
                  {count} × {size}
                </span>
              );
            })}
          </div>
        </div>

        {/* ─── TIER 2 (mobile) / RIGHT (desktop): PRICE & ADD TO CART CTA ─── */}
        <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 shrink-0 pt-0.5 md:pt-0">
          {/* Price display with savings */}
          <div className="text-left md:text-right shrink-0">
            <div className="flex items-baseline gap-1.5 justify-start md:justify-end leading-tight">
              <span className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">
                ₹{pricing.finalPrice.toLocaleString('en-IN')}
              </span>
              {pricing.compareAtPrice > pricing.finalPrice && (
                <span className="text-[11px] sm:text-xs text-white/40 line-through font-mono">
                  ₹{pricing.compareAtPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            {pricing.totalSavings > 0 && (
              <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400 font-semibold block leading-tight mt-1">
                Save ₹{pricing.totalSavings.toLocaleString('en-IN')} (Pack Discount)
              </span>
            )}
          </div>

          {/* Add to Cart CTA (44px min height touch target) */}
          <button
            type="button"
            disabled={isAdding}
            onClick={handleAddToCart}
            className="flex-1 md:flex-initial max-w-[210px] md:max-w-none min-h-[44px] flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#3B5EFF] hover:bg-[#2B4EFF] active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#3B5EFF]/25 transition-all duration-150 whitespace-nowrap"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="md:hidden">Add to Cart</span>
            <span className="hidden md:inline">Add Wall to Cart</span>
          </button>
        </div>
      </div>

      {/* ─── INCOMPLETE WALL MODAL ─── */}
      {showIncompleteNotice && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Incomplete Wall Slots"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <div className="relative w-full max-w-md bg-[#121316] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Your Wall Has Empty Slots</h3>
                <p className="text-xs text-white/60 font-mono mt-1">
                  You have {emptySlotsCount} empty slot{emptySlotsCount > 1 ? 's' : ''}. Would you
                  like to fill them automatically with matching bestsellers, or proceed to cart?
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  themeFill('all');
                  executeAddToCart();
                }}
                className="w-full py-2.5 rounded-xl bg-[#3B5EFF] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#2B4EFF] transition-colors font-mono"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fill Empty Slots & Add to Cart</span>
              </button>

              <button
                type="button"
                onClick={executeAddToCart}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-mono transition-colors"
              >
                Add Incomplete Wall Anyway
              </button>

              <button
                type="button"
                onClick={() => setShowIncompleteNotice(false)}
                className="w-full py-1.5 text-xs text-white/40 hover:text-white font-mono"
              >
                Back to Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
