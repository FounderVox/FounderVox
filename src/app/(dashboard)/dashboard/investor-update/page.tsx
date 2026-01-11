'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { FilterBar } from '@/components/dashboard/filter-bar'
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Send,
  Trash2,
  Copy,
  ArrowRight,
  Briefcase,
  Mail,
  FileText,
  Calendar,
  Clock,
  ChevronRight,
  X,
  Check,
  Pencil,
  Save
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { useSidebar } from '@/components/dashboard/sidebar'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Toast } from '@/components/ui/toast'

export const dynamic = 'force-dynamic'

interface InvestorUpdate {
  id: string
  draft_subject: string | null
  draft_body: string | null
  wins: string[] | null
  metrics: Record<string, any> | null
  challenges: string[] | null
  asks: string[] | null
  status: 'draft' | 'sent'
  sent_at: string | null
  created_at: string
}

export default function InvestorUpdatePage() {
  const [profile, setProfile] = useState<any>(null)
  const [updates, setUpdates] = useState<InvestorUpdate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUpdate, setSelectedUpdate] = useState<InvestorUpdate | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editedSubject, setEditedSubject] = useState('')
  const [editedBody, setEditedBody] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast state
  const [toast, setToast] = useState<{
    open: boolean
    message: string
    description?: string
    variant: 'success' | 'error' | 'warning' | 'info'
  }>({ open: false, message: '', variant: 'success' })

  const supabase = createClient()
  const { setIsCollapsed } = useSidebar()

  // Collapse sidebar when page loads
  useEffect(() => {
    setIsCollapsed(true)
  }, [setIsCollapsed])

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error('[InvestorUpdate] Error getting user:', userError)
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

        // Load investor updates via recordings
        const { data: recordings } = await supabase
          .from('recordings')
          .select('id')
          .eq('user_id', user.id)

        if (recordings && recordings.length > 0) {
          const recordingIds = recordings.map(r => r.id)
          const { data: updateData, error: updateError } = await supabase
            .from('investor_updates')
            .select('*')
            .in('recording_id', recordingIds)
            .order('created_at', { ascending: false })

          if (updateError) {
            console.error('[InvestorUpdate] Error loading updates:', updateError)
          } else {
            // Filter out empty updates (no subject, no body, no wins, no metrics, no challenges, no asks)
            const filteredUpdates = (updateData || []).filter(update => {
              const hasContent = 
                (update.draft_subject && update.draft_subject.trim()) ||
                (update.draft_body && update.draft_body.trim()) ||
                (update.wins && Array.isArray(update.wins) && update.wins.length > 0) ||
                (update.metrics && typeof update.metrics === 'object' && Object.keys(update.metrics).length > 0) ||
                (update.challenges && Array.isArray(update.challenges) && update.challenges.length > 0) ||
                (update.asks && Array.isArray(update.asks) && update.asks.length > 0)
              return hasContent
            })
            setUpdates(filteredUpdates)
          }
        }

        setIsLoading(false)
      } catch (error) {
        console.error('[InvestorUpdate] Unexpected error:', error)
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const markAsSent = async (updateId: string) => {
    try {
      const { error } = await supabase
        .from('investor_updates')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', updateId)

      if (error) {
        console.error('[InvestorUpdate] Error marking as sent:', error)
        return
      }

      setUpdates(items =>
        items.map(item =>
          item.id === updateId
            ? { ...item, status: 'sent', sent_at: new Date().toISOString() }
            : item
        )
      )
    } catch (error) {
      console.error('[InvestorUpdate] Unexpected error:', error)
    }
  }

  const handleDeleteClick = (updateId: string) => {
    setDeleteConfirmId(updateId)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmId) return

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('investor_updates')
        .delete()
        .eq('id', deleteConfirmId)

      if (error) {
        console.error('[InvestorUpdate] Error deleting update:', error)
        setToast({
          open: true,
          message: 'Failed to delete',
          description: 'There was an error deleting the update',
          variant: 'error'
        })
        return
      }

      setUpdates(items => items.filter(item => item.id !== deleteConfirmId))
      if (selectedUpdate?.id === deleteConfirmId) {
        setSelectedUpdate(null)
        setIsEditing(false)
      }
      setToast({
        open: true,
        message: 'Update deleted',
        description: 'The investor update has been removed',
        variant: 'success'
      })
    } catch (error) {
      console.error('[InvestorUpdate] Unexpected error:', error)
    } finally {
      setIsDeleting(false)
      setDeleteConfirmId(null)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setToast({
      open: true,
      message: 'Copied to clipboard',
      description: 'Email content has been copied',
      variant: 'success'
    })
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Start editing mode
  const startEditing = () => {
    if (!selectedUpdate) return
    setEditedSubject(selectedUpdate.draft_subject || '')
    setEditedBody(selectedUpdate.draft_body || '')
    setIsEditing(true)
    // Auto-resize textarea after state update
    setTimeout(() => {
      if (bodyTextareaRef.current) {
        bodyTextareaRef.current.style.height = 'auto'
        bodyTextareaRef.current.style.height = bodyTextareaRef.current.scrollHeight + 'px'
      }
    }, 0)
  }

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false)
    setEditedSubject('')
    setEditedBody('')
  }

  // Save edited content
  const saveEdit = async () => {
    if (!selectedUpdate) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('investor_updates')
        .update({
          draft_subject: editedSubject,
          draft_body: editedBody
        })
        .eq('id', selectedUpdate.id)

      if (error) {
        console.error('[InvestorUpdate] Error saving update:', error)
        setToast({
          open: true,
          message: 'Failed to save',
          description: 'There was an error saving your changes',
          variant: 'error'
        })
        return
      }

      // Update local state
      setUpdates(items =>
        items.map(item =>
          item.id === selectedUpdate.id
            ? { ...item, draft_subject: editedSubject, draft_body: editedBody }
            : item
        )
      )
      setSelectedUpdate({
        ...selectedUpdate,
        draft_subject: editedSubject,
        draft_body: editedBody
      })
      setIsEditing(false)
      setToast({
        open: true,
        message: 'Changes saved',
        description: 'Your email has been updated',
        variant: 'success'
      })
    } catch (error) {
      console.error('[InvestorUpdate] Unexpected error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const groupedByDate = updates.reduce((groups, update) => {
    const date = new Date(update.created_at)
    const dateKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(update)
    return groups
  }, {} as Record<string, InvestorUpdate[]>)

  // Stats calculations
  const draftCount = updates.filter(u => u.status === 'draft').length
  const sentCount = updates.filter(u => u.status === 'sent').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <div className="h-10 w-10 rounded-full border-[3px] border-gray-200 border-t-black" />
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="pb-8"
    >
      {/* Filter Bar */}
      <FilterBar
        avatarUrl={profile?.avatar_url}
        displayName={profile?.display_name}
        email={profile?.email}
        recordingsCount={profile?.recordings_count || 0}
      />

      {/* Premium Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 shadow-lg shadow-amber-600/20">
              <Briefcase className="h-7 w-7 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Investor Updates</h1>
              <p className="text-gray-500 mt-1 text-sm">
                Manage and send professional updates to your investors
              </p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100">
                <FileText className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{updates.length}</p>
                <p className="text-xs text-gray-500">Total Updates</p>
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{draftCount}</p>
                <p className="text-xs text-gray-500">Drafts</p>
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Send className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{sentCount}</p>
                <p className="text-xs text-gray-500">Sent</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Updates List - Email Inbox Style */}
        <div className="lg:col-span-2">
          {Object.keys(groupedByDate).length > 0 ? (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/60 overflow-hidden shadow-sm">
              {/* Inbox Header */}
              <div className="px-4 py-3 border-b border-gray-200/60 bg-gray-50/50">
                <h2 className="text-sm font-semibold text-gray-700">All Updates</h2>
              </div>

              <div className="divide-y divide-gray-100">
                {Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map((dateKey) => (
                  groupedByDate[dateKey].map((update, index) => (
                    <motion.div
                      key={update.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => {
                        setSelectedUpdate(update)
                        setIsEditing(false)
                      }}
                      className={cn(
                        'px-4 py-4 cursor-pointer transition-all duration-200 group relative',
                        selectedUpdate?.id === update.id
                          ? 'bg-gray-100/80'
                          : 'hover:bg-gray-50/80'
                      )}
                    >
                      {/* Selection indicator */}
                      {selectedUpdate?.id === update.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-r" />
                      )}

                      <div className="flex items-start gap-3">
                        {/* Status Icon */}
                        <div className={cn(
                          "p-2 rounded-lg flex-shrink-0 mt-0.5",
                          update.status === 'sent' ? "bg-emerald-100" : "bg-amber-100"
                        )}>
                          {update.status === 'sent' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <FileText className="h-4 w-4 text-amber-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Subject Line */}
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className={cn(
                              "font-semibold text-sm truncate",
                              update.status === 'draft' ? "text-gray-900" : "text-gray-700"
                            )}>
                              {update.draft_subject || 'Untitled Update'}
                            </h3>
                            <span className="text-[10px] text-gray-400 flex-shrink-0">
                              {getRelativeDate(update.created_at)}
                            </span>
                          </div>

                          {/* Preview */}
                          <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                            {update.draft_body?.substring(0, 100).replace(/[#*_`]/g, '') || 'No content'}
                          </p>

                          {/* Tags Row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide',
                              update.status === 'sent'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            )}>
                              {update.status}
                            </span>
                            {update.wins && update.wins.length > 0 && (
                              <span className="text-[10px] text-gray-400">
                                {update.wins.length} wins
                              </span>
                            )}
                            {update.challenges && update.challenges.length > 0 && (
                              <span className="text-[10px] text-gray-400">
                                {update.challenges.length} challenges
                              </span>
                            )}
                          </div>
                        </div>

                        <ChevronRight className={cn(
                          "h-4 w-4 text-gray-300 flex-shrink-0 transition-transform",
                          selectedUpdate?.id === update.id && "text-gray-500 translate-x-0.5"
                        )} />
                      </div>
                    </motion.div>
                  ))
                ))}
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50"
            >
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 mb-4 shadow-sm">
                <Briefcase className="h-8 w-8 text-amber-600" strokeWidth={1.5} />
              </div>
              <h3 className="text-gray-900 font-semibold mb-2">No investor updates yet</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-4">
                Use Smartify on a note to generate investor update drafts automatically.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                Go to Notes
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          )}
        </div>

        {/* Update Detail - Email Preview Style */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {selectedUpdate ? (
              <motion.div
                key={selectedUpdate.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden sticky top-6"
              >
                {/* Email Header */}
                <div className="px-6 py-4 border-b border-gray-200/60 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium",
                      selectedUpdate.status === 'sent'
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    )}>
                      {selectedUpdate.status === 'sent' ? 'Sent' : 'Draft'}
                    </div>
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={cancelEditing}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={saveEdit}
                            disabled={isSaving}
                            className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                            title="Save changes"
                          >
                            {isSaving ? (
                              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={startEditing}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                            title="Edit email"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(selectedUpdate.draft_body || '', selectedUpdate.id)}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              copiedId === selectedUpdate.id
                                ? "bg-emerald-100 text-emerald-600"
                                : "hover:bg-gray-100 text-gray-500"
                            )}
                            title="Copy email body"
                          >
                            {copiedId === selectedUpdate.id ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                          {selectedUpdate.status === 'draft' && (
                            <button
                              onClick={() => markAsSent(selectedUpdate.id)}
                              className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                              title="Mark as sent"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteClick(selectedUpdate.id)}
                            className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setSelectedUpdate(null)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors lg:hidden"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      placeholder="Email subject..."
                      className="w-full text-xl font-bold text-gray-900 mb-2 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    />
                  ) : (
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedUpdate.draft_subject || 'Untitled Update'}
                    </h2>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(selectedUpdate.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(selectedUpdate.created_at)}
                    </span>
                    {selectedUpdate.sent_at && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Send className="h-3.5 w-3.5" />
                        Sent {formatDate(selectedUpdate.sent_at)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Email Body with Markdown */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  {isEditing ? (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Email Body (Markdown supported)
                      </label>
                      <textarea
                        ref={bodyTextareaRef}
                        value={editedBody}
                        onChange={(e) => {
                          setEditedBody(e.target.value)
                          e.target.style.height = 'auto'
                          e.target.style.height = e.target.scrollHeight + 'px'
                        }}
                        placeholder="Write your email content here..."
                        className="w-full text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none min-h-[300px] font-mono leading-relaxed"
                      />
                      <p className="text-xs text-gray-400">
                        Tip: Use Markdown formatting for headings (##), bold (**text**), bullets (-), etc.
                      </p>
                    </div>
                  ) : selectedUpdate.draft_body ? (
                    <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-li:text-gray-700 prose-a:text-amber-600 prose-hr:border-gray-200">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">{children}</h3>,
                          p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-4">{children}</p>,
                          ul: ({ children }) => <ul className="space-y-2 mb-4 pl-4">{children}</ul>,
                          ol: ({ children }) => <ol className="space-y-2 mb-4 pl-4 list-decimal">{children}</ol>,
                          li: ({ children }) => <li className="text-gray-700 leading-relaxed">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                          em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                          hr: () => <hr className="my-6 border-gray-200" />,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-amber-400 pl-4 py-1 my-4 bg-amber-50/50 rounded-r-lg">
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {selectedUpdate.draft_body}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-8">No content</p>
                  )}
                </div>

                {/* Additional Sections */}
                {((selectedUpdate.wins && selectedUpdate.wins.length > 0) ||
                  (selectedUpdate.metrics && Object.keys(selectedUpdate.metrics).length > 0) ||
                  (selectedUpdate.challenges && selectedUpdate.challenges.length > 0) ||
                  (selectedUpdate.asks && selectedUpdate.asks.length > 0)) && (
                  <div className="border-t border-gray-200/60 p-6 bg-gray-50/50 space-y-4">
                    {/* Wins */}
                    {selectedUpdate.wins && selectedUpdate.wins.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                          Wins ({selectedUpdate.wins.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedUpdate.wins.map((win, idx) => (
                            <div key={idx} className="flex items-start gap-2 bg-emerald-50 border border-emerald-200/60 rounded-lg p-3">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{win}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metrics */}
                    {selectedUpdate.metrics && Object.keys(selectedUpdate.metrics).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          Metrics
                        </h4>
                        <div className="bg-white border border-gray-200/60 rounded-lg overflow-hidden">
                          {Object.entries(selectedUpdate.metrics).map(([key, value], idx) => (
                            <div key={key} className={cn(
                              "flex justify-between px-4 py-2.5",
                              idx !== Object.keys(selectedUpdate.metrics!).length - 1 && "border-b border-gray-100"
                            )}>
                              <span className="text-sm font-medium text-gray-700">{key}</span>
                              <span className="text-sm text-gray-600">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Challenges */}
                    {selectedUpdate.challenges && selectedUpdate.challenges.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          Challenges ({selectedUpdate.challenges.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedUpdate.challenges.map((challenge, idx) => (
                            <div key={idx} className="flex items-start gap-2 bg-amber-50 border border-amber-200/60 rounded-lg p-3">
                              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{challenge}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Asks */}
                    {selectedUpdate.asks && selectedUpdate.asks.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-600" />
                          Asks ({selectedUpdate.asks.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedUpdate.asks.map((ask, idx) => (
                            <div key={idx} className="flex items-start gap-2 bg-blue-50 border border-blue-200/60 rounded-lg p-3">
                              <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{ask}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/40 p-12 text-center h-[400px] flex flex-col items-center justify-center"
              >
                <div className="p-4 rounded-2xl bg-gray-100/80 mb-4">
                  <Mail className="h-8 w-8 text-gray-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-gray-600 font-medium mb-1">Select an update</h3>
                <p className="text-gray-400 text-sm">Choose an update from the list to view details</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete Investor Update"
        description="Are you sure you want to delete this investor update? This action cannot be undone."
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

