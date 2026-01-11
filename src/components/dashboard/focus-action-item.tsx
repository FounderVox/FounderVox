'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ActionItem, formatDeadline, isOverdue, isToday } from '@/types/dashboard'

interface FocusActionItemProps {
  item: ActionItem
  onComplete: (itemId: string) => Promise<void>
}

export function FocusActionItem({ item, onComplete }: FocusActionItemProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(item.status === 'done')

  const handleComplete = async () => {
    if (isCompleting || isCompleted) return

    setIsCompleting(true)
    setIsCompleted(true)

    try {
      await onComplete(item.id)
    } catch (error) {
      // Revert on error
      setIsCompleted(false)
      console.error('Failed to complete item:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  const priorityConfig = {
    high: {
      border: 'border-l-red-500',
      badge: 'bg-red-50 text-red-700 border-red-200',
      label: 'High'
    },
    medium: {
      border: 'border-l-amber-500',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      label: 'Med'
    },
    low: {
      border: 'border-l-gray-400',
      badge: 'bg-gray-50 text-gray-600 border-gray-200',
      label: 'Low'
    }
  }

  const config = priorityConfig[item.priority]
  const deadline = formatDeadline(item.deadline)
  const overdue = isOverdue(item.deadline)
  const today = isToday(item.deadline)

  return (
    <motion.div
      initial={{ opacity: 1, height: 'auto' }}
      animate={{
        opacity: isCompleted ? 0 : 1,
        height: isCompleted ? 0 : 'auto',
        marginBottom: isCompleted ? 0 : undefined
      }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "rounded-xl p-4 bg-white border border-gray-200 shadow-sm border-l-4 transition-all group",
        config.border,
        !isCompleted && "hover:shadow-md hover:border-gray-300"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleComplete}
          disabled={isCompleting || isCompleted}
          className={cn(
            "flex-shrink-0 w-5 h-5 mt-0.5 rounded-md border-2 transition-all flex items-center justify-center",
            isCompleted || isCompleting
              ? "bg-brand border-brand"
              : "border-gray-300 hover:border-brand group-hover:border-gray-400"
          )}
        >
          {(isCompleted || isCompleting) && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </motion.div>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm text-gray-800 leading-relaxed",
            isCompleted && "line-through text-gray-400"
          )}>
            {item.task}
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Priority badge */}
            <span className={cn(
              "px-2 py-0.5 text-xs font-medium rounded-full border",
              config.badge
            )}>
              {config.label}
            </span>

            {/* Deadline */}
            {deadline && (
              <span className={cn(
                "flex items-center gap-1 text-xs",
                overdue ? "text-red-600 font-medium" : today ? "text-brand font-medium" : "text-gray-500"
              )}>
                {overdue ? (
                  <AlertCircle className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
                {deadline}
              </span>
            )}

            {/* Assignee */}
            {item.assignee && (
              <span className="text-xs text-gray-400">
                {item.assignee}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
