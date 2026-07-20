export default function SplitPosterLoading() {
  return (
    <main className="pt-36 md:pt-40 pb-20">
      <div className="section-container">
        <div className="mb-12 max-w-2xl">
          <div className="h-4 w-32 bg-smoke rounded mb-4 animate-pulse" />
          <div className="h-14 w-80 bg-smoke rounded mb-6 animate-pulse" />
          <div className="h-20 w-full max-w-xl bg-smoke rounded animate-pulse" />
        </div>

        <div>
          {/* Controls Skeleton */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="h-4 w-16 bg-smoke rounded animate-pulse" />
              <div className="h-10 w-40 bg-smoke rounded-sm animate-pulse" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-4 w-16 bg-smoke rounded animate-pulse" />
              <div className="h-10 w-48 bg-smoke rounded-sm animate-pulse" />
            </div>
          </div>

          {/* Visualizer Area Skeleton */}
          <div className="w-full min-h-[400px] md:min-h-[500px] lg:min-h-[600px] bg-graphite border border-smoke rounded-lg animate-pulse" />
        </div>
      </div>
    </main>
  );
}
