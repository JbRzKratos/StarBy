'use client';

import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  hasSelection: boolean;
  isLocked?: boolean | undefined;
  canPaste?: boolean | undefined;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onToggleLock: () => void;
  onClose: () => void;
}

export function ContextMenu({
  x,
  y,
  hasSelection,
  isLocked,
  canPaste,
  onCut,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onToggleLock,
  onClose,
}: ContextMenuProps) {
  React.useEffect(() => {
    const handleClickOutside = () => onClose();
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed bg-[#0E0E10] border border-[#F5F1EA]/15 rounded-xl shadow-2xl p-1.5 min-w-[180px] font-mono text-xs text-[#F5F1EA] z-[99999] select-none"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      {hasSelection && (
        <>
          <button
            onClick={() => {
              onCut();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-[#1A1A22] rounded flex justify-between items-center text-left"
          >
            <span>Cut</span>
            <span className="text-[10px] text-[#F5F1EA]/40">Ctrl+X</span>
          </button>
          <button
            onClick={() => {
              onCopy();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-[#1A1A22] rounded flex justify-between items-center text-left"
          >
            <span>Copy</span>
            <span className="text-[10px] text-[#F5F1EA]/40">Ctrl+C</span>
          </button>
        </>
      )}

      {canPaste && (
        <button
          onClick={() => {
            onPaste();
            onClose();
          }}
          className="w-full px-3 py-1.5 hover:bg-[#1A1A22] rounded flex justify-between items-center text-left"
        >
          <span>Paste</span>
          <span className="text-[10px] text-[#F5F1EA]/40">Ctrl+V</span>
        </button>
      )}

      {hasSelection && (
        <>
          <button
            onClick={() => {
              onDuplicate();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-[#1A1A22] rounded flex justify-between items-center text-left"
          >
            <span>Duplicate</span>
            <span className="text-[10px] text-[#F5F1EA]/40">Ctrl+D</span>
          </button>
          <div className="h-[1px] bg-white/10 my-1" />
          <button
            onClick={() => {
              onBringForward();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-[#1A1A22] rounded text-left"
          >
            Bring Forward
          </button>
          <button
            onClick={() => {
              onSendBackward();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-[#1A1A22] rounded text-left"
          >
            Send Backward
          </button>
          <button
            onClick={() => {
              onBringToFront();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-[#1A1A22] rounded text-left"
          >
            Bring to Front
          </button>
          <button
            onClick={() => {
              onSendToBack();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-[#1A1A22] rounded text-left"
          >
            Send to Back
          </button>
          <div className="h-[1px] bg-white/10 my-1" />
          <button
            onClick={() => {
              onToggleLock();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-[#1A1A22] rounded flex justify-between items-center text-left"
          >
            <span>{isLocked ? 'Unlock' : 'Lock'}</span>
            <span className="text-[10px]">{isLocked ? '🔓' : '🔒'}</span>
          </button>
          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-rose-500/20 text-rose-400 rounded flex justify-between items-center text-left"
          >
            <span>Delete</span>
            <span className="text-[10px]">Del</span>
          </button>
        </>
      )}
    </div>
  );
}
