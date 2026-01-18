export default function BrainDumpLoading() {
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
            <div className="h-8 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-64 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[...Array(5)].map((_, i) => (
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
      </div>

      {/* Category columns skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {['Meetings', 'Blockers', 'Decisions', 'Questions', 'Follow-ups'].map((label, colIndex) => (
          <div key={colIndex} className="flex flex-col min-h-[400px] rounded-2xl bg-gray-50 border border-gray-200/60">
            {/* Column header */}
            <div className="flex items-center justify-between p-3 rounded-t-2xl bg-gradient-to-r from-gray-100 to-gray-50">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                <div className="h-5 w-20 bg-gray-200 rounded" />
              </div>
              <div className="h-6 w-6 bg-gray-200 rounded-full" />
            </div>

            {/* Cards skeleton */}
            <div className="flex-1 p-2 space-y-2">
              {[...Array(colIndex % 2 === 0 ? 2 : 3)].map((_, cardIndex) => (
                <div key={cardIndex} className="bg-white rounded-xl border border-gray-200/80 p-3">
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-4 w-16 bg-gray-200 rounded" />
                      <div className="h-4 w-12 bg-gray-200 rounded" />
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
