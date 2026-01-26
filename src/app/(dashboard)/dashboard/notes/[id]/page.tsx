'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Save, Wand2, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { SmartifyModal } from '@/components/dashboard/smartify-modal'
import { cn } from '@/lib/utils'
import { getTagColor } from '@/lib/tag-colors'
import { AnnotatedMarkdown } from '@/components/ui/annotated-markdown'

interface NoteData {
  id: string
  title: string | null
  content: string | null
  formatted_content: string | null
  raw_transcript: string | null
  created_at: string
  updated_at: string
  is_starred: boolean
  tags?: string[] | null
  template_type?: string | null
  template_label?: string | null
  smartified_at?: string | null
  canSmartify?: boolean
}

export default function NoteViewPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const noteId = params.id as string
  const { user, supabase } = useAuth()

  const [note, setNote] = useState<NoteData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showSmartifyModal, setShowSmartifyModal] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSmartifying, setIsSmartifying] = useState(false)
  const [smartifyPreviewData, setSmartifyPreviewData] = useState<{actionItems: number, investorUpdates: number, brainDump: number} | null>(null)
  const smartifyTriggered = useRef(false)

  const titleInputRef = useRef<HTMLInputElement>(null)
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (noteId && user) {
      loadNote()
    }
  }, [noteId, user])

  // Reset smartify trigger when noteId changes
  useEffect(() => {
    smartifyTriggered.current = false
  }, [noteId])

  // Auto-trigger smartify when navigated with ?smartify=true
  useEffect(() => {
    if (searchParams.get('smartify') === 'true' && note && !smartifyTriggered.current) {
      smartifyTriggered.current = true
      // Clean the URL without reloading
      window.history.replaceState({}, '', `/dashboard/notes/${noteId}`)
      // Trigger the shimmer + preview flow
      triggerSmartify()
    }
  }, [searchParams, note, noteId])

  useEffect(() => {
    if (note) {
      setHasUnsavedChanges(
        editedTitle !== (note.title || '') ||
        editedContent !== (note.formatted_content || note.content || note.raw_transcript || '')
      )
    }
  }, [editedTitle, editedContent, note])

  const loadNote = async () => {
    if (!noteId || !user || !supabase) return

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: noteError } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .eq('user_id', user.id)
        .single()

      if (noteError || !data) {
        setError('Note not found')
        setIsLoading(false)
        return
      }

      const noteData: NoteData = {
        ...data,
        canSmartify: !data.smartified_at || !!(data.updated_at && new Date(data.updated_at) > new Date(data.smartified_at || ''))
      }

      setNote(noteData)
      setEditedTitle(data.title || '')
      setEditedContent(data.formatted_content || data.content || data.raw_transcript || '')
      setIsLoading(false)
    } catch (error) {
      console.error('[NoteView] Error loading note:', error)
      setError('Failed to load note')
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!noteId || !user || !supabase || !editedContent.trim()) return

    try {
      setIsSaving(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('notes')
        .update({
          title: editedTitle || 'Untitled Note',
          content: editedContent,
          formatted_content: editedContent,
          raw_transcript: editedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('[NoteView] Error saving note:', updateError)
        setError('Failed to save note')
        setIsSaving(false)
        return
      }

      // Reload note to get updated data
      await loadNote()
      setHasUnsavedChanges(false)
      setIsSaving(false)

      // Dispatch event to notify other components with updated note data
      const { data: updatedNote } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .eq('user_id', user.id)
        .single()

      if (updatedNote) {
        window.dispatchEvent(new CustomEvent('noteUpdated', { 
          detail: { 
            noteId,
            note: updatedNote
          } 
        }))
      } else {
        window.dispatchEvent(new CustomEvent('noteUpdated', { detail: { noteId } }))
      }
    } catch (error) {
      console.error('[NoteView] Error saving note:', error)
      setError('Failed to save note')
      setIsSaving(false)
    }
  }

  const triggerSmartify = async () => {
    if (isSmartifying) return
    setIsSmartifying(true)
    setSmartifyPreviewData(null)

    try {
      const response = await fetch('/api/notes/smartify/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Preview failed')
      }

      const data = await response.json()
      setSmartifyPreviewData(data.preview)
      setIsSmartifying(false)
      setShowSmartifyModal(true)
    } catch (err) {
      console.error('[NoteView] Smartify preview error:', err)
      setIsSmartifying(false)
      // Fallback: open modal and let it handle its own preview
      setShowSmartifyModal(true)
    }
  }

  const handleSmartify = () => {
    if (note && note.canSmartify) {
      triggerSmartify()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      // Premium date formatting like Apple Notes
      const day = date.getDate()
      const month = date.toLocaleDateString('en-US', { month: 'long' })
      const year = date.getFullYear()
      const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
      
      return `${weekday}, ${month} ${day}, ${year}`
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent" />
      </div>
    )
  }

  if (error && !note) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
        >
          Go Back
        </button>
      </div>
    )
  }

  if (!note) return null

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Fixed */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-4xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-2 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors group hidden sm:flex"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors group sm:hidden"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* Center: Date */}
            <div className="flex-1 flex justify-center">
              <p className="text-sm font-medium text-gray-500">
                {formatDate(note.created_at)}
              </p>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <span className="text-xs text-gray-500 hidden sm:inline">Unsaved changes</span>
              )}
              <button
                onClick={handleSmartify}
                disabled={!note.canSmartify}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  note.canSmartify
                    ? "text-gray-700 hover:bg-gray-100 hover:text-black"
                    : "text-gray-400 cursor-not-allowed"
                )}
                title={!note.canSmartify && note.smartified_at ? "Note already smartified. Edit to smartify again." : "Extract structured data from this note"}
              >
                {note.smartified_at ? (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Re-smartify</span>
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Smartify</span>
                  </>
                )}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  hasUnsavedChanges && !isSaving
                    ? "bg-black text-white hover:bg-gray-900"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Scrollable with padding for floating buttons */}
      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Title and Tags Row */}
        <div className="flex items-start gap-4 mb-8">
          {/* Title - Bold, Apple Notes style */}
          <input
            ref={titleInputRef}
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            placeholder="Untitled Note"
            className="flex-1 text-4xl font-bold text-black bg-transparent border-none outline-none placeholder:text-gray-300"
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontWeight: 700
            }}
          />

          {/* Tags - Right side of title */}
          {note.tags && Array.isArray(note.tags) && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              {note.tags.map((tag) => {
                const color = getTagColor(tag)
                return (
                  <span
                    key={tag}
                    className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
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
        </div>

        {/* Divider line to prevent text overlap with floating buttons */}
        <div className="h-px bg-gray-200 mb-6" />

        {/* Content - View/Edit mode */}
        <div className="relative">
          {isEditing ? (
            <textarea
              ref={contentTextareaRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              onBlur={() => {
                // Only exit edit mode if no unsaved changes
                if (!hasUnsavedChanges) {
                  setIsEditing(false)
                }
              }}
              placeholder="Start writing..."
              className="w-full min-h-[60vh] text-gray-900 bg-transparent border-none outline-none resize-none leading-relaxed placeholder:text-gray-300"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontSize: '17px',
                lineHeight: '1.5',
                letterSpacing: '-0.01em'
              }}
              autoFocus
            />
          ) : (
            <div
              onClick={() => !isSmartifying && setIsEditing(true)}
              className={cn("min-h-[60vh]", isSmartifying ? "cursor-default" : "cursor-text")}
            >
              <AnnotatedMarkdown
                content={editedContent || 'Click to start writing...'}
                className="text-gray-900"
              />
            </div>
          )}

          {/* Smartify shimmer overlay on content */}
          <AnimatePresence>
            {isSmartifying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 z-10 rounded-xl overflow-hidden pointer-events-none"
              >
                {/* Shimmer sweep across the content */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(110deg, transparent 20%, rgba(189, 103, 80, 0.08) 40%, rgba(189, 103, 80, 0.15) 50%, rgba(189, 103, 80, 0.08) 60%, transparent 80%)',
                    backgroundSize: '200% 100%',
                  }}
                  animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                  transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
                />
                {/* Subtle pulsing overlay */}
                <motion.div
                  className="absolute inset-0 bg-[#BD6750]/[0.02]"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity }}
                />
                {/* Centered processing indicator */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-[#BD6750]/20">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-[#BD6750]/30 border-t-[#BD6750] rounded-full"
                  />
                  <span className="text-sm font-medium text-[#BD6750]">Analyzing note...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Spacer to ensure content doesn't overlap with floating buttons */}
        <div className="h-32" />

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Smartify Modal */}
      {note && (
        <SmartifyModal
          open={showSmartifyModal}
          onOpenChange={(open) => {
            setShowSmartifyModal(open)
            if (!open) {
              setSmartifyPreviewData(null)
              // Reload note after smartify to update canSmartify status
              loadNote()
            }
          }}
          noteId={note.id}
          noteTitle={note.title || 'Untitled Note'}
          noteContent={note.formatted_content || note.content || note.raw_transcript || undefined}
          previewData={smartifyPreviewData}
        />
      )}
    </div>
  )
}

