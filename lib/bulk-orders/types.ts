/**
 * Types and Constants for Bulk & Custom Apparel Orders
 */

export const BULK_ORDER_TYPES = [
  'Corporate',
  'College',
  'School',
  'Event',
  'Sports Team',
  'Wedding',
  'Birthday',
  'Festival',
  'Brand Merchandise',
  'Creator Merchandise',
  'Club / Community',
  'Other',
] as const;

export type BulkOrderType = (typeof BULK_ORDER_TYPES)[number];

export const PRINTING_METHODS = [
  'DTF (Direct to Film)',
  'Screen Printing',
  'Sublimation',
  'Embroidery',
  'Vinyl Transfer',
  'Not Sure (Recommend for me)',
  'Other',
] as const;

export type PrintingMethod = (typeof PRINTING_METHODS)[number];

export const ARTWORK_PLACEMENTS = [
  { id: 'front', label: 'Front Body', defaultSize: '30 × 40 cm' },
  { id: 'back', label: 'Back Body', defaultSize: '30 × 40 cm' },
  { id: 'sleeve_left', label: 'Left Sleeve', defaultSize: '10 × 10 cm' },
  { id: 'sleeve_right', label: 'Right Sleeve', defaultSize: '10 × 10 cm' },
  { id: 'chest_logo', label: 'Chest Crest / Pocket', defaultSize: '10 × 10 cm' },
  { id: 'neck_label', label: 'Inside Neck Label', defaultSize: '6 × 6 cm' },
  { id: 'other', label: 'Other Placement', defaultSize: 'Custom' },
] as const;

export const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'] as const;
export type ApparelSize = (typeof STANDARD_SIZES)[number] | string;

export const FABRIC_OPTIONS = [
  '180 GSM Single Jersey',
  '200 GSM Combed Cotton',
  '220 GSM Premium Bio-Washed',
  '240 GSM Heavyweight Terry',
  '280 GSM French Terry Fleece',
  '320 GSM Heavy Fleece (Hoodies)',
  '100% Cotton',
  'Cotton / Poly Blend',
  'Polyester Dry-Fit',
  'Custom / Discuss with Team',
] as const;

export const BRANDING_OPTIONS = [
  { id: 'none', label: 'No custom label (Standard Fregoro tag)' },
  { id: 'neck_label', label: 'Custom Printed Inside Neck Label' },
  { id: 'woven_label', label: 'Custom Woven Hem / Sleeve Tag' },
  { id: 'hang_tags', label: 'Custom Brand Hang Tags' },
  { id: 'stickers', label: 'Custom Brand Insert Stickers' },
  { id: 'custom_packaging', label: 'Custom Branded Polybags / Boxes' },
  { id: 'other', label: 'Other Custom Branding' },
] as const;

export const PACKAGING_OPTIONS = [
  { id: 'individual', label: 'Individual Polybag per piece (Recommended)' },
  { id: 'bulk', label: 'Bulk Packaged in master cartons' },
  { id: 'custom', label: 'Custom Gift / Event Packaging' },
  { id: 'no_preference', label: 'No Preference' },
] as const;

export const BUDGET_RANGES = [
  'Under ₹10,000',
  '₹10,000 – ₹25,000',
  '₹25,000 – ₹50,000',
  '₹50,000 – ₹1,00,000',
  '₹1,00,000+',
  'Not sure (Awaiting Quote)',
] as const;

export type BulkOrderStatus =
  | 'new'
  | 'under_review'
  | 'need_more_info'
  | 'quote_sent'
  | 'customer_reviewing'
  | 'approved'
  | 'payment_pending'
  | 'paid'
  | 'production'
  | 'quality_check'
  | 'packed'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export type ArtworkReviewStatus = 'received' | 'needs_revision' | 'approved' | 'rejected';

export const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'New Request', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
  under_review: {
    label: 'Under Review',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/30',
  },
  need_more_info: {
    label: 'Information Required',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10 border-rose-400/30',
  },
  quote_sent: {
    label: 'Quote Ready',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10 border-purple-400/30',
  },
  customer_reviewing: {
    label: 'Customer Reviewing',
    color: 'text-purple-300',
    bg: 'bg-purple-300/10 border-purple-300/30',
  },
  approved: {
    label: 'Quote Approved',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10 border-emerald-400/30',
  },
  payment_pending: {
    label: 'Payment Pending',
    color: 'text-amber-300',
    bg: 'bg-amber-300/10 border-amber-300/30',
  },
  paid: {
    label: 'Paid & Confirmed',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10 border-emerald-400/30',
  },
  production: {
    label: 'In Production',
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10 border-indigo-400/30',
  },
  quality_check: {
    label: 'Quality Check',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10 border-cyan-400/30',
  },
  packed: {
    label: 'Packed & Ready',
    color: 'text-teal-400',
    bg: 'bg-teal-400/10 border-teal-400/30',
  },
  shipped: { label: 'Shipped', color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/30' },
  completed: {
    label: 'Delivered / Completed',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-zinc-400',
    bg: 'bg-zinc-400/10 border-zinc-400/30',
  },
};

export interface SizeColorMatrixRow {
  colorName: string;
  colorHex?: string;
  quantities: Record<string, number>;
  total: number;
}

export interface BulkOrderItemInput {
  id?: string;
  apparelType: string;
  productId?: string;
  productName?: string;
  fabric?: string;
  gsm?: string;
  printingMethod?: string;
  printingPlacements: string[];
  designNotes?: string;
  sizeColorMatrix: SizeColorMatrixRow[];
  totalQuantity: number;
}

