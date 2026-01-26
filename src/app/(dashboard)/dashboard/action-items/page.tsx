'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FilterBar } from '@/components/dashboard/filter-bar'
import {
  ClipboardList,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Trash2,
  ArrowRight,
  Circle,
  Zap,
  Flag,
  Target,
  ChevronDown,
  Check,
  Edit3,
  CalendarDays
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useSidebar } from '@/components/dashboard/sidebar'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Toast } from '@/components/ui/toast'

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
type SortOption = 'priority' | 'deadline' | 'created'
type DateFilter = 'all' | 'today' | 'week' | 'overdue'

export default function ActionItemsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [filterDate, setFilterDate] = useState<DateFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('priority')
  const [draggedItem, setDraggedItem] = useState<{ itemId: string; status: StatusColumn; index: number } | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<StatusColumn | null>(null)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTaskText, setEditingTaskText] = useState('')
  const [priorityDropdownId, setPriorityDropdownId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; message: string; variant: 'success' | 'error' }>({ open: false, message: '', variant: 'success' })
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const { setIsCollapsed } = useSidebar()

  const editTextareaRef = useRef<HTMLTextAreaElement>(null)
  const sortDropdownRef = useRef<HTMLDivElement>(null)

  // Collapse sidebar when page loads
  useEffect(() => {
    setIsCollapsed(true)
  }, [setIsCollapsed])

  // Focus textarea when editing starts and auto-resize
  useEffect(() => {
    if (editingTaskId && editTextareaRef.current) {
      editTextareaRef.current.focus()
      editTextareaRef.current.select()
      editTextareaRef.current.style.height = 'auto'
      editTextareaRef.current.style.height = editTextareaRef.current.scrollHeight + 'px'
    }
  }, [editingTaskId])

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close priority dropdown on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPriorityDropdownId(null)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const loadData = async () => {
    if (typeof window === 'undefined') return

    const supabase = createClient()

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('[ActionItems] Error getting user:', userError)
        setIsLoading(false)
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      const { data: items, error: itemsError } = await supabase
        .from('action_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (itemsError) {
        console.error('[ActionItems] Error loading items:', itemsError)
        setActionItems([])
      } else {
        setActionItems(items || [])
      }

      setIsLoading(false)
    } catch (error) {
      console.error('[ActionItems] Unexpected error:', error)
      setIsLoading(false)
    }
  }

  const getSupabase = () => {
    if (typeof window === 'undefined') return null
    return createClient()
  }

  useEffect(() => {
    loadData()

    const handleActionItemEvent = () => {
      loadData()
    }

    window.addEventListener('actionItemCompleted', handleActionItemEvent as EventListener)
    window.addEventListener('actionItemUpdated', handleActionItemEvent as EventListener)

    return () => {
      window.removeEventListener('actionItemCompleted', handleActionItemEvent as EventListener)
      window.removeEventListener('actionItemUpdated', handleActionItemEvent as EventListener)
    }
  }, [])

  // ============================================================================
  // DRAG AND DROP - Simplified without layout animations
  // ============================================================================

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

    // Store values before clearing draggedItem to avoid race conditions
    const itemId = draggedItem.itemId
    const originalStatus = draggedItem.status
    const originalCompletedAt = item.completed_at
    const completedAt = targetStatus === 'done' ? new Date().toISOString() : null

    // Clear drag state immediately
    setDraggedItem(null)

    // Update state optimistically
    setActionItems(prevItems =>
      prevItems.map(i =>
        i.id === itemId
          ? { ...i, status: targetStatus, completed_at: completedAt }
          : i
      )
    )

    try {
      const supabase = getSupabase()
      if (!supabase) return

      const { error } = await supabase
        .from('action_items')
        .update({
          status: targetStatus,
          completed_at: completedAt
        })
        .eq('id', itemId)

      if (error) {
        console.error('[ActionItems] Error updating status:', error)
        // Revert optimistic update on error
        setActionItems(prevItems =>
          prevItems.map(i =>
            i.id === itemId
              ? { ...i, status: originalStatus, completed_at: originalCompletedAt }
              : i
          )
        )
        setToast({ open: true, message: 'Failed to update task status', variant: 'error' })
      } else {
        window.dispatchEvent(new CustomEvent('actionItemUpdated', {
          detail: { itemId: itemId, status: targetStatus }
        }))
      }
    } catch (error) {
      console.error('[ActionItems] Unexpected error updating status:', error)
      // Revert optimistic update on error
      setActionItems(prevItems =>
        prevItems.map(i =>
          i.id === itemId
            ? { ...i, status: originalStatus, completed_at: originalCompletedAt }
            : i
        )
      )
      setToast({ open: true, message: 'Failed to update task status', variant: 'error' })
    }
  }

  // ============================================================================
  // TASK EDITING
  // ============================================================================

  const startEditingTask = (item: ActionItem) => {
    setEditingTaskId(item.id)
    setEditingTaskText(item.task)
  }

  const saveTaskEdit = async () => {
    if (!editingTaskId || !editingTaskText.trim()) {
      setEditingTaskId(null)
      return
    }

    const originalItem = actionItems.find(i => i.id === editingTaskId)
    if (!originalItem || originalItem.task === editingTaskText.trim()) {
      setEditingTaskId(null)
      return
    }

    const originalTask = originalItem.task
    const newTask = editingTaskText.trim()
    const itemId = editingTaskId

    setActionItems(prevItems =>
      prevItems.map(i =>
        i.id === itemId ? { ...i, task: newTask } : i
      )
    )

    try {
      const supabase = getSupabase()
      if (!supabase) return

      const { error } = await supabase
        .from('action_items')
        .update({ task: newTask })
        .eq('id', itemId)

      if (error) {
        console.error('[ActionItems] Error updating task:', error)
        setActionItems(prevItems =>
          prevItems.map(i =>
            i.id === itemId ? { ...i, task: originalTask } : i
          )
        )
        setToast({ open: true, message: 'Failed to update task', variant: 'error' })
      } else {
        window.dispatchEvent(new CustomEvent('actionItemUpdated', {
          detail: { itemId, task: newTask }
        }))
      }
    } catch (error) {
      console.error('[ActionItems] Unexpected error updating task:', error)
      setActionItems(prevItems =>
        prevItems.map(i =>
          i.id === itemId ? { ...i, task: originalTask } : i
        )
      )
      setToast({ open: true, message: 'Failed to update task', variant: 'error' })
    }

    setEditingTaskId(null)
  }

  const cancelTaskEdit = () => {
    setEditingTaskId(null)
    setEditingTaskText('')
  }

  // ============================================================================
  // PRIORITY UPDATE
  // ============================================================================

  const updatePriority = async (itemId: string, newPriority: 'high' | 'medium' | 'low') => {
    setPriorityDropdownId(null)

    const item = actionItems.find(i => i.id === itemId)
    if (!item || item.priority === newPriority) return

    const originalPriority = item.priority

    setActionItems(prevItems =>
      prevItems.map(i =>
        i.id === itemId ? { ...i, priority: newPriority } : i
      )
    )

    try {
      const supabase = getSupabase()
      if (!supabase) return

      const { error } = await supabase
        .from('action_items')
        .update({ priority: newPriority })
        .eq('id', itemId)

      if (error) {
        console.error('[ActionItems] Error updating priority:', error)
        setActionItems(prevItems =>
          prevItems.map(i =>
            i.id === itemId ? { ...i, priority: originalPriority } : i
          )
        )
        setToast({ open: true, message: 'Failed to update priority', variant: 'error' })
      } else {
        window.dispatchEvent(new CustomEvent('actionItemUpdated', {
          detail: { itemId, priority: newPriority }
        }))
      }
    } catch (error) {
      console.error('[ActionItems] Unexpected error updating priority:', error)
      setActionItems(prevItems =>
        prevItems.map(i =>
          i.id === itemId ? { ...i, priority: originalPriority } : i
        )
      )
      setToast({ open: true, message: 'Failed to update priority', variant: 'error' })
    }
  }

  // ============================================================================
  // DELETE
  // ============================================================================

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
        .from('action_items')
        .delete()
        .eq('id', deleteConfirmId)

      if (error) {
        console.error('[ActionItems] Error deleting item:', error)
        setToast({ open: true, message: 'Failed to delete task', variant: 'error' })
        return
      }

      setActionItems(items => items.filter(item => item.id !== deleteConfirmId))
      setToast({ open: true, message: 'Task deleted successfully', variant: 'success' })
    } catch (error) {
      console.error('[ActionItems] Unexpected error:', error)
      setToast({ open: true, message: 'Failed to delete task', variant: 'error' })
    } finally {
      setIsDeleting(false)
      setDeleteConfirmId(null)
    }
  }

  // ============================================================================
  // DATE HELPERS
  // ============================================================================

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

  const formatFullDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false
    const deadlineDate = new Date(deadline)
    deadlineDate.setHours(23, 59, 59, 999)
    return deadlineDate < new Date()
  }

  const isThisWeek = (dateString: string | null) => {
    if (!dateString) return false
    const date = new Date(dateString)
    const today = new Date()
    const weekFromNow = new Date(today)
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    return date >= today && date <= weekFromNow
  }

  const isToday = (dateString: string | null) => {
    if (!dateString) return false
    const date = new Date(dateString)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // ============================================================================
  // CONFIG HELPERS
  // ============================================================================

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200',
          dot: 'bg-red-500',
          icon: Zap,
          label: 'Urgent'
        }
      case 'medium':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          dot: 'bg-amber-500',
          icon: Flag,
          label: 'Medium'
        }
      case 'low':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          dot: 'bg-emerald-500',
          icon: Target,
          label: 'Low'
        }
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          dot: 'bg-gray-400',
          icon: Flag,
          label: 'Normal'
        }
    }
  }

  const getStatusConfig = (status: StatusColumn) => {
    switch (status) {
      case 'open':
        return {
          label: 'To Do',
          sublabel: 'Not started',
          icon: Circle,
          bg: 'bg-slate-50/50',
          headerBg: 'bg-gradient-to-br from-slate-100 via-slate-50 to-white',
          border: 'border-slate-200',
          text: 'text-slate-900',
          iconColor: 'text-slate-600',
          count: 'bg-slate-100 text-slate-700'
        }
      case 'in_progress':
        return {
          label: 'In Progress',
          sublabel: 'Working on it',
          icon: Clock,
          bg: 'bg-blue-50/50',
          headerBg: 'bg-gradient-to-br from-blue-100 via-blue-50 to-white',
          border: 'border-blue-200',
          text: 'text-blue-900',
          iconColor: 'text-blue-600',
          count: 'bg-blue-100 text-blue-700'
        }
      case 'done':
        return {
          label: 'Done',
          sublabel: 'Completed',
          icon: CheckCircle2,
          bg: 'bg-emerald-50/50',
          headerBg: 'bg-gradient-to-br from-emerald-100 via-emerald-50 to-white',
          border: 'border-emerald-200',
          text: 'text-emerald-900',
          iconColor: 'text-emerald-600',
          count: 'bg-emerald-100 text-emerald-700'
        }
    }
  }

  // ============================================================================
  // FILTER AND SORT
  // ============================================================================

  const getFilteredAndSortedItems = () => {
    let filtered = actionItems.filter(item => {
      if (filterPriority !== 'all' && item.priority !== filterPriority) return false
      if (filterDate === 'today' && !isToday(item.deadline)) return false
      if (filterDate === 'week' && !isThisWeek(item.deadline)) return false
      if (filterDate === 'overdue' && (!isOverdue(item.deadline) || item.status === 'done')) return false
      return true
    })

    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { high: 1, medium: 2, low: 3 }
        return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4)
      } else if (sortBy === 'deadline') {
        if (!a.deadline && !b.deadline) return 0
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    return filtered
  }

  const filteredItems = getFilteredAndSortedItems()

  const itemsByStatus = {
    open: filteredItems.filter(i => i.status === 'open'),
    in_progress: filteredItems.filter(i => i.status === 'in_progress'),
    done: filteredItems.filter(i => i.status === 'done')
  }

  // ============================================================================
  // STATS
  // ============================================================================

  const completedToday = actionItems.filter(item => {
    if (item.status !== 'done' || !item.completed_at) return false
    const completed = new Date(item.completed_at)
    const today = new Date()
    return completed.toDateString() === today.toDateString()
  }).length

  const overdueCount = actionItems.filter(item =>
    item.status !== 'done' && item.deadline && isOverdue(item.deadline)
  ).length

  const dueThisWeek = actionItems.filter(item =>
    item.status !== 'done' && item.deadline && isThisWeek(item.deadline)
  ).length

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="pb-8 min-h-screen">
      <FilterBar
        avatarUrl={profile?.avatar_url}
        displayName={profile?.display_name}
        email={profile?.email}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg">
              <ClipboardList className="h-7 w-7 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Todos</h1>
              <p className="text-slate-500 mt-1 text-sm">
                Manage your tasks across stages
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <Circle className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{itemsByStatus.open.length}</p>
                <p className="text-xs text-slate-500">To Do</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{itemsByStatus.in_progress.length}</p>
                <p className="text-xs text-slate-500">In Progress</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{completedToday}</p>
                <p className="text-xs text-slate-500">Done Today</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", overdueCount > 0 ? "bg-red-100" : "bg-slate-100")}>
                <Calendar className={cn("h-4 w-4", overdueCount > 0 ? "text-red-600" : "text-slate-500")} />
              </div>
              <div>
                <p className={cn("text-2xl font-bold", overdueCount > 0 ? "text-red-600" : "text-slate-900")}>{overdueCount}</p>
                <p className="text-xs text-slate-500">Overdue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Priority:</span>
            <div className="inline-flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              {(['all', 'high', 'medium', 'low'] as const).map(priority => {
                const isActive = filterPriority === priority
                const config = priority !== 'all' ? getPriorityConfig(priority) : null

                return (
                  <button
                    key={priority}
                    onClick={() => setFilterPriority(priority)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {config && <span className={cn("w-2 h-2 rounded-full", config.dot)} />}
                      {priority === 'all' ? 'All' : config?.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Due:</span>
            <div className="inline-flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              {([
                { value: 'all' as DateFilter, label: 'Any' },
                { value: 'today' as DateFilter, label: 'Today' },
                { value: 'week' as DateFilter, label: 'This Week', count: dueThisWeek },
                { value: 'overdue' as DateFilter, label: 'Overdue', count: overdueCount }
              ]).map(({ value, label, count }) => {
                const isActive = filterDate === value

                return (
                  <button
                    key={value}
                    onClick={() => setFilterDate(value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    )}
                  >
                    {value === 'overdue' && <CalendarDays className="h-3.5 w-3.5" />}
                    {label}
                    {count !== undefined && count > 0 && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full",
                        isActive ? "bg-white/20" : value === 'overdue' ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-600"
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium text-slate-600">Sort:</span>
            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className={cn(
                  "flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-all",
                  sortDropdownOpen
                    ? "ring-2 ring-slate-300"
                    : "hover:bg-slate-50"
                )}
              >
                <span className="capitalize">{sortBy === 'created' ? 'Created' : sortBy === 'deadline' ? 'Deadline' : 'Priority'}</span>
                <ChevronDown className={cn(
                  "h-3.5 w-3.5 text-slate-400 transition-transform",
                  sortDropdownOpen && "rotate-180"
                )} />
              </button>

              {sortDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[100]"
                    onClick={() => setSortDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-[101] bg-white rounded-xl border border-slate-200 py-1 min-w-[140px] shadow-xl">
                    {([
                      { value: 'priority' as SortOption, label: 'Priority', icon: Flag },
                      { value: 'deadline' as SortOption, label: 'Deadline', icon: Calendar },
                      { value: 'created' as SortOption, label: 'Created', icon: Clock }
                    ]).map(({ value, label, icon: SortIcon }) => (
                      <button
                        key={value}
                        onClick={() => {
                          setSortBy(value)
                          setSortDropdownOpen(false)
                        }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                          sortBy === value ? "bg-slate-50" : "hover:bg-slate-50"
                        )}
                      >
                        <SortIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium flex-1 text-left text-slate-700">{label}</span>
                        {sortBy === value && <Check className="h-3.5 w-3.5 text-slate-400" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {filteredItems.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-5">
          {(['open', 'in_progress', 'done'] as StatusColumn[]).map((status) => {
            const config = getStatusConfig(status)
            const Icon = config.icon
            const items = itemsByStatus[status]

            return (
              <div
                key={status}
                className={cn(
                  "flex flex-col min-h-[500px] rounded-2xl border-2 transition-all",
                  config.bg,
                  config.border,
                  dragOverColumn === status && "ring-4 ring-offset-2 ring-blue-300 border-blue-400"
                )}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status)}
              >
                {/* Column Header */}
                <div className={cn("flex items-center justify-between p-4 rounded-t-2xl border-b border-slate-200", config.headerBg)}>
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl bg-white/70 shadow-sm")}>
                      <Icon className={cn("h-5 w-5", config.iconColor)} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className={cn("font-semibold text-base", config.text)}>
                        {config.label}
                      </h3>
                      <p className="text-xs text-slate-500">{config.sublabel}</p>
                    </div>
                  </div>
                  <div className={cn("flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shadow-sm", config.count)}>
                    {items.length}
                  </div>
                </div>

                {/* Items */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                  {items.length > 0 ? (
                    items.map((item, index) => {
                      const priorityConfig = getPriorityConfig(item.priority)
                      const PriorityIcon = priorityConfig.icon
                      const itemOverdue = item.status !== 'done' && isOverdue(item.deadline)
                      const isEditing = editingTaskId === item.id
                      const isDragging = draggedItem?.itemId === item.id && draggedItem?.status === status

                      return (
                        <div
                          key={item.id}
                          draggable={!isEditing}
                          onDragStart={(e) => !isEditing && handleDragStart(e, item.id, status, index)}
                          onMouseEnter={() => setHoveredCard(item.id)}
                          onMouseLeave={() => setHoveredCard(null)}
                          className={cn(
                            "bg-white rounded-xl border-2 transition-all group relative",
                            isEditing
                              ? "ring-2 ring-blue-400 shadow-md border-blue-300"
                              : "border-slate-200 cursor-grab active:cursor-grabbing",
                            isDragging && "opacity-50 scale-95",
                            !isEditing && !isDragging && "hover:shadow-md hover:border-slate-300"
                          )}
                        >
                          {/* Priority Bar */}
                          <div className={cn("absolute top-0 left-0 w-1.5 h-full rounded-l-xl", priorityConfig.dot)} />

                          <div className="p-4 pl-5">
                            {/* Task Header */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                {/* Status Icon */}
                                <div className="mt-0.5 flex-shrink-0">
                                  {status === 'done' ? (
                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                                    </div>
                                  ) : status === 'in_progress' ? (
                                    <div className="w-5 h-5 rounded-full border-2 border-blue-400 flex items-center justify-center">
                                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-slate-400 transition-colors" />
                                  )}
                                </div>

                                {/* Task Text */}
                                <div className="flex-1 min-w-0">
                                  {isEditing ? (
                                    <div className="flex flex-col gap-2">
                                      <textarea
                                        ref={editTextareaRef}
                                        value={editingTaskText}
                                        onChange={(e) => {
                                          setEditingTaskText(e.target.value)
                                          e.target.style.height = 'auto'
                                          e.target.style.height = e.target.scrollHeight + 'px'
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                            e.preventDefault()
                                            saveTaskEdit()
                                          }
                                          if (e.key === 'Escape') cancelTaskEdit()
                                        }}
                                        className="w-full text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none overflow-hidden min-h-[60px]"
                                        placeholder="Task description..."
                                      />
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-slate-400">
                                          Press Cmd+Enter to save
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            onClick={cancelTaskEdit}
                                            className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-xs font-medium"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            onClick={saveTaskEdit}
                                            className="px-2.5 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-xs font-medium flex items-center gap-1"
                                          >
                                            <Check className="h-3 w-3" />
                                            Save
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <h3
                                      onClick={() => startEditingTask(item)}
                                      className="text-sm font-medium leading-snug cursor-text hover:bg-slate-50 rounded px-1 -mx-1 py-0.5 transition-colors whitespace-pre-wrap text-slate-900"
                                    >
                                      {item.task}
                                    </h3>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              {!isEditing && (
                                <div className={cn(
                                  "flex items-center gap-1 transition-opacity",
                                  hoveredCard === item.id ? "opacity-100" : "opacity-0"
                                )}>
                                  <button
                                    onClick={() => startEditingTask(item)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(item.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Meta Row */}
                            <div className="flex items-center justify-between gap-2 mt-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Priority Badge */}
                                <div className="relative">
                                  <button
                                    onClick={() => setPriorityDropdownId(priorityDropdownId === item.id ? null : item.id)}
                                    className={cn(
                                      "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide border transition-all",
                                      priorityConfig.bg,
                                      priorityConfig.text,
                                      priorityConfig.border,
                                      "hover:ring-2 hover:ring-offset-1",
                                      item.priority === 'high' && "hover:ring-red-300",
                                      item.priority === 'medium' && "hover:ring-amber-300",
                                      item.priority === 'low' && "hover:ring-emerald-300"
                                    )}
                                  >
                                    <PriorityIcon className="h-3 w-3" />
                                    {item.priority}
                                    <ChevronDown className={cn(
                                      "h-2.5 w-2.5 ml-0.5 transition-transform",
                                      priorityDropdownId === item.id && "rotate-180"
                                    )} />
                                  </button>

                                  {/* Priority Dropdown */}
                                  {priorityDropdownId === item.id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-[200]"
                                        onClick={() => setPriorityDropdownId(null)}
                                      />
                                      <div className="absolute left-0 top-full mt-1 z-[201] bg-white rounded-xl border border-slate-200 py-1 min-w-[130px] shadow-xl">
                                        {(['high', 'medium', 'low'] as const).map((p) => {
                                          const pConfig = getPriorityConfig(p)
                                          return (
                                            <button
                                              key={p}
                                              onClick={() => updatePriority(item.id, p)}
                                              className={cn(
                                                "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                                                item.priority === p ? "bg-slate-50" : "hover:bg-slate-50"
                                              )}
                                            >
                                              <span className={cn("w-2 h-2 rounded-full", pConfig.dot)} />
                                              <span className={cn("font-medium flex-1 text-left", pConfig.text)}>{pConfig.label}</span>
                                              {item.priority === p && <Check className="h-3.5 w-3.5 text-slate-400" />}
                                            </button>
                                          )
                                        })}
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* Assignee */}
                                {item.assignee && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium">
                                    <User className="h-3 w-3" />
                                    {item.assignee}
                                  </span>
                                )}
                              </div>

                              {/* Deadline */}
                              {item.deadline && (
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium",
                                    itemOverdue
                                      ? "bg-red-100 text-red-700"
                                      : isToday(item.deadline)
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-slate-100 text-slate-600"
                                  )}
                                  title={formatFullDate(item.deadline) || undefined}
                                >
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(item.deadline)}
                                  {itemOverdue && <span className="ml-0.5 text-red-600">!</span>}
                                </span>
                              )}
                            </div>

                            {/* Created Date */}
                            {item.created_at && (
                              <div className="mt-2 pt-2 border-t border-slate-100">
                                <span className="text-[10px] text-slate-400">
                                  Created {formatDate(item.created_at)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className={cn(
                      "flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-xl text-center",
                      config.border
                    )}>
                      <Icon className={cn("h-8 w-8 mb-3", config.iconColor)} strokeWidth={1.5} />
                      <p className="text-sm text-slate-500 font-medium">Drop tasks here</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-2xl p-16 text-center border border-slate-200">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 mb-6 shadow-sm">
            <ClipboardList className="h-10 w-10 text-blue-600" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {filterPriority !== 'all' || filterDate !== 'all'
              ? 'No matching tasks'
              : 'No action items yet'}
          </h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            {filterPriority !== 'all' || filterDate !== 'all'
              ? 'Try adjusting your filters to see more tasks.'
              : 'Use Smartify on your notes to automatically extract action items and start tracking your tasks.'}
          </p>
          {filterPriority !== 'all' || filterDate !== 'all' ? (
            <button
              onClick={() => {
                setFilterPriority('all')
                setFilterDate('all')
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm"
            >
              Clear Filters
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm"
            >
              Go to Notes
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {/* Dialogs */}
      <ConfirmDialog
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete Action Item"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete Task"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      <Toast
        open={toast.open}
        onClose={() => setToast({ ...toast, open: false })}
        message={toast.message}
        variant={toast.variant}
        position="bottom-right"
      />
    </div>
  )
}
