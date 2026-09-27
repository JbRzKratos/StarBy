'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  MessageCircle,
  Building2,
  Layers,
  ChevronRight,
  RotateCcw,
  Send,
  Download,
  CreditCard,
  X,
  Truck,
  Phone,
  Mail,
  User,
} from 'lucide-react';
import {
  STATUS_LABELS,
  type BulkOrderDetailData,
  type BulkOrderItemData,
  type BulkOrderArtworkData,
  type BulkOrderMessageData,
  type BulkOrderStatusHistoryData,
  type BulkOrderAddressData,
} from '@/lib/bulk-orders/types';
import { getWhatsappLink } from '@/lib/whatsapp';

interface CustomerRequestViewProps {
  requestId: string;
}

export function CustomerRequestView({ requestId }: CustomerRequestViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paidParam = searchParams.get('paid');

  const [data, setData] = useState<BulkOrderDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quote actions
  const [isAccepting, setIsAccepting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  // Message reply
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Action status message
  const [actionAlert, setActionAlert] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchRequest = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/bulk-orders/${requestId}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Bulk request not found');
      }
      setData(json.request);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load request details');
    } finally {
      setIsLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    if (requestId) {
      fetchRequest();
    }
  }, [requestId, fetchRequest]);

  // If redirecting back from Cashfree with ?paid=true
  useEffect(() => {
    if (paidParam === 'true') {
      setActionAlert({
        type: 'success',
        text: 'Payment received successfully! Your order has been moved to production queue.',
      });
    }
  }, [paidParam]);

  // Handle Accept Quote
  const handleAcceptQuote = async () => {
    if (!data?.id) return;
    setIsAccepting(true);
    setActionAlert(null);
    try {
      const res = await fetch(`/api/bulk-orders/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept_quote' }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to accept quote');
      }
      setActionAlert({
        type: 'success',
        text: 'Quote accepted! You can now proceed to secure payment.',
      });
      await fetchRequest();
    } catch (err: unknown) {
      setActionAlert({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error accepting quote',
      });
    } finally {
      setIsAccepting(false);
    }
  };

  // Handle Checkout / Pay Approved Quote
  const handleProceedToPayment = async () => {
    if (!data?.id) return;
    setIsPaying(true);
    setActionAlert(null);
    try {
      const res = await fetch(`/api/bulk-orders/${data.id}/checkout`, {
        method: 'POST',
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to initialize payment');
      }

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else if (result.paymentSessionId) {
        // Cashfree SDK fallback
        window.location.href = `https://payments.cashfree.com/order/#${result.paymentSessionId}`;
      } else {
        throw new Error('Payment gateway session could not be established');
      }
    } catch (err: unknown) {
      setActionAlert({
        type: 'error',
        text: err instanceof Error ? err.message : 'Payment initiation failed',
      });
      setIsPaying(false);
    }
  };

  // Handle Request Changes
  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNotes.trim() || !data?.id) return;
    setIsSubmittingRevision(true);
    try {
      const res = await fetch(`/api/bulk-orders/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_changes',
          notes: revisionNotes.trim(),
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to submit changes');
      }
      setShowRevisionModal(false);
      setRevisionNotes('');
      setActionAlert({
        type: 'success',
        text: 'Changes requested. Our team will revise your quote and update you.',
      });
      await fetchRequest();
    } catch (err: unknown) {
      setActionAlert({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to submit revision request',
      });
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  // Handle Sending a Message to Admin
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !data?.id) return;
    setIsSendingMessage(true);
    try {
      const res = await fetch(`/api/bulk-orders/${data.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyMessage.trim(),
          senderName: data.contactName,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to send message');
      }
      setReplyMessage('');
      await fetchRequest();
    } catch (err: unknown) {
      setActionAlert({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to send message',
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handle Reorder / Duplicate
  const handleReorder = () => {
    if (!data) return;
    try {
      const duplicateData = {
        orderType: data.orderType,
        eventName: data.eventName ? `${data.eventName} (Reorder)` : '',
        companyName: data.companyName,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        contactPreference: data.contactPreference,
        items: data.items.map((item: BulkOrderItemData) => ({
          apparelType: item.apparelType,
          printingMethod: item.printingMethod,
          fabric: item.fabric,
          gsm: item.gsm,
          branding: item.branding,
          packaging: item.packaging,
          packagingNotes: item.packagingNotes,
          notes: item.notes,
          colorRows: item.colorRows,
        })),
        artworks: data.artworks.map((art: BulkOrderArtworkData) => ({
          placement: art.placement,
          fileUrl: art.fileUrl,
          fileName: art.fileName,
          fileType: art.fileType,
          fileSize: art.fileSize,
          printSize: art.printSize,
          customDimensions: art.customDimensions,
          notes: art.notes,
        })),
        deliveryAddress: data.deliveryAddress,
      };
      localStorage.setItem('fregoro_bulk_order_draft_v1', JSON.stringify(duplicateData));
      router.push('/bulk-orders#order-builder');
    } catch (e) {
      console.error(e);
      router.push('/bulk-orders');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#F5F1EA] flex items-center justify-center pt-24 pb-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#3B5EFF] border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs uppercase tracking-widest text-pearl">
            Loading Bulk Request Details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#F5F1EA] pt-32 pb-24 px-4 sm:px-6">
        <div className="max-w-xl mx-auto text-center space-y-6 bg-[#141414] border border-white/10 rounded-2xl p-8">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
            Request Not Found
          </h1>
          <p className="text-sm text-pearl">
            {error ||
              `We could not find a bulk order quotation matching reference "${requestId}". Please verify your link or contact our team.`}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/bulk-orders"
              className="w-full sm:w-auto px-6 py-3 bg-[#3B5EFF] text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#2b4be6] transition-colors"
            >
              Start New Request
            </Link>
            <a
              href={getWhatsappLink(
                `Hi Fregoro Studios, I am trying to view bulk order request ${requestId} but it appears unavailable.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 bg-white/5 border border-white/10 text-white font-mono text-xs uppercase tracking-wider rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>Contact Support</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const latestQuote = data.quotes?.[0] || null;
  const isQuoteAccepted = latestQuote?.status === 'accepted' || data.status === 'approved';
  const isPaid =
    data.status === 'paid' || data.status === 'production' || data.status === 'completed';

  const whatsappMessage = `Hi Fregoro Studios, I am checking on bulk order request ${data.requestNumber} (${data.orderType} - ${data.totalQuantity} pcs).`;
  const whatsappUrl = getWhatsappLink(whatsappMessage);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F1EA] pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-pearl uppercase tracking-wider">
          <Link href="/bulk-orders" className="hover:text-white transition-colors">
            Bulk Orders
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-white">{data.requestNumber}</span>
        </div>

        {/* Action Alert Banner */}
        {actionAlert && (
          <div
            className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
              actionAlert.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <div className="flex items-center gap-2.5 text-sm">
              {actionAlert.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span>{actionAlert.text}</span>
            </div>
            <button
              onClick={() => setActionAlert(null)}
              className="text-pearl hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. Header & Status Bar */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs uppercase px-3 py-1 rounded-full bg-white/10 text-white font-bold tracking-wider">
                {data.orderType}
              </span>
              <span
                className={`font-mono text-xs uppercase px-3 py-1 rounded-full border font-bold tracking-wider ${
                  data.status === 'new'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : data.status === 'quote_sent'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : data.status === 'approved' || data.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : data.status === 'need_more_info'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                          : 'bg-white/10 text-pearl border-white/10'
                }`}
              >
                {STATUS_LABELS[data.status]?.label || data.status}
              </span>
              {data.isUrgent && (
                <span className="font-mono text-xs uppercase px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                  Urgent Order
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
              {data.eventName || data.companyName || 'Custom Apparel Request'}
            </h1>

            <p className="font-mono text-xs text-pearl flex flex-wrap items-center gap-4">
              <span>
                Ref: <strong className="text-white">{data.requestNumber}</strong>
              </span>
              <span>•</span>
              <span>
                Submitted:{' '}
                {new Date(data.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span>•</span>
              <span>
                Required by:{' '}
                <strong className="text-white">
                  {data.requiredDeliveryDate
                    ? new Date(data.requiredDeliveryDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Flexible'}
                </strong>
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Talk On WhatsApp</span>
            </a>

            <button
              onClick={handleReorder}
              className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-pearl" />
              <span>Duplicate / Reorder</span>
            </button>
          </div>
        </div>

        {/* 2. Need More Information Banner (if triggered) */}
        {data.status === 'need_more_info' && (
          <div className="bg-rose-950/30 border border-rose-500/40 rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h2 className="font-display text-xl font-bold uppercase tracking-tight text-white">
                Action Required: More Information Needed
              </h2>
            </div>
            <p className="text-sm text-pearl leading-relaxed">
              Our production engineering team reviewed your request and needs a few quick details to
              proceed. Please review the messages below and submit your clarification.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLUMNS: Order Items, Matrices, Artworks, Messages */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Quotation Card (if sent) */}
            {latestQuote ? (
              <div className="bg-[#141414] border-2 border-[#3B5EFF]/40 rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 px-4 py-1.5 bg-[#3B5EFF] text-white font-mono text-[11px] font-bold uppercase tracking-wider rounded-bl-xl">
                  Official Quote v{latestQuote.version}
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-xs uppercase tracking-widest text-[#3B5EFF] font-bold">
                    Price Quotation
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-black uppercase text-white">
                    ₹{(latestQuote.total || latestQuote.totalAmount || 0).toLocaleString('en-IN')}
                  </h3>
                  <p className="text-xs text-pearl font-mono">
                    All inclusive (Manufacturing, printing, and delivery). Valid until{' '}
                    {latestQuote.expiresAt
                      ? new Date(latestQuote.expiresAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '14 days'}
                    .
                  </p>
                </div>

                {/* Quote Fee Breakdown */}
                <div className="border-t border-b border-white/10 py-4 space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between text-pearl">
                    <span>Garment Manufacturing ({data.totalQuantity} pcs)</span>
                    <span className="text-white">
                      ₹{(latestQuote.garmentPrice || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-pearl">
                    <span>Printing & Execution</span>
                    <span className="text-white">
                      ₹{(latestQuote.printingPrice || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {(latestQuote.setupFee || 0) > 0 && (
                    <div className="flex justify-between text-pearl">
                      <span>Screen / Artwork Setup Fee</span>
                      <span className="text-white">
                        ₹{(latestQuote.setupFee || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {(latestQuote.packagingFee || 0) > 0 && (
                    <div className="flex justify-between text-pearl">
                      <span>Custom Packaging</span>
                      <span className="text-white">
                        ₹{(latestQuote.packagingFee || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-pearl">
                    <span>Shipping & Logistics</span>
                    <span className="text-white">
                      {(latestQuote.shippingFee || 0) === 0
                        ? 'FREE'
                        : `₹${(latestQuote.shippingFee || 0).toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  {(latestQuote.urgencyFee || 0) > 0 && (
                    <div className="flex justify-between text-amber-400">
                      <span>Rush Production Surcharge</span>
                      <span>+₹{(latestQuote.urgencyFee || 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {(latestQuote.discount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Volume Discount</span>
                      <span>-₹{(latestQuote.discount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {(latestQuote.tax || latestQuote.taxAmount || 0) > 0 && (
                    <div className="flex justify-between text-pearl">
                      <span>GST (Applicable Taxes)</span>
                      <span className="text-white">
                        ₹{(latestQuote.tax || latestQuote.taxAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10">
                    <span>Final Approved Total</span>
                    <span className="text-[#3B5EFF]">
                      ₹{(latestQuote.total || latestQuote.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {latestQuote.notes && (
                  <div className="bg-white/5 p-4 rounded-xl text-xs text-pearl space-y-1">
                    <strong className="text-white block font-mono uppercase">
                      Production Terms / Notes:
                    </strong>
                    <p>{latestQuote.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  {!isQuoteAccepted && !isPaid && (
                    <button
                      onClick={handleAcceptQuote}
                      disabled={isAccepting}
                      className="w-full sm:flex-1 py-3.5 bg-[#3B5EFF] hover:bg-[#2b4be6] text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#3B5EFF]/20"
                    >
                      {isAccepting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept Quote</span>
                        </>
                      )}
                    </button>
                  )}

                  {isQuoteAccepted && !isPaid && (
                    <button
                      onClick={handleProceedToPayment}
                      disabled={isPaying}
                      className="w-full sm:flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-black font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                    >
                      {isPaying ? (
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Pay Approved Quote (Cashfree)</span>
                        </>
                      )}
                    </button>
                  )}

                  {isPaid && (
                    <div className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-center font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Quote Paid • In Production</span>
                    </div>
                  )}

                  {!isPaid && (
                    <button
                      onClick={() => setShowRevisionModal(true)}
                      className="w-full sm:w-auto px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                    >
                      Request Changes
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3 text-amber-400">
                  <Clock className="w-6 h-6" />
                  <h3 className="font-display text-xl font-bold uppercase tracking-tight text-white">
                    Quotation Under Review
                  </h3>
                </div>
                <p className="text-sm text-pearl leading-relaxed">
                  Our production team is calculating manufacturing costs based on your selected
                  apparel type, print locations, fabric weight, and quantities. We will update this
                  page with your official quote shortly.
                </p>
                <div className="pt-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs uppercase tracking-wider"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>Inquire Status on WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

            {/* Apparel Items & Size Matrix */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
              <h3 className="font-display text-xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#3B5EFF]" />
                <span>Apparel Configuration ({data.items?.length || 0})</span>
              </h3>

              <div className="space-y-6">
                {data.items?.map((item: BulkOrderItemData, idx: number) => {
                  const colorRows =
                    (item.colorRows as Array<{
                      color: string;
                      hex?: string;
                      sizes: Record<string, number>;
                    }>) || [];
                  const totalItemQty = colorRows.reduce(
                    (sum, row) =>
                      sum +
                      Object.values(row.sizes as Record<string, number>).reduce(
                        (s, q) => s + (Number(q) || 0),
                        0,
                      ),
                    0,
                  );

                  return (
                    <div
                      key={item.id || idx}
                      className="border border-white/10 rounded-xl p-5 bg-[#0F0F0F] space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <div>
                          <span className="font-mono text-[10px] text-pearl uppercase tracking-wider">
                            Item {idx + 1}
                          </span>
                          <h4 className="font-display text-lg font-bold uppercase text-white">
                            {item.apparelType}
                          </h4>
                        </div>
                        <span className="font-mono text-xs font-bold px-3 py-1 rounded bg-white/10 text-white">
                          Total: {totalItemQty} pcs
                        </span>
                      </div>

                      {/* Item Specs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                        <div className="bg-white/5 p-2.5 rounded-lg">
                          <span className="text-pearl block text-[10px] uppercase">Printing</span>
                          <span className="text-white font-bold">{item.printingMethod}</span>
                        </div>
                        <div className="bg-white/5 p-2.5 rounded-lg">
                          <span className="text-pearl block text-[10px] uppercase">Fabric</span>
                          <span className="text-white font-bold">{item.fabric}</span>
                        </div>
                        <div className="bg-white/5 p-2.5 rounded-lg">
                          <span className="text-pearl block text-[10px] uppercase">GSM</span>
                          <span className="text-white font-bold">{item.gsm}</span>
                        </div>
                        <div className="bg-white/5 p-2.5 rounded-lg">
                          <span className="text-pearl block text-[10px] uppercase">Packaging</span>
                          <span className="text-white font-bold">{item.packaging}</span>
                        </div>
                      </div>

                      {/* Size Matrix Table */}
                      <div className="space-y-3 pt-2">
                        <span className="font-mono text-xs uppercase tracking-wider text-pearl font-bold block">
                          Size & Color Quantity Matrix:
                        </span>
                        <div className="overflow-x-auto border border-white/10 rounded-lg">
                          <table className="w-full text-left text-xs font-mono">
                            <thead className="bg-white/5 text-pearl border-b border-white/10">
                              <tr>
                                <th className="p-2.5">Colour</th>
                                <th className="p-2.5 text-center">XS</th>
                                <th className="p-2.5 text-center">S</th>
                                <th className="p-2.5 text-center">M</th>
                                <th className="p-2.5 text-center">L</th>
                                <th className="p-2.5 text-center">XL</th>
                                <th className="p-2.5 text-center">2XL</th>
                                <th className="p-2.5 text-center">3XL</th>
                                <th className="p-2.5 text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {colorRows.map((row, rIdx: number) => {
                                const sizes = row.sizes || {};
                                const rowTotal = Object.values(sizes).reduce(
                                  (sum: number, q: unknown) => sum + (Number(q) || 0),
                                  0,
                                );
                                return (
                                  <tr key={rIdx} className="hover:bg-white/[0.02]">
                                    <td className="p-2.5 font-bold text-white flex items-center gap-2">
                                      <span
                                        className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                                        style={{ backgroundColor: row.hex || '#333' }}
                                      />
                                      <span>{row.color}</span>
                                    </td>
                                    <td className="p-2.5 text-center text-pearl">
                                      {sizes.XS || 0}
                                    </td>
                                    <td className="p-2.5 text-center text-pearl">{sizes.S || 0}</td>
                                    <td className="p-2.5 text-center text-pearl">{sizes.M || 0}</td>
                                    <td className="p-2.5 text-center text-pearl">{sizes.L || 0}</td>
                                    <td className="p-2.5 text-center text-pearl">
                                      {sizes.XL || 0}
                                    </td>
                                    <td className="p-2.5 text-center text-pearl">
                                      {sizes['2XL'] || 0}
                                    </td>
                                    <td className="p-2.5 text-center text-pearl">
                                      {sizes['3XL'] || 0}
                                    </td>
                                    <td className="p-2.5 text-right font-bold text-white">
                                      {rowTotal}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Uploaded Artworks */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
              <h3 className="font-display text-xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#3B5EFF]" />
                <span>Uploaded Artwork & Placement Designs ({data.artworks?.length || 0})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.artworks?.map((art: BulkOrderArtworkData, aIdx: number) => (
                  <div
                    key={art.id || aIdx}
                    className="border border-white/10 rounded-xl p-4 bg-[#0F0F0F] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                        {art.placement}
                      </span>
                      <span
                        className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded font-bold ${
                          art.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : art.status === 'needs_revision'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-white/10 text-pearl'
                        }`}
                      >
                        {art.status}
                      </span>
                    </div>

                    {art.fileUrl && (
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-black/50 border border-white/10 flex items-center justify-center">
                        {art.fileType?.includes('image') ||
                        art.fileName?.match(/\.(png|jpe?g|webp|svg)$/i) ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={art.fileUrl}
                            alt={art.fileName}
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <FileText className="w-10 h-10 text-pearl" />
                        )}
                      </div>
                    )}

                    <div className="text-[11px] font-mono text-pearl space-y-1">
                      <p className="truncate text-white font-medium">{art.fileName}</p>
                      <p>Print size: {art.printSize || 'Standard'}</p>
                      {art.customDimensions && <p>Dimensions: {art.customDimensions}</p>}
                      {art.notes && <p className="italic text-pearl/80">&quot;{art.notes}&quot;</p>}
                    </div>

                    {art.fileUrl && (
                      <a
                        href={art.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download High-Res</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Conversation Thread / Information Request Messages */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
              <h3 className="font-display text-xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#3B5EFF]" />
                <span>Production Communication & Inquiries</span>
              </h3>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {(!data.messages || data.messages.length === 0) && (
                  <p className="text-xs font-mono text-pearl italic">
                    No active messages on this quotation yet. If you have questions, post below or
                    ping us on WhatsApp.
                  </p>
                )}

                {data.messages?.map((msg: BulkOrderMessageData) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-xl space-y-1.5 text-xs font-mono ${
                      msg.sender === 'admin'
                        ? 'bg-[#3B5EFF]/10 border border-[#3B5EFF]/30 text-white mr-8'
                        : 'bg-white/5 border border-white/10 text-pearl ml-8'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-pearl font-bold uppercase">
                      <span>
                        {msg.sender === 'admin' ? 'Fregoro Production' : msg.senderName || 'You'}
                      </span>
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm font-sans text-white leading-relaxed">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendMessage} className="space-y-3 pt-2">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type a message or answer questions regarding your order..."
                  rows={2}
                  className="w-full bg-[#0F0F0F] border border-white/15 focus:border-[#3B5EFF] rounded-xl p-3 text-sm text-white placeholder-pearl/50 outline-none transition-colors"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSendingMessage || !replyMessage.trim()}
                    className="px-5 py-2.5 bg-[#3B5EFF] hover:bg-[#2b4be6] disabled:opacity-50 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Contact, Fulfillment & Audit History */}
          <div className="space-y-6">
            {/* Contact Details */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-4">
              <h4 className="font-display text-base font-bold uppercase tracking-tight text-white flex items-center gap-2">
                <User className="w-4 h-4 text-[#3B5EFF]" />
                <span>Contact Details</span>
              </h4>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center gap-2 text-pearl">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-white font-medium">{data.contactName}</span>
                </div>
                {data.companyName && (
                  <div className="flex items-center gap-2 text-pearl">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-white">{data.companyName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-pearl">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-white">{data.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-pearl">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-white">{data.email}</span>
                </div>
                <div className="pt-2 border-t border-white/10 text-[11px] text-pearl">
                  Preferred Contact:{' '}
                  <strong className="text-white capitalize">{data.contactPreference}</strong>
                </div>
              </div>
            </div>

            {/* Delivery Destination */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-4">
              <h4 className="font-display text-base font-bold uppercase tracking-tight text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#3B5EFF]" />
                <span>Fulfillment & Delivery</span>
              </h4>

              <div className="space-y-2 text-xs font-mono text-pearl">
                <p>
                  Method:{' '}
                  <strong className="text-white uppercase">
                    {data.fulfillmentMethod || data.shippingMethod || 'delivery'}
                  </strong>
                </p>
                {(() => {
                  const rawAddr = data.deliveryAddress || data.shippingAddress;
                  const addr: BulkOrderAddressData | null =
                    typeof rawAddr === 'object' && rawAddr !== null
                      ? (rawAddr as BulkOrderAddressData)
                      : null;
                  const isDelivery =
                    (data.fulfillmentMethod || data.shippingMethod || 'delivery') === 'delivery';

                  if (isDelivery && addr) {
                    return (
                      <div className="bg-[#0F0F0F] p-3 rounded-lg border border-white/10 space-y-1 text-white">
                        <p>{addr.street}</p>
                        <p>
                          {addr.city}, {addr.state} - {addr.pincode || addr.zip}
                        </p>
                        <p>{addr.country || 'India'}</p>
                      </div>
                    );
                  }
                  return <p className="text-white">Customer Self-Pickup at Fregoro Chennai Hub.</p>;
                })()}
                <div className="pt-2 border-t border-white/10">
                  <p>
                    Target Date:{' '}
                    <strong className="text-white">
                      {data.requiredDeliveryDate
                        ? new Date(data.requiredDeliveryDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Flexible'}
                    </strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Order Audit History */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-4">
              <h4 className="font-display text-base font-bold uppercase tracking-tight text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#3B5EFF]" />
                <span>Status Timeline</span>
              </h4>

              <div className="space-y-3 relative pl-4 border-l border-white/15">
                {data.statusHistory?.map((h: BulkOrderStatusHistoryData, idx: number) => (
                  <div key={h.id || idx} className="space-y-0.5 text-xs font-mono relative">
                    <div className="w-2 h-2 rounded-full bg-[#3B5EFF] absolute -left-[21px] top-1" />
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-white capitalize">
                        {STATUS_LABELS[h.newStatus]?.label || h.newStatus}
                      </span>
                      <span className="text-pearl text-[10px]">
                        {new Date(h.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    {h.note && <p className="text-[11px] text-pearl/80">{h.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revision Request Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-white/15 rounded-2xl p-6 sm:p-8 max-w-lg w-full space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold uppercase text-white">
                Request Quote Revisions
              </h3>
              <button
                onClick={() => setShowRevisionModal(false)}
                className="text-pearl hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-pearl">
              Let us know what changes you require (e.g. quantity adjustments, alternate garment
              colors, delivery timeline, or printing specifications).
            </p>

            <form onSubmit={handleSubmitRevision} className="space-y-4">
              <textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Explain the changes you would like us to make to this quotation..."
                rows={4}
                required
                className="w-full bg-[#0F0F0F] border border-white/15 focus:border-[#3B5EFF] rounded-xl p-3 text-sm text-white placeholder-pearl/50 outline-none transition-colors"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-pearl font-mono text-xs uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRevision || !revisionNotes.trim()}
                  className="px-5 py-2.5 bg-[#3B5EFF] hover:bg-[#2b4be6] disabled:opacity-50 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  {isSubmittingRevision ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