export interface BulkOrderArtworkInput {
  id?: string;
  placement: string;
  label?: string;
  fileUrl: string;
  fileKey?: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  printSize?: string;
  dimensionsMm?: string;
  notes?: string;
}

export interface BulkOrderFormState {
  // Step 1: Order details
  orderType: string;
  eventName: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  estimatedQuantity?: number;
  requiredDeliveryDate?: string;
  eventDate?: string;
  isUrgent: boolean;
  websiteOrSocial?: string;
  budgetRange?: string;
  customerNotes?: string;

  // Step 2 & 4: Apparel items with size/color matrices
  items: BulkOrderItemInput[];

  // Step 3: Artworks
  artworks: BulkOrderArtworkInput[];
  printingMethodPreference?: string;
  generalDesignNotes?: string;

  // Step 4: Fabric, branding & packaging preferences
  brandingOption?: string;
  brandingNotes?: string;
  packagingOption?: string;
  packagingNotes?: string;

  // Step 5: Delivery
  shippingMethod: 'delivery' | 'pickup';
  deliveryAddress: {
    name: string;
    company?: string;
    phone: string;
    email: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    deliveryNotes?: string;
  };
  contactPreference: 'whatsapp' | 'phone' | 'email';
}

export interface BulkOrderQuoteItemData {
  id: string;
  apparelType: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  fabric?: string | null;
  printingMethod?: string | null;
}

export interface BulkOrderQuoteData {
  id: string;
  version: number;
  status: string;
  currency: string;
  subtotal: number;
  garmentPrice?: number | null;
  printingPrice?: number | null;
  printCost?: number;
  setupFee?: number;
  packagingFee?: number;
  urgencyFee?: number;
  shippingFee?: number;
  discount?: number;
  taxAmount?: number;
  tax?: number;
  totalAmount?: number;
  total?: number;
  estimatedDays?: number | null;
  validUntil?: string | null;
  expiresAt?: string | Date | null;
  acceptedAt?: string | Date | null;
  notes?: string | null;
  rejectionReason?: string | null;
  paymentGatewayPaymentId?: string | null;
  paidAt?: string | Date | null;
  createdAt: string | Date;
  items?: BulkOrderQuoteItemData[];
}

export interface BulkOrderMessageData {
  id: string;
  sender?: string;
  senderRole?: string | null;
  senderName?: string | null;
  message?: string;
  content?: string;
  attachments?: string | null;
  createdAt: string | Date;
}

export interface BulkOrderItemData {
  id: string;
  apparelType: string;
  fabric?: string | null;
  gsm?: string | null;
  branding?: string | null;
  packaging?: string | null;
  packagingNotes?: string | null;
  notes?: string | null;
  printingMethod?: string | null;
  printingPlacements: string[] | string;
  designNotes?: string | null;
  totalQuantity: number;
  sizeColorMatrix?: unknown;
  colorRows?: Array<{ color: string; hex?: string; sizes: Record<string, number> }>;
}

export interface BulkOrderArtworkData {
  id: string;
  placement: string;
  label?: string | null;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: number | null;
  printSize?: string | null;
  customDimensions?: string | null;
  dimensionsMm?: string | null;
  notes?: string | null;
  status?: string | null;
  reviewStatus?: string | null;
  reviewNotes?: string | null;
}

export interface BulkOrderActivityLogData {
  id: string;
  action: string;
  actorRole?: string;
  actorName?: string;
  details?: string | null;
  createdAt: string | Date;
}

export interface BulkOrderStatusHistoryData {
  id?: string;
  oldStatus?: string | null;
  newStatus: string;
  reason?: string | null;
  note?: string | null;
  changedBy?: string | null;
  createdAt: string | Date;
}

export interface BulkOrderAddressData {
  name?: string;
  company?: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  zip?: string;
  country?: string;
  [key: string]: unknown;
}

export interface BulkOrderEmailEventData {
  id: string;
  type: string;
  recipient: string;
  subject: string;
  providerMessageId?: string | null;
  status: string;
  error?: string | null;
  createdAt: string | Date;
}

export interface BulkOrderDetailData {
  id: string;
  requestNumber: string;
  orderType: string;
  eventName?: string | null;
  companyName?: string | null;
  contactName: string;
  phone: string;
  email: string;
  status: string;
  estimatedQuantity?: number | null;
  totalQuantity?: number;
  requiredDeliveryDate?: string | Date | null;
  eventDate?: string | Date | null;
  isUrgent: boolean;
  websiteOrSocial?: string | null;
  budgetRange?: string | null;
  customerNotes?: string | null;
  notes?: string | null;
  printingMethodPreference?: string | null;
  generalDesignNotes?: string | null;
  brandingOption?: string | null;
  brandingNotes?: string | null;
  packagingOption?: string | null;
  packagingNotes?: string | null;
  shippingMethod?: string | null;
  fulfillmentMethod?: string | null;
  deliveryAddress?: unknown;
  shippingAddress?: unknown;
  contactPreference?: string | null;
  internalNotes?: string | null;
  adminNotes?: string | null;
  assignedTo?: string | null;
  targetPricePerUnit?: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  items: BulkOrderItemData[];
  artworks: BulkOrderArtworkData[];
  quotes: BulkOrderQuoteData[];
  messages: BulkOrderMessageData[];
  activityLogs?: BulkOrderActivityLogData[];
  statusHistory?: BulkOrderStatusHistoryData[];
  emailEvents?: BulkOrderEmailEventData[];
}
