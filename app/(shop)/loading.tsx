export default function ShopLoading() {
  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Category header skeleton */}
      <div className="mb-12">
        <div className="w-32 h-4 bg-white/10 rounded mb-3 animate-pulse" />
        <div className="w-64 h-10 bg-white/10 rounded mb-3 animate-pulse" />
        <div className="w-96 h-5 bg-white/5 rounded animate-pulse" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-[3/4] bg-[#16161A] border border-white/5 rounded-xl animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            </div>
            <div className="w-3/4 h-4 bg-white/10 rounded animate-pulse" />
            <div className="w-1/3 h-5 bg-white/10 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
