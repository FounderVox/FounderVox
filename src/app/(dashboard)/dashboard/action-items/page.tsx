'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { ClipboardList, Calendar, User, CheckCircle2, Clock, X, ArrowRight, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface ActionItem {
  id: string
  task: string
  assignee: string | null
  deadline: string | null
  priority: 'high' | 'medium' | 'low'
  status: 'open' | 'in_progress' | 'done'
  created_at: string
  completed_at: string | null
}

type StatusColumn = 'open' | 'in_progress' | 'done'

export default function ActionItemsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [draggedItem, setDraggedItem] = useState<{ itemId: string; status: StatusColumn; index: number } | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<StatusColumn | null>(null)

  const loadData = async () => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    const supabase = createClient()
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('[ActionItems] Error getting user:', userError)
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

      // Load action items via recordings
      const { data: recordings, error: recordingsError } = await supabase
        .from('recordings')
        .select('id')
        .eq('user_id', user.id)

      if (recordingsError) {
        console.error('[ActionItems] Error loading recordings:', recordingsError)
      }

      if (recordings && recordings.length > 0) {
        const recordingIds = recordings.map(r => r.id)
        
        const { data: items, error: itemsError } = await supabase
          .from('action_items')
          .select('*')
          .in('recording_id', recordingIds)
          .order('created_at', { ascending: false })

        if (itemsError) {
          console.error('[ActionItems] Error loading items:', itemsError)
        } else {
          setActionItems(items || [])
        }
      } else {
        setActionItems([])
      }

      setIsLoading(false)
    } catch (error) {
      console.error('[ActionItems] Unexpected error:', error)
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

  const handleDragStart = (e: React.DragEvent, itemId: string, status: StatusColumn, index: number) => {
    setDraggedItem({ itemId, status, index })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
  }

  const handleDragOver = (e: React.DragEvent, status: StatusColumn) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: StatusColumn) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedItem || draggedItem.status === targetStatus) {
      setDraggedItem(null)
      return
    }

    const item = actionItems.find(i => i.id === draggedItem.itemId)
    if (!item) {
      setDraggedItem(null)
      return
    }

    // Update state optimistically
    const completedAt = targetStatus === 'done' ? new Date().toISOString() : null
    setActionItems(prevItems =>
      prevItems.map(i =>
        i.id === draggedItem.itemId
          ? { ...i, status: targetStatus, completed_at: completedAt }
          : i
      )
    )

    // Update database
    try {
      const supabase = getSupabase()
      if (!supabase) return
      
      const { error } = await supabase
        .from('action_items')
        .update({
          status: targetStatus,
          completed_at: completedAt
        })
        .eq('id', draggedItem.itemId)

      if (error) {
        console.error('[ActionItems] Error updating status:', error)
        // Revert optimistic update on error
        loadData()
      }
    } catch (error) {
      console.error('[ActionItems] Unexpected error updating status:', error)
      loadData()
    }

    setDraggedItem(null)
  }

  const deleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this action item?')) return

    try {
      const supabase = getSupabase()
      if (!supabase) return
      
      const { error } = await supabase
        .from('action_items')
        .delete()
        .eq('id', itemId)

      if (error) {
        console.error('[ActionItems] Error deleting item:', error)
        return
      }

      setActionItems(items => items.filter(item => item.id !== itemId))
    } catch (error) {
      console.error('[ActionItems] Unexpected error:', error)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusConfig = (status: StatusColumn) => {
    switch (status) {
      case 'open':
        return {
          label: 'To Do',
          icon: Circle,
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          iconColor: 'text-gray-500'
        }
      case 'in_progress':
        return {
          label: 'In Progress',
          icon: Clock,
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          iconColor: 'text-blue-500'
        }
      case 'done':
        return {
          label: 'Done',
          icon: CheckCircle2,
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          iconColor: 'text-green-500'
        }
    }
  }

  const filteredItems = actionItems.filter(item => {
    if (filterPriority !== 'all' && item.priority !== filterPriority) return false
    return true
  })

  const itemsByStatus = {
    open: filteredItems.filter(i => i.status === 'open'),
    in_progress: filteredItems.filter(i => i.status === 'in_progress'),
    done: filteredItems.filter(i => i.status === 'done')
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
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gray-100">
            <ClipboardList className="h-6 w-6 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">Action Items</h1>
            <p className="text-gray-600 text-sm mt-1">
              {actionItems.length} total • {itemsByStatus.open.length} to do • {itemsByStatus.in_progress.length} in progress • {itemsByStatus.done.length} done
            </p>
          </div>
        </div>

        {/* Priority Filter */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-lg p-2">
            <span className="text-sm text-gray-600">Priority:</span>
            {(['all', 'high', 'medium', 'low'] as const).map(priority => (
              <button
                key={priority}
                onClick={() => setFilterPriority(priority)}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  filterPriority === priority
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {priority === 'all' ? 'All' : priority.charAt(0).toUpperCase() + priority.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {filteredItems.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-6">
          {(['open', 'in_progress', 'done'] as StatusColumn[]).map((status) => {
            const config = getStatusConfig(status)
            const Icon = config.icon
            const items = itemsByStatus[status]

            return (
              <div
                key={status}
                className={cn(
                  "flex-1 min-h-[400px] rounded-xl transition-all duration-200",
                  dragOverColumn === status && "ring-2 ring-gray-300 ring-offset-2"
                )}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status)}
              >
                {/* Column Header */}
                <div className={cn(
                  "flex items-center justify-between mb-4 p-3 rounded-lg",
                  config.bg,
                  config.border,
                  "border"
                )}>
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-5 w-5", config.iconColor)} />
                    <h3 className={cn("font-semibold", config.text)}>
                      {config.label}
                    </h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      config.bg,
                      config.text,
                      "border",
                      config.border
                    )}>
                      {items.length}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3 min-h-[300px]">
                  {items.length > 0 ? (
                    items.map((item, index) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, item.id, status, index)}
                        className={cn(
                          "bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 cursor-move transition-all duration-200 group",
                          draggedItem?.itemId === item.id && draggedItem?.status === status
                            ? "opacity-50 scale-95"
                            : "hover:bg-white/90 hover:border-gray-300 hover:shadow-lg",
                          item.status === 'done' && "opacity-75"
                        )}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          {status === 'done' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" />
                          ) : status === 'in_progress' ? (
                            <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className={cn(
                              "text-sm font-semibold mb-2",
                              item.status === 'done' && "line-through text-gray-500"
                            )}>
                              {item.task}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                              {item.assignee && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{item.assignee}</span>
                                </div>
                              )}
                              {item.deadline && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(item.deadline)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium border",
                            getPriorityColor(item.priority)
                          )}>
                            {item.priority.toUpperCase()}
                          </span>
                          <button
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation()
                              deleteItem(item.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-all"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={cn(
                      "text-sm text-gray-400 italic py-8 text-center border-2 border-dashed rounded-lg",
                      config.border
                    )}>
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
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50"
        >
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/60 backdrop-blur-sm border-2 border-gray-200/50 mb-4">
            <ClipboardList className="h-8 w-8 text-black" />
          </div>
          <h3 className="text-black font-semibold mb-2">No action items yet</h3>
          <p className="text-gray-600 text-sm max-w-sm mx-auto mb-4">
            Use Smartify on a note to extract action items automatically.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors text-sm"
          >
            Go to Notes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      )}
    </motion.div>
  )
}
