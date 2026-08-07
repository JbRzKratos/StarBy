'use client';

/**
 * useArtworkTransform — Manages all artwork positioning, scaling and rotation.
 *
 * Features:
 * - Drag to reposition (pointer events)
 * - Wheel to zoom (centered on print area)
 * - Keyboard nudge (arrow keys, Shift for faster)
 * - Undo/Redo stack (50 levels)
 * - Reset to fit-cover
 * - Rotate 90° CW/CCW
 * - Flip horizontal / vertical
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Rect } from '@/lib/skin-engine/geometry';
import {
  type ArtworkTransform,
  DEFAULT_TRANSFORM,
  fitCoverTransform,
  fitContainTransform,
  clampTranslation,
  applyWheelZoom,
  getMinCoverScale,
} from '@/lib/skin-engine/transformMatrix';

const UNDO_LIMIT = 50;
const NUDGE_STEP = 1; // px per arrow key press
const NUDGE_SHIFT = 10; // px per arrow key press with Shift

export interface UseArtworkTransformReturn {
  transform: ArtworkTransform;
  /** Call once artwork has loaded to compute initial fit */
  initTransform: (naturalW: number, naturalH: number) => void;
  /** Fit cover — artwork fills entire print area */
  fitCover: () => void;
  /** Fit contain — entire artwork visible in print area */
  fitContain: () => void;
  /** Pointer down on artwork — start drag */
  handlePointerDown: (e: React.PointerEvent<SVGElement>) => void;
  /** Wheel event — zoom */
  handleWheel: (e: React.WheelEvent<SVGElement>) => void;
  /** Rotate by degrees (+90 = CW, -90 = CCW) */
  rotate: (deg: number) => void;
  /** Toggle horizontal flip */
  flipHorizontal: () => void;
  /** Toggle vertical flip */
  flipVertical: () => void;
  /** Undo last transform */
  undo: () => void;
  /** Redo last undone transform */
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  artNaturalSize: { w: number; h: number } | null;
}

