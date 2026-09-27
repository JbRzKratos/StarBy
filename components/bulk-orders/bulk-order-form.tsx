'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  Check,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  FileText,
  AlertCircle,
  Sparkles,
  Layers,
  Eye,
  Truck,
  Send,
} from 'lucide-react';
import {
  BULK_ORDER_TYPES,
  PRINTING_METHODS,
  ARTWORK_PLACEMENTS,
  STANDARD_SIZES,
  FABRIC_OPTIONS,
  BRANDING_OPTIONS,
  PACKAGING_OPTIONS,
  BUDGET_RANGES,
  type BulkOrderType,
  type BulkOrderFormState,
  type BulkOrderItemInput,
  type BulkOrderArtworkInput,
} from '@/lib/bulk-orders/types';
import { getWhatsappLink, formatBulkOrderWhatsappMessage } from '@/lib/whatsapp';
import { CustomDatePicker } from '@/components/ui/custom-date-picker';
import { CustomSelect } from '@/components/ui/custom-select';
import { MatrixQuantityCell } from './matrix-quantity-cell';

interface ApparelOption {
  id: string;
  name: string;
  categorySlug: string;
  description: string;
  recommendedFabric: string;
  sizes: string[];
  colors: Array<{ name: string; hex: string }>;
  productId?: string;
}

interface BulkOrderFormProps {
  initialOrderType?: BulkOrderType;
}

const STORAGE_KEY = 'fregoro_bulk_order_draft_v1';

