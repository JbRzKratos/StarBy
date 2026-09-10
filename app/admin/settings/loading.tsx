export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse p-2">
      <div className="h-7 w-28 bg-white/5 rounded-md" />
      <div className="bg-white/5 rounded-xl p-6 space-y-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 bg-white/5 rounded" />
            <div className="h-10 w-full bg-white/[0.03] rounded-lg" />
          </div>
        ))}
        <div className="h-10 w-32 bg-white/5 rounded-lg mt-4" />
      </div>
    </div>
  );
}