export function useArtworkTransform(printableRect: Rect | null): UseArtworkTransformReturn {
  const [transform, setTransform] = useState<ArtworkTransform>(DEFAULT_TRANSFORM);
  const [artNaturalSize, setArtNaturalSize] = useState<{ w: number; h: number } | null>(null);

  // Undo / Redo stacks
  const undoStack = useRef<ArtworkTransform[]>([]);
  const redoStack = useRef<ArtworkTransform[]>([]);

  const pushUndo = useCallback((prev: ArtworkTransform) => {
    undoStack.current = [...undoStack.current.slice(-UNDO_LIMIT + 1), prev];
    redoStack.current = []; // clear redo on new action
  }, []);

  const applyTransform = useCallback(
    (updater: (prev: ArtworkTransform) => ArtworkTransform, trackUndo = true) => {
      setTransform((prev) => {
        if (trackUndo) pushUndo(prev);
        return updater(prev);
      });
    },
    [pushUndo]
  );

  // ─── Init ─────────────────────────────────────────────────────────────────

  const initTransform = useCallback(
    (naturalW: number, naturalH: number) => {
      setArtNaturalSize({ w: naturalW, h: naturalH });
      if (!printableRect) return;
      const initial = fitCoverTransform(naturalW, naturalH, printableRect);
      setTransform(initial);
      undoStack.current = [];
      redoStack.current = [];
    },
    [printableRect]
  );

  // ─── Fit modes ────────────────────────────────────────────────────────────

  const fitCover = useCallback(() => {
    if (!artNaturalSize || !printableRect) return;
    applyTransform(() =>
      fitCoverTransform(artNaturalSize.w, artNaturalSize.h, printableRect)
    );
  }, [artNaturalSize, printableRect, applyTransform]);

  const fitContain = useCallback(() => {
    if (!artNaturalSize || !printableRect) return;
    applyTransform(() =>
      fitContainTransform(artNaturalSize.w, artNaturalSize.h, printableRect)
    );
  }, [artNaturalSize, printableRect, applyTransform]);

  // ─── Drag ─────────────────────────────────────────────────────────────────

  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const dragSnapshot = useRef<ArtworkTransform | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    // snapshot for undo on drag start
    setTransform((prev) => {
      dragSnapshot.current = prev;
      return prev;
    });
  }, []);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!isDragging.current || !artNaturalSize || !printableRect) return;

      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };

      setTransform((prev) => {
        const clamped = clampTranslation(
          prev.tx + dx,
          prev.ty + dy,
          artNaturalSize.w,
          artNaturalSize.h,
          prev.scale,
          printableRect
        );
        return { ...prev, tx: clamped.tx, ty: clamped.ty };
      });
    };

    const handleUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      // Push drag start snapshot to undo
      if (dragSnapshot.current) {
        undoStack.current = [
          ...undoStack.current.slice(-UNDO_LIMIT + 1),
          dragSnapshot.current,
        ];
        redoStack.current = [];
        dragSnapshot.current = null;
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [artNaturalSize, printableRect]);

  // ─── Wheel Zoom ───────────────────────────────────────────────────────────

  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGElement>) => {
      e.preventDefault();
      if (!artNaturalSize || !printableRect) return;

      const minScale = getMinCoverScale(artNaturalSize.w, artNaturalSize.h, printableRect);

      applyTransform(
        (prev) =>
          applyWheelZoom(prev, e.deltaY, artNaturalSize.w, artNaturalSize.h, printableRect, minScale),
        true
      );
    },
    [artNaturalSize, printableRect, applyTransform]
  );

  // ─── Rotate ───────────────────────────────────────────────────────────────

  const rotate = useCallback(
    (deg: number) => {
      applyTransform((prev) => ({ ...prev, rotation: (prev.rotation + deg) % 360 }));
    },
    [applyTransform]
  );

  // ─── Flip ─────────────────────────────────────────────────────────────────

  const flipHorizontal = useCallback(() => {
    applyTransform((prev) => ({ ...prev, flipX: !prev.flipX }));
  }, [applyTransform]);

  const flipVertical = useCallback(() => {
    applyTransform((prev) => ({ ...prev, flipY: !prev.flipY }));
  }, [applyTransform]);

  // ─── Keyboard Nudge ───────────────────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!artNaturalSize || !printableRect) return;

      const step = e.shiftKey ? NUDGE_SHIFT : NUDGE_STEP;
      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowLeft') { dx = -step; e.preventDefault(); }
      else if (e.key === 'ArrowRight') { dx = step; e.preventDefault(); }
      else if (e.key === 'ArrowUp') { dy = -step; e.preventDefault(); }
      else if (e.key === 'ArrowDown') { dy = step; e.preventDefault(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          // Redo
          const next = redoStack.current.pop();
          if (next) {
            setTransform((prev) => {
              undoStack.current = [...undoStack.current, prev];
              return next;
            });
          }
        } else {
          // Undo
          const prev = undoStack.current.pop();
          if (prev) {
            setTransform((curr) => {
              redoStack.current = [...redoStack.current, curr];
              return prev;
            });
          }
        }
        return;
      } else return;

      if (dx !== 0 || dy !== 0) {
        applyTransform((prev) => {
          const clamped = clampTranslation(
            prev.tx + dx,
            prev.ty + dy,
            artNaturalSize.w,
            artNaturalSize.h,
            prev.scale,
            printableRect
          );
          return { ...prev, tx: clamped.tx, ty: clamped.ty };
        }, false); // don't track nudge in undo for smoothness
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [artNaturalSize, printableRect, applyTransform]);

  // ─── Undo / Redo ──────────────────────────────────────────────────────────

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    setTransform((curr) => {
      redoStack.current = [...redoStack.current, curr];
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    setTransform((curr) => {
      undoStack.current = [...undoStack.current, curr];
      return next;
    });
  }, []);

  return {
    transform,
    initTransform,
    fitCover,
    fitContain,
    handlePointerDown,
    handleWheel,
    rotate,
    flipHorizontal,
    flipVertical,
    undo,
    redo,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
    artNaturalSize,
  };
}
