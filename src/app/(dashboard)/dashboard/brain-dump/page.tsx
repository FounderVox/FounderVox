'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { Brain, Users, HelpCircle, AlertTriangle, GitBranch, ArrowRightCircle, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useSidebar } from '@/components/dashboard/sidebar'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Toast } from '@/components/ui/toast'

export const dynamic = 'force-dynamic'

interface BrainDumpItem {
  id: string
  content: string
  category: 'meeting' | 'blocker' | 'decision' | 'question' | 'followup'
  participants: string[] | null
  created_at: string
}

type CategoryColumn = 'meeting' | 'blocker' | 'decision' | 'question' | 'followup'

export default function BrainDumpPage() {
  const [profile, setProfile] = useState<any>(null)
  const [items, setItems] = useState<BrainDumpItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draggedItem, setDraggedItem] = useState<{ itemId: string; category: CategoryColumn; index: number } | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<CategoryColumn | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; message: string; description?: string; variant: 'success' | 'error' }>({ open: false, message: '', variant: 'success' })
  const supabase = createClient()
  const { setIsCollapsed } = useSidebar()

  // Collapse sidebar when page loads
  useEffect(() => {
    setIsCollapsed(true)
  }, [setIsCollapsed])

  const loadData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('[BrainDump] Error getting user:', userError)
        setIsLoading(false)
        return
      }

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      // Load brain dump items via recordings
      const { data: recordings } = await supabase
        .from('recordings')
        .select('id')
        .eq('user_id', user.id)

      if (recordings && recordings.length > 0) {
        const recordingIds = recordings.map(r => r.id)
        const { data: itemsData, error: itemsError } = await supabase
          .from('brain_dump')
          .select('*')
          .in('recording_id', recordingIds)
          .order('created_at', { ascending: false })

        if (itemsError) {
          console.error('[BrainDump] Error loading items:', itemsError)
        } else {
          setItems(itemsData || [])
        }
      }

      setIsLoading(false)
    } catch (error) {
      console.error('[BrainDump] Unexpected error:', error)
      setIsLoading(false)
    }
  }

  // Get supabase client for drag handlers
  const getSupabase = () => {
    if (typeof window === 'undefined') return null
    return createClient()
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDragStart = (e: React.DragEvent, itemId: string, category: CategoryColumn, index: number) => {
    setDraggedItem({ itemId, category, index })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
  }

  const handleDragOver = (e: React.DragEvent, category: CategoryColumn) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(category)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, targetCategory: CategoryColumn) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedItem || draggedItem.category === targetCategory) {
      setDraggedItem(null)
      return
    }

    const item = items.find(i => i.id === draggedItem.itemId)
    if (!item) {
      setDraggedItem(null)
      return
    }

    // Update state optimistically
    setItems(prevItems =>
      prevItems.map(i =>
        i.id === draggedItem.itemId
          ? { ...i, category: targetCategory }
          : i
      )
    )

    // Update database
    try {
      const supabase = getSupabase()
      if (!supabase) return
      
      const { error } = await supabase
        .from('brain_dump')
        .update({ category: targetCategory })
        .eq('id', draggedItem.itemId)

      if (error) {
        console.error('[BrainDump] Error updating category:', error)
        // Revert optimistic update on error
        loadData()
      }
    } catch (error) {
      console.error('[BrainDump] Unexpected error updating category:', error)
      loadData()
    }

    setDraggedItem(null)
  }

  const handleDeleteClick = (itemId: string) => {
    setDeleteConfirmId(itemId)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmId) return

    setIsDeleting(true)
    try {
      const supabase = getSupabase()
      if (!supabase) return

      const { error } = await supabase
        .from('brain_dump')
        .delete()
        .eq('id', deleteConfirmId)

      if (error) {
        console.error('[BrainDump] Error deleting item:', error)
        setToast({
          open: true,
          message: 'Failed to delete',
          description: 'There was an error deleting the item',
          variant: 'error'
        })
        return
      }

      setItems(items => items.filter(item => item.id !== deleteConfirmId))
      setToast({
        open: true,
        message: 'Item deleted',
        description: 'The brain dump item has been removed',
        variant: 'success'
      })
    } catch (error) {
      console.error('[BrainDump] Unexpected error:', error)
    } finally {
      setIsDeleting(false)
      setDeleteConfirmId(null)
    }
  }

  const getCategoryConfig = (category: CategoryColumn) => {
    // Refined, muted color palette for professional aesthetic
    // Using subtle left border accents instead of saturated backgrounds
    switch (category) {
      case 'meeting':
        return {
          label: 'Meetings',
          icon: Users,
          bg: 'bg-white',
          border: 'border-gray-200',
          headerBg: 'bg-gray-50',
          text: 'text-gray-900',
          iconColor: 'text-blue-600',
          itemBg: 'bg-white',
          itemBorder: 'border-gray-200',
          accentBorder: 'border-l-blue-500'
        }
      case 'blocker':
        return {
          label: 'Blockers',
          icon: AlertTriangle,
          bg: 'bg-white',
          border: 'border-gray-200',
          headerBg: 'bg-gray-50',
          text: 'text-gray-900',
          iconColor: 'text-red-600',
          itemBg: 'bg-white',
          itemBorder: 'border-gray-200',
          accentBorder: 'border-l-red-500'
        }
      case 'decision':
        return {
          label: 'Decisions',
          icon: GitBranch,
          bg: 'bg-white',
          border: 'border-gray-200',
          headerBg: 'bg-gray-50',
          text: 'text-gray-900',
          iconColor: 'text-purple-600',
          itemBg: 'bg-white',
          itemBorder: 'border-gray-200',
          accentBorder: 'border-l-purple-500'
        }
      case 'question':
        return {
          label: 'Questions',
          icon: HelpCircle,
          bg: 'bg-white',
          border: 'border-gray-200',
          headerBg: 'bg-gray-50',
          text: 'text-gray-900',
          iconColor: 'text-amber-600',
          itemBg: 'bg-white',
          itemBorder: 'border-gray-200',
          accentBorder: 'border-l-amber-500'
        }
      case 'followup':
        return {
          label: 'Follow-ups',
          icon: ArrowRightCircle,
          bg: 'bg-white',
          border: 'border-gray-200',
          headerBg: 'bg-gray-50',
          text: 'text-gray-900',
          iconColor: 'text-emerald-600',
          itemBg: 'bg-white',
          itemBorder: 'border-gray-200',
          accentBorder: 'border-l-emerald-500'
        }
    }
  }

  const itemsByCategory = {
    meeting: items.filter(i => i.category === 'meeting'),
    blocker: items.filter(i => i.category === 'blocker'),
    decision: items.filter(i => i.category === 'decision'),
    question: items.filter(i => i.category === 'question'),
    followup: items.filter(i => i.category === 'followup')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Filter Bar */}
      <FilterBar
        avatarUrl={profile?.avatar_url}
        displayName={profile?.display_name}
        email={profile?.email}
        recordingsCount={profile?.recordings_count || 0}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
            <Brain className="h-6 w-6 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Brain Dump</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {items.length} items across {Object.values(itemsByCategory).filter(arr => arr.length > 0).length} categories
            </p>
          </div>
        </div>
      </div>

      {/* Column Layout */}
      {items.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5">
          {(['meeting', 'blocker', 'decision', 'question', 'followup'] as CategoryColumn[]).map((category) => {
            const config = getCategoryConfig(category)
            const Icon = config.icon
            const categoryItems = itemsByCategory[category]

            return (
              <div
                key={category}
                className={cn(
                  "flex-1 min-h-[400px] rounded-xl transition-all duration-200",
                  dragOverColumn === category && "ring-2 ring-brand/30 ring-offset-2"
                )}
                onDragOver={(e) => handleDragOver(e, category)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, category)}
              >
                {/* Column Header - Clean, minimal design */}
                <div className={cn(
                  "flex items-center justify-between mb-4 p-3 rounded-lg border shadow-sm",
                  config.headerBg,
                  config.border
                )}>
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", config.iconColor)} />
                    <h3 className="font-semibold text-sm text-gray-900">
                      {config.label}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                    {categoryItems.length}
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-3 min-h-[300px]">
                  {categoryItems.length > 0 ? (
                    categoryItems.map((item, index) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id, category, index)}
                        className={cn(
                          "rounded-xl p-4 cursor-move transition-all duration-200 group border relative shadow-sm border-l-4",
                          config.itemBg,
                          config.itemBorder,
                          config.accentBorder,
                          draggedItem?.itemId === item.id && draggedItem?.category === category
                            ? "opacity-50 scale-95"
                            : "hover:shadow-md hover:border-gray-300"
                        )}
                      >
                        {/* Delete button - top right corner, only on hover */}
                        <button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            handleDeleteClick(item.id)
                          }}
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all z-10"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>

                        <div className="flex items-start gap-3">
                          <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", config.iconColor)} />
                          <div className="flex-1 min-w-0 pr-6">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                              {item.content}
                            </p>
                            {item.participants && item.participants.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500">
                                <Users className="h-3 w-3" />
                                <span>{item.participants.join(', ')}</span>
                              </div>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(item.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400 italic py-8 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                      Drop items here
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-sm rounded-2xl p-12 text-center border border-gray-200"
        >
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gray-50 border border-gray-200 mb-4">
            <Brain className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-gray-900 font-semibold mb-2">No brain dump items yet</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
            Use Smartify on a note to extract thoughts, meetings, and ideas automatically.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium shadow-sm"
          >
            Go to Notes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete Brain Dump Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

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
