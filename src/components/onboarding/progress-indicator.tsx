'use client'

import { cn } from '@/lib/utils'

interface ProgressIndicatorProps {
  current: number
  total: number
}

export function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            index < current
              ? 'w-8 bg-violet-500'
              : index === current
              ? 'w-8 bg-violet-500/50'
              : 'w-2 bg-white/20'
          )}
        />
      ))}
      <span className="ml-2 text-sm text-gray-400">
        {current} of {total}
      </span>
    </div>
  )
}
