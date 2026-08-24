export type PageOrientation = 'portrait' | 'landscape';
export type PageFormat = 'a4' | 'a5' | 'custom';

export interface PageDimension {
  name: string;
  format: PageFormat;
  orientation: PageOrientation;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  safeMarginMm: number;
}

export const DEFAULT_PAGE_DIMENSION: PageDimension = {
  name: 'A4 Portrait',
  format: 'a4',
  orientation: 'portrait',
  widthMm: 210,
  heightMm: 297,
  bleedMm: 3,
  safeMarginMm: 10,
};

export const PAGE_DIMENSIONS: Record<string, PageDimension> = {
  'a4-portrait': DEFAULT_PAGE_DIMENSION,
  'a4-landscape': {
    name: 'A4 Landscape',
    format: 'a4',
    orientation: 'landscape',
    widthMm: 297,
    heightMm: 210,
    bleedMm: 3,
    safeMarginMm: 10,
  },
  'a5-portrait': {
    name: 'A5 Portrait',
    format: 'a5',
    orientation: 'portrait',
    widthMm: 148,
    heightMm: 210,
    bleedMm: 3,
    safeMarginMm: 8,
  },
  'a5-landscape': {
    name: 'A5 Landscape',
    format: 'a5',
    orientation: 'landscape',
    widthMm: 210,
    heightMm: 148,
    bleedMm: 3,
    safeMarginMm: 8,
  },
};

export type MagazineCategory =
  | 'fashion'
  | 'technology'
  | 'mens-style'
  | 'catalogue'
  | 'editorial'
  | 'business'
  | 'events'
  | 'blank';

export interface MagazineTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  surfaceColor: string;
  cardColor: string;
}

export const DEFAULT_THEME: MagazineTheme = {
  id: 'editorial-black',
  name: 'Editorial Obsidian',
  primaryColor: '#F5F1EA',
  secondaryColor: '#A09FA6',
  accentColor: '#0057FF',
  backgroundColor: '#0D0D0E',
  textColor: '#F5F1EA',
  surfaceColor: '#16161A',
  cardColor: '#1F1F24',
};

export const PRESET_THEMES: MagazineTheme[] = [
  DEFAULT_THEME,
  {
    id: 'minimal-white',
    name: 'Minimal Ivory',
    primaryColor: '#121214',
    secondaryColor: '#6B6972',
    accentColor: '#0057FF',
    backgroundColor: '#FAF8F5',
    textColor: '#121214',
    surfaceColor: '#F0ECE4',
    cardColor: '#FFFFFF',
  },
  {
    id: 'crimson-avantgarde',
    name: 'Crimson Folio',
    primaryColor: '#F5F1EA',
    secondaryColor: '#E29578',
    accentColor: '#9E2A2B',
    backgroundColor: '#140D0E',
    textColor: '#F5F1EA',
    surfaceColor: '#2B1113',
    cardColor: '#3F181B',
  },
  {
    id: 'luxury-gold',
    name: 'Luxury Champagne',
    primaryColor: '#F5F1EA',
    secondaryColor: '#D4AF37',
    accentColor: '#ED9518',
    backgroundColor: '#121110',
    textColor: '#F5F1EA',
    surfaceColor: '#24201C',
    cardColor: '#332D28',
  },
  {
    id: 'tech-dark',
    name: 'Cybernetic Monolith',
    primaryColor: '#00E5FF',
    secondaryColor: '#7C8BA1',
    accentColor: '#0057FF',
    backgroundColor: '#08090C',
    textColor: '#EAEEF6',
    surfaceColor: '#10141C',
    cardColor: '#161C28',
  },
  {
    id: 'neutral-beige',
    name: 'Atelier Earth',
    primaryColor: '#23201C',
    secondaryColor: '#8C827A',
    accentColor: '#C46D47',
    backgroundColor: '#EFECE6',
    textColor: '#23201C',
    surfaceColor: '#E2DDD4',
    cardColor: '#F7F5F0',
  },
];

export type ElementType =
  | 'text'
  | 'image'
  | 'shape'
  | 'circle'
  | 'line'
  | 'divider'
  | 'barcode'
  | 'quote-block'
  | 'page-number'
  | 'logo'
  | 'header-band';

