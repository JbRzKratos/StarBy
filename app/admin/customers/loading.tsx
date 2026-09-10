export default function CustomersLoading() {
  return (
    <div className="space-y-6 animate-pulse p-2">
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 bg-white/5 rounded-md" />
        <div className="h-9 w-28 bg-white/5 rounded-lg" />
      </div>
      <div className="h-10 w-full bg-white/5 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/[0.08] rounded-full" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-28 bg-white/[0.08] rounded" />
                <div className="h-3 w-36 bg-white/5 rounded" />
              </div>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/5">
              <div className="h-3 w-16 bg-white/5 rounded" />
              <div className="h-3 w-20 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
