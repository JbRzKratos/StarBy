'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Building2,
  Layers,
  Truck,
  Phone,
  Mail,
  User,
  ExternalLink,
  Send,
  CreditCard,
} from 'lucide-react';
import { STATUS_LABELS, type ArtworkReviewStatus } from '@/lib/bulk-orders/types';
import { formatAdminToCustomerWhatsappMessage, getWhatsappLink } from '@/lib/whatsapp';

interface AdminBulkOrderDetailClientProps {
  request: any;
}

export function AdminBulkOrderDetailClient({
  request: initialRequest,
}: AdminBulkOrderDetailClientProps) {
  const [request, setRequest] = useState<any>(initialRequest);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialRequest.status);

  // Quote form state
  const latestQuote = request.quotes?.[0] || null;
  const nextVersion = (latestQuote?.version || 0) + 1;

  const [garmentPrice, setGarmentPrice] = useState<number>(latestQuote?.garmentPrice || 0);
  const [printingPrice, setPrintingPrice] = useState<number>(latestQuote?.printingPrice || 0);
  const [setupFee, setSetupFee] = useState<number>(latestQuote?.setupFee || 0);
  const [packagingFee, setPackagingFee] = useState<number>(latestQuote?.packagingFee || 0);
  const [shippingFee, setShippingFee] = useState<number>(latestQuote?.shippingFee || 0);
  const [urgencyFee, setUrgencyFee] = useState<number>(
    latestQuote?.urgencyFee || (request.isUrgent ? 1500 : 0),
  );
  const [discount, setDiscount] = useState<number>(latestQuote?.discount || 0);
  const [taxRate, setTaxRate] = useState<number>(18); // Default 18% GST
  const [quoteNotes, setQuoteNotes] = useState<string>(
    latestQuote?.notes ||
      'Includes premium combed cotton manufacturing, industrial high-definition DTF printing, and individual polybag packaging.',
  );
  const [validDays, setValidDays] = useState<number>(14);
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);

  // Artwork status updates
  const [artworkStatuses, setArtworkStatuses] = useState<Record<string, ArtworkReviewStatus>>(
    () => {
      const map: Record<string, ArtworkReviewStatus> = {};
      request.artworks?.forEach((a: any) => {
        map[a.id] = a.status;
      });
      return map;
    },
  );
  const [updatingArtworkId, setUpdatingArtworkId] = useState<string | null>(null);

  // Messaging / Request More Info
  const [adminMessage, setAdminMessage] = useState('');
  const [markNeedMoreInfo, setMarkNeedMoreInfo] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Alerts
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Calculation of totals
  const subtotal =
    garmentPrice + printingPrice + setupFee + packagingFee + shippingFee + urgencyFee - discount;
  const calculatedTax = Math.round(Math.max(0, subtotal) * (taxRate / 100) * 100) / 100;
  const quoteTotal = Math.max(0, subtotal + calculatedTax);

  // Refresh data
  const refreshData = async () => {
    try {
      const res = await fetch(`/api/bulk-orders/${request.id}`);
      const json = await res.json();
      if (json.success && json.request) {
        setRequest(json.request);
        setSelectedStatus(json.request.status);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle status update
  const handleUpdateStatus = async () => {
    setIsUpdatingStatus(true);
    setAlert(null);
    try {
      const res = await fetch(`/api/bulk-orders/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          adminNotes: statusNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update status');
      }
      setAlert({ type: 'success', text: `Status updated to ${selectedStatus}` });
      setStatusNote('');
      await refreshData();
    } catch (err: any) {
      setAlert({ type: 'error', text: err.message || 'Status update failed' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle artwork review status update
  const handleUpdateArtworkStatus = async (artworkId: string, newStatus: ArtworkReviewStatus) => {
    setUpdatingArtworkId(artworkId);
    try {
      const res = await fetch(`/api/bulk-orders/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artworkId,
          artworkStatus: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update artwork');
      }
      setArtworkStatuses((prev) => ({ ...prev, [artworkId]: newStatus }));
      setAlert({ type: 'success', text: `Artwork marked as ${newStatus}` });
    } catch (err: any) {
      setAlert({ type: 'error', text: err.message || 'Failed to update artwork' });
    } finally {
      setUpdatingArtworkId(null);
    }
  };

  // Handle quote creation
  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quoteTotal <= 0) {
      setAlert({ type: 'error', text: 'Quote total must be greater than zero.' });
      return;
    }

    setIsCreatingQuote(true);
    setAlert(null);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validDays);

      const res = await fetch(`/api/bulk-orders/${request.id}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garmentPrice,
          printingPrice,
          setupFee,
          packagingFee,
          shippingFee,
          urgencyFee,
          discount,
          tax: calculatedTax,
          total: quoteTotal,
          notes: quoteNotes.trim(),
          expiresAt: expiresAt.toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create quote');
      }

      setAlert({
        type: 'success',
        text: `Quote v${nextVersion} created and sent to customer (Total: ₹${quoteTotal.toLocaleString('en-IN')})!`,
      });
      await refreshData();
    } catch (err: any) {
      setAlert({ type: 'error', text: err.message || 'Failed to create quote' });
    } finally {
      setIsCreatingQuote(false);
    }
  };

  // Handle sending production message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminMessage.trim()) return;

    setIsSendingMessage(true);
    setAlert(null);
    try {
      const res = await fetch(`/api/bulk-orders/${request.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: adminMessage.trim(),
          markNeedMoreInfo,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to post message');
      }

      setAdminMessage('');
      setMarkNeedMoreInfo(false);
      setAlert({ type: 'success', text: 'Message posted to customer portal.' });
      await refreshData();
    } catch (err: any) {
      setAlert({ type: 'error', text: err.message || 'Failed to post message' });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const whatsappCustomerUrl = getWhatsappLink(
    formatAdminToCustomerWhatsappMessage(request.contactName, request.requestNumber, request.phone),
  );

  return (
    <div className="space-y-6">
      {/* Back and Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-smoke/30">
        <div className="space-y-1">
          <Link
            href="/admin/bulk-orders"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-pearl hover:text-bone transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Bulk Requests</span>
          </Link>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-bone">
              {request.requestNumber}
            </h1>
            <span className="px-2.5 py-0.5 rounded bg-smoke/20 border border-smoke/40 text-[11px] font-mono uppercase font-bold text-pearl">
              {request.orderType}
            </span>
            {request.isUrgent && (
              <span className="px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-mono uppercase font-bold animate-pulse">
                Rush Order
              </span>
            )}
          </div>
        </div>

        {/* Header CTAs */}
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={whatsappCustomerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat Customer on WhatsApp</span>
          </a>

          <Link
            href={`/bulk-orders/request/${request.requestNumber}`}
            target="_blank"
            className="px-4 py-2 bg-graphite hover:bg-smoke/30 border border-smoke/40 text-bone font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>Customer View</span>
            <ExternalLink className="w-3.5 h-3.5 text-pearl" />
          </Link>
        </div>
      </div>

      {/* Action Alert Banner */}
      {alert && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono ${
            alert.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{alert.text}</span>
          </div>
          <button
            onClick={() => setAlert(null)}
            className="text-pearl hover:text-bone uppercase tracking-wider text-[10px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Fast Status Bar */}
      <div className="bg-graphite border border-smoke/40 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-pearl uppercase">Current Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-charcoal border border-smoke/40 focus:border-cobalt px-3 py-2 text-xs font-mono text-bone font-bold rounded-lg outline-none cursor-pointer"
          >
            <option value="new">New</option>
            <option value="under_review">Under Review</option>
            <option value="need_more_info">Need More Info</option>
            <option value="quote_sent">Quote Sent</option>
            <option value="customer_reviewing">Customer Reviewing</option>
            <option value="approved">Approved</option>
            <option value="payment_pending">Payment Pending</option>
            <option value="paid">Paid</option>
            <option value="production">Production</option>
            <option value="quality_check">Quality Check</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex flex-1 max-w-md items-center gap-2">
          <input
            type="text"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            placeholder="Audit log note (optional)..."
            className="flex-1 bg-charcoal border border-smoke/40 focus:border-cobalt px-3 py-2 text-xs font-mono text-bone placeholder-pearl/50 rounded-lg outline-none"
          />
          <button
            onClick={handleUpdateStatus}
            disabled={isUpdatingStatus || selectedStatus === request.status}
            className="px-4 py-2 bg-cobalt hover:bg-cobalt/80 disabled:opacity-40 text-white font-mono text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
          >
            {isUpdatingStatus ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLUMNS: Apparel Configuration, Matrix, Artworks, Quote Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Apparel Items & Matrix */}
          <div className="bg-graphite border border-smoke/40 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-smoke/30 pb-3">
              <h2 className="font-display text-lg font-bold uppercase tracking-tight text-bone flex items-center gap-2">
                <Layers className="w-4 h-4 text-cobalt" />
                <span>Apparel Configuration ({request.items?.length || 0})</span>
              </h2>
              <span className="font-mono text-xs font-bold text-bone bg-charcoal px-3 py-1 rounded border border-smoke/30">
                Total Units: {request.totalQuantity} pcs
              </span>
            </div>

            <div className="space-y-6">
              {request.items?.map((item: any, idx: number) => {
                const colorRows = (item.colorRows as any[]) || [];
                const itemTotal = colorRows.reduce(
                  (sum, r) =>
                    sum +
                    Object.values(r.sizes as Record<string, number>).reduce(
                      (s, q) => s + (Number(q) || 0),
                      0,
                    ),
                  0,
                );

                return (
                  <div
                    key={item.id || idx}
                    className="border border-smoke/30 rounded-lg p-4 bg-charcoal space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-smoke/20 pb-2">
                      <h3 className="font-display text-base font-bold uppercase text-bone">
                        {item.apparelType}
                      </h3>
                      <span className="font-mono text-xs font-bold text-pearl">
                        {itemTotal} units
                      </span>
                    </div>

                    {/* Specs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                      <div className="bg-graphite p-2 rounded">
                        <span className="text-pearl block text-[9px] uppercase">
                          Print Technique
                        </span>
                        <span className="text-bone font-bold">{item.printingMethod}</span>
                      </div>
                      <div className="bg-graphite p-2 rounded">
                        <span className="text-pearl block text-[9px] uppercase">Fabric</span>
                        <span className="text-bone font-bold">{item.fabric}</span>
                      </div>
                      <div className="bg-graphite p-2 rounded">
                        <span className="text-pearl block text-[9px] uppercase">GSM</span>
                        <span className="text-bone font-bold">{item.gsm}</span>
                      </div>
                      <div className="bg-graphite p-2 rounded">
                        <span className="text-pearl block text-[9px] uppercase">
                          Branding / Label
                        </span>
                        <span className="text-bone font-bold">{item.branding}</span>
                      </div>
                    </div>

                    {/* Size and Color Matrix Table */}
                    <div className="space-y-2 pt-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-pearl font-bold block">
                        Size Quantity Allocation:
                      </span>
                      <div className="overflow-x-auto border border-smoke/30 rounded-lg">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-graphite text-pearl border-b border-smoke/30 text-[10px] uppercase">
                            <tr>
                              <th className="p-2">Colour</th>
                              <th className="p-2 text-center">XS</th>
                              <th className="p-2 text-center">S</th>
                              <th className="p-2 text-center">M</th>
                              <th className="p-2 text-center">L</th>
                              <th className="p-2 text-center">XL</th>
                              <th className="p-2 text-center">2XL</th>
                              <th className="p-2 text-center">3XL</th>
                              <th className="p-2 text-center">4XL</th>
                              <th className="p-2 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-smoke/20">
                            {colorRows.map((row: any, rIdx: number) => {
                              const sizes = row.sizes || {};
                              const rowTotal = Object.values(sizes).reduce(
                                (sum: number, q: any) => sum + (Number(q) || 0),
                                0,
                              );
                              return (
                                <tr key={rIdx} className="hover:bg-graphite/40">
                                  <td className="p-2 font-bold text-bone flex items-center gap-1.5">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-smoke/40 shrink-0"
                                      style={{ backgroundColor: row.hex || '#555' }}
                                    />
                                    <span>{row.color}</span>
                                  </td>
                                  <td className="p-2 text-center text-pearl">{sizes.XS || 0}</td>
                                  <td className="p-2 text-center text-pearl">{sizes.S || 0}</td>
                                  <td className="p-2 text-center text-pearl">{sizes.M || 0}</td>
                                  <td className="p-2 text-center text-pearl">{sizes.L || 0}</td>
                                  <td className="p-2 text-center text-pearl">{sizes.XL || 0}</td>
                                  <td className="p-2 text-center text-pearl">
                                    {sizes['2XL'] || 0}
                                  </td>
                                  <td className="p-2 text-center text-pearl">
                                    {sizes['3XL'] || 0}
                                  </td>
                                  <td className="p-2 text-center text-pearl">
                                    {sizes['4XL'] || 0}
                                  </td>
                                  <td className="p-2 text-right font-bold text-bone">{rowTotal}</td>
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

          {/* 2. Artwork Inspection & Review */}
          <div className="bg-graphite border border-smoke/40 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-smoke/30 pb-3">
              <h2 className="font-display text-lg font-bold uppercase tracking-tight text-bone flex items-center gap-2">
                <FileText className="w-4 h-4 text-cobalt" />
                <span>Artwork Files & Review ({request.artworks?.length || 0})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {request.artworks?.map((art: any) => (
                <div
                  key={art.id}
                  className="border border-smoke/30 rounded-lg p-4 bg-charcoal space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-bone">
                      {art.placement}
                    </span>
                    <select
                      value={artworkStatuses[art.id] || art.status}
                      onChange={(e) =>
                        handleUpdateArtworkStatus(art.id, e.target.value as ArtworkReviewStatus)
                      }
                      disabled={updatingArtworkId === art.id}
                      className="bg-graphite border border-smoke/40 px-2 py-1 rounded text-[10px] font-mono uppercase font-bold text-bone outline-none cursor-pointer"
                    >
                      <option value="received">Received</option>
                      <option value="approved">Approved</option>
                      <option value="needs_revision">Needs Revision</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {art.fileUrl && (
                    <div className="relative aspect-video rounded bg-black/40 border border-smoke/40 overflow-hidden flex items-center justify-center">
                      {art.fileType?.includes('image') ||
                      art.fileName?.match(/\.(png|jpe?g|webp|svg)$/i) ? (
                        <img
                          src={art.fileUrl}
                          alt={art.fileName}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <FileText className="w-8 h-8 text-pearl" />
                      )}
                    </div>
                  )}

                  <div className="text-[11px] font-mono text-pearl space-y-0.5">
                    <p className="truncate text-bone font-medium">{art.fileName}</p>
                    <p>Print size: {art.printSize || 'Standard'}</p>
                    {art.customDimensions && <p>Dimensions: {art.customDimensions}</p>}
                    {art.notes && <p className="italic text-pearl/80">&quot;{art.notes}&quot;</p>}
                  </div>

                  {art.fileUrl && (
                    <a
                      href={art.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-1.5 bg-smoke/20 hover:bg-smoke/40 border border-smoke/40 rounded text-bone font-mono text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download Artwork Asset</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Official Quotation Builder */}
          <div className="bg-graphite border border-smoke/40 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-smoke/30 pb-3">
              <div>
                <h2 className="font-display text-lg font-bold uppercase tracking-tight text-bone flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cobalt" />
                  <span>Quotation Engine (Version {nextVersion})</span>
                </h2>
                <p className="font-mono text-xs text-pearl">
                  Enter production cost line-items. The final approved quote is used for customer
                  checkout.
                </p>
              </div>

              {latestQuote && (
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-cobalt/20 text-cobalt border border-cobalt/40 font-bold">
                  Active: v{latestQuote.version} (₹{latestQuote.total.toLocaleString('en-IN')})
                </span>
              )}
            </div>

            <form onSubmit={handleCreateQuote} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-pearl block uppercase text-[10px] mb-1">
                    Garment Manufacturing (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={garmentPrice}
                    onChange={(e) => setGarmentPrice(Number(e.target.value) || 0)}
                    className="w-full bg-charcoal border border-smoke/40 px-3 py-2 text-bone rounded-lg outline-none"
                    placeholder="e.g. 35000"
                  />
                </div>

                <div>
                  <label className="text-pearl block uppercase text-[10px] mb-1">
                    Printing & Customization (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={printingPrice}
                    onChange={(e) => setPrintingPrice(Number(e.target.value) || 0)}
                    className="w-full bg-charcoal border border-smoke/40 px-3 py-2 text-bone rounded-lg outline-none"
                    placeholder="e.g. 12000"
                  />
                </div>

                <div>
                  <label className="text-pearl block uppercase text-[10px] mb-1">
                    Screen / Setup Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={setupFee}
                    onChange={(e) => setSetupFee(Number(e.target.value) || 0)}
                    className="w-full bg-charcoal border border-smoke/40 px-3 py-2 text-bone rounded-lg outline-none"
                    placeholder="e.g. 1000"
                  />
                </div>

                <div>
                  <label className="text-pearl block uppercase text-[10px] mb-1">
                    Packaging Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={packagingFee}
                    onChange={(e) => setPackagingFee(Number(e.target.value) || 0)}
                    className="w-full bg-charcoal border border-smoke/40 px-3 py-2 text-bone rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="text-pearl block uppercase text-[10px] mb-1">
                    Shipping & Logistics (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(Number(e.target.value) || 0)}
                    className="w-full bg-charcoal border border-smoke/40 px-3 py-2 text-bone rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="text-pearl block uppercase text-[10px] mb-1">
                    Rush / Urgency Surcharge (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={urgencyFee}
                    onChange={(e) => setUrgencyFee(Number(e.target.value) || 0)}
                    className="w-full bg-charcoal border border-smoke/40 px-3 py-2 text-bone rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="text-pearl block uppercase text-[10px] mb-1">
                    Volume Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="w-full bg-charcoal border border-smoke/40 px-3 py-2 text-bone rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="text-pearl block uppercase text-[10px] mb-1">
                    GST Rate (% applied to subtotal)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="28"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                    className="w-full bg-charcoal border border-smoke/40 px-3 py-2 text-bone rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="text-pearl block uppercase text-[10px] mb-1">
                    Quote Validity (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={validDays}
                    onChange={(e) => setValidDays(Number(e.target.value) || 14)}
                    className="w-full bg-charcoal border border-smoke/40 px-3 py-2 text-bone rounded-lg outline-none"
                  />
                </div>
              </div>

              {/* Terms & Notes */}
              <div>
                <label className="text-pearl block uppercase text-[10px] mb-1">
                  Production Terms & Notes to Customer
                </label>
                <textarea
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-charcoal border border-smoke/40 px-3 py-2 text-bone rounded-lg outline-none"
                />
              </div>

              {/* Total Summary & Submit */}
              <div className="bg-charcoal p-4 rounded-lg border border-smoke/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-4 text-pearl text-xs">
                    <span>Subtotal: ₹{subtotal.toLocaleString('en-IN')}</span>
                    <span>
                      GST ({taxRate}%): ₹{calculatedTax.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-base font-bold text-bone">
                    Grand Total Quote:{' '}
                    <span className="text-cobalt">₹{quoteTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingQuote || quoteTotal <= 0}
                  className="px-6 py-2.5 bg-cobalt hover:bg-cobalt/80 disabled:opacity-40 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Quote v{nextVersion} to Customer</span>
                </button>
              </div>
            </form>

            {/* Historical Quotes */}
            {request.quotes?.length > 0 && (
              <div className="border-t border-smoke/30 pt-4 space-y-2">
                <span className="font-mono text-[10px] text-pearl uppercase tracking-wider block font-bold">
                  Quote Version History:
                </span>
                <div className="space-y-2">
                  {request.quotes.map((q: any) => (
                    <div
                      key={q.id}
                      className="bg-charcoal p-3 rounded border border-smoke/20 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-bone">
                          Version {q.version} — ₹{q.total.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-pearl block">
                          Created {new Date(q.createdAt).toLocaleDateString('en-IN')} • Status:{' '}
                          <strong className="text-bone uppercase">{q.status}</strong>
                        </span>
                      </div>
                      <span className="text-pearl text-[10px]">
                        Valid till {new Date(q.expiresAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Customer Details, Fulfillment, Messages & Clarifications */}
        <div className="space-y-6">
          {/* Customer & Event Details */}
          <div className="bg-graphite border border-smoke/40 rounded-xl p-5 space-y-4">
            <h3 className="font-display text-base font-bold uppercase tracking-tight text-bone flex items-center gap-2">
              <User className="w-4 h-4 text-cobalt" />
              <span>Customer Information</span>
            </h3>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center gap-2 text-pearl">
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="text-bone font-medium">{request.contactName}</span>
              </div>
              {request.companyName && (
                <div className="flex items-center gap-2 text-pearl">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-bone">{request.companyName}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-pearl">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span className="text-bone">{request.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-pearl">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="text-bone">{request.email}</span>
              </div>
              <div className="pt-2 border-t border-smoke/20 text-[11px] text-pearl">
                Preferred Channel:{' '}
                <strong className="text-bone capitalize">{request.contactPreference}</strong>
              </div>
              {request.budgetRange && (
                <div className="text-[11px] text-pearl">
                  Budget: <strong className="text-bone">{request.budgetRange}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Delivery & Schedule */}
          <div className="bg-graphite border border-smoke/40 rounded-xl p-5 space-y-4">
            <h3 className="font-display text-base font-bold uppercase tracking-tight text-bone flex items-center gap-2">
              <Truck className="w-4 h-4 text-cobalt" />
              <span>Delivery & Fulfillment</span>
            </h3>

            <div className="space-y-2 text-xs font-mono text-pearl">
              <p>
                Method: <strong className="text-bone uppercase">{request.fulfillmentMethod}</strong>
              </p>
              {request.fulfillmentMethod === 'delivery' && request.deliveryAddress ? (
                <div className="bg-charcoal p-2.5 rounded border border-smoke/30 text-bone space-y-0.5">
                  <p>{request.deliveryAddress.street}</p>
                  <p>
                    {request.deliveryAddress.city}, {request.deliveryAddress.state} -{' '}
                    {request.deliveryAddress.pincode}
                  </p>
                </div>
              ) : (
                <p className="text-bone">Self-Pickup at Chennai Production Hub</p>
              )}
              <div className="pt-2 border-t border-smoke/20">
                <p>
                  Target Delivery Date:{' '}
                  <strong className="text-bone">
                    {new Date(request.requiredDeliveryDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </strong>
                </p>
                {request.eventDate && (
                  <p className="text-[11px] text-pearl mt-1">
                    Event Date: {new Date(request.eventDate).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Customer Special Notes */}
          {request.notes && (
            <div className="bg-graphite border border-smoke/40 rounded-xl p-5 space-y-2">
              <h4 className="font-display text-sm font-bold uppercase text-bone">
                Customer Notes / Instructions:
              </h4>
              <p className="text-xs font-mono text-pearl italic">&quot;{request.notes}&quot;</p>
            </div>
          )}

          {/* Messaging Thread & Clarification Center */}
          <div className="bg-graphite border border-smoke/40 rounded-xl p-5 space-y-4">
            <h3 className="font-display text-base font-bold uppercase tracking-tight text-bone flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-cobalt" />
              <span>Production Inquiries & Clarifications</span>
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {(!request.messages || request.messages.length === 0) && (
                <p className="text-xs font-mono text-pearl italic">
                  No messages yet. Send a note or request high-res artwork clarification below.
                </p>
              )}

              {request.messages?.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg text-xs font-mono space-y-1 ${
                    msg.sender === 'admin'
                      ? 'bg-cobalt/15 border border-cobalt/30 text-bone'
                      : 'bg-charcoal border border-smoke/30 text-pearl'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-pearl uppercase font-bold">
                    <span>
                      {msg.sender === 'admin' ? 'Fregoro Staff' : msg.senderName || 'Customer'}
                    </span>
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs font-sans text-bone">{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Post Message Form */}
            <form onSubmit={handleSendMessage} className="space-y-3 pt-2 border-t border-smoke/20">
              <textarea
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                placeholder="Ask customer for vector logo, pantone shade, or size confirmation..."
                rows={2}
                className="w-full bg-charcoal border border-smoke/40 px-3 py-2 text-xs font-mono text-bone placeholder-pearl/50 rounded-lg outline-none"
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[11px] font-mono text-pearl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={markNeedMoreInfo}
                    onChange={(e) => setMarkNeedMoreInfo(e.target.checked)}
                    className="rounded bg-charcoal border-smoke/40 text-rose-500 focus:ring-0"
                  />
                  <span>Mark status as &quot;Need More Info&quot;</span>
                </label>

                <button
                  type="submit"
                  disabled={isSendingMessage || !adminMessage.trim()}
                  className="px-4 py-1.5 bg-cobalt hover:bg-cobalt/80 disabled:opacity-40 text-white font-mono text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </button>
              </div>
            </form>
          </div>

          {/* Audit History Timeline */}
          <div className="bg-graphite border border-smoke/40 rounded-xl p-5 space-y-4">
            <h3 className="font-display text-base font-bold uppercase tracking-tight text-bone flex items-center gap-2">
              <Clock className="w-4 h-4 text-cobalt" />
              <span>Audit History</span>
            </h3>

            <div className="space-y-3 relative pl-4 border-l border-smoke/30">
              {request.statusHistory?.map((h: any, idx: number) => (
                <div key={h.id || idx} className="space-y-0.5 text-xs font-mono relative">
                  <div className="w-2 h-2 rounded-full bg-cobalt absolute -left-[21px] top-1" />
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-bone capitalize">
                      {STATUS_LABELS[h.newStatus]?.label || h.newStatus}
                    </span>
                    <span className="text-pearl">
                      {new Date(h.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  {h.changedBy && (
                    <span className="text-[10px] text-pearl block">By {h.changedBy}</span>
                  )}
                  {h.note && <p className="text-[11px] text-pearl/80">{h.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
