'use client';

import React, { useRef, useEffect, useState } from 'react';
import type { TextStyle } from '@/types/magazine';

interface TextInlineEditorProps {
  content: string;
  style?: TextStyle | undefined;
  isEditing: boolean;
  onUpdateContent: (newContent: string) => void;
  onExitEditing: () => void;
}

export function TextInlineEditor({
  content,
  style,
  isEditing,
  onUpdateContent,
  onExitEditing,
}: TextInlineEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Check for text overflow whenever content or dimensions change
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const isOverflowing =
      el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2;
    setHasOverflow(isOverflowing);
  }, [content, style]);

  // Focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && editableRef.current) {
      editableRef.current.focus();
      // Select all on initial edit or place cursor at end
      const range = document.createRange();
      range.selectNodeContents(editableRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  const handleBlur = () => {
    if (editableRef.current) {
      onUpdateContent(editableRef.current.innerText || '');
    }
    onExitEditing();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleBlur();
    }
    // Prevent Escape from bubbling up to the canvas
    if (e.key === 'Escape') e.stopPropagation();
    // Allow Ctrl+B, Ctrl+I, Ctrl+U natively for bold/italic/underline
  };

  // Format commands
  const execFormat = (command: string, value?: string) => {
    editableRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const fontFamily = style?.fontFamily || 'Inter, sans-serif';
  const fontSize = style?.fontSize ? `${style.fontSize}px` : '14px';
  const fontWeight = style?.fontWeight || 400;
  const fontStyle = style?.fontStyle || 'normal';
  const color = style?.color || '#F5F1EA';
  const textAlign = style?.textAlign || 'left';
  const lineHeight = style?.lineHeight || 1.3;
  const letterSpacing = style?.letterSpacing ? `${style.letterSpacing}px` : 'normal';

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden flex flex-col justify-start"
      style={{ textAlign }}
    >
      {isEditing ? (
        <>
          {/* ── Inline Formatting Toolbar ── */}
          <div
            onMouseDown={(e) => e.preventDefault()} // prevent blur
            className="absolute -top-9 left-0 flex items-center gap-0.5 bg-[#0E0E10] border border-[#F5F1EA]/20 px-1.5 py-1 rounded-lg shadow-xl z-50 pointer-events-auto select-none"
          >
            <button
              onMouseDown={() => execFormat('bold')}
              title="Bold (Ctrl+B)"
              className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs text-[#F5F1EA]/70 hover:text-white hover:bg-[#25252E] transition-colors"
            >
              B
            </button>
            <button
              onMouseDown={() => execFormat('italic')}
              title="Italic (Ctrl+I)"
              className="w-6 h-6 rounded flex items-center justify-center italic text-xs text-[#F5F1EA]/70 hover:text-white hover:bg-[#25252E] transition-colors font-serif"
            >
              I
            </button>
            <button
              onMouseDown={() => execFormat('underline')}
              title="Underline (Ctrl+U)"
              className="w-6 h-6 rounded flex items-center justify-center text-xs text-[#F5F1EA]/70 hover:text-white hover:bg-[#25252E] transition-colors underline"
            >
              U
            </button>
            <button
              onMouseDown={() => execFormat('strikeThrough')}
              title="Strikethrough"
              className="w-6 h-6 rounded flex items-center justify-center text-xs text-[#F5F1EA]/70 hover:text-white hover:bg-[#25252E] transition-colors line-through"
            >
              S
            </button>
            <div className="w-[1px] h-4 bg-white/15 mx-0.5" />
            <button
              onMouseDown={() => execFormat('fontSize', '5')}
              title="Larger text"
              className="w-6 h-6 rounded flex items-center justify-center font-mono text-[10px] text-[#F5F1EA]/70 hover:text-white hover:bg-[#25252E] transition-colors font-bold"
            >
              A+
            </button>
            <button
              onMouseDown={() => execFormat('fontSize', '2')}
              title="Smaller text"
              className="w-6 h-6 rounded flex items-center justify-center font-mono text-[9px] text-[#F5F1EA]/70 hover:text-white hover:bg-[#25252E] transition-colors"
            >
              A-
            </button>
            <div className="w-[1px] h-4 bg-white/15 mx-0.5" />
            <label title="Text Color" className="w-6 h-6 rounded flex items-center justify-center cursor-pointer hover:bg-[#25252E] transition-colors overflow-hidden">
              <span className="text-xs">🎨</span>
              <input
                type="color"
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
                onInput={(e) => execFormat('foreColor', (e.target as HTMLInputElement).value)}
              />
            </label>
            <div className="w-[1px] h-4 bg-white/15 mx-0.5" />
            <button
              onMouseDown={handleBlur}
              title="Done editing (Escape)"
              className="px-2 h-6 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 font-mono text-[9px] font-bold uppercase transition-colors"
            >
              Done
            </button>
          </div>

          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full h-full outline-none select-text cursor-text ring-1 ring-[#0057FF] bg-black/20 rounded p-0.5"
            style={{
              fontFamily,
              fontSize,
              fontWeight,
              fontStyle,
              color,
              lineHeight,
              letterSpacing,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {content}
          </div>
        </>
      ) : (
        <div
          className="w-full h-full select-none pointer-events-none"
          style={{
            fontFamily,
            fontSize,
            fontWeight,
            fontStyle,
            color,
            lineHeight,
            letterSpacing,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {style?.isDropCap && content.length > 0 ? (
            <div>
              <span
                className="float-left text-4xl font-serif font-black leading-none pr-2 pt-1"
                style={{ color: style.color }}
              >
                {content.charAt(0)}
              </span>
              <span>{content.slice(1)}</span>
            </div>
          ) : (
            content
          )}
        </div>
      )}

      {/* ── Text Overflow Warning Badge ── */}
      {hasOverflow && (
        <div
          className="absolute bottom-1 right-1 bg-amber-500/90 text-black font-mono text-[8px] font-bold px-1.5 py-0.5 rounded shadow-md pointer-events-none z-30 flex items-center gap-1 uppercase"
          title="Text exceeds frame dimensions. Expand frame or reduce font size."
        >
          <span>⚠</span>
          <span>Overflow</span>
        </div>
      )}
    </div>
  );
}
