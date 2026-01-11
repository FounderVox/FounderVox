'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Edit2, Calendar, Clock, Star, Tag as TagIcon, Wand2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface NoteDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  noteId: string | null
}

interface NoteData {
  id: string
  title: string | null
  content: string | null
  formatted_content: string | null
  raw_transcript: string | null
  created_at: string
  updated_at: string
  duration_seconds?: number | null
  is_starred: boolean
  tags?: string[] | null
  template_type?: string | null
  template_label?: string | null
  smartified_at?: string | null
}

export function NoteDetailModal({ open, onOpenChange, noteId }: NoteDetailModalProps) {
  const [note, setNote] = useState<NoteData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (open && noteId) {
      loadNote()
      setIsEditing(false)
    } else {
      setNote(null)
      setEditedTitle('')
      setEditedContent('')
      setError(null)
    }
  }, [open, noteId])

  const loadNote = async () => {
    if (!noteId) return

    try {
      setIsLoading(true)
      setError(null)

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError('Not authenticated')
        setIsLoading(false)
        return
      }

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

      setNote(data)
      setEditedTitle(data.title || '')
      setEditedContent(data.formatted_content || data.content || data.raw_transcript || '')
      setIsLoading(false)
    } catch (error) {
      console.error('[NoteDetailModal] Error loading note:', error)
      setError('Failed to load note')
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!noteId || !editedContent.trim()) return

    try {
      setIsSaving(true)
      setError(null)

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError('Not authenticated')
        setIsSaving(false)
        return
      }

      const { error: updateError } = await supabase
        .from('notes')
        .update({
          title: editedTitle || 'Untitled Note',
          content: editedContent,
          formatted_content: editedContent,
          raw_transcript: editedContent,
        })
        .eq('id', noteId)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('[NoteDetailModal] Error saving note:', updateError)
        setError('Failed to save note')
        setIsSaving(false)
        return
      }

      // Reload note to get updated data
      await loadNote()
      setIsEditing(false)
      setIsSaving(false)

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('noteUpdated', { detail: { noteId } }))
    } catch (error) {
      console.error('[NoteDetailModal] Error saving note:', error)
      setError('Failed to save note')
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (note) {
      setEditedTitle(note.title || '')
      setEditedContent(note.formatted_content || note.content || note.raw_transcript || '')
    }
    setIsEditing(false)
    setError(null)
  }

  const toggleStar = async () => {
    if (!noteId || !note) return

    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_starred: !note.is_starred })
        .eq('id', noteId)

      if (error) {
        console.error('[NoteDetailModal] Error toggling star:', error)
        return
      }

      setNote({ ...note, is_starred: !note.is_starred })
      window.dispatchEvent(new CustomEvent('starToggled'))
    } catch (error) {
      console.error('[NoteDetailModal] Error toggling star:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
        onClick={() => {
          if (!isEditing) {
            onOpenChange(false)
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full h-full max-w-6xl max-h-[95vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden m-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {isLoading ? (
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
              ) : note ? (
                <>
                  <button
                    onClick={toggleStar}
                    className={cn(
                      "p-2 rounded-lg transition-colors flex-shrink-0",
                      note.is_starred
                        ? "text-amber-500 hover:bg-amber-50"
                        : "text-gray-400 hover:bg-gray-100"
                    )}
                  >
                    <Star className={cn("h-5 w-5", note.is_starred && "fill-current")} />
                  </button>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="w-full text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-gray-300 focus:border-black focus:outline-none pb-1"
                        placeholder="Note title..."
                        autoFocus
                      />
                    ) : (
                      <h1 className="text-2xl font-bold text-gray-900 truncate">
                        {note.title || 'Untitled Note'}
                      </h1>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(note.created_at)}</span>
                      </div>
                      {note.duration_seconds && note.duration_seconds > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(note.duration_seconds)}</span>
                        </div>
                      )}
                      {note.template_label && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {note.template_label}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : error ? (
                <div className="text-red-600">{error}</div>
              ) : null}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {note && !isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    title="Edit note"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  {note.smartified_at && (
                    <div className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-gray-200">
                      <Wand2 className="h-3.5 w-3.5" />
                      Smartified
                    </div>
                  )}
                </>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !editedContent.trim()}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save
                      </>
                    )}
                  </button>
                </>
              )}
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-red-500 text-lg mb-2">{error}</div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : note ? (
              <div className="max-w-4xl mx-auto">
                {/* Tags */}
                {note.tags && Array.isArray(note.tags) && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        <TagIcon className="h-3.5 w-3.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Content */}
                {isEditing ? (
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full min-h-[500px] p-4 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none resize-none font-sans text-base leading-relaxed"
                    placeholder="Start typing your note..."
                  />
                ) : (
                  <div className="prose prose-lg max-w-none">
                    <div className="whitespace-pre-wrap text-gray-900 text-base leading-relaxed p-4 bg-gray-50 rounded-xl border border-gray-200 min-h-[500px]">
                      {note.formatted_content || note.content || note.raw_transcript || 'No content'}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

