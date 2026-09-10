'use client';

import React, { useEffect, useState } from 'react';
import { Database, Download, Trash2, Loader2 } from 'lucide-react';

interface StorageStats {
  usedBytes: number;
  totalBytes: number;
  percentage: number;
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
    if (bytes === 0) return '0 B';
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
    <div className="bg-[#1A1A1E]/80 backdrop-blur-md rounded-xl border border-[#F5F1EA]/10 p-6 flex flex-col justify-between hover:scale-[1.01] hover:border-cobalt/30 transition-all duration-300 shadow-xl group">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display tracking-tight text-bone flex items-center gap-2 text-lg">
            <Database className="w-5 h-5 text-cobalt group-hover:text-cobalt/80 transition-colors" />
            Storage Management
          </h2>
          {loading && <Loader2 className="w-4 h-4 text-ash animate-spin" />}
        </div>

        {data && (
          <div className="space-y-6 mb-6">
            {/* Supabase Meter */}
            <div className="bg-black/20 rounded-lg p-4 border border-[#F5F1EA]/5">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-ash font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                  Supabase Database
                </span>
                <span className="text-bone font-mono">
                  {formatBytes(data.supabase.usedBytes)} / {formatBytes(data.supabase.totalBytes)}
                </span>
              </div>
              <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden border border-[#F5F1EA]/5 mb-4">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.max(data.supabase.percentage, 1)}%` }}
                ></div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => handleDownload('supabase')}
                  disabled={loading}
                  className="py-1.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-md text-xs font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Backup
                </button>
              </div>
            </div>

            {/* Cloudflare R2 Meter */}
            <div className="bg-black/20 rounded-lg p-4 border border-[#F5F1EA]/5">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-ash font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cobalt shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                  Cloudflare R2
                </span>
                <span className="text-bone font-mono">
                  {formatBytes(data.r2.usedBytes)} / {formatBytes(data.r2.totalBytes)}
                </span>
              </div>
              <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden border border-[#F5F1EA]/5 mb-4">
                <div
                  className="h-full bg-gradient-to-r from-cobalt to-[#8b5cf6] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.max(data.r2.percentage, 1)}%` }}
                ></div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => handleDownload('r2')}
                  disabled={loading}
                  className="py-1.5 px-4 bg-cobalt/10 hover:bg-cobalt/20 border border-cobalt/30 text-cobalt rounded-md text-xs font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Backup
                </button>
                <button
                  onClick={handleClearR2}
                  disabled={loading || isClearing}
                  className="py-1.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-md text-xs font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
