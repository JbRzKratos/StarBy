'use client';

import React, { useEffect, useState } from 'react';
import { Database, Download, Trash2, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface StorageStats {
  usedBytes: number;
  totalBytes: number;
  percentage: number;
  fileCount?: number;
}

interface StorageData {
  r2: StorageStats;
  supabase: StorageStats;
}

export function StorageWidget() {
  const [data, setData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/storage/stats');
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!json || typeof json !== 'object' || !json.supabase || !json.r2) {
        throw new Error('Invalid storage data format received');
      }
      setData(json);
    } catch (err: unknown) {
      console.error('Failed to fetch storage stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch storage stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0 || isNaN(bytes)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const supabaseStats = data?.supabase ?? {
    usedBytes: 0,
    totalBytes: 500 * 1024 * 1024,
    percentage: 0,
  };

  const r2Stats = data?.r2 ?? {
    usedBytes: 0,
    totalBytes: 10 * 1024 * 1024 * 1024,
    percentage: 0,
    fileCount: 0,
  };

  const handleDownload = (target: 'supabase' | 'r2') => {
    const used = target === 'supabase' ? supabaseStats.usedBytes : r2Stats.usedBytes;
    if (used === 0) {
      alert(`There are no files in ${target === 'r2' ? 'Cloudflare R2' : 'Supabase'} to download.`);
      return;
    }
    window.location.href = `/api/admin/storage/download?target=${target}`;
  };

  const handleClearR2 = async () => {
    if (r2Stats.usedBytes === 0) {
      alert('There are no files in Cloudflare R2 to clear.');
      return;
    }

    if (
      !window.confirm(
        'Are you sure you want to permanently delete all customer design files from Cloudflare R2? Make sure you have downloaded the assets first!',
      )
    ) {
      return;
    }

    setIsClearing(true);
    try {
      const res = await fetch('/api/admin/storage/clear', { method: 'DELETE' });
      if (res.ok) {
        alert('R2 Storage cleared successfully!');
        await fetchStats();
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert('Failed to clear storage: ' + (errJson.message || errJson.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while clearing storage.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="bg-[#1A1A1E] rounded-xl border border-white/10 p-6 flex flex-col justify-between hover:border-cobalt/40 transition-all duration-300 shadow-xl group">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display tracking-tight text-white flex items-center gap-2 text-lg font-bold">
            <Database className="w-5 h-5 text-cobalt" />
            Storage Capacity
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStats}
              disabled={loading}
              title="Refresh live storage usage"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cobalt' : ''}`} />
            </button>
          </div>
        </div>

        {loading && !data ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-cobalt" />
            <span className="font-mono text-xs">Loading storage metrics...</span>
          </div>
        ) : error && !data ? (
          <div className="bg-black/30 rounded-lg p-5 border border-white/10 text-center my-4">
            <AlertCircle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-xs text-slate-300 font-mono mb-3">Metrics currently unavailable</p>
            <button
              onClick={fetchStats}
              className="py-1.5 px-3 bg-white/10 hover:bg-white/15 text-white rounded text-xs font-mono transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-5 mb-2">
            {/* Supabase PostgreSQL Database */}
            <div className="bg-black/30 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-200 font-semibold flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                  Database Asset Records
                </span>
                <span className="text-emerald-400 font-mono text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {supabaseStats.percentage}% used
                </span>
              </div>

              <div className="flex justify-between items-baseline mb-2">
                <span className="text-white font-mono text-base font-bold">
                  {formatBytes(supabaseStats.usedBytes)}
                </span>
                <span className="text-slate-400 font-mono text-xs">
                  limit: {formatBytes(supabaseStats.totalBytes)}
                </span>
              </div>

              <p className="text-[11px] font-mono text-slate-400 mb-3">
                Exact: {supabaseStats.usedBytes.toLocaleString()} bytes
              </p>

              <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10 mb-4">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(supabaseStats.percentage, 1.5)}%` }}
                ></div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleDownload('supabase')}
                  disabled={loading}
                  className="py-1.5 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Assets
                </button>
              </div>
            </div>

            {/* Cloudflare R2 Storage */}
            <div className="bg-black/30 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-200 font-semibold flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cobalt shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                  Cloudflare R2 Bucket
                </span>
                <span className="text-blue-400 font-mono text-xs font-bold bg-cobalt/10 px-2 py-0.5 rounded border border-cobalt/20">
                  {r2Stats.percentage}% used
                </span>
              </div>

              <div className="flex justify-between items-baseline mb-2">
                <span className="text-white font-mono text-base font-bold">
                  {formatBytes(r2Stats.usedBytes)}
                </span>
                <span className="text-slate-400 font-mono text-xs">
                  limit: {formatBytes(r2Stats.totalBytes)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-3">
                <span>Exact: {r2Stats.usedBytes.toLocaleString()} bytes</span>
                {typeof r2Stats.fileCount === 'number' && (
                  <span className="text-slate-300 font-medium">
                    {r2Stats.fileCount} {r2Stats.fileCount === 1 ? 'file' : 'files'}
                  </span>
                )}
              </div>

              <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10 mb-4">
                <div
                  className="h-full bg-gradient-to-r from-cobalt to-[#8b5cf6] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(r2Stats.percentage, 1.5)}%` }}
                ></div>
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => handleDownload('r2')}
                  disabled={loading}
                  className="py-1.5 px-3 bg-cobalt/15 hover:bg-cobalt/25 border border-cobalt/30 text-blue-300 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Assets
                </button>
                <button
                  onClick={handleClearR2}
                  disabled={loading || isClearing}
                  className="py-1.5 px-3 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isClearing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Clear Storage
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
