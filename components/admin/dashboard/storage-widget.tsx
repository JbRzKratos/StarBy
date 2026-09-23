'use client';

import React, { useEffect, useState } from 'react';
import { Database, Download, Trash2, Loader2, RefreshCw } from 'lucide-react';

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
  const [isClearing, setIsClearing] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/storage/stats');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to fetch storage stats', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (target: 'supabase' | 'r2') => {
    if (data && data[target].usedBytes === 0) {
      alert(`There are no files in ${target === 'r2' ? 'Cloudflare R2' : 'Supabase'} to download.`);
      return;
    }
    window.location.href = `/api/admin/storage/download?target=${target}`;
  };

  const handleClearR2 = async () => {
    if (data && data.r2.usedBytes === 0) {
      alert('There are no files in Cloudflare R2 to clear.');
      return;
    }

    if (
      !window.confirm(
        'Are you sure you want to permanently delete all customer design files from Cloudflare R2? Make sure you have downloaded a backup first!',
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
        const error = await res.json();
        alert('Failed to clear storage: ' + error.message);
      }
    } catch (error) {
      console.error(error);
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

        {data && (
          <div className="space-y-5 mb-2">
            {/* Supabase PostgreSQL Database */}
            <div className="bg-black/30 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-200 font-semibold flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                  Supabase PostgreSQL
                </span>
                <span className="text-emerald-400 font-mono text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {data.supabase.percentage}% used
                </span>
              </div>

              <div className="flex justify-between items-baseline mb-2">
                <span className="text-white font-mono text-base font-bold">
                  {formatBytes(data.supabase.usedBytes)}
                </span>
                <span className="text-slate-400 font-mono text-xs">
                  limit: {formatBytes(data.supabase.totalBytes)}
                </span>
              </div>

              <p className="text-[11px] font-mono text-slate-400 mb-3">
                Exact: {data.supabase.usedBytes.toLocaleString()} bytes
              </p>

              <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10 mb-4">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(data.supabase.percentage, 1.5)}%` }}
                ></div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleDownload('supabase')}
                  disabled={loading}
                  className="py-1.5 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Backup
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
                  {data.r2.percentage}% used
                </span>
              </div>

              <div className="flex justify-between items-baseline mb-2">
                <span className="text-white font-mono text-base font-bold">
                  {formatBytes(data.r2.usedBytes)}
                </span>
                <span className="text-slate-400 font-mono text-xs">
                  limit: {formatBytes(data.r2.totalBytes)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-3">
                <span>Exact: {data.r2.usedBytes.toLocaleString()} bytes</span>
                {typeof data.r2.fileCount === 'number' && (
                  <span className="text-slate-300 font-medium">
                    {data.r2.fileCount} {data.r2.fileCount === 1 ? 'file' : 'files'}
                  </span>
                )}
              </div>

              <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10 mb-4">
                <div
                  className="h-full bg-gradient-to-r from-cobalt to-[#8b5cf6] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(data.r2.percentage, 1.5)}%` }}
                ></div>
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => handleDownload('r2')}
                  disabled={loading}
                  className="py-1.5 px-3 bg-cobalt/15 hover:bg-cobalt/25 border border-cobalt/30 text-blue-300 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Backup
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
