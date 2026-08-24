import jsPDF from 'jspdf';
import type { MagazineDocument, MagazinePage, PdfExportOptions } from '@/types/magazine';
import { PAGE_DIMENSIONS, DEFAULT_PAGE_DIMENSION } from '@/types/magazine';

// Convert image URL to HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // In case of CORS or broken image, resolve with fallback 1x1 transparent
      const fallback = new Image();
      fallback.src =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      resolve(fallback);
    };
    img.src = src;
  });
}

/**
 * Render a single MagazinePage onto an offscreen canvas at high print resolution (300 DPI equivalent)
 */
async function renderPageToCanvas(
  page: MagazinePage,
  doc: MagazineDocument,
  widthMm: number,
  heightMm: number,
  bleedMm: number,
): Promise<HTMLCanvasElement> {
  const scale = 3; // 3x scale for crisp 300DPI rendering
  const canvasWidth = (widthMm + bleedMm * 2) * scale;
  const canvasHeight = (heightMm + bleedMm * 2) * scale;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background
  const bgColor = page.backgroundColor || doc.theme.backgroundColor || '#0D0D0E';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Offset coordinate system for bleed area
  const contentX = bleedMm * scale;
  const contentY = bleedMm * scale;
  const contentW = widthMm * scale;
  const contentH = heightMm * scale;

  // Sort elements by zIndex
  const sortedElements = [...(page.elements || [])].sort(
    (a, b) => (a.frame.zIndex || 1) - (b.frame.zIndex || 1),
  );

  for (const el of sortedElements) {
    const elX = contentX + (el.frame.x / 100) * contentW;
    const elY = contentY + (el.frame.y / 100) * contentH;
    const elW = (el.frame.width / 100) * contentW;
    const elH = (el.frame.height / 100) * contentH;

    ctx.save();

    if (el.frame.rotation) {
      const centerX = elX + elW / 2;
      const centerY = elY + elH / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((el.frame.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    if (el.type === 'shape') {
      const shapeColor = el.shapeStyle?.fillColor || doc.theme.accentColor || '#0057FF';
      ctx.fillStyle = shapeColor;
      if (el.shapeStyle?.borderRadius) {
        const r = el.shapeStyle.borderRadius * scale;
        ctx.beginPath();
        ctx.roundRect(elX, elY, elW, elH, r);
        ctx.fill();
      } else {
        ctx.fillRect(elX, elY, elW, elH);
      }
    } else if (el.type === 'circle') {
      const circleColor = el.shapeStyle?.fillColor || doc.theme.accentColor || '#0057FF';
      ctx.fillStyle = circleColor;
      ctx.beginPath();
      ctx.ellipse(elX + elW / 2, elY + elH / 2, elW / 2, elH / 2, 0, 0, 2 * Math.PI);
      ctx.fill();
    } else if (el.type === 'line' || el.type === 'divider') {
      ctx.fillStyle = el.shapeStyle?.fillColor || doc.theme.accentColor || '#0057FF';
      ctx.fillRect(elX, elY + elH / 2 - 1, elW, (el.shapeStyle?.strokeWidth || 2) * scale * 0.4);
    } else if (el.type === 'image' && el.content) {
      try {
        const img = await loadImage(el.content);
        ctx.save();
        if (el.imageStyle?.borderRadius) {
          const r = el.imageStyle.borderRadius * scale;
          ctx.beginPath();
          ctx.roundRect(elX, elY, elW, elH, r);
          ctx.clip();
        }

        // Draw image with object-fit cover and crop scale/offsets
        const cropScale = el.crop?.scale || 1;
        const cropOffsetX = (el.crop?.offsetX || 0) * scale;
        const cropOffsetY = (el.crop?.offsetY || 0) * scale;

        const imgRatio = img.width / img.height;
        const targetRatio = elW / elH;
        let sWidth = img.width;
        let sHeight = img.height;
        let sx = 0;
        let sy = 0;

        if (imgRatio > targetRatio) {
          sWidth = img.height * targetRatio;
          sx = (img.width - sWidth) / 2;
        } else {
          sHeight = img.width / targetRatio;
          sy = (img.height - sHeight) / 2;
        }

        ctx.translate(cropOffsetX, cropOffsetY);
        ctx.scale(cropScale, cropScale);
        ctx.drawImage(img, sx, sy, sWidth, sHeight, elX, elY, elW, elH);
        ctx.restore();
      } catch {
        ctx.fillStyle = '#1A1A1E';
        ctx.fillRect(elX, elY, elW, elH);
      }
    } else if (el.type === 'text' || el.type === 'quote-block' || el.type === 'page-number') {
      const style = el.textStyle || {
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
        fontWeight: 400,
      };
      const fontSizePx = (style.fontSize || 12) * scale * 0.45;
      const weight = style.fontWeight || 400;
      const fontName = style.fontFamily?.includes('Playfair')
        ? 'serif'
        : style.fontFamily?.includes('Mono')
          ? 'monospace'
          : 'sans-serif';

      ctx.font = `${style.fontStyle === 'italic' ? 'italic ' : ''}${weight} ${fontSizePx}px ${fontName}`;
      ctx.fillStyle = style.color || doc.theme.textColor || '#F5F1EA';
      ctx.textBaseline = 'top';

      const lines = (el.content || '').split('\n');
      const lineHeight = (style.lineHeight || 1.35) * fontSizePx;
      let curY = elY;

      for (const line of lines) {
        const words = line.split(' ');
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > elW && currentLine) {
            ctx.fillText(currentLine, elX, curY);
            currentLine = word;
            curY += lineHeight;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          ctx.fillText(currentLine, elX, curY);
          curY += lineHeight;
        }
      }
    } else if (el.type === 'barcode') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(elX, elY, elW, elH);
      ctx.fillStyle = '#000000';
      const barCount = 24;
      const barW = elW / (barCount * 1.5);
      for (let b = 0; b < barCount; b++) {
        if (b % 3 !== 1) {
          ctx.fillRect(elX + b * barW * 1.4, elY + 2, barW, elH - 4);
        }
      }
    }

    ctx.restore();
  }

  return canvas;
}

/**
 * Generate a complete, high-resolution multi-page PDF document
 */
export async function generateMagazinePdf(
  doc: MagazineDocument,
  options: PdfExportOptions = {},
): Promise<Blob> {
  const dim = PAGE_DIMENSIONS[doc.dimensionKey] || DEFAULT_PAGE_DIMENSION;
  const bleedMm = options.includeBleed ? dim.bleedMm : 0;
  const pdfWidth = dim.widthMm + bleedMm * 2;
  const pdfHeight = dim.heightMm + bleedMm * 2;

  const orientation = dim.orientation === 'landscape' ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [pdfWidth, pdfHeight],
    compress: true,
  });

  const totalPages = doc.pages.length;

  for (let i = 0; i < totalPages; i++) {
    if (i > 0) {
      pdf.addPage([pdfWidth, pdfHeight], orientation);
    }

    const page = doc.pages[i];
    if (!page) continue;
    options.onProgress?.(i + 1, totalPages);

    const canvas = await renderPageToCanvas(page, doc, dim.widthMm, dim.heightMm, bleedMm);
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  }

  return pdf.output('blob');
}

/**
 * Trigger immediate client-side download of the print-ready PDF
 */
export async function downloadMagazinePdf(
  doc: MagazineDocument,
  filename?: string,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const blob = await generateMagazinePdf(doc, {
    includeBleed: true,
    ...(onProgress ? { onProgress } : {}),
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (doc.title || 'FREGORO_Magazine').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = filename || `FREGORO_Magazine_${safeName}_${doc.pages.length}p.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
