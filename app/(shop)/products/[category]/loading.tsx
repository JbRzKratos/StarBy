export default function CategoryLoading() {
  return (
    <main className="min-h-screen bg-graphite flex flex-col lg:flex-row pt-20">
      {/* Left Pane - Sticky Cover Skeleton */}
      <div className="w-full lg:w-5/12 xl:w-4/12 lg:h-[calc(100vh-5rem)] flex flex-col justify-end p-8 md:p-12 lg:p-16 relative bg-charcoal/50">
        <div className="relative z-10 w-full">
          <div className="h-4 w-24 bg-smoke rounded mb-4 animate-pulse" />
          <div className="h-16 md:h-24 lg:h-32 w-3/4 bg-smoke rounded mb-6 animate-pulse" />
          <div className="h-6 w-full max-w-sm bg-smoke rounded mb-2 animate-pulse" />
          <div className="h-6 w-2/3 max-w-sm bg-smoke rounded animate-pulse" />
        </div>
      </div>

      {/* Right Pane - Scrollable Content Skeleton */}
      <div className="w-full lg:w-7/12 xl:w-8/12 flex flex-col">
        {/* Sticky Filter Bar */}
        <div className="border-b border-smoke px-6 py-4 md:px-12 flex justify-between">
          <div className="flex gap-2 w-full max-w-sm">
            <div className="h-8 w-16 bg-smoke rounded-sm animate-pulse" />
            <div className="h-8 w-20 bg-smoke rounded-sm animate-pulse" />
            <div className="h-8 w-24 bg-smoke rounded-sm animate-pulse" />
          </div>
          <div className="h-8 w-32 bg-smoke rounded-sm animate-pulse shrink-0 hidden sm:block" />
        </div>

        {/* Product Grid Skeleton */}
        <div className="p-6 md:p-12 lg:p-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 items-start sm:[&>*:nth-child(even)]:mt-16 xl:[&>*:nth-child(even)]:mt-0 xl:[&>*:nth-child(3n-1)]:mt-16 xl:[&>*:nth-child(3n)]:mt-32 pb-32">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-full flex flex-col gap-4">
                <div className="w-full aspect-[3/4] bg-smoke rounded-lg animate-pulse" />
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-1/3 bg-smoke rounded animate-pulse" />
                  <div className="h-6 w-2/3 bg-smoke rounded animate-pulse" />
                  <div className="flex justify-between mt-2">
                    <div className="h-5 w-16 bg-smoke rounded animate-pulse" />
                    <div className="h-5 w-8 bg-smoke rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
