export function ClothingProductModalLoading() {
  return (
    <div
      data-fregoro-modal-loading
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[99990] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-fadeIn"
    >
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#111216] p-5 shadow-2xl shadow-black/60">
        <div className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
            <span className="h-5 w-5 rounded-full border-2 border-white/15 border-t-[#ED9518] animate-spin" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-white/90">
              Preparing product
            </p>
            <p className="mt-1 font-mono text-[10px] leading-relaxed text-white/50">
              Loading artwork and garment controls…
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <div className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-xl border border-white/5 bg-[#181A20]">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.06] to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-7 w-7 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
            <div className="h-2.5 w-3/4 animate-pulse rounded-full bg-white/10" />
            <div className="h-2 w-1/2 animate-pulse rounded-full bg-white/[0.07]" />
            <div className="mt-auto grid grid-cols-4 gap-1.5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-7 animate-pulse rounded-lg border border-white/5 bg-white/[0.05]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
