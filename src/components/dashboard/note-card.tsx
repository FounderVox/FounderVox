'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Clock, MoreVertical, Play, Edit, Trash2, Tag } from 'lucide-react'
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
  onEdit?: () => void
  onDelete?: () => void
  onAddTag?: () => void
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
  onEdit,
  onDelete,
  onAddTag,
}: NoteCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  return (
    <motion.div
      className="group bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5 hover:bg-black hover:text-white hover:border-black transition-all cursor-pointer"
      whileHover={{ y: -2 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          {template && (
            <span className="inline-block px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-black text-white rounded-full mb-2 group-hover:bg-white group-hover:text-black">
              {template}
            </span>
          )}
          <h3 className="text-black font-semibold truncate group-hover:text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-1 transition-opacity relative">
          {/* Show star when starred, even without hover */}
          {isStarred && (
            <div className="group-hover:hidden">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            </div>
          )}

          {/* Show interactive buttons on hover */}
          <div className={cn("flex items-center gap-1", isStarred ? "hidden group-hover:flex" : "opacity-0 group-hover:opacity-100")}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStar?.()
              }}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isStarred
                  ? 'text-amber-500 hover:bg-white hover:text-black'
                  : 'text-white hover:bg-white/20'
              )}
            >
              <Star className={cn('h-4 w-4', isStarred && 'fill-current')} />
            </button>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsMenuOpen(!isMenuOpen)
              }}
              className="p-1.5 rounded-lg text-white hover:bg-white/20 transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isMenuOpen && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsMenuOpen(false)
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsMenuOpen(false)
                        onEdit?.()
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-black hover:bg-gray-100 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Note
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsMenuOpen(false)
                        onAddTag?.()
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-black hover:bg-gray-100 transition-colors"
                    >
                      <Tag className="h-4 w-4" />
                      Add Tag
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsMenuOpen(false)
                        onDelete?.()
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Note
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <p className="text-sm text-gray-600 line-clamp-2 mb-4 group-hover:text-white/90">{preview}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500 group-hover:text-white/70">
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
            className="p-2 rounded-full bg-white text-black hover:bg-white/90 transition-colors group-hover:bg-white group-hover:text-black"
          >
            <Play className="h-4 w-4" fill="currentColor" />
          </button>
        )}
      </div>
    </motion.div>
  )
}
