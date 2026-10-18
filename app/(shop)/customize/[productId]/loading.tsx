export default function CustomizeLoading() {
  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#0c0e12] flex flex-col items-center justify-center gap-5">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-[#F5F1EA]/10" />
        <div className="absolute inset-0 rounded-full border-2 border-t-[#3B5EFF] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm font-semibold tracking-wider text-[#F5F1EA]/80 uppercase font-mono">
          Loading Mockup Studio
        </p>
        <p className="text-xs text-[#F5F1EA]/30 font-mono">Initialising 3D engine…</p>
      </div>
      <div className="w-48 h-1 rounded-full bg-[#1f2530] overflow-hidden">
        <div className="h-full bg-[#3B5EFF]/60 rounded-full animate-pulse w-3/5" />
      </div>
    </div>
  );
}
