'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Search,
  X,
  FileText,
  CheckSquare,
  AtSign,
  Clock,
  Calendar,
  ArrowRight,
  User,
  AlertCircle,
  ChevronRight,
  Brain,
  Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { isOverdue, formatDeadline } from '@/types/dashboard'

// Search result types
interface NoteSearchResult {
  id: string
  title: string | null
  formatted_content: string | null
  raw_transcript: string | null
  created_at: string
  template_label: string | null
  type: 'note'
}

interface TaskSearchResult {
  id: string
  task: string
  assignee: string | null
  deadline: string | null
  priority: 'high' | 'medium' | 'low'
  status: 'open' | 'in_progress' | 'done'
  created_at: string
  recording_id: string
  type: 'task'
}

interface BrainDumpSearchResult {
  id: string
  content: string
  category: 'meeting' | 'blocker' | 'decision' | 'question' | 'followup'
  participants: string[] | null
  created_at: string
  recording_id: string
  type: 'brain_dump'
}

interface PersonResult {
  name: string
  noteCount: number
  taskCount: number
  brainDumpCount: number
}

type SearchMode = 'all' | 'notes' | 'tasks' | 'brain_dump'

interface SearchPanelProps {
  open: boolean
  onClose: () => void
}

export function SearchPanel({ open, onClose }: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState<SearchMode>('all')
  const [noteResults, setNoteResults] = useState<NoteSearchResult[]>([])
  const [taskResults, setTaskResults] = useState<TaskSearchResult[]>([])
  const [brainDumpResults, setBrainDumpResults] = useState<BrainDumpSearchResult[]>([])
  const [personResults, setPersonResults] = useState<PersonResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isPeopleSearch, setIsPeopleSearch] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Debounced search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Reset state when closing
  const handleClose = useCallback(() => {
    setSearchQuery('')
    setNoteResults([])
    setTaskResults([])
    setBrainDumpResults([])
    setPersonResults([])
    setIsPeopleSearch(false)
    setSelectedPerson(null)
    onClose()
  }, [onClose])

  // Focus input when opening and handle keyboard shortcuts
  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 100)

      // Handle Escape key to close
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose()
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleClose])

  // Detect @ symbol for people search
  useEffect(() => {
    const isAtSearch = searchQuery.startsWith('@')
    setIsPeopleSearch(isAtSearch)
    if (!isAtSearch) {
      setSelectedPerson(null)
      setPersonResults([])
    }
  }, [searchQuery])

  // Perform search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setNoteResults([])
      setTaskResults([])
      setBrainDumpResults([])
      setPersonResults([])
      return
    }

    setIsSearching(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsSearching(false)
        return
      }

      // Handle @ people search
      if (query.startsWith('@')) {
        const personQuery = query.slice(1).toLowerCase().trim()

        // Get all recordings first
        const { data: recordings } = await supabase
          .from('recordings')
          .select('id')
          .eq('user_id', user.id)

        if (!recordings || recordings.length === 0) {
          setPersonResults([])
          setIsSearching(false)
          return
        }

        const recordingIds = recordings.map(r => r.id)

        // Search tasks for assignees
        const { data: tasks } = await supabase
          .from('action_items')
          .select('*')
          .in('recording_id', recordingIds)
          .not('assignee', 'is', null)

        // Search brain dump for participants
        const { data: brainDumps } = await supabase
          .from('brain_dump')
          .select('*')
          .in('recording_id', recordingIds)

        // Build people index
        const peopleMap = new Map<string, { noteCount: number; taskCount: number; brainDumpCount: number }>()

        tasks?.forEach(task => {
          if (task.assignee) {
            const name = task.assignee.toLowerCase()
            if (!personQuery || name.includes(personQuery)) {
              const existing = peopleMap.get(task.assignee) || { noteCount: 0, taskCount: 0, brainDumpCount: 0 }
              existing.taskCount++
              peopleMap.set(task.assignee, existing)
            }
          }
        })

        brainDumps?.forEach(item => {
          if (item.participants && Array.isArray(item.participants)) {
            item.participants.forEach((participant: string) => {
              const name = participant.toLowerCase()
              if (!personQuery || name.includes(personQuery)) {
                const existing = peopleMap.get(participant) || { noteCount: 0, taskCount: 0, brainDumpCount: 0 }
                existing.brainDumpCount++
                peopleMap.set(participant, existing)
              }
            })
          }
        })

        const results: PersonResult[] = Array.from(peopleMap.entries())
          .map(([name, counts]) => ({ name, ...counts }))
          .sort((a, b) => (b.noteCount + b.taskCount + b.brainDumpCount) - (a.noteCount + a.taskCount + a.brainDumpCount))
          .slice(0, 10)

        setPersonResults(results)
        setIsSearching(false)
        return
      }

      // Standard search
      const searchTerm = query.trim()

      // Search notes
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('id, title, formatted_content, raw_transcript, created_at, template_label')
        .eq('user_id', user.id)
        .or(`title.ilike.%${searchTerm}%,formatted_content.ilike.%${searchTerm}%,raw_transcript.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(15)

      if (!notesError && notes) {
        setNoteResults(notes.map(n => ({ ...n, type: 'note' as const })))
      }

      // Get recordings for task and brain dump search
      const { data: recordings } = await supabase
        .from('recordings')
        .select('id')
        .eq('user_id', user.id)

      if (recordings && recordings.length > 0) {
        const recordingIds = recordings.map(r => r.id)

        // Search tasks
        const { data: tasks, error: tasksError } = await supabase
          .from('action_items')
          .select('*')
          .in('recording_id', recordingIds)
          .or(`task.ilike.%${searchTerm}%,assignee.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false })
          .limit(15)

        if (!tasksError && tasks) {
          setTaskResults(tasks.map(t => ({ ...t, type: 'task' as const })))
        }

        // Search brain dump
        const { data: brainDumps, error: brainDumpError } = await supabase
          .from('brain_dump')
          .select('*')
          .in('recording_id', recordingIds)
          .ilike('content', `%${searchTerm}%`)
          .order('created_at', { ascending: false })
          .limit(15)

        if (!brainDumpError && brainDumps) {
          setBrainDumpResults(brainDumps.map(b => ({ ...b, type: 'brain_dump' as const })))
        }
      }

    } catch (error) {
      console.error('[SearchPanel] Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }, [supabase])

  // Search for a specific person
  const searchPerson = useCallback(async (personName: string) => {
    setIsSearching(true)
    setSelectedPerson(personName)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsSearching(false)
        return
      }

      // Get all recordings first
      const { data: recordings } = await supabase
        .from('recordings')
        .select('id')
        .eq('user_id', user.id)

      if (!recordings || recordings.length === 0) {
        setIsSearching(false)
        return
      }

      const recordingIds = recordings.map(r => r.id)

      // Get tasks assigned to this person
      const { data: tasks } = await supabase
        .from('action_items')
        .select('*')
        .in('recording_id', recordingIds)
        .ilike('assignee', `%${personName}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (tasks) {
        setTaskResults(tasks.map(t => ({ ...t, type: 'task' as const })))
      }

      // Get brain dumps with this person as participant
      const { data: brainDumps } = await supabase
        .from('brain_dump')
        .select('*')
        .in('recording_id', recordingIds)
        .contains('participants', [personName])
        .order('created_at', { ascending: false })
        .limit(15)

      if (brainDumps) {
        setBrainDumpResults(brainDumps.map(b => ({ ...b, type: 'brain_dump' as const })))
      }

      // Search notes that mention this person
      const { data: notes } = await supabase
        .from('notes')
        .select('id, title, formatted_content, raw_transcript, created_at, template_label')
        .eq('user_id', user.id)
        .or(`formatted_content.ilike.%${personName}%,raw_transcript.ilike.%${personName}%`)
        .order('created_at', { ascending: false })
        .limit(15)

      if (notes) {
        setNoteResults(notes.map(n => ({ ...n, type: 'note' as const })))
      }

    } catch (error) {
      console.error('[SearchPanel] Person search error:', error)
    } finally {
      setIsSearching(false)
    }
  }, [supabase])

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery)
      }, 300)
    } else {
      setNoteResults([])
      setTaskResults([])
      setBrainDumpResults([])
      setPersonResults([])
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, performSearch])

  // Handle note click - dispatch event to open note detail
  const handleNoteClick = (noteId: string) => {
    window.dispatchEvent(new CustomEvent('openNoteDetail', { detail: { noteId } }))
    handleClose()
  }

  // Handle task click - navigate to action items page
  const handleTaskClick = (taskId: string) => {
    window.location.href = `/dashboard/action-items?highlight=${taskId}`
    handleClose()
  }

  // Handle brain dump click - navigate to brain dump page
  const handleBrainDumpClick = (brainDumpId: string) => {
    window.location.href = `/dashboard/brain-dump?highlight=${brainDumpId}`
    handleClose()
  }

  // Total results count
  const totalNotes = noteResults.length
  const totalTasks = taskResults.length
  const totalBrainDump = brainDumpResults.length
  const totalAll = totalNotes + totalTasks + totalBrainDump

  // Check if there are any results
  const hasResults = totalNotes > 0 || totalTasks > 0 || totalBrainDump > 0

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || query.startsWith('@')) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} className="bg-amber-200/60 text-amber-900 px-0.5 rounded">{part}</mark> : part
    )
  }

  // Priority color mapping
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-700'
      case 'done': return 'bg-emerald-100 text-emerald-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  // Category color mapping for brain dump
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'meeting': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'blocker': return 'bg-red-100 text-red-700 border-red-200'
      case 'decision': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'question': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'followup': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  // Render notes section
  const renderNotes = () => (
    <>
      {noteResults.length > 0 && (
        <>
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            Notes
            <span className="ml-auto text-gray-300">{totalNotes}</span>
          </div>
          {noteResults.map((result) => (
            <button
              key={result.id}
              onClick={() => handleNoteClick(result.id)}
              className="w-full text-left p-4 rounded-xl hover:bg-gray-50 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-gray-700">
                    {highlightMatch(result.title || 'Untitled Note', searchQuery)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {new Date(result.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                    {highlightMatch(
                      result.formatted_content?.substring(0, 150) ||
                      result.raw_transcript?.substring(0, 150) ||
                      'No content',
                      searchQuery
                    )}
                  </p>
                </div>
                {result.template_label && (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg font-medium flex-shrink-0">
                    {result.template_label}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-end mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  View note
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          ))}
        </>
      )}
    </>
  )

  // Render tasks section
  const renderTasks = () => (
    <>
      {taskResults.length > 0 && (
        <>
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <CheckSquare className="h-3.5 w-3.5" />
            Tasks
            <span className="ml-auto text-gray-300">{totalTasks}</span>
          </div>
          {taskResults.map((result) => {
            const deadline = formatDeadline(result.deadline)
            const overdue = isOverdue(result.deadline)

            return (
              <button
                key={result.id}
                onClick={() => handleTaskClick(result.id)}
                className="w-full text-left p-4 rounded-xl hover:bg-gray-50 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0",
                    result.status === 'done'
                      ? "bg-emerald-500 border-emerald-500"
                      : result.status === 'in_progress'
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-300"
                  )}>
                    {result.status === 'done' && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium leading-relaxed",
                      result.status === 'done' ? "text-gray-400 line-through" : "text-gray-900"
                    )}>
                      {highlightMatch(result.task, searchQuery)}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-md font-medium border",
                        getPriorityColor(result.priority)
                      )}>
                        {result.priority}
                      </span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-md font-medium",
                        getStatusColor(result.status)
                      )}>
                        {result.status === 'in_progress' ? 'In Progress' : result.status}
                      </span>
                      {deadline && (
                        <span className={cn(
                          "text-xs flex items-center gap-1",
                          overdue ? "text-red-600 font-medium" : "text-gray-500"
                        )}>
                          {overdue && <AlertCircle className="h-3 w-3" />}
                          <Calendar className="h-3 w-3" />
                          {deadline}
                        </span>
                      )}
                      {result.assignee && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {highlightMatch(result.assignee, searchQuery)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </>
      )}
    </>
  )

  // Render brain dump section
  const renderBrainDump = () => (
    <>
      {brainDumpResults.length > 0 && (
        <>
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Brain className="h-3.5 w-3.5" />
            Brain Dump
            <span className="ml-auto text-gray-300">{totalBrainDump}</span>
          </div>
          {brainDumpResults.map((result) => (
            <button
              key={result.id}
              onClick={() => handleBrainDumpClick(result.id)}
              className="w-full text-left p-4 rounded-xl hover:bg-gray-50 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-8 w-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center flex-shrink-0">
                  <Brain className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-relaxed line-clamp-2">
                    {highlightMatch(result.content, searchQuery)}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-md font-medium border capitalize",
                      getCategoryColor(result.category)
                    )}>
                      {result.category}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(result.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    {result.participants && result.participants.length > 0 && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {result.participants.slice(0, 2).join(', ')}
                        {result.participants.length > 2 && ` +${result.participants.length - 2}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </>
      )}
    </>
  )

  if (!open) return null

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90]"
        onClick={handleClose}
      />

      {/* Search Panel - Right Sidebar */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-white border-l border-gray-200/50 shadow-2xl z-[91]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* Search Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <button
                onClick={handleClose}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes, tasks, brain dump... Use @ for people"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 font-medium transition-all"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedPerson(null)
                      searchInputRef.current?.focus()
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Mode Toggle - Only show when not in people search and has results */}
            {!isPeopleSearch && hasResults && !selectedPerson && (
              <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
                <button
                  onClick={() => setSearchMode('all')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                    searchMode === 'all'
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <Layers className="h-4 w-4" />
                  All
                  {totalAll > 0 && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-md text-xs",
                      searchMode === 'all' ? "bg-white/20" : "bg-gray-200"
                    )}>
                      {totalAll}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setSearchMode('notes')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                    searchMode === 'notes'
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  Notes
                  {totalNotes > 0 && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-md text-xs",
                      searchMode === 'notes' ? "bg-white/20" : "bg-gray-200"
                    )}>
                      {totalNotes}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setSearchMode('tasks')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                    searchMode === 'tasks'
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <CheckSquare className="h-4 w-4" />
                  Tasks
                  {totalTasks > 0 && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-md text-xs",
                      searchMode === 'tasks' ? "bg-white/20" : "bg-gray-200"
                    )}>
                      {totalTasks}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setSearchMode('brain_dump')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                    searchMode === 'brain_dump'
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <Brain className="h-4 w-4" />
                  Brain Dump
                  {totalBrainDump > 0 && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-md text-xs",
                      searchMode === 'brain_dump' ? "bg-white/20" : "bg-gray-200"
                    )}>
                      {totalBrainDump}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Person filter indicator */}
            {selectedPerson && (
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-2 bg-[#BD6750]/10 text-[#BD6750] rounded-xl border border-[#BD6750]/20">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{selectedPerson}</span>
                  <button
                    onClick={() => {
                      setSelectedPerson(null)
                      setSearchQuery('@')
                      searchInputRef.current?.focus()
                    }}
                    className="p-0.5 rounded hover:bg-[#BD6750]/20 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setSearchMode('all')}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      searchMode === 'all'
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    All ({totalAll})
                  </button>
                  <button
                    onClick={() => setSearchMode('notes')}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      searchMode === 'notes'
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    Notes ({totalNotes})
                  </button>
                  <button
                    onClick={() => setSearchMode('tasks')}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      searchMode === 'tasks'
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    Tasks ({totalTasks})
                  </button>
                  <button
                    onClick={() => setSearchMode('brain_dump')}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      searchMode === 'brain_dump'
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    Brain ({totalBrainDump})
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-gray-900" />
                <p className="text-sm text-gray-500 mt-4">Searching...</p>
              </div>
            ) : isPeopleSearch && !selectedPerson ? (
              // People search results
              personResults.length > 0 ? (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    People
                  </div>
                  {personResults.map((person) => (
                    <button
                      key={person.name}
                      onClick={() => searchPerson(person.name)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all group text-left"
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#BD6750] to-[#a85744] flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{person.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {person.taskCount > 0 && `${person.taskCount} task${person.taskCount !== 1 ? 's' : ''}`}
                          {person.taskCount > 0 && (person.brainDumpCount > 0 || person.noteCount > 0) && ' · '}
                          {person.brainDumpCount > 0 && `${person.brainDumpCount} brain dump${person.brainDumpCount !== 1 ? 's' : ''}`}
                          {person.brainDumpCount > 0 && person.noteCount > 0 && ' · '}
                          {person.noteCount > 0 && `${person.noteCount} mention${person.noteCount !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              ) : searchQuery.length > 1 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <AtSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">No people found</p>
                  <p className="text-sm text-gray-400 mt-1">Try a different name</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-[#BD6750]/10 flex items-center justify-center mb-4">
                    <AtSign className="h-5 w-5 text-[#BD6750]" />
                  </div>
                  <p className="text-gray-600 font-medium">Search for people</p>
                  <p className="text-sm text-gray-400 mt-1">Type a name after @ to find their notes, tasks, and brain dumps</p>
                </div>
              )
            ) : hasResults ? (
              <div className="p-2">
                {/* All mode - show notes first, then tasks, then brain dump */}
                {searchMode === 'all' && (
                  <>
                    {renderNotes()}
                    {noteResults.length > 0 && (taskResults.length > 0 || brainDumpResults.length > 0) && (
                      <div className="my-2 border-t border-gray-100" />
                    )}
                    {renderTasks()}
                    {taskResults.length > 0 && brainDumpResults.length > 0 && (
                      <div className="my-2 border-t border-gray-100" />
                    )}
                    {renderBrainDump()}
                  </>
                )}

                {/* Notes mode */}
                {searchMode === 'notes' && renderNotes()}

                {/* Tasks mode */}
                {searchMode === 'tasks' && renderTasks()}

                {/* Brain dump mode */}
                {searchMode === 'brain_dump' && renderBrainDump()}
              </div>
            ) : searchQuery.trim() && !isPeopleSearch ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">No results found</p>
                <p className="text-sm text-gray-400 mt-1">Try different keywords or search by @person</p>
              </div>
            ) : !isPeopleSearch ? (
              // Empty state
              <div className="p-6 text-center">
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <CheckSquare className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-[#BD6750]/10 flex items-center justify-center">
                      <AtSign className="h-5 w-5 text-[#BD6750]" />
                    </div>
                  </div>
                  <p className="text-gray-600 font-medium mb-2">Search your workspace</p>
                  <p className="text-sm text-gray-400 max-w-xs">
                    Search through your notes, tasks, and brain dumps. Use <span className="font-medium text-[#BD6750]">@name</span> to find everything related to a person.
                  </p>
                </div>

                {/* Quick tips */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">@</kbd>
                      <span>People search</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">Esc</kbd>
                      <span>Close</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
