import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  WallLayoutData,
  SlotSelection,
  PosterArtworkData,
  CropData,
  WallConfigurationSnapshot,
} from './types';
import { FREGORO_LAYOUTS, getLayoutById } from './layouts-data';
import { calculateWallPrice } from './pricing';
import type { PriceBreakdown } from './pricing';
import { oneTapThemeFill, shuffleWall } from './recommendations';
import type { ShuffleScope } from './recommendations';
import { FREGORO_DESIGN_PLACEMENTS } from './design-placements';
import type { DesignPlacement } from './design-placements';

export type StudioViewMode = 'clean' | 'print-map';
export type RoomSceneId = 'modern-living' | 'studio-desk' | 'minimal-bedroom' | 'custom-room';

interface WallStudioState {
  currentLayout: WallLayoutData;
  selections: Record<string, SlotSelection>;
  activeSlotId: string | null;
  activeThemeSlug: string;
  viewMode: StudioViewMode;
  cleanWallColor: string;
  roomScene: RoomSceneId;
  customRoomImageUrl: string | null;
  pricing: PriceBreakdown;

  // History for Undo/Redo
  history: Array<Record<string, SlotSelection>>;
  historyIndex: number;

  // Modals / Drawers
  isPickerOpen: boolean;
  isCustomUploadModalOpen: boolean;
  isLayoutSelectorOpen: boolean;
  isCuratorModalOpen: boolean;
  isShareModalOpen: boolean;
  isPlacementsModalOpen: boolean;
}

interface WallStudioActions {
  setLayout: (layoutIdOrSlug: string, presetSelections?: Record<string, SlotSelection>) => void;
  setActiveSlot: (slotId: string | null) => void;
  setActiveTheme: (themeSlug: string) => void;
  setViewMode: (mode: StudioViewMode) => void;
  setCleanWallColor: (hex: string) => void;
  setRoomScene: (scene: RoomSceneId) => void;
  setCustomRoomImage: (url: string | null) => void;

  // Artwork assignments
  setSlotArtwork: (slotId: string, artwork: PosterArtworkData, crop?: CropData) => void;
  setSplitArtwork: (splitGroupId: string, artwork: PosterArtworkData, crop?: CropData) => void;
  setCustomPhoto: (slotId: string, imageUrl: string, isSplit: boolean, crop?: CropData) => void;
  removeSlotArtwork: (slotId: string) => void;
  toggleLockSlot: (slotId: string) => void;

  // Smart actions & Placements
  themeFill: (themeSlug: string) => void;
  shuffle: (scope?: ShuffleScope) => void;
  resetWall: () => void;
  clearAllSlots: () => void;
  applyDesignPlacement: (placement: DesignPlacement) => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;

  // Modal openers
  openPickerForSlot: (slotId: string) => void;
  closePicker: () => void;
  openCustomUploadForSlot: (slotId?: string) => void;
  closeCustomUpload: () => void;
  openLayoutSelector: () => void;
  closeLayoutSelector: () => void;
  openCuratorModal: () => void;
  closeCuratorModal: () => void;
  openShareModal: () => void;
  closeShareModal: () => void;
  openPlacementsModal: () => void;
  closePlacementsModal: () => void;

  // Export & Cart Snapshot
  getSnapshot: () => WallConfigurationSnapshot;
}

const INITIAL_LAYOUT = FREGORO_LAYOUTS[0]; // 5-Piece Panoramic Wave signature split art

