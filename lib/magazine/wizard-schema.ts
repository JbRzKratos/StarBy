/**
 * Wizard Schema Generator
 * Dynamically generates TemplateWizardSchema from template data by scanning
 * each element's type, role, frame, and original content.
 *
 * Provides accurate content requirement fields for photos and text,
 * filtering out decorative lines, barcodes, and tiny design artifacts.
 */

import type {
  MagazineTemplate,
  MagazinePage,
  MagazineElement,
  TemplateWizardSchema,
  PageWizardSchema,
  ElementWizardMeta,
  ElementRole,
} from '@/types/magazine';

// ── Role inference from element metadata ─────────────────────────────────────

function inferRole(el: MagazineElement, pageIndex: number, isLargestImage: boolean): ElementRole {
  const key = el.placeholderKey ?? '';
  const name = (el.name ?? '').toLowerCase();
  const isFirstPage = pageIndex === 0;

  if (el.type === 'image' || el.type === 'logo') {
    if (key === 'background-image') return 'background-image';
    if (isLargestImage || (isFirstPage && name.includes('img_2'))) return 'hero-image';
    if (name.includes('portrait') || name.includes('headshot')) return 'portrait';
    if (name.includes('product')) return 'product-shot';
    return 'image-placeholder';
  }

  if (el.type === 'text') {
    const fontSize = el.textStyle?.fontSize ?? 16;
    const content = (el.content ?? '').trim();

    if (key === 'headline' || fontSize >= 50 || name.includes('headline')) return 'headline';
    if (key === 'subheadline' || (fontSize >= 24 && fontSize < 50) || name.includes('subtitle'))
      return 'subheadline';
    if (
      key === 'date' ||
      content.toLowerCase().includes('issue') ||
      content.toLowerCase().includes('202')
    )
      return 'date';
    if (key === 'quote' || name.includes('quote')) return 'quote';
    if (key === 'caption' || name.includes('caption')) return 'caption';
    if (key === 'author' || name.includes('author') || name.includes('byline')) return 'author';
    if (content.length > 80 || name.includes('body') || name.includes('paragraph')) return 'body';
    return 'subheadline';
  }

  return 'decorative';
}

function computeAspectRatioLabel(width: number, height: number): string {
  if (!height || height === 0) return 'Custom';
  // Standard A4 aspect ratio correction if coordinates are in %:
  // A4 ratio is 210 / 297 ≈ 0.707
  const pixelAspect = (width * 0.707) / height;

  if (pixelAspect >= 0.85 && pixelAspect <= 1.18) return '1:1 Square';
  if (pixelAspect >= 0.65 && pixelAspect < 0.85) return '3:4 Portrait';
  if (pixelAspect < 0.65) return '9:16 Vertical';
  if (pixelAspect > 1.18 && pixelAspect <= 1.5) return '4:3 Landscape';
  return '16:9 Wide';
}

// ── Editable element filter ──────────────────────────────────────────────────

function isWizardEditable(el: MagazineElement): boolean {
  if (el.locked || el.isLocked) return false;
  if (el.visible === false) return false;
  if (el.editable === false && el.isEditable === false) return false;

  // Skip full-page backgrounds (the PDF page image itself)
  const isFullPageBg =
    el.placeholderKey === 'background-image' ||
    (el.frame.x <= 1 && el.frame.y <= 1 && el.frame.width >= 99 && el.frame.height >= 99);
  if (isFullPageBg) return false;

  if (el.type === 'image' || el.type === 'logo') {
    const w = el.frame.width;
    const h = el.frame.height;
    const area = w * h;
    const name = (el.name ?? '').toLowerCase();

    // Skip thin decorative lines (e.g. w <= 3% or h <= 3% with high aspect ratio)
    if ((w <= 3 && h > 15) || (h <= 3 && w > 15)) return false;

    // Skip tiny decorative marks/icons (area < 25% unless explicitly named photo/portrait)
    if (area < 25 && !name.includes('photo') && !name.includes('portrait')) return false;

    // Skip barcodes
    if (name.includes('barcode') || (el.content && el.content.includes('barcode'))) return false;

    return true;
  }

  if (el.type === 'text') {
    const text = (el.content ?? '').trim();
    if (!text) return false;
    // Skip static tiny page counters like "03 >" or footer links "MENSFASHION.COM"
    if (/^\d+\s*>$/.test(text)) return false;
    if (/^[A-Za-z0-9.-]+\.(com|org|net|in|co)$/i.test(text)) return false;
    return true;
  }

  return false;
}

// ── Main schema generator ────────────────────────────────────────────────────

