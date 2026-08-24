'use client';

import type { PreflightReport } from '@/types/magazine';

interface PreflightModalProps {
  report: PreflightReport;
  onClose: () => void;
  onSelectPage?: (pageNumber: number) => void;
  onProceedToOrder: () => void;
}

export function PreflightModal({
  report,
  onClose,
  onSelectPage,
  onProceedToOrder,
}: PreflightModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121214] border border-[#F5F1EA]/15 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#F5F1EA]">
        {/* Header */}
        <div className="p-6 border-b border-[#F5F1EA]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                report.isPrintReady
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {report.isPrintReady ? '✓' : '⚠'}
            </div>
            <div>
              <h3 className="font-display text-xl font-bold">Print Preflight Check</h3>
              <p className="font-mono text-xs text-[#F5F1EA]/60">
                {report.isPrintReady
                  ? 'All print specifications validated for high-fidelity production.'
                  : `${report.errorCount} critical errors · ${report.warningCount} quality warnings.`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1A1A1E] hover:bg-[#25252E] text-[#F5F1EA]/60 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Issue List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {report.issues.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-2xl text-emerald-400">
                ✓
              </div>
              <h4 className="font-display text-lg font-bold text-emerald-400">
                Ready for Press Production
              </h4>
              <p className="font-mono text-xs text-[#F5F1EA]/70 max-w-md mx-auto leading-relaxed">
                Page dimensions, 3mm bleed margins, safe typography bounds, and image resolutions
                meet commercial print house requirements.
              </p>
            </div>
          ) : (
            report.issues.map((issue) => (
              <div
                key={issue.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start justify-between gap-4 ${
                  issue.severity === 'error'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : issue.severity === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-black/40">
                      Page {issue.pageNumber} · {issue.severity.toUpperCase()}
                    </span>
                    <span className="font-display text-sm font-bold text-white">{issue.title}</span>
                  </div>
                  <p className="font-mono text-xs text-[#F5F1EA]/80 leading-relaxed">
                    {issue.message}
                  </p>
                  {issue.fixSuggestion && (
                    <p className="font-mono text-[11px] text-[#F5F1EA]/50 italic pt-1">
                      Tip: {issue.fixSuggestion}
                    </p>
                  )}
                </div>

                {onSelectPage && (
                  <button
                    onClick={() => {
                      onSelectPage(issue.pageNumber);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 font-mono text-xs text-white border border-[#F5F1EA]/20 whitespace-nowrap"
                  >
                    Go to Page {issue.pageNumber} →
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#F5F1EA]/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0D0D0E]">
          <span className="font-mono text-xs text-[#F5F1EA]/50 text-center sm:text-left">
            FREGORO print engineers review all files before plate generation.
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-[#1A1A1E] hover:bg-[#25252E] text-xs font-mono font-bold uppercase tracking-wider"
            >
              Back to Editor
            </button>
            <button
              onClick={onProceedToOrder}
              disabled={report.errorCount > 0}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-[#0057FF] hover:bg-[#0046CC] disabled:opacity-40 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-lg shadow-[#0057FF]/30"
            >
              Continue to Order →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
