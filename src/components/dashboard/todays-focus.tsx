'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, ChevronDown, CheckSquare, Zap, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ActionItem, BrainDumpItem, TodaysFocusStats, isOverdue, dispatchActionItemEvent } from '@/types/dashboard'
import { FocusActionItem } from './focus-action-item'
import { FocusBrainItem } from './focus-brain-item'
import { createClient } from '@/lib/supabase/client'
import { Toast } from '@/components/ui/toast'
import Link from 'next/link'

interface TodaysFocusSectionProps {
  actionItems: ActionItem[]
  brainDumpItems: BrainDumpItem[]
  onItemsChange?: () => void
}

export function TodaysFocusSection({
  actionItems,
  brainDumpItems,
  onItemsChange
}: TodaysFocusSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [localActionItems, setLocalActionItems] = useState(actionItems)
  const [toast, setToast] = useState<{ open: boolean; message: string; description?: string; variant: 'success' | 'error' }>({
    open: false,
    message: '',
    variant: 'success'
  })

  // Calculate stats
  const stats: TodaysFocusStats = {
    totalItems: localActionItems.length + brainDumpItems.length,
    highPriority: localActionItems.filter(i => i.priority === 'high' && i.status !== 'done').length,
    overdue: localActionItems.filter(i => isOverdue(i.deadline) && i.status !== 'done').length,
    actionItems: localActionItems.filter(i => i.status !== 'done').length,
    brainDumpItems: brainDumpItems.length
  }

  const handleCompleteItem = async (itemId: string) => {
    const supabase = createClient()

    // Optimistic update
    setLocalActionItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, status: 'done' as const, completed_at: new Date().toISOString() }
          : item
      )
    )

    try {
      const { error } = await supabase
        .from('action_items')
        .update({
          status: 'done',
          completed_at: new Date().toISOString()
        })
        .eq('id', itemId)

      if (error) throw error

      // Dispatch event for cross-page sync
      dispatchActionItemEvent('actionItemCompleted', { itemId, status: 'done' })

      setToast({
        open: true,
        message: 'Task completed',
        description: 'Great work! Keep it up.',
        variant: 'success'
      })

      // Notify parent to refresh data
      onItemsChange?.()
    } catch (error) {
      console.error('Failed to complete item:', error)
      // Revert optimistic update
      setLocalActionItems(actionItems)
      setToast({
        open: true,
        message: 'Failed to complete task',
        description: 'Please try again.',
        variant: 'error'
      })
    }
  }

  // Filter out completed items for display
  const activeActionItems = localActionItems.filter(i => i.status !== 'done')

  // Show empty state if no items
  if (stats.totalItems === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gray-50 border border-gray-200 mb-4">
            <Sparkles className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="text-gray-900 font-semibold mb-1">All caught up!</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            No urgent items need your attention right now. Record a note to get started.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {/* Section Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header - Always Visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
              <Target className="h-6 w-6 text-brand" />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold text-gray-900">Today's Focus</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                {stats.actionItems > 0 && `${stats.actionItems} action item${stats.actionItems !== 1 ? 's' : ''}`}
                {stats.actionItems > 0 && stats.brainDumpItems > 0 && ' \u2022 '}
                {stats.highPriority > 0 && (
                  <span className="text-red-600 font-medium">{stats.highPriority} high priority</span>
                )}
                {stats.overdue > 0 && (
                  <>
                    {stats.highPriority > 0 && ' \u2022 '}
                    <span className="text-red-600 font-medium">{stats.overdue} overdue</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Stats Pills - visible when collapsed */}
            {!isExpanded && activeActionItems.length > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                {activeActionItems.slice(0, 2).map((item) => (
                  <span
                    key={item.id}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-full border truncate max-w-[150px]",
                      item.priority === 'high'
                        ? "bg-red-50 text-red-700 border-red-200"
                        : item.priority === 'medium'
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    )}
                  >
                    {item.task}
                  </span>
                ))}
                {activeActionItems.length > 2 && (
                  <span className="px-2 py-1 text-xs text-gray-500">
                    +{activeActionItems.length - 2} more
                  </span>
                )}
              </div>
            )}

            {/* Expand/Collapse Icon */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="p-2 rounded-lg bg-gray-100 text-gray-600"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </div>
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="px-6 pb-6 pt-2 space-y-6">
                {/* Action Items Section */}
                {activeActionItems.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-brand" />
                        <h3 className="text-sm font-semibold text-gray-700">Action Items</h3>
                        <span className="px-1.5 py-0.5 text-xs text-gray-500 bg-gray-100 rounded">
                          {activeActionItems.length}
                        </span>
                      </div>
                      <Link
                        href="/dashboard/action-items"
                        className="text-xs text-brand hover:text-brand/80 font-medium transition-colors"
                      >
                        View all
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {activeActionItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <FocusActionItem
                            item={item}
                            onComplete={handleCompleteItem}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Brain Dump Section */}
                {brainDumpItems.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <h3 className="text-sm font-semibold text-gray-700">Quick Thoughts</h3>
                        <span className="px-1.5 py-0.5 text-xs text-gray-500 bg-gray-100 rounded">
                          {brainDumpItems.length}
                        </span>
                      </div>
                      <Link
                        href="/dashboard/brain-dump"
                        className="text-xs text-brand hover:text-brand/80 font-medium transition-colors"
                      >
                        View all
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {brainDumpItems.slice(0, 3).map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (activeActionItems.length + index) * 0.05 }}
                        >
                          <FocusBrainItem item={item} />
                        </motion.div>
                      ))}
                      {brainDumpItems.length > 3 && (
                        <Link
                          href="/dashboard/brain-dump"
                          className="block text-center py-2 text-sm text-gray-500 hover:text-brand transition-colors"
                        >
                          +{brainDumpItems.length - 3} more items
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast Notification */}
      <Toast
        open={toast.open}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        message={toast.message}
        description={toast.description}
        variant={toast.variant}
        position="bottom-right"
      />
    </motion.div>
  )
}
