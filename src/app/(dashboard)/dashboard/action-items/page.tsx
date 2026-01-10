'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { CheckSquare, Calendar, User, AlertCircle, CheckCircle2, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'

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

export default function ActionItemsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in_progress' | 'done'>('all')
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
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
        const { data: recordings } = await supabase
          .from('recordings')
          .select('id')
          .eq('user_id', user.id)

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
        }

        setIsLoading(false)
      } catch (error) {
        console.error('[ActionItems] Unexpected error:', error)
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const toggleStatus = async (itemId: string, currentStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let newStatus: 'open' | 'in_progress' | 'done'
      let completedAt: string | null = null

      if (currentStatus === 'open') {
        newStatus = 'in_progress'
      } else if (currentStatus === 'in_progress') {
        newStatus = 'done'
        completedAt = new Date().toISOString()
      } else {
        newStatus = 'open'
        completedAt = null
      }

      const { error } = await supabase
        .from('action_items')
        .update({ 
          status: newStatus,
          completed_at: completedAt
        })
        .eq('id', itemId)

      if (error) {
        console.error('[ActionItems] Error updating status:', error)
        return
      }

      setActionItems(items =>
        items.map(item =>
          item.id === itemId
            ? { ...item, status: newStatus, completed_at: completedAt }
            : item
        )
      )
    } catch (error) {
      console.error('[ActionItems] Unexpected error:', error)
    }
  }

  const deleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this action item?')) return

    try {
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
    if (!dateString) return 'No deadline'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'open':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const filteredItems = actionItems.filter(item => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false
    if (filterPriority !== 'all' && item.priority !== filterPriority) return false
    return true
  })

  const groupedByDate = filteredItems.reduce((groups, item) => {
    const date = new Date(item.created_at)
    const dateKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(item)
    return groups
  }, {} as Record<string, ActionItem[]>)

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
          <div className="p-3 rounded-xl bg-blue-100">
            <CheckSquare className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">Action Items</h1>
            <p className="text-gray-600 text-sm mt-1">
              {actionItems.length} total • {actionItems.filter(i => i.status === 'open').length} open • {actionItems.filter(i => i.status === 'done').length} completed
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-lg p-2">
            <span className="text-sm text-gray-600">Status:</span>
            {(['all', 'open', 'in_progress', 'done'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  filterStatus === status
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {status === 'all' ? 'All' : status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

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

      {/* Action Items List */}
      {Object.keys(groupedByDate).length > 0 ? (
        <div className="space-y-8">
          {Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map((dateKey) => (
            <div key={dateKey}>
              <h2 className="text-2xl font-semibold text-black mb-4">{dateKey}</h2>
              <div className="space-y-3">
                {groupedByDate[dateKey].map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'bg-white/60 backdrop-blur-sm border rounded-xl p-5 hover:bg-black hover:text-white hover:border-black transition-all group',
                      item.status === 'done' && 'opacity-60'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <button
                            onClick={() => toggleStatus(item.id, item.status)}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              item.status === 'done'
                                ? 'text-green-600 group-hover:text-green-400'
                                : 'text-gray-400 group-hover:text-white'
                            )}
                          >
                            {item.status === 'done' ? (
                              <CheckCircle2 className="h-5 w-5" fill="currentColor" />
                            ) : (
                              <div className="h-5 w-5 border-2 border-current rounded-full" />
                            )}
                          </button>

                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium border',
                            getPriorityColor(item.priority)
                          )}>
                            {item.priority.toUpperCase()}
                          </span>

                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium border',
                            getStatusColor(item.status)
                          )}>
                            {item.status === 'in_progress' ? 'IN PROGRESS' : item.status.toUpperCase()}
                          </span>
                        </div>

                        <h3 className={cn(
                          'text-lg font-semibold mb-2',
                          item.status === 'done' && 'line-through'
                        )}>
                          {item.task}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 group-hover:text-white/70">
                          {item.assignee && (
                            <div className="flex items-center gap-1.5">
                              <User className="h-4 w-4" />
                              <span>{item.assignee}</span>
                            </div>
                          )}
                          {item.deadline && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(item.deadline)}</span>
                            </div>
                          )}
                          {item.completed_at && (
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Completed {formatDate(item.completed_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-red-600 hover:bg-red-50 group-hover:bg-red-500 group-hover:text-white transition-all"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-100 mb-4">
            <CheckSquare className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-black font-semibold mb-2">No action items yet</h3>
          <p className="text-gray-600 text-sm max-w-sm mx-auto">
            Use Smartify on a note to extract action items automatically.
          </p>
        </div>
      )}
    </motion.div>
  )
}

