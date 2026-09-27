'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  MessageCircle,
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  Trash2,
  RefreshCw,
} from 'lucide-react';

export interface AdminContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  subject: string;
  message: string;
  status: string; // 'new' | 'read' | 'replied' | 'closed'
  emailStatus: string; // 'pending' | 'sent' | 'partial' | 'failed'
  emailError: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminContactClientProps {
  initialSubmissions: AdminContactSubmission[];
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: typeof Clock }
> = {
  new: {
    label: 'New',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    icon: Clock,
  },
  read: {
    label: 'Read',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    icon: CheckCircle2,
  },
  replied: {
    label: 'Replied',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
    icon: CheckCircle2,
  },
  closed: {
    label: 'Closed',
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-400',
    border: 'border-zinc-500/20',
    icon: CheckCircle2,
  },
};

export function AdminContactClient({ initialSubmissions }: AdminContactClientProps) {
  const [submissions, setSubmissions] = useState<AdminContactSubmission[]>(initialSubmissions);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const metrics = useMemo(() => {
    const total = submissions.length;
    const newCount = submissions.filter((s) => s.status === 'new').length;
    const readCount = submissions.filter((s) => s.status === 'read').length;
    const repliedCount = submissions.filter((s) => s.status === 'replied').length;
    const closedCount = submissions.filter((s) => s.status === 'closed').length;
    return { total, newCount, readCount, repliedCount, closedCount };
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (statusFilter !== 'all' && sub.status !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = sub.name.toLowerCase().includes(q);
        const matchEmail = sub.email.toLowerCase().includes(q);
        const matchPhone = (sub.phone || '').toLowerCase().includes(q);
        const matchCompany = (sub.company || '').toLowerCase().includes(q);
        const matchSubject = sub.subject.toLowerCase().includes(q);
        const matchMessage = sub.message.toLowerCase().includes(q);
        return (
          matchName || matchEmail || matchPhone || matchCompany || matchSubject || matchMessage
        );
      }
      return true;
    });
  }, [submissions, statusFilter, search]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/contact/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update status');
      }
      setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
      setActionMessage({ type: 'success', text: `Status updated to ${newStatus}` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating status';
      setActionMessage({ type: 'error', text: msg });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRetryEmail = async (id: string) => {
    setRetryingId(id);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/contact/${id}/retry-email`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to resend email');
      }
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, emailStatus: 'sent', emailError: null } : s)),
      );
      setActionMessage({
        type: 'success',
        text: 'Enquiry notification emails resent successfully',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error resending email';
      setActionMessage({ type: 'error', text: msg });
    } finally {
      setRetryingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this enquiry? This action cannot be undone.')) {
      return;
    }
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/contact/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete');
      }
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setActionMessage({ type: 'success', text: 'Enquiry deleted' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting';
      setActionMessage({ type: 'error', text: msg });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Contact Enquiries</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage submissions from the Contact Us form, reply via email or WhatsApp.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs opacity-75 hover:opacity-100 uppercase font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-[#141419] border border-white/10 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Total</p>
          <p className="text-2xl font-bold text-white mt-1">{metrics.total}</p>
        </div>
        <div className="bg-[#141419] border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-emerald-400 font-medium">New</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{metrics.newCount}</p>
        </div>
        <div className="bg-[#141419] border border-blue-500/20 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-blue-400 font-medium">Read</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{metrics.readCount}</p>
        </div>
        <div className="bg-[#141419] border border-purple-500/20 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-purple-400 font-medium">Replied</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{metrics.repliedCount}</p>
        </div>
        <div className="bg-[#141419] border border-zinc-500/20 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Closed</p>
          <p className="text-2xl font-bold text-zinc-300 mt-1">{metrics.closedCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, email, subject, phone..."
            className="w-full pl-10 pr-4 py-2 bg-[#141419] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-[#141419] p-1 rounded-xl border border-white/10 overflow-x-auto">
          {(['all', 'new', 'read', 'replied', 'closed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-[#141419] border border-white/10 rounded-2xl p-12 text-center">
          <Mail className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No enquiries found</h3>
          <p className="text-sm text-zinc-400 mt-1">
            {search || statusFilter !== 'all'
              ? 'Try changing your search query or status filter.'
              : 'Submissions through the Contact Us form will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((sub) => {
            const statusConfig = STATUS_CONFIG[sub.status] || STATUS_CONFIG.new;
            const isExpanded = expandedId === sub.id;
            const dateStr = new Date(sub.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            // Build WhatsApp link for customer's phone if available
            const customerWhatsAppLink = sub.phone
              ? `https://wa.me/${sub.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Hi ${sub.name}, thank you for reaching out to Fregoro Studios regarding "${sub.subject}". We'd love to assist you!`,
                )}`
              : null;

            return (
              <div
                key={sub.id}
                className="bg-[#141419] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors"
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-base">{sub.name}</span>
                      {sub.company && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 border border-white/10">
                          <Building2 className="w-3 h-3" />
                          {sub.company}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                      >
                        {statusConfig.label}
                      </span>

                      {/* Email Status Indicator */}
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${
                          sub.emailStatus === 'sent'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : sub.emailStatus === 'failed'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                        title={sub.emailError || undefined}
                      >
                        Email: {sub.emailStatus}
                      </span>
                    </div>

                    <h4 className="text-sm font-medium text-amber-300/90 pt-1">
                      Subject: {sub.subject}
                    </h4>

                    {/* Metadata chips */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 pt-1">
                      <a
                        href={`mailto:${sub.email}?subject=${encodeURIComponent(`Re: ${sub.subject} — Fregoro Studios`)}`}
                        className="inline-flex items-center gap-1 hover:text-white transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-zinc-500" />
                        {sub.email}
                      </a>
                      {sub.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" />
                          {sub.phone}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-zinc-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {dateStr}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
                    {/* Status Dropdown */}
                    <div className="relative">
                      <select
                        value={sub.status}
                        disabled={updatingId === sub.id}
                        onChange={(e) => handleStatusChange(sub.id, e.target.value)}
                        className="bg-[#0E0E12] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-300 font-medium appearance-none pr-8 cursor-pointer focus:outline-none focus:border-white/30 disabled:opacity-50"
                      >
                        <option value="new">Mark as New</option>
                        <option value="read">Mark as Read</option>
                        <option value="replied">Mark as Replied</option>
                        <option value="closed">Mark as Closed</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Direct Email Reply Button */}
                    <a
                      href={`mailto:${sub.email}?subject=${encodeURIComponent(`Re: ${sub.subject} — Fregoro Studios`)}`}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white transition-colors inline-flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Reply
                    </a>

                    {/* WhatsApp Button */}
                    {customerWhatsAppLink && (
                      <a
                        href={customerWhatsAppLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-xl text-xs font-semibold text-[#25D366] transition-colors inline-flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    )}

                    {/* Retry Email Button if failed */}
                    {sub.emailStatus !== 'sent' && (
                      <button
                        onClick={() => handleRetryEmail(sub.id)}
                        disabled={retryingId === sub.id}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs font-semibold text-amber-400 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                        title="Resend enquiry notification emails"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${retryingId === sub.id ? 'animate-spin' : ''}`}
                        />
                        Retry Email
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(sub.id)}
                      disabled={updatingId === sub.id}
                      className="p-1.5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-lg transition-colors"
                      title="Delete enquiry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <div className="mt-4 pt-3 border-t border-white/5">
                  <p
                    className={`text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap ${
                      !isExpanded ? 'line-clamp-3' : ''
                    }`}
                  >
                    {sub.message}
                  </p>
                  {sub.message.length > 200 && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                      className="text-xs font-semibold text-zinc-400 hover:text-white mt-2 transition-colors"
                    >
                      {isExpanded ? 'Show less' : 'Read full message'}
                    </button>
                  )}
                </div>

                {sub.emailError && (
                  <div className="mt-3 p-2.5 rounded-lg bg-red-500/5 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Email Delivery Note: {sub.emailError}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