export interface ElementCrop {
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation?: number;
}

export interface ElementFrame {
  x: number; // percentage (0-100) on document canvas
  y: number; // percentage (0-100)
  width: number; // percentage (0-100)
  height: number; // percentage (0-100)
  rotation?: number; // degrees (0-360)
  zIndex?: number;
  scaleX?: number;
  scaleY?: number;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number; // pt or relative
  fontWeight: string | number;
  fontStyle?: 'normal' | 'italic';
  lineHeight?: number;
  letterSpacing?: number;
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  isDropCap?: boolean;
  dropCapLetter?: string;
  maxLines?: number;
  columns?: number;
  autoHeight?: boolean;
}

export interface ImageStyle {
  objectFit: 'cover' | 'contain' | 'fill';
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  shadow?: boolean;
  opacity?: number;
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
}

export interface ShapeStyle {
  fillColor: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  opacity?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface MagazineElement {
  id: string;
  type: ElementType;
  name: string;
  frame: ElementFrame;
  content: string; // text content, image URL, shape type
  textStyle?: TextStyle;
  imageStyle?: ImageStyle;
  shapeStyle?: ShapeStyle;
  crop?: ElementCrop;
  opacity?: number;
  visible?: boolean;
  locked?: boolean;
  isLocked?: boolean;
  editable?: boolean;
  isEditable?: boolean;
  replaceable?: boolean;
  isReplaceable?: boolean;
  groupId?: string;
  placeholderKey?: string; // e.g. 'headline', 'hero-image', 'author'
  originalDpi?: number;
  hasTextOverflow?: boolean;
}

export type AlignAction = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export type DistributeAction = 'horizontal' | 'vertical';

export interface GuideLine {
  type: 'horizontal' | 'vertical';
  position: number; // percentage (0-100)
  color?: string;
  label?: string;
}

export interface ClipboardItem {
  elements: MagazineElement[];
  copiedAt: number;
}

export type PageLayoutType =
  | 'cover'
  | 'contents'
  | 'editor-letter'
  | 'editorial-single'
  | 'editorial-spread-left'
  | 'editorial-spread-right'
  | 'interview'
  | 'product-catalogue'
  | 'product-feature'
  | 'fashion-lookbook'
  | 'quote-impact'
  | 'gallery-grid'
  | 'closing-backcover'
  | 'blank';

export interface MagazinePage {
  id: string;
  pageNumber: number;
  layoutType: PageLayoutType;
  title: string;
  backgroundColor?: string;
  backgroundImage?: string;
  elements: MagazineElement[];
  isLocked?: boolean;
}

export interface MagazineDocument {
  id: string;
  userId?: string;
  title: string;
  templateId?: string;
  dimensionKey: string; // key in PAGE_DIMENSIONS
  theme: MagazineTheme;
  pages: MagazinePage[];
  pageCount: number;
  coverFinish: 'gloss' | 'matte' | 'soft-touch';
  paperWeight: '130gsm-silk' | '170gsm-silk' | '250gsm-gloss' | '120gsm-uncoated';
  bindingType: 'saddle-stitch' | 'perfect-bound';
  version: number;
  isOrdered?: boolean;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MagazineTemplate {
  id: string;
  slug: string;
  name: string;
  category: MagazineCategory;
  subcategory?: string;
  description: string;
  styleTags: string[];
  pageCount: number;
  dimensionKey: string;
  theme: MagazineTheme;
  coverImage: string;
  spreadPreviews: string[];
  featured?: boolean;
  badge?: string;
  pages: MagazinePage[];
}

export interface PreflightIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  pageNumber: number;
  elementId?: string;
  title: string;
  message: string;
  fixSuggestion?: string;
}

export interface PreflightReport {
  timestamp: string;
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  isPrintReady: boolean;
  issues: PreflightIssue[];
}

export interface UploadedPdfInspection {
  fileName: string;
  fileSizeMb: number;
  pageCount: number;
  pageSize: string;
  orientation: PageOrientation;
  hasBleed: boolean;
  isValid: boolean;
  warnings: string[];
  errors: string[];
  previewImages?: string[];
}

export interface PdfExportOptions {
  includeBleed?: boolean;
  includeCropMarks?: boolean;
  onProgress?: (current: number, total: number) => void;
}
