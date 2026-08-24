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