export const useWallStudioStore = create<WallStudioState & WallStudioActions>()(
  devtools(
    persist(
      (set, get) => {
        const defaultPlacement = FREGORO_DESIGN_PLACEMENTS[0];
        const initialSelections: Record<string, SlotSelection> = { ...defaultPlacement.selections };
        const initialPricing = calculateWallPrice(INITIAL_LAYOUT, initialSelections);

        const pushHistory = (newSelections: Record<string, SlotSelection>) => {
          const { history, historyIndex } = get();
          const sliced = history.slice(0, historyIndex + 1);
          return {
            history: [...sliced, newSelections].slice(-20), // Max 20 steps
            historyIndex: Math.min(sliced.length, 19),
          };
        };

        return {
          currentLayout: INITIAL_LAYOUT,
          selections: initialSelections,
          activeSlotId: null,
          activeThemeSlug: 'all',
          viewMode: 'clean',
          cleanWallColor: '#121214',
          roomScene: 'modern-living',
          customRoomImageUrl: null,
          pricing: initialPricing,

          history: [initialSelections],
          historyIndex: 0,

          isPickerOpen: false,
          isCustomUploadModalOpen: false,
          isLayoutSelectorOpen: false,
          isCuratorModalOpen: false,
          isShareModalOpen: false,
          isPlacementsModalOpen: false,

          setLayout: (layoutIdOrSlug, presetSelections) => {
            const nextLayout = getLayoutById(layoutIdOrSlug) || INITIAL_LAYOUT;
            let newSelections: Record<string, SlotSelection> = {};

            if (presetSelections && Object.keys(presetSelections).length > 0) {
              newSelections = presetSelections;
            } else {
              // Check if there is a curated design placement for this layout
              const matchingPlacement = FREGORO_DESIGN_PLACEMENTS.find(
                (p) => p.layoutId === nextLayout.id || p.layoutSlug === nextLayout.slug,
              );
              if (matchingPlacement) {
                newSelections = { ...matchingPlacement.selections };
              } else {
                // Pre-fill with matching template artworks for this layout's primary theme
                const defaultTheme = nextLayout.recommendedThemes[0]?.toLowerCase() || 'gaming';
                newSelections = oneTapThemeFill(nextLayout, {}, defaultTheme);
              }
            }

            const nextPricing = calculateWallPrice(nextLayout, newSelections);

            set({
              currentLayout: nextLayout,
              selections: newSelections,
              activeSlotId: null,
              pricing: nextPricing,
              isLayoutSelectorOpen: false,
              ...pushHistory(newSelections),
            });
          },

          setActiveSlot: (slotId) => set({ activeSlotId: slotId }),
          setActiveTheme: (themeSlug) => set({ activeThemeSlug: themeSlug }),
          setViewMode: (viewMode) => set({ viewMode }),
          setCleanWallColor: (cleanWallColor) => set({ cleanWallColor }),
          setRoomScene: (roomScene) => set({ roomScene }),
          setCustomRoomImage: (customRoomImageUrl) => set({ customRoomImageUrl }),

          setSlotArtwork: (slotId, artwork, crop) => {
            const { selections, currentLayout } = get();
            const slot = currentLayout.slots.find((s) => s.id === slotId);
            if (!slot) return;

            // If slot is part of a split group, assign to entire split group continuously
            if (slot.splitGroupId) {
              get().setSplitArtwork(slot.splitGroupId, artwork, crop);
              return;
            }

            const updatedSelections = {
              ...selections,
              [slotId]: {
                slotId,
                artworkId: artwork.id,
                title: artwork.title,
                imageUrl: artwork.imageUrl,
                thumbnailUrl: artwork.thumbnailUrl,
                physicalSize: slot.size,
                price: artwork.price,
                cropData: crop,
                isLocked: selections[slotId]?.isLocked || false,
                isCustomUpload: false,
              },
            };

            const updatedPricing = calculateWallPrice(currentLayout, updatedSelections);

            set({
              selections: updatedSelections,
              pricing: updatedPricing,
              isPickerOpen: false,
              ...pushHistory(updatedSelections),
            });
          },

          setSplitArtwork: (splitGroupId, artwork, crop) => {
            const { selections, currentLayout } = get();
            const group = currentLayout.splitGroups.find((g) => g.splitGroupId === splitGroupId);
            if (!group) return;

            const updatedSelections = { ...selections };
            group.slotIds.forEach((slotId, pIndex) => {
              const slot = currentLayout.slots.find((s) => s.id === slotId);
              updatedSelections[slotId] = {
                slotId,
                artworkId: artwork.id,
                title: `${artwork.title} (Panel ${pIndex + 1}/${group.panelCount})`,
                imageUrl: artwork.imageUrl,
                thumbnailUrl: artwork.thumbnailUrl,
                splitGroupId,
                panelIndex: pIndex,
                physicalSize: slot?.size || group.physicalSize,
                price: artwork.price,
                cropData: crop,
                isLocked: selections[slotId]?.isLocked || false,
                isCustomUpload: false,
              };
            });

            const updatedPricing = calculateWallPrice(currentLayout, updatedSelections);

            set({
              selections: updatedSelections,
              pricing: updatedPricing,
              isPickerOpen: false,
              ...pushHistory(updatedSelections),
            });
          },

          setCustomPhoto: (slotId, imageUrl, isSplit, crop) => {
            const { selections, currentLayout } = get();
            const slot = currentLayout.slots.find((s) => s.id === slotId);
            if (!slot) return;

            const updatedSelections = { ...selections };

            if (isSplit && slot.splitGroupId) {
              const group = currentLayout.splitGroups.find(
                (g) => g.splitGroupId === slot.splitGroupId,
              );
              if (group) {
                group.slotIds.forEach((sId, pIndex) => {
                  const s = currentLayout.slots.find((item) => item.id === sId);
                  updatedSelections[sId] = {
                    slotId: sId,
                    title: `Custom Split (Panel ${pIndex + 1}/${group.panelCount})`,
                    imageUrl,
                    splitGroupId: group.splitGroupId,
                    panelIndex: pIndex,
                    physicalSize: s?.size || group.physicalSize,
                    price: 299,
                    cropData: crop,
                    isLocked: false,
                    isCustomUpload: true,
                  };
                });
              }
            } else {
              updatedSelections[slotId] = {
                slotId,
                title: 'Custom Uploaded Artwork',
                imageUrl,
                physicalSize: slot.size,
                price: 199,
                cropData: crop,
                isLocked: false,
                isCustomUpload: true,
              };
            }

            const updatedPricing = calculateWallPrice(currentLayout, updatedSelections);

            set({
              selections: updatedSelections,
              pricing: updatedPricing,
              isCustomUploadModalOpen: false,
              ...pushHistory(updatedSelections),
            });
          },

          removeSlotArtwork: (slotId) => {
            const { selections, currentLayout } = get();
            const slot = currentLayout.slots.find((s) => s.id === slotId);
            let updatedSelections = { ...selections };

            if (slot?.splitGroupId) {
              const group = currentLayout.splitGroups.find(
                (g) => g.splitGroupId === slot.splitGroupId,
              );
              const toRemove = new Set(group?.slotIds || []);
              updatedSelections = Object.fromEntries(
                Object.entries(updatedSelections).filter(([k]) => !toRemove.has(k)),
              );
            } else {
              const { [slotId]: _omitted, ...rest } = updatedSelections;
              updatedSelections = rest;
            }

            const updatedPricing = calculateWallPrice(currentLayout, updatedSelections);
            set({
              selections: updatedSelections,
              pricing: updatedPricing,
              ...pushHistory(updatedSelections),
            });
          },

          toggleLockSlot: (slotId) => {
            const { selections } = get();
            const current = selections[slotId];
            if (!current) return;

            set({
              selections: {
                ...selections,
                [slotId]: {
                  ...current,
                  isLocked: !current.isLocked,
                },
              },
            });
          },

          themeFill: (themeSlug) => {
            const { currentLayout, selections } = get();
            const filled = oneTapThemeFill(currentLayout, selections, themeSlug);
            const nextPricing = calculateWallPrice(currentLayout, filled);

            set({
              selections: filled,
              activeThemeSlug: themeSlug,
              pricing: nextPricing,
              ...pushHistory(filled),
            });
          },

          shuffle: (scope = 'all') => {
            const { currentLayout, selections, activeThemeSlug } = get();
            const shuffled = shuffleWall(currentLayout, selections, scope, activeThemeSlug);
            const nextPricing = calculateWallPrice(currentLayout, shuffled);

            set({
              selections: shuffled,
              pricing: nextPricing,
              ...pushHistory(shuffled),
            });
          },

          resetWall: () => {
            const { currentLayout } = get();
            const emptySelections = {};
            const nextPricing = calculateWallPrice(currentLayout, emptySelections);

            set({
              selections: emptySelections,
              pricing: nextPricing,
              activeSlotId: null,
              ...pushHistory(emptySelections),
            });
          },

          clearAllSlots: () => {
            const { currentLayout } = get();
            const emptySelections = {};
            const nextPricing = calculateWallPrice(currentLayout, emptySelections);

            set({
              selections: emptySelections,
              pricing: nextPricing,
              activeSlotId: null,
              ...pushHistory(emptySelections),
            });
          },

          applyDesignPlacement: (placement: DesignPlacement) => {
            const targetLayout =
              getLayoutById(placement.layoutId) ||
              getLayoutById(placement.layoutSlug) ||
              get().currentLayout;
            const newSelections = { ...placement.selections };
            const nextPricing = calculateWallPrice(targetLayout, newSelections);

            set({
              currentLayout: targetLayout,
              selections: newSelections,
              activeThemeSlug: placement.themeSlug || 'all',
              pricing: nextPricing,
              activeSlotId: null,
              isPlacementsModalOpen: false,
              ...pushHistory(newSelections),
            });
          },

          undo: () => {
            const { history, historyIndex, currentLayout } = get();
            if (historyIndex > 0) {
              const prev = history[historyIndex - 1];
              const nextPricing = calculateWallPrice(currentLayout, prev);
              set({
                selections: prev,
                historyIndex: historyIndex - 1,
                pricing: nextPricing,
              });
            }
          },

          redo: () => {
            const { history, historyIndex, currentLayout } = get();
            if (historyIndex < history.length - 1) {
              const next = history[historyIndex + 1];
              const nextPricing = calculateWallPrice(currentLayout, next);
              set({
                selections: next,
                historyIndex: historyIndex + 1,
                pricing: nextPricing,
              });
            }
          },

          openPickerForSlot: (slotId) => set({ activeSlotId: slotId, isPickerOpen: true }),
          closePicker: () => set({ isPickerOpen: false }),
          openCustomUploadForSlot: (slotId) =>
            set({ activeSlotId: slotId || get().activeSlotId, isCustomUploadModalOpen: true }),
          closeCustomUpload: () => set({ isCustomUploadModalOpen: false }),
          openLayoutSelector: () => set({ isLayoutSelectorOpen: true }),
          closeLayoutSelector: () => set({ isLayoutSelectorOpen: false }),
          openCuratorModal: () => set({ isCuratorModalOpen: true }),
          closeCuratorModal: () => set({ isCuratorModalOpen: false }),
          openShareModal: () => set({ isShareModalOpen: true }),
          closeShareModal: () => set({ isShareModalOpen: false }),
          openPlacementsModal: () => set({ isPlacementsModalOpen: true }),
          closePlacementsModal: () => set({ isPlacementsModalOpen: false }),

          getSnapshot: (): WallConfigurationSnapshot => {
            const { currentLayout, selections, pricing } = get();

            const sizeBreakdown: Record<string, number> = {};
            currentLayout.slots.forEach((s) => {
              sizeBreakdown[s.size] = (sizeBreakdown[s.size] || 0) + 1;
            });

            const slotsData = currentLayout.slots.map((s, index) => {
              const sel = selections[s.id];
              return {
                slotId: s.id,
                slotType: s.slotType,
                physicalSize: s.size,
                physicalWidthMm: s.physicalWidthMm,
                physicalHeightMm: s.physicalHeightMm,
                orientation: s.orientation,
                splitGroupId: s.splitGroupId,
                panelIndex: s.panelIndex,
                artworkId: sel?.artworkId || null,
                artworkTitle: sel?.title || 'Fregoro Studio Art',
                imageUrl: sel?.imageUrl || '',
                thumbnailUrl: sel?.thumbnailUrl || sel?.imageUrl || '',
                isCustomUpload: sel?.isCustomUpload || false,
                cropData: sel?.cropData,
                panelNumber: index + 1,
              };
            });

            return {
              wallConfigurationId: `wall_cfg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              layoutId: currentLayout.id,
              layoutSlug: currentLayout.slug,
              layoutName: currentLayout.name,
              layoutVersion: currentLayout.version,
              wallWidthMm: currentLayout.wallWidthMm,
              wallHeightMm: currentLayout.wallHeightMm,
              coverageLabel: currentLayout.coverageLabel,
              physicalPrintCount: currentLayout.physicalPrintCount,
              logicalArtworkCount: currentLayout.logicalArtworkCount,
              sizeBreakdown,
              slots: slotsData,
              splitGroups: currentLayout.splitGroups,
              calculatedPrice: pricing.finalPrice,
              compareAtPrice: pricing.compareAtPrice,
              createdAt: new Date().toISOString(),
            };
          },
        };
      },
      {
        name: 'fregoro-wall-studio-v6',
        partialize: (state) => ({
          currentLayout: state.currentLayout,
          selections: state.selections,
          cleanWallColor: state.cleanWallColor,
        }),
      },
    ),
    { name: 'WallStudioStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);
