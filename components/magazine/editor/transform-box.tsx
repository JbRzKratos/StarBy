'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { ElementFrame } from '@/types/magazine';

interface TransformBoxProps {
  frame: ElementFrame;
  containerRect: DOMRect | null;
  isLocked?: boolean | undefined;
  onUpdateFrame: (newFrame: Partial<ElementFrame>, isFinal: boolean) => void;
  onDuplicate?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
  onBringForward?: (() => void) | undefined;
  onSendBackward?: (() => void) | undefined;
  onToggleLock?: (() => void) | undefined;
  onMoveStart?: ((e: React.PointerEvent) => void) | undefined;
}

type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rot';

export function TransformBox({
  frame,
  containerRect,
  isLocked = false,
  onUpdateFrame,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
  onToggleLock,
  onMoveStart,
}: TransformBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);

  // Use ref to keep latest callbacks and rect without re-attaching listeners
  const stateRef = useRef({
    frame,
    containerRect,
    isLocked,
    onUpdateFrame,
  });

  useEffect(() => {
    stateRef.current = { frame, containerRect, isLocked, onUpdateFrame };
  }, [frame, containerRect, isLocked, onUpdateFrame]);

  // Handle pointer down on handles
  const handleHandlePointerDown = useCallback((e: React.PointerEvent, handle: HandleType) => {
    if (stateRef.current.isLocked) return;
    e.preventDefault();
    e.stopPropagation();

    setActiveHandle(handle);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialFrame = { ...stateRef.current.frame };
    const rect = stateRef.current.containerRect;
    if (!rect) return;

    let hasMoved = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      hasMoved = true;

      const currentRect = stateRef.current.containerRect || rect;
      const dxPx = moveEvent.clientX - startX;
      const dyPx = moveEvent.clientY - startY;

      // Convert pixel deltas to percentage
      const dx = (dxPx / currentRect.width) * 100;
      const dy = (dyPx / currentRect.height) * 100;
      const isShift = moveEvent.shiftKey;

      if (handle === 'rot') {
        // Rotation relative to element center
        const elemCenterX =
          currentRect.left + ((initialFrame.x + initialFrame.width / 2) / 100) * currentRect.width;
        const elemCenterY =
          currentRect.top + ((initialFrame.y + initialFrame.height / 2) / 100) * currentRect.height;

        const angleRad = Math.atan2(
          moveEvent.clientY - elemCenterY,
          moveEvent.clientX - elemCenterX,
        );
        let angleDeg = (angleRad * 180) / Math.PI + 90;
        if (angleDeg < 0) angleDeg += 360;

        if (isShift) {
          angleDeg = Math.round(angleDeg / 15) * 15;
        }

        stateRef.current.onUpdateFrame({ rotation: Math.round(angleDeg) }, false);
      } else {
        // 8-Directional Resizing
        let newX = initialFrame.x;
        let newY = initialFrame.y;
        let newWidth = initialFrame.width;
        let newHeight = initialFrame.height;

        const minDim = 2; // minimum 2%

        if (handle.includes('e')) {
          newWidth = Math.max(minDim, initialFrame.width + dx);
        }
        if (handle.includes('s')) {
          newHeight = Math.max(minDim, initialFrame.height + dy);
        }
        if (handle.includes('w')) {
          const potentialWidth = initialFrame.width - dx;
          if (potentialWidth >= minDim) {
            newWidth = potentialWidth;
            newX = initialFrame.x + dx;
          }
        }
        if (handle.includes('n')) {
          const potentialHeight = initialFrame.height - dy;
          if (potentialHeight >= minDim) {
            newHeight = potentialHeight;
            newY = initialFrame.y + dy;
          }
        }

        if (isShift && initialFrame.width > 0 && initialFrame.height > 0) {
          const ratio = initialFrame.width / initialFrame.height;
          if (handle === 'e' || handle === 'w') {
            newHeight = newWidth / ratio;
          } else {
            newWidth = newHeight * ratio;
          }
        }

        stateRef.current.onUpdateFrame(
          { x: newX, y: newY, width: newWidth, height: newHeight },
          false,
        );
      }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      upEvent.preventDefault();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      setActiveHandle(null);

      if (hasMoved) {
        stateRef.current.onUpdateFrame({}, true); // Commit final state
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp, { passive: false });
  }, []);

  const rotation = frame.rotation || 0;

  return (
    <div
      ref={boxRef}
      className={`absolute pointer-events-none border-2 transition-colors z-[100] ${
        isLocked ? 'border-amber-400 border-dashed' : 'border-[#0057FF]'
      }`}
      style={{
        left: `${frame.x}%`,
        top: `${frame.y}%`,
        width: `${frame.width}%`,
        height: `${frame.height}%`,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: 'center center',
      }}
    >
      {/* ── Dimension & Angle Pill ── */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#0E0E10] border border-[#F5F1EA]/20 rounded font-mono text-[9px] font-bold text-white shadow-lg pointer-events-none whitespace-nowrap z-50">
        {Math.round(frame.width)}% × {Math.round(frame.height)}%{rotation ? ` · ${rotation}°` : ''}
      </div>

      {/* ── Quick Floating Contextual Actions Bar ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute -bottom-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#0E0E10] border border-[#F5F1EA]/20 px-2 py-1 rounded-lg shadow-2xl z-50 pointer-events-auto select-none"
      >
        <button
          onPointerDown={onMoveStart}
          title="Move Element"
          className="p-1 text-[12px] text-white hover:text-[#0057FF] cursor-move flex items-center justify-center font-bold"
        >
          ✥
        </button>
        <div className="w-[1px] h-3 bg-white/20 mx-0.5" />
        <button
          onClick={onBringForward}
          title="Bring Forward"
          className="p-1 text-[11px] text-[#F5F1EA]/70 hover:text-white font-mono"
        >
          ▲
        </button>
        <button
          onClick={onSendBackward}
          title="Send Backward"
          className="p-1 text-[11px] text-[#F5F1EA]/70 hover:text-white font-mono"
        >
          ▼
        </button>
        <div className="w-[1px] h-3 bg-white/20 mx-0.5" />
        <button
          onClick={onDuplicate}
          title="Duplicate (Ctrl+D)"
          className="p-1 text-[11px] text-[#F5F1EA]/70 hover:text-white font-mono"
        >
          ❐
        </button>
        <button
          onClick={onToggleLock}
          title={isLocked ? 'Unlock Element' : 'Lock Element'}
          className={`p-1 text-[11px] font-mono ${isLocked ? 'text-amber-400' : 'text-[#F5F1EA]/70 hover:text-white'}`}
        >
          {isLocked ? '🔒' : '🔓'}
        </button>
        <button
          onClick={onDelete}
          title="Delete (Delete Key)"
          className="p-1 text-[11px] text-rose-400/80 hover:text-rose-400 font-mono"
        >
          ✕
        </button>
      </div>

      {!isLocked && (
        <>
          {/* ── Top Rotation Handle & Stalk ── */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
            <div
              onPointerDown={(e) => handleHandlePointerDown(e, 'rot')}
              className={`w-3.5 h-3.5 rounded-full bg-white border-2 border-[#0057FF] cursor-grab active:cursor-grabbing shadow-md hover:scale-125 transition-transform ${
                activeHandle === 'rot' ? 'scale-125 bg-[#0057FF]' : ''
              }`}
              title="Rotate (Hold Shift for 15° snap)"
            />
            <div className="w-[1.5px] h-3 bg-[#0057FF]" />
          </div>

          {/* ── 4 Corner Resize Handles ── */}
          <div
            onPointerDown={(e) => handleHandlePointerDown(e, 'nw')}
            className="pointer-events-auto absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#0057FF] rounded-sm cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
          />
          <div
            onPointerDown={(e) => handleHandlePointerDown(e, 'ne')}
            className="pointer-events-auto absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#0057FF] rounded-sm cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
          />
          <div
            onPointerDown={(e) => handleHandlePointerDown(e, 'se')}
            className="pointer-events-auto absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#0057FF] rounded-sm cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
          />
          <div
            onPointerDown={(e) => handleHandlePointerDown(e, 'sw')}
            className="pointer-events-auto absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#0057FF] rounded-sm cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
          />

          {/* ── 4 Edge Resize Handles ── */}
          <div
            onPointerDown={(e) => handleHandlePointerDown(e, 'n')}
            className="pointer-events-auto absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-white border border-[#0057FF] rounded-sm cursor-ns-resize shadow-sm hover:scale-110 transition-transform"
          />
          <div
            onPointerDown={(e) => handleHandlePointerDown(e, 's')}
            className="pointer-events-auto absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-white border border-[#0057FF] rounded-sm cursor-ns-resize shadow-sm hover:scale-110 transition-transform"
          />
          <div
            onPointerDown={(e) => handleHandlePointerDown(e, 'e')}
            className="pointer-events-auto absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-4 bg-white border border-[#0057FF] rounded-sm cursor-ew-resize shadow-sm hover:scale-110 transition-transform"
          />
          <div
            onPointerDown={(e) => handleHandlePointerDown(e, 'w')}
            className="pointer-events-auto absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-4 bg-white border border-[#0057FF] rounded-sm cursor-ew-resize shadow-sm hover:scale-110 transition-transform"
          />
        </>
      )}
    </div>
  );
}
