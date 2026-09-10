export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse p-2">
      <div className="h-7 w-36 bg-white/5 rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-24 bg-white/5 rounded-xl" />
        <div className="h-24 bg-white/5 rounded-xl" />
        <div className="h-24 bg-white/5 rounded-xl" />
      </div>
      <div className="h-72 bg-white/5 rounded-xl" />
      <div className="h-48 bg-white/5 rounded-xl" />
    </div>
  );
}