export function BulkOrderForm({ initialOrderType }: BulkOrderFormProps) {
  const formRef = useRef<HTMLDivElement>(null);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [apparelCatalog, setApparelCatalog] = useState<ApparelOption[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedAccuracy, setConfirmedAccuracy] = useState(false);
  const [emailDeliveryWarning, setEmailDeliveryWarning] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<{
    requestId: string;
    requestNumber: string;
  } | null>(null);

  // Artwork print mode: 'front_only' | 'back_only' | 'front_back'
  const [printPlacementMode, setPrintPlacementMode] = useState<
    'front_only' | 'back_only' | 'front_back'
  >('front_back');

  // Form State
  const [formData, setFormData] = useState<BulkOrderFormState>({
    orderType: initialOrderType || 'Corporate',
    eventName: '',
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    estimatedQuantity: undefined,
    requiredDeliveryDate: '',
    eventDate: '',
    isUrgent: false,
    websiteOrSocial: '',
    budgetRange: 'Not sure (Awaiting Quote)',
    customerNotes: '',
    items: [],
    artworks: [],
    printingMethodPreference: 'DTF (Direct to Film)',
    generalDesignNotes: '',
    brandingOption: 'none',
    brandingNotes: '',
    packagingOption: 'individual',
    packagingNotes: '',
    shippingMethod: 'delivery',
    deliveryAddress: {
      name: '',
      company: '',
      phone: '',
      email: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'India',
      deliveryNotes: '',
    },
    contactPreference: 'whatsapp',
  });

  // 1. Fetch apparel catalog options
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch('/api/bulk-orders/apparel-options');
        const data = await res.json();
        if (data.success && Array.isArray(data.apparelTypes)) {
          setApparelCatalog(data.apparelTypes);
          // If no items in form, initialize with first option
          setFormData((prev) => {
            if (prev.items.length === 0 && data.apparelTypes.length > 0) {
              const first = data.apparelTypes[0];
              const defaultColor = first.colors[0]?.name || 'Black';
              const defaultHex = first.colors[0]?.hex || '#121214';

              return {
                ...prev,
                items: [
                  {
                    apparelType: first.name,
                    productId: first.productId,
                    fabric: first.recommendedFabric,
                    printingMethod: prev.printingMethodPreference || 'DTF (Direct to Film)',
                    printingPlacements: ['front', 'back'],
                    totalQuantity: 30,
                    sizeColorMatrix: [
                      {
                        colorName: defaultColor,
                        colorHex: defaultHex,
                        quantities: { S: 5, M: 10, L: 10, XL: 5 },
                        total: 30,
                      },
                    ],
                  },
                ],
              };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Failed to load apparel options:', err);
      } finally {
        setIsLoadingCatalog(false);
      }
    }

    loadCatalog();
  }, []);

  // Update orderType if initialOrderType changes from outside prop (e.g. clicking use case cards)
  useEffect(() => {
    if (initialOrderType) {
      setFormData((prev) => ({ ...prev, orderType: initialOrderType }));
    }
  }, [initialOrderType]);

  // Restore draft from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setFormData((prev) => ({
            ...prev,
            ...parsed,
            // Preserve prop initialOrderType if explicitly set
            orderType: initialOrderType || parsed.orderType || prev.orderType,
          }));
        }
      }
    } catch {}
  }, [initialOrderType]);

  // Save draft to localStorage
  useEffect(() => {
    if (!submittedRequest) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      } catch {}
    }
  }, [formData, submittedRequest]);

  // Calculate grand total quantity
  const grandTotalQuantity = formData.items.reduce(
    (sum, item) => sum + (item.totalQuantity || 0),
    0,
  );

  // Sync delivery address recipient name/phone/email with step 1 contact if empty
  const handleProceedToStep = (step: number) => {
    setSubmitError(null);

    // Validation for Step 1
    if (currentStep === 1) {
      if (!formData.contactName.trim()) {
        setSubmitError('Please enter your contact name.');
        return;
      }
      if (!formData.phone.trim() || formData.phone.length < 10) {
        setSubmitError('Please enter a valid phone number (at least 10 digits).');
        return;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        setSubmitError('Please enter a valid email address.');
        return;
      }

      // Pre-fill delivery details with step 1 contact info
      setFormData((prev) => ({
        ...prev,
        deliveryAddress: {
          ...prev.deliveryAddress,
          name: prev.deliveryAddress.name || prev.contactName,
          company: prev.deliveryAddress.company || prev.companyName,
          phone: prev.deliveryAddress.phone || prev.phone,
          email: prev.deliveryAddress.email || prev.email,
        },
      }));
    }

    // Validation for Step 2
    if (currentStep === 2) {
      if (formData.items.length === 0) {
        setSubmitError('Please select at least one apparel garment type.');
        return;
      }
    }

    // Validation for Step 4
    if (currentStep === 4) {
      for (const item of formData.items) {
        if (!item.totalQuantity || item.totalQuantity <= 0) {
          setSubmitError(
            `Please allocate quantities for "${item.apparelType}". Quantity cannot be 0.`,
          );
          return;
        }
      }
    }

    // Validation for Step 5
    if (currentStep === 5) {
      if (formData.shippingMethod === 'delivery') {
        if (!formData.deliveryAddress.street.trim() || !formData.deliveryAddress.city.trim()) {
          setSubmitError('Please provide your delivery street address and city.');
          return;
        }
        if (!formData.deliveryAddress.zip.trim()) {
          setSubmitError('Please provide a valid PIN code / postal code.');
          return;
        }
      }
    }

    setCurrentStep(step);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ─── Apparel Item Helpers ──────────────────────────────────────────────────

  const handleAddApparel = (apparel: ApparelOption) => {
    const existingIndex = formData.items.findIndex((i) => i.apparelType === apparel.name);
    if (existingIndex >= 0) return; // already added

    const defaultColor = apparel.colors[0]?.name || 'Black';
    const defaultHex = apparel.colors[0]?.hex || '#121214';

    const newItem: BulkOrderItemInput = {
      apparelType: apparel.name,
      productId: apparel.productId,
      fabric: apparel.recommendedFabric,
      printingMethod: formData.printingMethodPreference || 'DTF (Direct to Film)',
      printingPlacements: ['front', 'back'],
      totalQuantity: 25,
      sizeColorMatrix: [
        {
          colorName: defaultColor,
          colorHex: defaultHex,
          quantities: { S: 5, M: 10, L: 10 },
          total: 25,
        },
      ],
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleRemoveApparel = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const handleAddColorToItem = (itemIndex: number, colorName: string, colorHex?: string) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      const item = { ...updated[itemIndex] };
      const matrix = [...(item.sizeColorMatrix || [])];

      // Check if color already exists
      if (matrix.some((r) => r.colorName.toLowerCase() === colorName.toLowerCase())) {
        return prev;
      }

      matrix.push({
        colorName,
        colorHex: colorHex || '#121214',
        quantities: { M: 10, L: 10 },
        total: 20,
      });

      item.sizeColorMatrix = matrix;
      item.totalQuantity = matrix.reduce((s, r) => s + r.total, 0);
      updated[itemIndex] = item;
      return { ...prev, items: updated };
    });
  };

  const handleRemoveColorRow = (itemIndex: number, rowIndex: number) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      const item = { ...updated[itemIndex] };
      const matrix = item.sizeColorMatrix.filter((_, idx) => idx !== rowIndex);
      item.sizeColorMatrix = matrix;
      item.totalQuantity = matrix.reduce((s, r) => s + r.total, 0);
      updated[itemIndex] = item;
      return { ...prev, items: updated };
    });
  };

  const handleMatrixQuantityChange = (
    itemIndex: number,
    rowIndex: number,
    size: string,
    rawVal: string | number,
  ) => {
    const val = Math.max(0, typeof rawVal === 'number' ? rawVal : parseInt(rawVal, 10) || 0);

    setFormData((prev) => {
      const updated = [...prev.items];
      const item = { ...updated[itemIndex] };
      const matrix = [...item.sizeColorMatrix];
      const row = { ...matrix[rowIndex] };
      const quantities = { ...row.quantities, [size]: val };

      const rowTotal = Object.values(quantities).reduce((sum, q) => sum + (q || 0), 0);
      row.quantities = quantities;
      row.total = rowTotal;
      matrix[rowIndex] = row;

      item.sizeColorMatrix = matrix;
      item.totalQuantity = matrix.reduce((sum, r) => sum + r.total, 0);
      updated[itemIndex] = item;
      return { ...prev, items: updated };
    });
  };

  // ─── Artwork Upload Handler ────────────────────────────────────────────────

  const [isUploading, setIsUploading] = useState<string | null>(null); // placement id or null

  const handleFileUpload = async (placement: string, file: File) => {
    setIsUploading(placement);
    setSubmitError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('placement', placement);

      const res = await fetch('/api/bulk-orders/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Artwork upload failed');
      }

      setFormData((prev) => {
        const existingIdx = prev.artworks.findIndex((a) => a.placement === placement);
        const newArt: BulkOrderArtworkInput = {
          placement,
          label: ARTWORK_PLACEMENTS.find((p) => p.id === placement)?.label || placement,
          fileUrl: data.fileUrl,
          fileKey: data.fileKey,
          fileName: data.fileName || file.name,
          fileType: data.fileType || file.type,
          fileSize: data.fileSize || file.size,
          printSize: 'Standard',
          dimensionsMm:
            ARTWORK_PLACEMENTS.find((p) => p.id === placement)?.defaultSize || '30 × 40 cm',
        };

        if (existingIdx >= 0) {
          const updated = [...prev.artworks];
          updated[existingIdx] = newArt;
          return { ...prev, artworks: updated };
        } else {
          return { ...prev, artworks: [...prev.artworks, newArt] };
        }
      });
    } catch (err: unknown) {
      console.error('Artwork upload error:', err);
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to upload artwork file. Please check file format and size.';
      setSubmitError(msg);
    } finally {
      setIsUploading(null);
    }
  };

  const handleRemoveArtwork = (placement: string) => {
    setFormData((prev) => ({
      ...prev,
      artworks: prev.artworks.filter((a) => a.placement !== placement),
    }));
  };

  // ─── Form Submission ───────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!confirmedAccuracy) {
      setSubmitError(
        'Please check the confirmation box to verify that your order requirements and artwork are correct before submitting.',
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/bulk-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit quote request');
      }

      if (data.emailStatus && data.emailStatus.customerSent === false) {
        setEmailDeliveryWarning(true);
      }

      // Clear draft
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}

      setSubmittedRequest({
        requestId: data.requestId,
        requestNumber: data.requestNumber,
      });

      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err: unknown) {
      console.error('Submit quote request error:', err);
      const msg =
        err instanceof Error ? err.message : 'Something went wrong while submitting your request.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prefilled WhatsApp link with current order summary
  const whatsappPrefilledUrl = getWhatsappLink(
    formatBulkOrderWhatsappMessage({
      requestId: submittedRequest?.requestNumber,
      customerName: formData.contactName,
      orderType: formData.orderType,
      companyName: formData.companyName,
      eventName: formData.eventName,
      apparelTypes: formData.items.map((i) => i.apparelType),
      totalQuantity: grandTotalQuantity,
      colours: Array.from(
        new Set(formData.items.flatMap((i) => i.sizeColorMatrix.map((r) => r.colorName))),
      ),
      printingMethod: formData.printingMethodPreference,
      requiredDate: formData.requiredDeliveryDate,
      city: formData.deliveryAddress.city,
    }),
  );

  // ─── Render Success Confirmation (Section 31) ──────────────────────────────

  if (submittedRequest) {
    return (
      <div ref={formRef} className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-[#121214] border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl shadow-emerald-500/10">
          <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <Check className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="font-mono text-xs font-bold text-emerald-400 tracking-[0.25em] uppercase block">
              Request Received
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
              YOUR REQUEST IS IN
            </h2>
            <p className="text-sm sm:text-base text-pearl/80 max-w-lg mx-auto font-sans leading-relaxed">
              Thanks, <strong className="text-white">{formData.contactName}</strong>. We&apos;ve
              received your bulk order requirements.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 max-w-md mx-auto text-left space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-pearl/50 uppercase">Request ID</span>
              <span className="text-[#3B5EFF] font-bold text-sm tracking-wider">
                {submittedRequest.requestNumber}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-pearl/50 uppercase">Order Type</span>
              <span className="text-white font-medium">{formData.orderType}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-pearl/50 uppercase">Total Pieces</span>
              <span className="text-amber-400 font-bold">{grandTotalQuantity} pcs</span>
            </div>
            {formData.requiredDeliveryDate && (
              <div className="flex justify-between items-center">
                <span className="text-pearl/50 uppercase">Target Delivery</span>
                <span className="text-white font-medium">{formData.requiredDeliveryDate}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-pearl/50 uppercase">Contact Phone</span>
              <span className="text-white font-medium">{formData.phone}</span>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 max-w-md mx-auto text-center space-y-2">
            <p className="text-xs text-pearl/80 font-sans leading-relaxed">
              We&apos;ve received your artwork and order details. Our team will review your request
              and get back to you on WhatsApp within 24 hours.
            </p>
            {emailDeliveryWarning && (
              <p className="text-[11px] text-amber-300 font-mono">
                ✦ Your request was received. Our confirmation email is currently delayed. You can
                still contact us on WhatsApp.
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 max-w-md mx-auto">
            <a
              href={whatsappPrefilledUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3.5 px-6 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20"
            >
              <MessageCircle className="w-4 h-4" />
              <span>CHAT ON WHATSAPP</span>
            </a>

            <Link
              href={`/bulk-orders/request/${submittedRequest.requestNumber}`}
              className="flex-1 py-3.5 px-6 rounded-xl bg-[#3B5EFF] hover:bg-[#2b4be6] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>VIEW REQUEST</span>
            </Link>
          </div>

          <div className="pt-2">
            <Link
              href="/products/all"
              className="text-xs font-mono text-pearl/50 hover:text-white uppercase tracking-wider underline decoration-white/20 hover:decoration-white transition-colors"
            >
              CONTINUE SHOPPING
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Multi-Step Form Layout ────────────────────────────────────────────────

  const STEPS_NAV = [
    { num: 1, title: 'Details', icon: FileText },
    { num: 2, title: 'Apparel', icon: Layers },
    { num: 3, title: 'Artwork', icon: UploadCloud },
    { num: 4, title: 'Sizes & Matrix', icon: Sparkles },
    { num: 5, title: 'Delivery', icon: Truck },
    { num: 6, title: 'Review', icon: Check },
  ];

  return (
    <div ref={formRef} className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20 relative z-20">
      {/* Progress Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 overflow-x-auto scrollbar-none">
          {STEPS_NAV.map((s) => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num < currentStep) handleProceedToStep(s.num);
                }}
                disabled={s.num > currentStep}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#3B5EFF] text-white shadow-lg shadow-[#3B5EFF]/20'
                    : isCompleted
                      ? 'text-emerald-400 hover:bg-white/5 cursor-pointer'
                      : 'text-pearl/40 cursor-not-allowed'
                }`}
              >
                <span>{s.num.toString().padStart(2, '0')}</span>
                <span>{s.title}</span>
                {isCompleted && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Message Box */}
      {submitError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-sans flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1">{submitError}</div>
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            className="text-rose-400 hover:text-white font-mono text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Step Contents */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md relative z-20">
        {/* ──────────────── STEP 1: ORDER DETAILS ──────────────── */}
        {currentStep === 1 && (
          <div className="space-y-8">
            <div className="space-y-1">
              <span className="font-mono text-xs text-[#3B5EFF] uppercase font-bold tracking-widest block">
                Step 01 / 06
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                Tell Us About Your Order
              </h2>
              <p className="text-xs sm:text-sm text-pearl/70 font-sans">
                Help us understand the purpose and timeline so we can provide tailored pricing.
              </p>
            </div>

            {/* Order Type Buttons */}
            <div className="space-y-2.5">
              <label className="block text-xs font-mono text-pearl/70 uppercase tracking-wider font-semibold">
                What Type Of Order Is This? *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {BULK_ORDER_TYPES.map((type) => {
                  const isSelected = formData.orderType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, orderType: type }))}
                      className={`p-3 rounded-xl border text-left font-mono text-xs font-medium tracking-wide transition-all ${
                        isSelected
                          ? 'bg-[#3B5EFF] border-[#3B5EFF] text-white shadow-md shadow-[#3B5EFF]/25'
                          : 'bg-white/[0.03] border-white/10 text-pearl/80 hover:bg-white/[0.07] hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event Name & Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-xs font-mono text-pearl/70 uppercase tracking-wider font-semibold">
                  Purpose / Event Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Annual Tech Symposium, Summer Fest"
                  value={formData.eventName}
                  onChange={(e) => setFormData((p) => ({ ...p, eventName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-pearl/30 text-sm focus:outline-none focus:border-[#3B5EFF] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono text-pearl/70 uppercase tracking-wider font-semibold">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Tech Pvt Ltd, Loyola College"
                  value={formData.companyName}
                  onChange={(e) => setFormData((p) => ({ ...p, companyName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-pearl/30 text-sm focus:outline-none focus:border-[#3B5EFF] transition-colors"
                />
              </div>
            </div>

            {/* Contact Person, Phone, Email */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-2">
                <label className="block text-xs font-mono text-pearl/70 uppercase tracking-wider font-semibold">
                  Contact Person *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your full name"
                  value={formData.contactName}
                  onChange={(e) => setFormData((p) => ({ ...p, contactName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-pearl/30 text-sm focus:outline-none focus:border-[#3B5EFF] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono text-pearl/70 uppercase tracking-wider font-semibold">
                  Phone (WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-pearl/30 text-sm focus:outline-none focus:border-[#3B5EFF] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono text-pearl/70 uppercase tracking-wider font-semibold">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-pearl/30 text-sm focus:outline-none focus:border-[#3B5EFF] transition-colors"
                />
              </div>
            </div>

            {/* Target Delivery Date & Urgent Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div className="space-y-2">
                <CustomDatePicker
                  label="When Do You Need The Order Delivered?"
                  value={formData.requiredDeliveryDate}
                  onChange={(dateStr) =>
                    setFormData((p) => ({ ...p, requiredDeliveryDate: dateStr }))
                  }
                  minDate={new Date()}
                  placeholder="Select delivery target date"
                  required
                />
                <p className="text-[11px] text-pearl/50 font-sans">
                  Final timelines will be confirmed by our production team upon quote generation.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono text-pearl/70 uppercase tracking-wider font-semibold mb-2">
                  Is This An Urgent / Fast-Track Order?
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, isUrgent: false }))}
                    className={`flex-1 py-3 px-4 rounded-xl border font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                      !formData.isUrgent
                        ? 'bg-white/10 border-white/30 text-white'
                        : 'bg-white/[0.02] border-white/10 text-pearl/60 hover:text-white'
                    }`}
                  >
                    No (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, isUrgent: true }))}
                    className={`flex-1 py-3 px-4 rounded-xl border font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                      formData.isUrgent
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-white/[0.02] border-white/10 text-pearl/60 hover:text-white'
                    }`}
                  >
                    ⚡ Yes (Urgent)
                  </button>
                </div>
                {formData.isUrgent && (
                  <p className="text-[11px] text-amber-400 font-sans mt-2">
                    ⚠️ Urgent orders receive express scheduling and direct team priority.
                  </p>
                )}
              </div>
            </div>

            {/* Optional Budget & Website */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div>
                <CustomSelect
                  label="Approximate Budget (Optional)"
                  value={formData.budgetRange}
                  onChange={(val) => setFormData((p) => ({ ...p, budgetRange: val }))}
                  options={BUDGET_RANGES as unknown as string[]}
                  placeholder="Select budget range"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono text-pearl/70 uppercase tracking-wider font-semibold">
                  Website / Instagram / Social Link (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.websiteOrSocial}
                  onChange={(e) => setFormData((p) => ({ ...p, websiteOrSocial: e.target.value }))}
                  className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-pearl/30 text-sm focus:outline-none focus:border-[#3B5EFF] transition-colors"
                />
              </div>
            </div>

            {/* Next Button */}
            <div className="pt-6 flex justify-end">
              <button
                type="button"
                onClick={() => handleProceedToStep(2)}
                className="px-8 py-4 rounded-xl bg-[#3B5EFF] hover:bg-[#2b4be6] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-[#3B5EFF]/20 cursor-pointer"
              >
                <span>Continue To Apparel</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ──────────────── STEP 2: CHOOSE APPAREL ──────────────── */}
        {currentStep === 2 && (
          <div className="space-y-8">
            <div className="space-y-1">
              <span className="font-mono text-xs text-[#3B5EFF] uppercase font-bold tracking-widest block">
                Step 02 / 06
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                Choose Your Apparel Garments
              </h2>
              <p className="text-xs sm:text-sm text-pearl/70 font-sans">
                Select one or multiple garment styles for your bulk order. You can mix styles (e.g.
                100 Tees + 25 Hoodies).
              </p>
            </div>

            {/* Currently Selected Apparel */}
            <div className="space-y-3">
              <label className="block text-xs font-mono text-pearl/70 uppercase tracking-wider font-semibold">
                Selected Apparel ({formData.items.length})
              </label>

              {formData.items.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-white/20 rounded-2xl space-y-2">
                  <p className="font-mono text-xs text-pearl/50 uppercase">
                    No apparel selected yet
                  </p>
                  <p className="text-xs text-pearl/70">
                    Pick at least one garment style below to proceed.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-white/[0.04] border border-[#3B5EFF]/40 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-display text-sm font-bold uppercase text-white">
                          {item.apparelType}
                        </div>
                        <div className="text-[11px] font-mono text-pearl/60 mt-0.5">
                          {item.fabric || 'Premium Cotton'} · {item.totalQuantity} pcs
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveApparel(idx)}
                        className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Apparel Catalog Grid */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <label className="block text-xs font-mono text-pearl/70 uppercase tracking-wider font-semibold">
                Available Apparel Catalog
              </label>

              {isLoadingCatalog ? (
                <div className="p-12 text-center text-pearl/50 font-mono text-xs animate-pulse">
                  Loading catalog garments...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {apparelCatalog.map((apparel) => {
                    const isSelected = formData.items.some((i) => i.apparelType === apparel.name);

                    return (
                      <div
                        key={apparel.id}
                        className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                          isSelected
                            ? 'bg-[#3B5EFF]/10 border-[#3B5EFF]'
                            : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-white/5 text-pearl/70">
                              {apparel.categorySlug}
                            </span>
                            {isSelected && (
                              <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400 font-bold uppercase">
                                <Check className="w-3 h-3" /> Added
                              </span>
                            )}
                          </div>

                          <h3 className="font-display text-base font-bold uppercase text-white">
                            {apparel.name}
                          </h3>

                          <p className="text-xs text-pearl/60 font-sans leading-relaxed">
                            {apparel.description}
                          </p>

                          {/* Color Swatches */}
                          <div className="pt-2">
                            <span className="text-[10px] font-mono text-pearl/40 uppercase block mb-1.5">
                              Available Swatches ({apparel.colors.length}):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {apparel.colors.slice(0, 6).map((c, cIdx) => (
                                <span
                                  key={cIdx}
                                  title={c.name}
                                  className="w-4 h-4 rounded-full border border-white/20 inline-block shadow-sm"
                                  style={{ backgroundColor: c.hex }}
                                />
                              ))}
                              {apparel.colors.length > 6 && (
                                <span className="text-[10px] font-mono text-pearl/50 self-center">
                                  +{apparel.colors.length - 6}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-5 mt-4 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[11px] font-mono text-pearl/50">
                            {apparel.recommendedFabric.split(' ')[0]}{' '}
                            {apparel.recommendedFabric.split(' ')[1]}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              isSelected
                                ? handleRemoveApparel(
                                    formData.items.findIndex((i) => i.apparelType === apparel.name),
                                  )
                                : handleAddApparel(apparel)
                            }
                            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                                : 'bg-[#3B5EFF] text-white hover:bg-[#2b4be6]'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Trash2 className="w-3 h-3" /> Remove
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" /> Select
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Nav Buttons */}
            <div className="pt-6 flex justify-between">
              <button
                type="button"
                onClick={() => handleProceedToStep(1)}
                className="px-6 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 text-pearl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => handleProceedToStep(3)}
                disabled={formData.items.length === 0}
                className="px-8 py-3.5 rounded-xl bg-[#3B5EFF] hover:bg-[#2b4be6] disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-[#3B5EFF]/20 cursor-pointer"
              >
                <span>Continue To Artwork</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ──────────────── STEP 3: UPLOAD ARTWORK ──────────────── */}
        {currentStep === 3 && (
          <div className="space-y-8">
            <div className="space-y-1">
              <span className="font-mono text-xs text-[#3B5EFF] uppercase font-bold tracking-widest block">
                Step 03 / 06
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                Upload Artwork & Placements
              </h2>
              <p className="text-xs sm:text-sm text-pearl/70 font-sans">
                Upload front, back, or sleeve graphics. You can also specify print dimensions and
                techniques.
              </p>
            </div>

            {/* Placement Mode Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-mono text-pearl/70 uppercase tracking-wider font-semibold">
                Print Placements *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'front_only' as const, label: 'Front Only' },
                  { id: 'back_only' as const, label: 'Back Only' },
                  { id: 'front_back' as const, label: 'Front + Back' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPrintPlacementMode(mode.id)}
                    className={`py-3 px-4 rounded-xl border font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                      printPlacementMode === mode.id
                        ? 'bg-[#3B5EFF] border-[#3B5EFF] text-white shadow-lg shadow-[#3B5EFF]/20'
                        : 'bg-white/[0.03] border-white/10 text-pearl/70 hover:text-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Front & Back Artwork Upload Dropzones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Front Upload */}
              {(printPlacementMode === 'front_only' || printPlacementMode === 'front_back') && (
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-base font-bold uppercase text-white">
                      Front Design Artwork
                    </span>
                    <span className="font-mono text-[10px] text-pearl/50 uppercase">
                      Default: 30 × 40 cm
                    </span>
                  </div>

                  {formData.artworks.find((a) => a.placement === 'front') ? (
                    <div className="space-y-3">
                      <div className="relative rounded-xl border border-white/20 overflow-hidden bg-black/60 h-44 flex items-center justify-center p-2 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formData.artworks.find((a) => a.placement === 'front')?.fileUrl}
                          alt="Front Artwork"
                          className="max-h-full max-w-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveArtwork('front')}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-mono text-xs uppercase"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs font-mono text-pearl/60">
                        <span className="truncate max-w-[200px]">
                          {formData.artworks.find((a) => a.placement === 'front')?.fileName}
                        </span>
                        <span className="text-emerald-400 font-bold">✓ Ready</span>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-white/20 hover:border-[#3B5EFF] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-white/[0.01] hover:bg-[#3B5EFF]/5 group">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('front', file);
                        }}
                      />
                      <UploadCloud className="w-10 h-10 text-pearl/50 group-hover:text-[#3B5EFF] transition-colors mb-2" />
                      <span className="font-mono text-xs font-bold uppercase text-white">
                        {isUploading === 'front' ? 'Uploading Artwork...' : 'Upload Front Design'}
                      </span>
                      <span className="text-[11px] text-pearl/50 font-sans mt-1">
                        PNG, JPG, SVG, or PDF up to 50MB (300 DPI recommended)
                      </span>
                    </label>
                  )}
                </div>
              )}

              {/* Back Upload */}
              {(printPlacementMode === 'back_only' || printPlacementMode === 'front_back') && (
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-base font-bold uppercase text-white">
                      Back Design Artwork
                    </span>
                    <span className="font-mono text-[10px] text-pearl/50 uppercase">
                      Default: 30 × 40 cm
                    </span>
                  </div>

                  {formData.artworks.find((a) => a.placement === 'back') ? (
                    <div className="space-y-3">
                      <div className="relative rounded-xl border border-white/20 overflow-hidden bg-black/60 h-44 flex items-center justify-center p-2 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formData.artworks.find((a) => a.placement === 'back')?.fileUrl}
                          alt="Back Artwork"
                          className="max-h-full max-w-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveArtwork('back')}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-mono text-xs uppercase"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs font-mono text-pearl/60">
                        <span className="truncate max-w-[200px]">
                          {formData.artworks.find((a) => a.placement === 'back')?.fileName}
                        </span>
                        <span className="text-emerald-400 font-bold">✓ Ready</span>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-white/20 hover:border-[#3B5EFF] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-white/[0.01] hover:bg-[#3B5EFF]/5 group">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('back', file);
                        }}
                      />
                      <UploadCloud className="w-10 h-10 text-pearl/50 group-hover:text-[#3B5EFF] transition-colors mb-2" />
                      <span className="font-mono text-xs font-bold uppercase text-white">
                        {isUploading === 'back' ? 'Uploading Artwork...' : 'Upload Back Design'}
                      </span>
                      <span className="text-[11px] text-pearl/50 font-sans mt-1">
                        PNG, JPG, SVG, or PDF up to 50MB (300 DPI recommended)
                      </span>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Additional Artwork Placements (Sleeve, Chest, Neck, etc.) */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-sm font-bold uppercase text-white">
                    Additional Artwork Placements (Optional)
                  </h4>
                  <p className="text-xs text-pearl/60">
                    Add sleeve logos, chest crests, inside neck tags, or custom hem prints.
                  </p>
                </div>
              </div>

              {/* Uploaded additional artworks list */}
              {formData.artworks
                .filter((a) => a.placement !== 'front' && a.placement !== 'back')
                .map((art, aIdx) => (
                  <div
                    key={aIdx}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={art.fileUrl}
                          alt={art.label || ''}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="font-mono text-xs font-bold text-white uppercase">
                          {art.label}
                        </div>
                        <div className="text-[11px] text-pearl/50 font-mono truncate max-w-[200px]">
                          {art.fileName} · {art.dimensionsMm}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveArtwork(art.placement)}
                      className="p-2 text-rose-400 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

              {/* Add Placement Dropdown Selector */}
              <div className="flex flex-wrap gap-2 pt-1">
                {ARTWORK_PLACEMENTS.filter(
                  (p) =>
                    p.id !== 'front' &&
                    p.id !== 'back' &&
                    !formData.artworks.some((a) => a.placement === p.id),
                ).map((placement) => (
                  <label
                    key={placement.id}
                    className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-pearl/80 hover:text-white font-mono text-xs flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(placement.id, file);
                      }}
                    />
                    <Plus className="w-3.5 h-3.5 text-[#3B5EFF]" />
                    <span>+ Add {placement.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Printing Method & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-white/5">
              <div className="space-y-2">
                <CustomSelect
                  label="Preferred Printing Method"
                  value={formData.printingMethodPreference}
                  onChange={(val) => setFormData((p) => ({ ...p, printingMethodPreference: val }))}
                  options={PRINTING_METHODS as unknown as string[]}
                  placeholder="Select preferred print method"
                />
                <p className="text-[11px] text-pearl/50 font-sans">
                  Select &quot;Not Sure&quot; if you&apos;d like our technical team to recommend the
                  optimal print method.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono text-pearl/70 uppercase tracking-wider font-semibold">
                  Design Instructions & Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us where you'd like the design placed, approximate print size in cm, Pantone colors, or anything our production crew should know."
                  value={formData.generalDesignNotes}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, generalDesignNotes: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-pearl/30 text-sm focus:outline-none focus:border-[#3B5EFF] transition-colors resize-none"
                />
              </div>
            </div>

            {/* Nav Buttons */}
            <div className="pt-6 flex justify-between">
              <button
                type="button"
                onClick={() => handleProceedToStep(2)}
                className="px-6 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 text-pearl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => handleProceedToStep(4)}
                className="px-8 py-3.5 rounded-xl bg-[#3B5EFF] hover:bg-[#2b4be6] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-[#3B5EFF]/20 cursor-pointer"
              >
                <span>Continue To Sizes & Matrix</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ──────────────── STEP 4: SIZES & COLOUR MATRIX ──────────────── */}
        {currentStep === 4 && (
          <div className="space-y-8">
            <div className="space-y-1">
              <span className="font-mono text-xs text-[#3B5EFF] uppercase font-bold tracking-widest block">
                Step 04 / 06
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                Colours, Sizes & Quantity Matrix
              </h2>
              <p className="text-xs sm:text-sm text-pearl/70 font-sans">
                Allocate precise piece counts across colors and sizes. Totals are calculated
                automatically.
              </p>
            </div>

            {/* Matrix per selected apparel item */}
            <div className="space-y-8">
              {formData.items.map((item, itemIdx) => {
                const catalogMatch = apparelCatalog.find((c) => c.name === item.apparelType);
                const availableColors = catalogMatch?.colors || [
                  { name: 'Black', hex: '#121214' },
                  { name: 'White', hex: '#FFFFFF' },
                  { name: 'Navy', hex: '#1B263B' },
                  { name: 'Charcoal', hex: '#333333' },
                ];

                return (
                  <div
                    key={itemIdx}
                    className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-6"
                  >
                    {/* Item Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-white">
                            {item.apparelType}
                          </h3>
                          <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-400/10">
                            {item.totalQuantity} pcs
                          </span>
                        </div>
                        <p className="text-xs text-pearl/60 font-sans mt-0.5">
                          Configure fabric grade and piece counts by color and size.
                        </p>
                      </div>

                      {/* Fabric Grade Selector */}
                      <div className="sm:w-64">
                        <CustomSelect
                          label="Fabric Specification"
                          value={
                            item.fabric || catalogMatch?.recommendedFabric || FABRIC_OPTIONS[0]
                          }
                          onChange={(val) => {
                            setFormData((prev) => {
                              const updated = [...prev.items];
                              updated[itemIdx] = { ...updated[itemIdx], fabric: val };
                              return { ...prev, items: updated };
                            });
                          }}
                          options={FABRIC_OPTIONS as unknown as string[]}
                          placeholder="Select fabric grade"
                        />
                      </div>
                    </div>

                    {/* Size Matrix Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-pearl/50 uppercase">
                            <th className="py-2.5 px-3 min-w-[130px]">Color</th>
                            {STANDARD_SIZES.map((sz) => (
                              <th key={sz} className="py-2.5 px-2 text-center min-w-[64px]">
                                {sz}
                              </th>
                            ))}
                            <th className="py-2.5 px-3 text-right min-w-[70px]">Total</th>
                            <th className="py-2.5 px-2 text-center w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {item.sizeColorMatrix.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-white/[0.01]">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                                    style={{ backgroundColor: row.colorHex || '#121214' }}
                                  />
                                  <span className="font-bold text-white truncate max-w-[110px]">
                                    {row.colorName}
                                  </span>
                                </div>
                              </td>

                              {STANDARD_SIZES.map((sz) => (
                                <td key={sz} className="py-2 px-1 text-center">
                                  <MatrixQuantityCell
                                    value={row.quantities?.[sz]}
                                    sizeLabel={sz}
                                    colorName={row.colorName}
                                    onChange={(newVal) =>
                                      handleMatrixQuantityChange(itemIdx, rIdx, sz, newVal)
                                    }
                                  />
                                </td>
                              ))}

                              <td className="py-3 px-3 text-right font-bold text-amber-400">
                                {row.total}
                              </td>

                              <td className="py-3 px-2 text-center">
                                {item.sizeColorMatrix.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveColorRow(itemIdx, rIdx)}
                                    className="text-pearl/40 hover:text-rose-400 transition-colors p-1"
                                    title="Delete color row"
                                  >
                                    ✕
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-white/10 font-bold">
                            <td className="py-3 px-3 text-pearl uppercase">
                              Total {item.apparelType}
                            </td>
                            {STANDARD_SIZES.map((sz) => {
                              const szTotal = item.sizeColorMatrix.reduce(
                                (s, r) => s + (r.quantities?.[sz] || 0),
                                0,
                              );
                              return (
                                <td key={sz} className="py-3 px-1 text-center text-pearl/70">
                                  {szTotal > 0 ? szTotal : '-'}
                                </td>
                              );
                            })}
                            <td className="py-3 px-3 text-right text-emerald-400 text-sm">
                              {item.totalQuantity} pcs
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Add Another Color Button */}
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-pearl/50 uppercase tracking-wider">
                        + Add Another Color:
                      </span>
                      {availableColors
                        .filter(
                          (c) =>
                            !item.sizeColorMatrix.some(
                              (r) => r.colorName.toLowerCase() === c.name.toLowerCase(),
                            ),
                        )
                        .map((c, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => handleAddColorToItem(itemIdx, c.name, c.hex)}
                            className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-pearl/80 hover:text-white flex items-center gap-1.5 transition-colors"
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white/20"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span>{c.name}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Branding, Packaging & Labeling Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/10">
              <div className="space-y-2">
                <CustomSelect
                  label="Custom Branding & Labeling (Optional)"
                  value={formData.brandingOption}
                  onChange={(val) => setFormData((p) => ({ ...p, brandingOption: val }))}
                  options={BRANDING_OPTIONS.map((bo) => ({ value: bo.id, label: bo.label }))}
                  placeholder="Select branding customization"
                />
                {formData.brandingOption !== 'none' && (
                  <input
                    type="text"
                    placeholder="Provide details on woven label placement, size, or tags..."
                    value={formData.brandingNotes}
                    onChange={(e) => setFormData((p) => ({ ...p, brandingNotes: e.target.value }))}
                    className="w-full mt-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-pearl/30 text-xs focus:outline-none focus:border-[#3B5EFF] transition-colors"
                  />
                )}
              </div>

              <div className="space-y-2">
                <CustomSelect
                  label="Packaging Preference"
                  value={formData.packagingOption}
                  onChange={(val) => setFormData((p) => ({ ...p, packagingOption: val }))}
                  options={PACKAGING_OPTIONS.map((po) => ({ value: po.id, label: po.label }))}
                  placeholder="Select packaging type"
                />
                {formData.packagingOption === 'custom' && (
                  <input
                    type="text"
                    placeholder="Custom packaging notes (e.g. customized gift box with printed sleeve)..."
                    value={formData.packagingNotes}
                    onChange={(e) => setFormData((p) => ({ ...p, packagingNotes: e.target.value }))}
                    className="w-full mt-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-pearl/30 text-xs focus:outline-none focus:border-[#3B5EFF] transition-colors"
                  />
                )}
              </div>
            </div>

            {/* Total Quantity Summary Banner */}
            <div className="p-4 rounded-xl bg-[#3B5EFF]/10 border border-[#3B5EFF]/30 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs uppercase text-pearl/60 block">
                  Overall Order Volume
                </span>
                <span className="font-display text-xl font-bold uppercase text-white">
                  {grandTotalQuantity} Total Pieces
                </span>
              </div>
              <div className="text-right text-xs font-mono text-pearl/60">
                <span>{formData.items.length} apparel style(s)</span>
              </div>
            </div>

            {/* Nav Buttons */}
            <div className="pt-6 flex justify-between">
              <button
                type="button"
                onClick={() => handleProceedToStep(3)}
                className="px-6 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 text-pearl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => handleProceedToStep(5)}
                disabled={grandTotalQuantity <= 0}
                className="px-8 py-3.5 rounded-xl bg-[#3B5EFF] hover:bg-[#2b4be6] disabled:opacity-50 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-[#3B5EFF]/20 cursor-pointer"
              >
                <span>Continue To Delivery</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ──────────────── STEP 5: DELIVERY DETAILS ──────────────── */}
        {currentStep === 5 && (
          <div className="space-y-8">
            <div className="space-y-1">
              <span className="font-mono text-xs text-[#3B5EFF] uppercase font-bold tracking-widest block">
                Step 05 / 06
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                Delivery & Contact Preferences
              </h2>
              <p className="text-xs sm:text-sm text-pearl/70 font-sans">
                Where should the order be dispatched, and how would you like our team to
                communicate?
              </p>
            </div>

            {/* Shipping vs Pickup Toggle */}
            <div className="space-y-2">
              <label className="block text-xs font-mono text-pearl/70 uppercase tracking-wider font-semibold">
                Fulfillment Method
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, shippingMethod: 'delivery' }))}
                  className={`p-4 rounded-xl border text-left font-mono text-xs transition-all ${
                    formData.shippingMethod === 'delivery'
                      ? 'bg-[#3B5EFF]/15 border-[#3B5EFF] text-white'
                      : 'bg-white/[0.02] border-white/10 text-pearl/60'
                  }`}
                >
                  <div className="font-bold uppercase text-sm mb-1 text-white">
                    Doorstep Express Delivery
                  </div>
                  <p className="text-[11px] text-pearl/70 font-sans">
                    Insured courier delivery across India directly to your office, venue, or campus.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, shippingMethod: 'pickup' }))}
                  className={`p-4 rounded-xl border text-left font-mono text-xs transition-all ${
                    formData.shippingMethod === 'pickup'
                      ? 'bg-[#3B5EFF]/15 border-[#3B5EFF] text-white'
                      : 'bg-white/[0.02] border-white/10 text-pearl/60'
                  }`}
                >
                  <div className="font-bold uppercase text-sm mb-1 text-white">Studio Pickup</div>
                  <p className="text-[11px] text-pearl/70 font-sans">
                    Collect directly from Fregoro Studios production hub upon notification.
                  </p>
                </button>
              </div>
            </div>

            {/* Delivery Address Fields */}
            {formData.shippingMethod === 'delivery' && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-pearl/70 uppercase font-semibold">
                      Recipient / Company Contact *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.deliveryAddress.name}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          deliveryAddress: { ...p.deliveryAddress, name: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-pearl/70 uppercase font-semibold">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Building, street, landmark..."
                      value={formData.deliveryAddress.street}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          deliveryAddress: { ...p.deliveryAddress, street: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-pearl/70 uppercase font-semibold">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.deliveryAddress.city}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          deliveryAddress: { ...p.deliveryAddress, city: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-pearl/70 uppercase font-semibold">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.deliveryAddress.state}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          deliveryAddress: { ...p.deliveryAddress, state: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-pearl/70 uppercase font-semibold">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.deliveryAddress.zip}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          deliveryAddress: { ...p.deliveryAddress, zip: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-pearl/70 uppercase font-semibold">
                      Country
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.deliveryAddress.country}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/10 text-pearl/50 text-sm cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Preferred Contact Mode */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-mono text-pearl/70 uppercase tracking-wider font-semibold">
                How Would You Like Us To Contact You? *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'whatsapp' as const, label: 'WhatsApp (Fastest)' },
                  { id: 'phone' as const, label: 'Phone Call' },
                  { id: 'email' as const, label: 'Email' },
                ].map((cp) => (
                  <button
                    key={cp.id}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, contactPreference: cp.id }))}
                    className={`py-3 px-4 rounded-xl border font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                      formData.contactPreference === cp.id
                        ? 'bg-[#3B5EFF] border-[#3B5EFF] text-white shadow-md shadow-[#3B5EFF]/20'
                        : 'bg-white/[0.03] border-white/10 text-pearl/70 hover:text-white'
                    }`}
                  >
                    {cp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Customer Message / Specific Needs */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-mono text-pearl/70 uppercase tracking-wider font-semibold">
                Anything Else We Should Know? (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Need delivery before college fest on Friday; need separate polybags per employee name; need male and female fits."
                value={formData.customerNotes}
                onChange={(e) => setFormData((p) => ({ ...p, customerNotes: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-pearl/30 text-sm focus:outline-none focus:border-[#3B5EFF] transition-colors resize-none"
              />
            </div>

            {/* Nav Buttons */}
            <div className="pt-6 flex justify-between">
              <button
                type="button"
                onClick={() => handleProceedToStep(4)}
                className="px-6 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 text-pearl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => handleProceedToStep(6)}
                className="px-8 py-3.5 rounded-xl bg-[#3B5EFF] hover:bg-[#2b4be6] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-[#3B5EFF]/20 cursor-pointer"
              >
                <span>Review & Submit</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ──────────────── STEP 6: REVIEW & SUBMIT ──────────────── */}
        {currentStep === 6 && (
          <div className="space-y-8">
            <div className="space-y-1">
              <span className="font-mono text-xs text-[#3B5EFF] uppercase font-bold tracking-widest block">
                Step 06 / 06
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                REVIEW YOUR REQUEST
              </h2>
              <p className="text-xs sm:text-sm text-pearl/70 font-sans">
                Please double-check all details below. Once verified, submit your request to receive
                an official itemized quotation and digital proofing.
              </p>
            </div>

            {/* Summary Grid */}
            <div className="space-y-4 text-xs font-mono">
              {/* 01. Customer & Order Details */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-display text-sm font-bold uppercase text-white">
                    01. Customer &amp; Order Details
                  </span>
                  <button
                    type="button"
                    onClick={() => handleProceedToStep(1)}
                    className="text-[#3B5EFF] hover:underline uppercase text-[11px]"
                  >
                    Edit ↗
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-pearl/70">
                  <div>
                    <span className="text-pearl/40 block text-[10px] uppercase">Order Type</span>
                    <span className="text-white font-bold">{formData.orderType}</span>
                  </div>
                  <div>
                    <span className="text-pearl/40 block text-[10px] uppercase">
                      Contact Person
                    </span>
                    <span className="text-white font-bold">{formData.contactName}</span>
                  </div>
                  <div>
                    <span className="text-pearl/40 block text-[10px] uppercase">Phone</span>
                    <span className="text-white font-bold">{formData.phone}</span>
                  </div>
                  <div>
                    <span className="text-pearl/40 block text-[10px] uppercase">Email</span>
                    <span className="text-white font-bold">{formData.email}</span>
                  </div>
                  {formData.companyName && (
                    <div>
                      <span className="text-pearl/40 block text-[10px] uppercase">Company</span>
                      <span className="text-white">{formData.companyName}</span>
                    </div>
                  )}
                  {formData.eventName && (
                    <div>
                      <span className="text-pearl/40 block text-[10px] uppercase">Event Name</span>
                      <span className="text-white">{formData.eventName}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-pearl/40 block text-[10px] uppercase">Required Date</span>
                    <span className="text-white font-bold">
                      {formData.requiredDeliveryDate || 'Flexible'}
                    </span>
                  </div>
                  <div>
                    <span className="text-pearl/40 block text-[10px] uppercase">
                      Contact Preference
                    </span>
                    <span className="text-[#25D366] font-bold uppercase">
                      {formData.contactPreference}
                    </span>
                  </div>
                  {formData.isUrgent && (
                    <div className="text-amber-400 font-bold col-span-2">
                      ⚡ Urgent / Priority Order Flagged
                    </div>
                  )}
                </div>
              </div>

              {/* 02. Apparel, Colours & Exact Size Matrix */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-display text-sm font-bold uppercase text-white">
                    02. Apparel &amp; Size Quantities ({grandTotalQuantity} Pieces Total)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleProceedToStep(4)}
                    className="text-[#3B5EFF] hover:underline uppercase text-[11px]"
                  >
                    Edit ↗
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3"
                    >
                      <div className="flex justify-between items-center text-white font-bold">
                        <span className="text-sm">
                          #{idx + 1}. {item.apparelType}
                        </span>
                        <span className="text-amber-400 font-mono text-sm">
                          {item.totalQuantity} PCS
                        </span>
                      </div>
                      <div className="text-[11px] text-pearl/60">
                        Fabric: {item.fabric || 'Studio Standard'} · GSM: {item.gsm || '240 GSM'} ·
                        Print Method: {item.printingMethod}
                      </div>

                      {/* Exact Size/Color Table */}
                      <div className="space-y-2 pt-1">
                        {item.sizeColorMatrix.map((r, rIdx) => (
                          <div
                            key={rIdx}
                            className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 space-y-1.5"
                          >
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-2 font-bold text-white uppercase text-[11px]">
                                <span
                                  className="w-3 h-3 rounded-full border border-white/20 inline-block shrink-0"
                                  style={{ backgroundColor: r.colorHex || '#121214' }}
                                />
                                {r.colorName}
                              </span>
                              <span className="text-amber-400 font-bold font-mono">
                                Total: {r.total}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 text-[11px]">
                              {Object.entries(r.quantities || {})
                                .filter(([_, q]) => q > 0)
                                .map(([sz, q]) => (
                                  <span
                                    key={sz}
                                    className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-pearl/90"
                                  >
                                    <strong className="text-white">{sz}:</strong> {q}
                                  </span>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 03. Artwork & Placements (Replace / Remove actions) */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-display text-sm font-bold uppercase text-white">
                    03. Artwork Dossier ({formData.artworks.length} Files)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleProceedToStep(3)}
                    className="text-[#3B5EFF] hover:underline uppercase text-[11px]"
                  >
                    Edit / Add ↗
                  </button>
                </div>

                {formData.artworks.length === 0 ? (
                  <p className="text-pearl/50 text-xs">
                    No files uploaded directly. You can submit your artwork now or share it directly
                    over WhatsApp.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formData.artworks.map((art, aIdx) => (
                      <div
                        key={aIdx}
                        className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-12 h-12 rounded-lg bg-black border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={art.fileUrl}
                              alt={art.label || ''}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <div className="overflow-hidden">
                            <div className="font-bold text-white uppercase text-[11px]">
                              {art.label || art.placement}
                            </div>
                            <div className="text-[10px] text-pearl/50 truncate max-w-[150px]">
                              {art.fileName}
                            </div>
                            <div className="text-[10px] text-pearl/40">
                              {art.dimensionsMm || art.printSize || 'Standard'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleProceedToStep(3)}
                            className="text-[10px] text-[#3B5EFF] hover:underline uppercase"
                          >
                            Replace
                          </button>
                          <span className="text-white/20">|</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveArtwork(art.placement)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 uppercase"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 04. Packaging, Branding & Delivery */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-display text-sm font-bold uppercase text-white">
                    04. Packaging, Branding &amp; Delivery
                  </span>
                  <button
                    type="button"
                    onClick={() => handleProceedToStep(5)}
                    className="text-[#3B5EFF] hover:underline uppercase text-[11px]"
                  >
                    Edit ↗
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-pearl/80">
                  <div>
                    <span className="text-pearl/40 block text-[10px] uppercase">
                      Packaging Option
                    </span>
                    <span className="text-white">
                      {PACKAGING_OPTIONS.find((p) => p.id === formData.packagingOption)?.label ||
                        formData.packagingOption}
                    </span>
                  </div>
                  <div>
                    <span className="text-pearl/40 block text-[10px] uppercase">
                      Custom Labels &amp; Branding
                    </span>
                    <span className="text-white">
                      {BRANDING_OPTIONS.find((b) => b.id === formData.brandingOption)?.label ||
                        formData.brandingOption}
                    </span>
                  </div>
                  <div className="sm:col-span-2 pt-1 border-t border-white/5">
                    <span className="text-pearl/40 block text-[10px] uppercase">
                      Delivery Destination ({formData.shippingMethod})
                    </span>
                    {formData.shippingMethod === 'pickup' ? (
                      <span className="text-white">
                        Self-Pickup at Fregoro Studios Production Facility (Chennai)
                      </span>
                    ) : (
                      <span className="text-white leading-relaxed block">
                        {formData.deliveryAddress.name}
                        {formData.deliveryAddress.company &&
                          ` (${formData.deliveryAddress.company})`}
                        <br />
                        {formData.deliveryAddress.street}, {formData.deliveryAddress.city},{' '}
                        {formData.deliveryAddress.state} - {formData.deliveryAddress.zip},{' '}
                        {formData.deliveryAddress.country}
                      </span>
                    )}
                  </div>
                  {formData.customerNotes && (
                    <div className="sm:col-span-2 pt-1 border-t border-white/5">
                      <span className="text-pearl/40 block text-[10px] uppercase">
                        Customer Notes &amp; Special Instructions
                      </span>
                      <span className="text-pearl/90 italic">{formData.customerNotes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Legal / Confirmation Checkbox (Section 53) */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
              <input
                id="confirmAccuracy"
                type="checkbox"
                checked={confirmedAccuracy}
                onChange={(e) => setConfirmedAccuracy(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-white/20 text-[#3B5EFF] focus:ring-[#3B5EFF] bg-black/40 cursor-pointer"
              />
              <label
                htmlFor="confirmAccuracy"
                className="text-xs text-pearl leading-relaxed cursor-pointer select-none"
              >
                <strong className="text-white block mb-0.5">
                  Confirmation &amp; Accuracy Verification
                </strong>
                I confirm that the information and artwork provided above are correct.
              </label>
            </div>

            {/* Submission Actions (Section 21) */}
            <div className="pt-2 space-y-3">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Submit Request Button */}
                <button
                  type="button"
                  disabled={isSubmitting || !confirmedAccuracy || grandTotalQuantity === 0}
                  onClick={handleSubmit}
                  className="flex-1 py-4 px-6 rounded-xl bg-[#3B5EFF] hover:bg-[#2b4be6] disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#3B5EFF]/25 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting your request...' : 'SUBMIT BULK REQUEST'}</span>
                </button>

                {/* Talk to WhatsApp Direct Button */}
                <a
                  href={whatsappPrefilledUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-4 px-6 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#25D366]/20 transition-all text-center"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Talk To Us On WhatsApp</span>
                </a>
              </div>

              <div className="text-center text-pearl/40 text-[11px] font-mono pt-2">
                Submitting is 100% free with zero payment commitment. We will send you an itemized
                quotation for approval.
              </div>
            </div>

            {/* Back Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleProceedToStep(5)}
                className="text-pearl/60 hover:text-white font-mono text-xs uppercase tracking-wider flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Delivery</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
