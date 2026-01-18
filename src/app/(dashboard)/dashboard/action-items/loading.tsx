export default function ActionItemsLoading() {
  return (
    <div className="animate-pulse pb-8">
      {/* Filter bar skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gray-200 rounded-full" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-gray-200 rounded-lg" />
          <div className="h-8 w-20 bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-14 w-14 bg-gray-200 rounded-2xl" />
          <div className="space-y-2">
            <div className="h-8 w-40 bg-gray-200 rounded" />
            <div className="h-4 w-56 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/70 rounded-xl p-4 border border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                <div className="space-y-1">
                  <div className="h-6 w-8 bg-gray-200 rounded" />
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters skeleton */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-12 bg-gray-200 rounded" />
            <div className="h-8 w-48 bg-gray-200 rounded-xl" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-8 bg-gray-200 rounded" />
            <div className="h-8 w-56 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Kanban columns skeleton */}
      <div className="grid md:grid-cols-3 gap-5">
        {[...Array(3)].map((_, colIndex) => (
          <div key={colIndex} className="flex flex-col min-h-[500px] rounded-2xl bg-gray-50 border border-gray-200/60">
            {/* Column header */}
            <div className="flex items-center justify-between p-4 rounded-t-2xl bg-gradient-to-r from-gray-100 to-gray-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-200 rounded-xl" />
                <div className="space-y-1">
                  <div className="h-5 w-24 bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="h-8 w-8 bg-gray-200 rounded-full" />
            </div>

            {/* Cards skeleton */}
            <div className="flex-1 p-3 space-y-3">
              {[...Array(colIndex === 0 ? 3 : colIndex === 1 ? 2 : 1)].map((_, cardIndex) => (
                <div key={cardIndex} className="bg-white rounded-xl border border-gray-200/80 p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-5 w-5 bg-gray-200 rounded" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-full bg-gray-200 rounded" />
                        <div className="h-4 w-2/3 bg-gray-200 rounded" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-14 bg-gray-200 rounded-md" />
                      <div className="h-5 w-20 bg-gray-200 rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
