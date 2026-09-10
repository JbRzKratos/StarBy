export default function ProductsLoading() {
  return (
    <div className="space-y-6 animate-pulse p-2">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 bg-white/5 rounded-md" />
        <div className="h-9 w-36 bg-white/5 rounded-lg" />
      </div>
      <div className="h-10 w-full bg-white/5 rounded-lg" />
      <div className="bg-white/5 rounded-xl overflow-hidden">
        <div className="h-12 bg-white/[0.03] border-b border-white/5" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-white/5">
            <div className="h-10 w-10 bg-white/5 rounded-lg" />
            <div className="h-4 w-40 bg-white/5 rounded flex-1" />
            <div className="h-4 w-20 bg-white/5 rounded" />
            <div className="h-4 w-16 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
