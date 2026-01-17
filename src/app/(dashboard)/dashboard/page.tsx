'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'

export const dynamic = 'force-dynamic'
import { motion } from 'framer-motion'
import { NoteCard } from '@/components/dashboard/note-card'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { AddTagDialog } from '@/components/dashboard/add-tag-dialog'
import { EditNoteDialog } from '@/components/dashboard/edit-note-dialog'
import { SmartifyModal } from '@/components/dashboard/smartify-modal'
import { NoteDetailModal } from '@/components/dashboard/note-detail-modal'
import { DeleteNoteDialog } from '@/components/dashboard/delete-note-dialog'
import { Toast } from '@/components/ui/toast'
import {
  Mic,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  AlertCircle,
  PlayCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { ActionItem, BrainDumpItem, isOverdue, formatDeadline, dispatchActionItemEvent } from '@/types/dashboard'
import { createClient } from '@/lib/supabase/client'

// Skeleton loading component for note cards
function NoteCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 w-4 bg-gray-200 rounded"></div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-100 rounded w-full"></div>
        <div className="h-3 bg-gray-100 rounded w-5/6"></div>
        <div className="h-3 bg-gray-100 rounded w-4/6"></div>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-5 bg-gray-100 rounded-full w-16"></div>
        <div className="h-5 bg-gray-100 rounded-full w-12"></div>
      </div>
    </div>
  )
}

// Skeleton loading component for focus items
function FocusItemSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 border-l-[3px] border-l-gray-300 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-3 bg-gray-100 rounded w-1/3"></div>
        </div>
      </div>
    </div>
  )
}

// Get time-aware greeting
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// Get formatted date
function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
}

// Get first name from display name
function getFirstName(displayName: string | null | undefined): string {
  if (!displayName) return ''
  return displayName.split(' ')[0]
}

