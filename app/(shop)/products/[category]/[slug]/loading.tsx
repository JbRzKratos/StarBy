export default function ProductDetailLoading() {
  return (
    <main className="pt-36 md:pt-40 pb-20">
      <div className="section-container grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
        {/* Left: Gallery Skeleton */}
        <div className="flex flex-col gap-4">
          <div className="w-full aspect-[3/4] bg-[#16161A] border border-white/5 rounded-2xl animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-16 h-20 rounded-lg bg-[#16161A] border border-white/5 animate-pulse flex-shrink-0"
              />
            ))}
          </div>
        </div>

        {/* Right: Product Info Skeleton */}
        <div className="flex flex-col gap-6 md:pt-8">
          <div>
            <div className="w-24 h-4 bg-white/10 rounded mb-3 animate-pulse" />
            <div className="w-4/5 h-10 bg-white/10 rounded mb-2 animate-pulse" />
            <div className="w-1/2 h-5 bg-white/10 rounded animate-pulse" />
          </div>

          <div className="flex items-baseline gap-3">
            <div className="w-28 h-8 bg-white/10 rounded animate-pulse" />
            <div className="w-16 h-4 bg-white/10 rounded animate-pulse" />
          </div>

          {/* Options skeleton */}
          <div className="flex flex-col gap-3">
            <div className="w-32 h-4 bg-white/10 rounded animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
              <div className="h-16 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
            </div>
          </div>

          {/* Sizes skeleton */}
          <div className="flex flex-col gap-3">
            <div className="w-24 h-4 bg-white/10 rounded animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-12 h-10 rounded-lg bg-white/5 border border-white/10 animate-pulse" />
              ))}
            </div>
          </div>

          {/* Action button skeleton */}
          <div className="mt-4 flex flex-col gap-3">
            <div className="w-full h-14 rounded-lg bg-white/10 animate-pulse" />
            <div className="w-full h-12 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}
