export default function CategoriesLoading() {
  return (
    <div className="space-y-6 animate-pulse p-2">
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 bg-white/5 rounded-md" />
        <div className="h-9 w-32 bg-white/5 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-white/5 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
