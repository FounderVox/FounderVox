'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Clock, MoreVertical, Play, Edit, Trash2, Tag, Wand2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTagColor } from '@/lib/tag-colors'
import { getTemplateColor } from '@/lib/template-colors'

interface NoteCardProps {
  title: string
  preview: string
  createdAt: string
  duration?: string
  isStarred?: boolean
  template?: string
  tags?: string[]
  onPlay?: () => void
  onStar?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onAddTag?: () => void
  onSmartify?: () => void
  onView?: () => void
  noteId?: string
  canSmartify?: boolean
  isSmartified?: boolean
}

export function NoteCard({
  title,
  preview,
  createdAt,
  duration,
  isStarred = false,
  template,
  tags = [],
  onPlay,
  onStar,
  onEdit,
  onDelete,
  onAddTag,
  onSmartify,
  onView,
  noteId,
  canSmartify = true,
  isSmartified = false,
}: NoteCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const handleCardClick = () => {
    if (onView) {
      onView()
    }
  }

  const templateColor = getTemplateColor(template)

  return (
    <motion.div
      className={cn(
        "group bg-white shadow-sm border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer",
        "border-l-4",
        templateColor.borderLeft
      )}
      whileHover={{ y: -2, scale: 1.01 }}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-black font-semibold truncate">{title}</h3>
        </div>
        <div className="flex items-center gap-1 transition-opacity relative">
          {/* Show star when starred, even without hover */}
          {isStarred && (
            <div className="group-hover:hidden">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            </div>
          )}

          {/* Show interactive buttons on hover */}
          <div className={cn("flex items-center gap-1", isStarred ? "hidden group-hover:flex" : "opacity-0 group-hover:opacity-100 transition-opacity duration-200")}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStar?.()
              }}
              className={cn(
                'p-1.5 rounded-lg transition-all duration-200',
                isStarred
                  ? 'text-amber-500 hover:bg-amber-50 hover:shadow-sm'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-brand'
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
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-black transition-all duration-200"
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
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-black hover:bg-gray-200 transition-all duration-200"
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
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-black hover:bg-gray-200 transition-all duration-200"
                    >
                      <Tag className="h-4 w-4" />
                      Add Tag
                    </button>
                    {onSmartify && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsMenuOpen(false)
                          if (canSmartify) {
                            onSmartify?.()
                          }
                        }}
                        disabled={!canSmartify}
                        className={cn(
                          "flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-all duration-200",
                          canSmartify
                            ? "text-black hover:bg-gray-200 hover:shadow-sm"
                            : "text-gray-400 cursor-not-allowed"
                        )}
                        title={!canSmartify && isSmartified ? "Note already smartified. Edit to smartify again." : "Extract structured data from this note"}
                      >
                        <Wand2 className="h-4 w-4" />
                        <span className="flex-1 text-left">
                          {isSmartified ? "Re-smartify" : "Smartify"}
                        </span>
                        {isSmartified && (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsMenuOpen(false)
                        onDelete?.()
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-100 hover:shadow-sm transition-all duration-200"
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
      <p className="text-sm text-gray-600 line-clamp-2 mb-4">{preview}</p>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.map((tag) => {
            const color = getTagColor(tag)
            
            return (
              <span
                key={tag}
                className={cn(
                  "inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border",
                  color.bg,
                  color.text,
                  color.border
                )}
              >
                {tag}
              </span>
            )
          })}
        </div>
      )}

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
            className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-brand hover:text-white transition-all duration-200"
          >
            <Play className="h-4 w-4" fill="currentColor" />
          </button>
        )}
      </div>
    </motion.div>
  )
}