export default function DashboardPage() {
  const { user, profile, supabase } = useAuth()
  const router = useRouter()
  const [notes, setNotes] = useState<any[]>([])
  const [filteredNotes, setFilteredNotes] = useState<any[]>([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [brainDumpItems, setBrainDumpItems] = useState<BrainDumpItem[]>([])
  const [movingItems, setMovingItems] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ open: boolean; message: string; description?: string; variant: 'success' | 'error' }>({
    open: false,
    message: '',
    variant: 'success'
  })
  const [showTagDialog, setShowTagDialog] = useState(false)
  const [selectedNoteForTag, setSelectedNoteForTag] = useState<{id: string, tags: string[]} | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedNoteForEdit, setSelectedNoteForEdit] = useState<string | null>(null)
  const [showSmartifyModal, setShowSmartifyModal] = useState(false)
  const [selectedNoteForSmartify, setSelectedNoteForSmartify] = useState<{id: string, title: string} | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedNoteForDetail, setSelectedNoteForDetail] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedNoteForDelete, setSelectedNoteForDelete] = useState<{id: string, title: string} | null>(null)
  const [isLoadingNotes, setIsLoadingNotes] = useState(true)
  const [isLoadingFocus, setIsLoadingFocus] = useState(true)

  const loadNotes = useCallback(async () => {
    if (!user || !supabase) return

    try {
      setIsLoadingNotes(true)
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(9)

      if (error) {
        console.error('[Dashboard] Error loading notes:', error)
        return
      }

      const notesData = data || []
      setNotes(notesData)
      applyFilter(notesData, activeFilter)
    } catch (error) {
      console.error('[Dashboard] Unexpected error loading notes:', error)
    } finally {
      setIsLoadingNotes(false)
    }
  }, [user, supabase, activeFilter])

  const loadFocusItems = useCallback(async () => {
    if (!user || !supabase) return

    try {
      setIsLoadingFocus(true)
      const { data: recordings } = await supabase
        .from('recordings')
        .select('id')
        .eq('user_id', user.id)

      if (!recordings || recordings.length === 0) {
        setActionItems([])
        setBrainDumpItems([])
        return
      }

      const recordingIds = recordings.map(r => r.id)

      // Load all open and in_progress action items
      const { data: actionData, error: actionError } = await supabase
        .from('action_items')
        .select('*')
        .in('recording_id', recordingIds)
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false })

      if (actionError) {
        console.error('[Dashboard] Error loading action items:', actionError)
      } else {
        setActionItems(actionData || [])
      }

      // Load brain dump items (for blockers count)
      const { data: brainData, error: brainError } = await supabase
        .from('brain_dump')
        .select('*')
        .in('recording_id', recordingIds)
        .order('created_at', { ascending: false })

      if (brainError) {
        console.error('[Dashboard] Error loading brain dump:', brainError)
      } else {
        setBrainDumpItems(brainData || [])
      }
    } catch (error) {
      console.error('[Dashboard] Unexpected error loading focus items:', error)
    } finally {
      setIsLoadingFocus(false)
    }
  }, [user, supabase])

  const applyFilter = useCallback((notesData: any[], filter: string) => {
    let filtered = notesData

    if (filter === 'all') {
      filtered = notesData
    } else if (filter.startsWith('tag:')) {
      const tagName = filter.replace('tag:', '')
      filtered = notesData.filter(note =>
        note.tags && Array.isArray(note.tags) && note.tags.includes(tagName)
      )
    } else {
      filtered = notesData.filter(note => note.template_type === filter)
    }

    setFilteredNotes(filtered)
  }, [])

  useEffect(() => {
    const handleFilterChange = (event: CustomEvent) => {
      setActiveFilter(event.detail.filter)
      applyFilter(notes, event.detail.filter)
    }

    window.addEventListener('filterChanged' as any, handleFilterChange as EventListener)
    return () => {
      window.removeEventListener('filterChanged' as any, handleFilterChange as EventListener)
    }
  }, [notes, applyFilter])

  useEffect(() => {
    if (notes.length > 0) {
      applyFilter(notes, activeFilter)
    }
  }, [notes, activeFilter, applyFilter])

  useEffect(() => {
    loadNotes()
    loadFocusItems()

    const handleNoteEvent = () => {
      loadNotes()
      loadFocusItems()
    }
    const handleTagsUpdated = () => loadNotes()
    const handleActionItemEvent = () => loadFocusItems()

    // Handle search panel note click - open in detail modal
    const handleOpenNoteDetail = (event: CustomEvent<{ noteId: string }>) => {
      setSelectedNoteForDetail(event.detail.noteId)
      setShowDetailModal(true)
    }

    window.addEventListener('noteCreated', handleNoteEvent as EventListener)
    window.addEventListener('noteUpdated', handleNoteEvent as EventListener)
    window.addEventListener('noteDeleted', handleNoteEvent as EventListener)
    window.addEventListener('tagsUpdated', handleTagsUpdated)
    window.addEventListener('actionItemCompleted', handleActionItemEvent as EventListener)
    window.addEventListener('actionItemUpdated', handleActionItemEvent as EventListener)
    window.addEventListener('openNoteDetail', handleOpenNoteDetail as EventListener)

    return () => {
      window.removeEventListener('noteCreated', handleNoteEvent as EventListener)
      window.removeEventListener('noteUpdated', handleNoteEvent as EventListener)
      window.removeEventListener('noteDeleted', handleNoteEvent as EventListener)
      window.removeEventListener('tagsUpdated', handleTagsUpdated)
      window.removeEventListener('actionItemCompleted', handleActionItemEvent as EventListener)
      window.removeEventListener('actionItemUpdated', handleActionItemEvent as EventListener)
      window.removeEventListener('openNoteDetail', handleOpenNoteDetail as EventListener)
    }
  }, [loadNotes, loadFocusItems])

  // Move item to in_progress
  const handleStartWork = async (itemId: string) => {
    if (movingItems.has(itemId)) return

    setMovingItems(prev => new Set(prev).add(itemId))

    // Optimistic update
    setActionItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, status: 'in_progress' as const }
          : item
      )
    )

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('action_items')
        .update({ status: 'in_progress' })
        .eq('id', itemId)

      if (error) throw error

      dispatchActionItemEvent('actionItemUpdated', { itemId, status: 'in_progress' })

      setToast({
        open: true,
        message: 'Task moved to in progress',
        variant: 'success'
      })
    } catch (error) {
      console.error('Failed to update item:', error)
      loadFocusItems()
      setToast({
        open: true,
        message: 'Failed to update task',
        variant: 'error'
      })
    } finally {
      setMovingItems(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  // Complete item (mark as done)
  const handleCompleteItem = async (itemId: string) => {
    if (movingItems.has(itemId)) return

    setMovingItems(prev => new Set(prev).add(itemId))

    // Optimistic update - remove from list
    setActionItems(items => items.filter(item => item.id !== itemId))

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('action_items')
        .update({
          status: 'done',
          completed_at: new Date().toISOString()
        })
        .eq('id', itemId)

      if (error) throw error

      dispatchActionItemEvent('actionItemCompleted', { itemId, status: 'done' })

      setToast({
        open: true,
        message: 'Task completed',
        variant: 'success'
      })
    } catch (error) {
      console.error('Failed to complete item:', error)
      loadFocusItems()
      setToast({
        open: true,
        message: 'Failed to complete task',
        variant: 'error'
      })
    } finally {
      setMovingItems(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const toggleStar = async (noteId: string) => {
    if (!user || !supabase) return

    const note = notes.find(n => n.id === noteId)
    if (!note) return

    const newStarredState = !note.is_starred

    setNotes(notes.map(n =>
      n.id === noteId ? { ...n, is_starred: newStarredState } : n
    ))

    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_starred: newStarredState })
        .eq('id', noteId)
        .eq('user_id', user.id)

      if (error) {
        console.error('[Dashboard] Error toggling star:', error)
        setNotes(notes)
        return
      }

      window.dispatchEvent(new CustomEvent('starToggled', {
        detail: { noteId, isStarred: newStarredState }
      }))
    } catch (error) {
      console.error('[Dashboard] Unexpected error toggling star:', error)
      setNotes(notes)
    }
  }

  const handleDeleteNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    setSelectedNoteForDelete({ id: noteId, title: note?.title || 'Untitled Note' })
    setShowDeleteDialog(true)
  }

  const confirmDeleteNote = async () => {
    if (!user || !supabase || !selectedNoteForDelete) return

    const noteId = selectedNoteForDelete.id
    const originalNotes = notes

    setNotes(notes.filter(note => note.id !== noteId))

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id)

      if (error) {
        console.error('[Dashboard] Error deleting note:', error)
        setNotes(originalNotes)
        return
      }

      window.dispatchEvent(new CustomEvent('noteDeleted', { detail: { noteId } }))
    } catch (error) {
      console.error('[Dashboard] Unexpected error deleting note:', error)
      setNotes(originalNotes)
    }
  }

  const handleAddTag = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    setSelectedNoteForTag({ id: noteId, tags: note?.tags || [] })
    setShowTagDialog(true)
  }

  const handleEditNote = (noteId: string) => {
    setSelectedNoteForEdit(noteId)
    setShowEditDialog(true)
  }

  const handleSmartify = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    setSelectedNoteForSmartify({
      id: noteId,
      title: note?.title || 'Untitled Note'
    })
    setShowSmartifyModal(true)
  }

  const handleViewNote = (noteId: string) => {
    router.push(`/dashboard/notes/${noteId}`)
  }

  const displayNotes = activeFilter === 'all' ? notes : filteredNotes

  // Sort and separate action items
  const { todoItems, inProgressItems, overdueCount, blockersCount } = useMemo(() => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }

    // Sort function: overdue first, then priority, then deadline
    const sortItems = (items: ActionItem[]) => {
      return [...items].sort((a, b) => {
        const aOverdue = isOverdue(a.deadline)
        const bOverdue = isOverdue(b.deadline)

        // Overdue items first
        if (aOverdue && !bOverdue) return -1
        if (!aOverdue && bOverdue) return 1

        // Then by priority
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (priorityDiff !== 0) return priorityDiff

        // Then by deadline (earlier first)
        if (a.deadline && b.deadline) {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        }
        if (a.deadline) return -1
        if (b.deadline) return 1

        return 0
      })
    }

    const todos = sortItems(actionItems.filter(i => i.status === 'open'))
    const inProgress = sortItems(actionItems.filter(i => i.status === 'in_progress'))
    const overdue = actionItems.filter(i => i.status !== 'done' && isOverdue(i.deadline)).length
    const blockers = brainDumpItems.filter(i => i.category === 'blocker').length

    return {
      todoItems: todos,
      inProgressItems: inProgress,
      overdueCount: overdue,
      blockersCount: blockers
    }
  }, [actionItems, brainDumpItems])

  // Priority styles
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return { border: 'border-l-red-500', text: 'text-red-600' }
      case 'medium':
        return { border: 'border-l-amber-500', text: 'text-amber-600' }
      default:
        return { border: 'border-l-gray-300', text: 'text-gray-500' }
    }
  }

  // Build dynamic summary
  const summaryParts: string[] = []
  if (overdueCount > 0) {
    summaryParts.push(`${overdueCount} overdue`)
  }
  if (todoItems.length > 0) {
    summaryParts.push(`${todoItems.length} in queue`)
  }
  if (inProgressItems.length > 0) {
    summaryParts.push(`${inProgressItems.length} in progress`)
  }
  if (blockersCount > 0) {
    summaryParts.push(`${blockersCount} blocker${blockersCount > 1 ? 's' : ''} flagged`)
  }

  const hasFocusItems = todoItems.length > 0 || inProgressItems.length > 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Filter Bar */}
      <FilterBar
        avatarUrl={profile?.avatar_url}
        displayName={profile?.display_name}
        email={profile?.email}
        recordingsCount={profile?.recordings_count || 0}
      />

      {/* Personalized Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
          {getGreeting()}{profile?.display_name ? `, ${getFirstName(profile.display_name)}` : ''}
        </h1>
        <p className="text-gray-500 mt-1 text-sm tracking-wide">
          {getFormattedDate()}
        </p>

        {/* Dynamic Summary */}
        {summaryParts.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-sm">
            {summaryParts.map((part, index) => (
              <span key={index} className="flex items-center">
                {index > 0 && <span className="text-gray-300 mx-1.5">·</span>}
                <span className={cn(
                  part.includes('overdue') ? 'text-red-600 font-medium' :
                  part.includes('blocker') ? 'text-amber-600' :
                  'text-gray-600'
                )}>
                  {part}
                </span>
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Today's Focus - Two Column Layout */}
      {(hasFocusItems || isLoadingFocus) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Today's Focus
            </h2>
            <Link
              href="/dashboard/action-items"
              className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
            >
              View all tasks
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {isLoadingFocus ? (
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-medium text-gray-900">To Do</h3>
                </div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <FocusItemSkeleton key={i} />)}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-medium text-gray-900">In Progress</h3>
                </div>
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => <FocusItemSkeleton key={i} />)}
                </div>
              </div>
            </div>
          ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* To Do Column */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-gray-900">To Do</h3>
                {todoItems.length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{todoItems.length - 3} more
                  </span>
                )}
              </div>

              {todoItems.length > 0 ? (
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {todoItems.slice(0, 3).map((item, index) => {
                    const priorityStyles = getPriorityStyles(item.priority)
                    const deadline = formatDeadline(item.deadline)
                    const overdue = isOverdue(item.deadline)
                    const isMoving = movingItems.has(item.id)

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: isMoving ? 0.5 : 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={cn(
                          "group bg-white rounded-lg border border-gray-200 p-4 border-l-[3px] transition-all",
                          priorityStyles.border,
                          "hover:shadow-sm hover:border-gray-300"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 leading-relaxed">
                              {item.task}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              {deadline && (
                                <span className={cn(
                                  "flex items-center gap-1 text-[11px]",
                                  overdue ? "text-red-600 font-medium" : "text-gray-500"
                                )}>
                                  {overdue && <AlertCircle className="h-3 w-3" />}
                                  <Calendar className="h-3 w-3" />
                                  {deadline}
                                </span>
                              )}
                              {item.assignee && (
                                <span className="text-[11px] text-gray-400">
                                  {item.assignee}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Work Button */}
                          <button
                            onClick={() => handleStartWork(item.id)}
                            disabled={isMoving}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                              "bg-gray-900 text-white hover:bg-gray-800",
                              "opacity-0 group-hover:opacity-100",
                              isMoving && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            Work
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                  {todoItems.length > 3 && (
                    <div className="pt-2">
                      {todoItems.slice(3).map((item, index) => {
                        const priorityStyles = getPriorityStyles(item.priority)
                        const deadline = formatDeadline(item.deadline)
                        const overdue = isOverdue(item.deadline)
                        const isMoving = movingItems.has(item.id)

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isMoving ? 0.5 : 1 }}
                            className={cn(
                              "group bg-white rounded-lg border border-gray-200 p-4 border-l-[3px] transition-all mb-2",
                              priorityStyles.border,
                              "hover:shadow-sm hover:border-gray-300"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 leading-relaxed">
                                  {item.task}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  {deadline && (
                                    <span className={cn(
                                      "flex items-center gap-1 text-[11px]",
                                      overdue ? "text-red-600 font-medium" : "text-gray-500"
                                    )}>
                                      {overdue && <AlertCircle className="h-3 w-3" />}
                                      <Calendar className="h-3 w-3" />
                                      {deadline}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleStartWork(item.id)}
                                disabled={isMoving}
                                className={cn(
                                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                  "bg-gray-900 text-white hover:bg-gray-800",
                                  "opacity-0 group-hover:opacity-100"
                                )}
                              >
                                Work
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg border border-dashed border-gray-200 p-8 text-center">
                  <p className="text-sm text-gray-500">No tasks in queue</p>
                </div>
              )}
            </div>

            {/* In Progress Column */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-gray-900">In Progress</h3>
                {inProgressItems.length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{inProgressItems.length - 3} more
                  </span>
                )}
              </div>

              {inProgressItems.length > 0 ? (
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {inProgressItems.slice(0, 3).map((item, index) => {
                    const priorityStyles = getPriorityStyles(item.priority)
                    const deadline = formatDeadline(item.deadline)
                    const overdue = isOverdue(item.deadline)
                    const isMoving = movingItems.has(item.id)

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: isMoving ? 0.5 : 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={cn(
                          "group bg-blue-50/50 rounded-lg border border-blue-200/60 p-4 border-l-[3px] border-l-blue-500 transition-all",
                          "hover:shadow-sm hover:border-blue-300"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <PlayCircle className="h-3.5 w-3.5 text-blue-600" />
                              <span className="text-[10px] font-medium text-blue-600 uppercase tracking-wide">
                                Working
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 leading-relaxed">
                              {item.task}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              {deadline && (
                                <span className={cn(
                                  "flex items-center gap-1 text-[11px]",
                                  overdue ? "text-red-600 font-medium" : "text-gray-500"
                                )}>
                                  <Calendar className="h-3 w-3" />
                                  {deadline}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Complete Button */}
                          <button
                            onClick={() => handleCompleteItem(item.id)}
                            disabled={isMoving}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                              "bg-emerald-600 text-white hover:bg-emerald-700",
                              "opacity-0 group-hover:opacity-100",
                              isMoving && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            Done
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                  {inProgressItems.length > 3 && (
                    <div className="pt-2">
                      {inProgressItems.slice(3).map((item) => {
                        const deadline = formatDeadline(item.deadline)
                        const overdue = isOverdue(item.deadline)
                        const isMoving = movingItems.has(item.id)

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isMoving ? 0.5 : 1 }}
                            className={cn(
                              "group bg-blue-50/50 rounded-lg border border-blue-200/60 p-4 border-l-[3px] border-l-blue-500 transition-all mb-2",
                              "hover:shadow-sm hover:border-blue-300"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <PlayCircle className="h-3.5 w-3.5 text-blue-600" />
                                  <span className="text-[10px] font-medium text-blue-600 uppercase tracking-wide">
                                    Working
                                  </span>
                                </div>
                                <p className="text-sm text-gray-800 leading-relaxed">
                                  {item.task}
                                </p>
                                {deadline && (
                                  <span className={cn(
                                    "flex items-center gap-1 text-[11px] mt-2",
                                    overdue ? "text-red-600" : "text-gray-500"
                                  )}>
                                    <Calendar className="h-3 w-3" />
                                    {deadline}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleCompleteItem(item.id)}
                                disabled={isMoving}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                Done
                              </button>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg border border-dashed border-gray-200 p-8 text-center">
                  <p className="text-sm text-gray-500">No tasks in progress</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Work" on a task to start</p>
                </div>
              )}
            </div>
          </div>
          )}
        </motion.div>
      )}

      {/* Notes Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Recent Notes
          </h2>
          {notes.length > 0 && (
            <Link
              href="/dashboard/notes"
              className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
            >
              View all
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {isLoadingNotes ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <NoteCardSkeleton key={index} />
            ))}
          </div>
        ) : displayNotes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayNotes.map((note: any, index: number) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + (index * 0.04) }}
              >
                <NoteCard
                  title={note.title || 'Untitled Note'}
                  preview={note.formatted_content?.substring(0, 150) || note.raw_transcript?.substring(0, 150) || 'No content'}
                  createdAt={new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + new Date(note.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  duration={note.duration || '0:00'}
                  template={note.template_label || note.template_type || 'Note'}
                  isStarred={note.is_starred || false}
                  tags={note.tags || []}
                  onStar={() => toggleStar(note.id)}
                  onPlay={() => console.log('[Dashboard] Playing note:', note.id)}
                  onEdit={() => handleEditNote(note.id)}
                  onDelete={() => handleDeleteNote(note.id)}
                  onAddTag={() => handleAddTag(note.id)}
                  onSmartify={() => handleSmartify(note.id)}
                  onView={() => handleViewNote(note.id)}
                  noteId={note.id}
                  isSmartified={!!note.smartified_at}
                  canSmartify={!note.smartified_at || new Date(note.updated_at) > new Date(note.smartified_at)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-200">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gray-100 mb-4">
              <Mic className="h-6 w-6 text-gray-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-gray-900 font-medium mb-1">No notes yet</h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              Start recording your first voice note to see it here.
            </p>
          </div>
        )}
      </motion.div>

      {/* Dialogs */}
      {selectedNoteForTag && (
        <AddTagDialog
          open={showTagDialog}
          onOpenChange={async (open) => {
            setShowTagDialog(open)
            if (!open) {
              await loadNotes()
              if (selectedNoteForTag) {
                const note = notes.find(n => n.id === selectedNoteForTag.id)
                if (note) {
                  setSelectedNoteForTag({ id: note.id, tags: note.tags || [] })
                }
              }
            }
          }}
          noteId={selectedNoteForTag.id}
          existingTags={selectedNoteForTag.tags}
        />
      )}

      <EditNoteDialog
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open)
          if (!open) setSelectedNoteForEdit(null)
        }}
        noteId={selectedNoteForEdit}
      />

      {selectedNoteForSmartify && (
        <SmartifyModal
          open={showSmartifyModal}
          onOpenChange={(open) => {
            setShowSmartifyModal(open)
            if (!open) setSelectedNoteForSmartify(null)
          }}
          noteId={selectedNoteForSmartify.id}
          noteTitle={selectedNoteForSmartify.title}
        />
      )}

      <NoteDetailModal
        open={showDetailModal}
        onOpenChange={(open) => {
          setShowDetailModal(open)
          if (!open) setSelectedNoteForDetail(null)
        }}
        noteId={selectedNoteForDetail}
      />

      <DeleteNoteDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open)
          if (!open) setSelectedNoteForDelete(null)
        }}
        onConfirm={confirmDeleteNote}
        noteTitle={selectedNoteForDelete?.title}
      />

      {/* Toast */}
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
