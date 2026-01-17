'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('[FounderNote:Error] Error caught:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      name: error.name,
    })
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-black mb-4">Something went wrong!</h2>
        <p className="text-gray-600 mb-6">{error.message}</p>
        <div className="space-y-3">
          <Button onClick={reset} className="w-full">
            Try again
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 mb-2">
              Error Details (Dev Only)
            </summary>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

