'use client'

import { motion } from 'framer-motion'
import { Star, Clock, MoreVertical, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NoteCardProps {
  title: string
  preview: string
  createdAt: string
  duration?: string
  isStarred?: boolean
  template?: string
  onPlay?: () => void
  onStar?: () => void
}

export function NoteCard({
  title,
  preview,
  createdAt,
  duration,
  isStarred = false,
  template,
  onPlay,
  onStar,
}: NoteCardProps) {
  return (
    <motion.div
      className="group bg-gray-800/50 backdrop-blur-sm border border-white/5 rounded-2xl p-5 hover:bg-gray-800/70 hover:border-white/10 transition-all cursor-pointer"
      whileHover={{ y: -2 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          {template && (
            <span className="inline-block px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-violet-500/20 text-violet-300 rounded-full mb-2">
              {template}
            </span>
          )}
          <h3 className="text-white font-semibold truncate">{title}</h3>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onStar?.()
            }}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              isStarred
                ? 'text-amber-400 hover:bg-amber-500/20'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            )}
          >
            <Star className={cn('h-4 w-4', isStarred && 'fill-current')} />
          </button>
          <button className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Preview */}
      <p className="text-sm text-gray-400 line-clamp-2 mb-4">{preview}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {createdAt}
          </span>
          {duration && (
            <span>{duration}</span>
          )}
        </div>
        {onPlay && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPlay()
            }}
            className="p-2 rounded-full bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors"
          >
            <Play className="h-4 w-4" fill="currentColor" />
          </button>
        )}
      </div>
    </motion.div>
  )
}
