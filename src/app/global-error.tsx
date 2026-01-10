'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[FounderNote:GlobalError] Global error caught:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      name: error.name,
    })
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-black mb-4">Something went wrong!</h2>
            <p className="text-gray-600 mb-6">{error.message}</p>
            <button
              onClick={reset}
              className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