export function generateWizardSchema(template: MagazineTemplate): TemplateWizardSchema {
  const pages: PageWizardSchema[] = template.pages.map((page: MagazinePage, pageIndex: number) => {
    const roleCounts: Partial<Record<ElementRole, number>> = {};
    const elements: ElementWizardMeta[] = [];

    // Filter editable elements
    const validEls = page.elements.filter(isWizardEditable);

    // Find the largest image element on this page to designate as hero
    const imageEls = validEls.filter((e) => e.type === 'image' || e.type === 'logo');
    let maxArea = 0;
    let largestImgId: string | null = null;
    for (const imgEl of imageEls) {
      const area = imgEl.frame.width * imgEl.frame.height;
      if (area > maxArea) {
        maxArea = area;
        largestImgId = imgEl.id;
      }
    }

    // Sort: images first, then text sorted by visual position (y then x)
    const sortedEls = [...validEls].sort((a, b) => {
      const aIsImg = a.type === 'image' || a.type === 'logo';
      const bIsImg = b.type === 'image' || b.type === 'logo';
      if (aIsImg && !bIsImg) return -1;
      if (!aIsImg && bIsImg) return 1;
      return a.frame.y - b.frame.y || a.frame.x - b.frame.x;
    });

    for (const el of sortedEls) {
      const isLargest = el.id === largestImgId;
      const role = inferRole(el, pageIndex, isLargest);

      if (role === 'decorative') continue;

      const roleIdx = roleCounts[role] ?? 0;
      roleCounts[role] = roleIdx + 1;

      // Smart label generation
      let label = '';
      let guidance = '';
      const originalText = (el.content ?? '').trim().replace(/\n/g, ' ');

      if (el.type === 'image' || el.type === 'logo') {
        if (role === 'hero-image' || pageIndex === 0) {
          label = pageIndex === 0 ? 'Main Cover Photo' : 'Main Feature Photo';
          guidance = 'Upload your photo to feature prominently here';
        } else {
          label = roleIdx === 0 ? 'Photo' : `Photo ${roleIdx + 1}`;
          guidance = 'Upload your photo for this spot';
        }

        elements.push({
          elementId: el.id,
          role,
          label,
          guidance,
          recommendedAspectRatio: computeAspectRatioLabel(el.frame.width, el.frame.height),
          required: role === 'hero-image',
        });
      } else if (el.type === 'text') {
        if (role === 'headline') {
          label = roleIdx === 0 ? 'Main Headline' : `Headline ${roleIdx + 1}`;
          guidance = 'Main title for this page';
        } else if (role === 'date') {
          label = 'Date / Issue';
          guidance = 'Season, month, or issue number';
        } else if (role === 'body') {
          label = roleIdx === 0 ? 'Article Text' : `Article Text ${roleIdx + 1}`;
          guidance = 'Main article or paragraph text';
        } else {
          label = roleIdx === 0 ? 'Section Title' : `Story Title ${roleIdx + 1}`;
          guidance = 'Short subheading or feature teaser';
        }

        elements.push({
          elementId: el.id,
          role,
          label,
          guidance,
          placeholder: originalText || 'Enter your text...',
          maxChars: role === 'body' ? 800 : role === 'headline' ? 80 : 160,
          required: false,
        });
      }
    }

    let pageLabel = `Page ${pageIndex + 1}`;
    if (pageIndex === 0) pageLabel = 'Cover';
    else if (pageIndex === template.pages.length - 1) pageLabel = 'Back Cover';
    else if (page.layoutType === 'contents') pageLabel = `Contents (Page ${pageIndex + 1})`;
    else if (page.layoutType === 'editor-letter')
      pageLabel = `Editor's Letter (Page ${pageIndex + 1})`;
    else if (page.title && page.title !== `Page ${pageIndex + 1}`) pageLabel = page.title;

    return {
      pageId: page.id,
      pageLabel,
      elements,
    };
  });

  return {
    templateId: template.id,
    pages,
  };
}

/**
 * Get wizard schema for a specific template.
 * Lazily generates on first call and caches.
 */
const schemaCache = new Map<string, TemplateWizardSchema>();

export function getWizardSchema(template: MagazineTemplate): TemplateWizardSchema {
  const cached = schemaCache.get(template.id);
  if (cached) {
    return cached;
  }
  const schema = generateWizardSchema(template);
  schemaCache.set(template.id, schema);
  return schema;
}

/**
 * Calculate completion status for a page given a content map.
 */
export function getPageCompletion(
  pageSchema: PageWizardSchema,
  contentMap: Record<string, string>,
): 'complete' | 'partial' | 'empty' {
  const required = pageSchema.elements.filter((e) => e.required);
  const all = pageSchema.elements;

  if (all.length === 0) return 'complete';

  const filledRequired = required.filter((e) => (contentMap[e.elementId] ?? '').trim().length > 0);
  const filledAll = all.filter((e) => (contentMap[e.elementId] ?? '').trim().length > 0);

  if (filledAll.length === 0) return 'empty';
  if (required.length > 0 && filledRequired.length < required.length) return 'partial';
  return 'complete';
}
