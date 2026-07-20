export default function CustomizeLoading() {
  return (
    <main className="pt-24 md:pt-28 pb-20">
      <div className="section-container">
        <div className="mb-8">
          <div className="h-4 w-32 bg-smoke rounded mb-3 animate-pulse" />
          <div className="h-12 w-64 bg-smoke rounded mb-3 animate-pulse" />
          <div className="h-5 w-80 max-w-full bg-smoke rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canvas Skeleton */}
          <div className="lg:col-span-2">
            <div className="w-full aspect-[4/5] bg-graphite border border-smoke rounded-lg animate-pulse" />
          </div>

          {/* Toolbar sidebar Skeleton */}
          <div className="bg-graphite border border-smoke rounded-lg p-6">
            <div className="h-6 w-32 bg-smoke rounded mb-8 animate-pulse" />

            <div className="flex flex-col gap-8">
              <div>
                <div className="h-4 w-24 bg-smoke rounded mb-3 animate-pulse" />
                <div className="h-32 w-full bg-charcoal border border-smoke rounded-lg animate-pulse" />
              </div>

              <div>
                <div className="h-4 w-20 bg-smoke rounded mb-3 animate-pulse" />
                <div className="h-10 w-full bg-charcoal border border-smoke rounded-sm animate-pulse" />
              </div>

              <div>
                <div className="h-4 w-28 bg-smoke rounded mb-3 animate-pulse" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-smoke animate-pulse" />
                  ))}
                </div>
              </div>
            </div>

            <div className="h-12 w-full bg-smoke rounded-sm mt-8 animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}
