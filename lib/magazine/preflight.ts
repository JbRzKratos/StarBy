import type { MagazineDocument, PreflightReport, PreflightIssue } from '@/types/magazine';

export function runPreflightCheck(doc: MagazineDocument): PreflightReport {
  const issues: PreflightIssue[] = [];

  // 1. Page count validation (Saddle stitch must be divisible by 4)
  if (doc.pages.length === 0) {
    issues.push({
      id: 'err-no-pages',
      severity: 'error',
      pageNumber: 1,
      title: 'No Pages Found',
      message:
        'Your magazine has no pages. Please add at least 4 pages before exporting or ordering.',
      fixSuggestion: 'Add pages from the Pages panel.',
    });
  } else if (doc.bindingType === 'saddle-stitch' && doc.pages.length % 4 !== 0) {
    issues.push({
      id: 'warn-saddle-pages',
      severity: 'warning',
      pageNumber: doc.pages.length,
      title: 'Page Count div 4 for Saddle-Stitching',
      message: `Your magazine has ${doc.pages.length} pages. Saddle-stitched magazines are folded in 4-page sheets (recommended: 4, 8, 12, 16, 20, 24, 32 pages). Blank pages will be added to the end to align print plates.`,
      fixSuggestion: `Adjust page count to ${Math.ceil(doc.pages.length / 4) * 4} pages for optimal binding.`,
    });
  }

  // 2. Iterate through each page
  doc.pages.forEach((page, pageIdx) => {
    const pageNum = page.pageNumber || pageIdx + 1;

    // Check elements on page
    if (!page.elements || page.elements.length === 0) {
      issues.push({
        id: `warn-empty-page-${pageNum}`,
        severity: 'warning',
        pageNumber: pageNum,
        title: 'Empty Page',
        message: `Page ${pageNum} contains no text or visual elements.`,
        fixSuggestion: 'Add editorial content or delete this page if intentional.',
      });
      return;
    }

    page.elements.forEach((el) => {
      // Safe margin check (if element extends beyond safe zone and is not full-bleed background)
      const isFullBleedImage =
        el.type === 'image' &&
        el.frame.x <= 0 &&
        el.frame.y <= 0 &&
        el.frame.width >= 100 &&
        el.frame.height >= 100;

      if (el.type === 'text' && !isFullBleedImage) {
        // Safe margin is roughly 5% on each side
        const isTooCloseToLeft = el.frame.x < 3;
        const isTooCloseToRight = el.frame.x + el.frame.width > 97;
        const isTooCloseToTop = el.frame.y < 3;
        const isTooCloseToBottom = el.frame.y + el.frame.height > 97;

        if (isTooCloseToLeft || isTooCloseToRight || isTooCloseToTop || isTooCloseToBottom) {
          issues.push({
            id: `warn-safe-margin-${el.id}`,
            severity: 'warning',
            pageNumber: pageNum,
            elementId: el.id,
            title: 'Text Close to Trim Line',
            message: `Text "${el.name}" is positioned within 3mm of the trim boundary. It may be partially clipped during guillotine cutting.`,
            fixSuggestion: 'Move text box inward past the inner guide lines.',
          });
        }
      }

      // Check for empty or generic placeholder text
      if (el.type === 'text') {
        const textContent = el.content ? el.content.trim() : '';
        if (!textContent) {
          issues.push({
            id: `warn-empty-text-${el.id}`,
            severity: 'warning',
            pageNumber: pageNum,
            elementId: el.id,
            title: 'Empty Text Box',
            message: `Text element "${el.name}" on Page ${pageNum} has no text.`,
            fixSuggestion: 'Enter your copy or delete the text box.',
          });
        } else if (
          textContent.toLowerCase().includes('lorem ipsum') ||
          textContent === 'YOUR MAGAZINE TITLE' ||
          textContent === 'HEADLINE PLACEHOLDER'
        ) {
          issues.push({
            id: `info-placeholder-text-${el.id}`,
            severity: 'info',
            pageNumber: pageNum,
            elementId: el.id,
            title: 'Placeholder Text Detected',
            message: `Element "${el.name}" still contains default placeholder text.`,
            fixSuggestion: 'Review and customize with your own story before printing.',
          });
        }
      }

      // Check image quality and empty image states
      if (el.type === 'image') {
        if (!el.content || el.content.trim() === '') {
          issues.push({
            id: `err-empty-image-${el.id}`,
            severity: 'error',
            pageNumber: pageNum,
            elementId: el.id,
            title: 'Missing Image Asset',
            message: `Image frame "${el.name}" on Page ${pageNum} has no image uploaded.`,
            fixSuggestion: 'Upload your photograph or remove the empty frame.',
          });
        } else if (el.originalDpi && el.originalDpi < 150) {
          issues.push({
            id: `err-low-dpi-${el.id}`,
            severity: 'error',
            pageNumber: pageNum,
            elementId: el.id,
            title: 'Critically Low Resolution Image',
            message: `Image "${el.name}" has effective resolution of ~${el.originalDpi} DPI. Print requires 300 DPI (minimum 150 DPI). It will appear pixelated on physical paper.`,
            fixSuggestion: 'Upload a higher-resolution original photograph (at least 2000px wide).',
          });
        } else if (el.originalDpi && el.originalDpi < 220) {
          issues.push({
            id: `warn-med-dpi-${el.id}`,
            severity: 'warning',
            pageNumber: pageNum,
            elementId: el.id,
            title: 'Image May Print Soft',
            message: `Image "${el.name}" is approximately ${el.originalDpi} DPI. Fine details may print softer than digital display.`,
            fixSuggestion: 'For razor-sharp giclée print quality, supply 300 DPI assets.',
          });
        }
      }
    });
  });

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  return {
    timestamp: new Date().toISOString(),
    totalIssues: issues.length,
    errorCount,
    warningCount,
    isPrintReady: errorCount === 0,
    issues,
  };
}
