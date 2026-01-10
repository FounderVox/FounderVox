'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { NoteCard } from '@/components/dashboard/note-card'
import { AddTagDialog } from '@/components/dashboard/add-tag-dialog'
import { EditNoteDialog } from '@/components/dashboard/edit-note-dialog'
import { SmartifyModal } from '@/components/dashboard/smartify-modal'
import { NoteDetailModal } from '@/components/dashboard/note-detail-modal'
import { Star, Mic } from 'lucide-react'

interface Note {
  id: string
  title: string
  preview: string
  createdAt: string
  duration: string
  template: string
  isStarred: boolean
  tags: string[]
  smartified_at?: string | null
  updated_at?: string
}

export default function StarredPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showTagDialog, setShowTagDialog] = useState(false)
  const [selectedNoteForTag, setSelectedNoteForTag] = useState<{id: string, tags: string[]} | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedNoteForEdit, setSelectedNoteForEdit] = useState<string | null>(null)
  const [showSmartifyModal, setShowSmartifyModal] = useState(false)
  const [selectedNoteForSmartify, setSelectedNoteForSmartify] = useState<{id: string, title: string} | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedNoteForDetail, setSelectedNoteForDetail] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadStarredNotes = async () => {
      console.log('[FounderNote:Starred] Loading starred notes...')
      setIsLoading(true)

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_starred', true)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) {
          console.error('[FounderNote:Starred] Error loading notes:', error)
          // Fallback to empty array if table doesn't exist yet
          setNotes([])
        } else {
          const formattedNotes: Note[] = (data || []).map((note) => ({
            id: note.id,
            title: note.title || 'Untitled Note',
            preview: note.content?.substring(0, 150) || note.formatted_content?.substring(0, 150) || 'No content',
            createdAt: formatDate(note.created_at),
            duration: formatDuration(note.duration_seconds || 0),
            template: note.template_label || note.template_type || 'Note',
            isStarred: true,
            tags: note.tags || [],
            smartified_at: note.smartified_at,
            updated_at: note.updated_at,
          }))
          setNotes(formattedNotes)
        }
      } catch (err) {
        console.error('[FounderNote:Starred] Error:', err)
        setNotes([])
      } finally {
        setIsLoading(false)
      }
    }

    loadStarredNotes()

    // Listen for star toggle events to reload starred notes
    const handleStarToggled = () => {
      console.log('[FounderNote:Starred] Star toggled event received, reloading starred notes...')
      loadStarredNotes()
    }
    window.addEventListener('starToggled', handleStarToggled)

    return () => {
      window.removeEventListener('starToggled', handleStarToggled)
    }
  }, [supabase])

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const toggleStar = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_starred: false })
        .eq('id', noteId)

      if (!error) {
        setNotes(notes.filter(n => n.id !== noteId))
        // Dispatch event to update sidebar counts
        window.dispatchEvent(new CustomEvent('starToggled'))
      }
    } catch (err) {
      console.error('[FounderNote:Starred] Error toggling star:', err)
    }
  }

  const handleEditNote = (noteId: string) => {
    console.log('[FounderNote:Starred] Edit note:', noteId)
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
    window.location.href = `/dashboard/notes/${noteId}`
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id)

      if (error) {
        console.error('[FounderNote:Starred] Error deleting note:', error)
        return
      }

      console.log('[FounderNote:Starred] Note deleted successfully')
      setNotes(notes.filter(note => note.id !== noteId))
    } catch (error) {
      console.error('[FounderNote:Starred] Unexpected error deleting note:', error)
    }
  }

  const handleAddTag = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    console.log('[FounderNote:Starred] Opening tag dialog for note:', {
      noteId,
      currentTags: note?.tags || []
    })
    setSelectedNoteForTag({ id: noteId, tags: note?.tags || [] })
    setShowTagDialog(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
            <Star className="h-5 w-5 text-violet-600 fill-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Starred Notes</h1>
            <p className="text-sm text-gray-500 mt-1">
              Your favorite notes, saved for quick access
            </p>
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      {notes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NoteCard
                title={note.title}
                preview={note.preview}
                createdAt={note.createdAt}
                duration={note.duration}
                template={note.template}
                isStarred={note.isStarred}
                tags={note.tags}
                onStar={() => toggleStar(note.id)}
                onPlay={() => console.log('[FounderNote:Starred] Playing note:', note.id)}
                onEdit={() => handleEditNote(note.id)}
                onDelete={() => handleDeleteNote(note.id)}
                onAddTag={() => handleAddTag(note.id)}
                onSmartify={() => handleSmartify(note.id)}
                onView={() => handleViewNote(note.id)}
                noteId={note.id}
                isSmartified={!!note.smartified_at}
                canSmartify={!note.smartified_at || !!(note.updated_at && new Date(note.updated_at) > new Date(note.smartified_at))}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/60 backdrop-blur-sm border-2 border-gray-200/50 mb-4">
            <Star className="h-8 w-8 text-black" />
          </div>
          <h3 className="text-gray-900 font-semibold mb-2">No starred notes</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Star notes you want to quickly access later. Click the star icon on any note to add it here.
          </p>
        </div>
      )}

      {/* Add Tag Dialog */}
      {selectedNoteForTag && (
        <AddTagDialog
          open={showTagDialog}
          onOpenChange={(open) => {
            setShowTagDialog(open)
            if (!open) {
              // Reload starred notes when dialog closes to show updated tags
              const reloadStarredNotes = async () => {
                try {
                  const { data: { user } } = await supabase.auth.getUser()
                  if (!user) return

                  const { data, error } = await supabase
                    .from('notes')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('is_starred', true)
                    .order('created_at', { ascending: false })
                    .limit(50)

                  if (!error && data) {
                    console.log('[FounderNote:Starred] Starred notes reloaded after tag update')
                    const formattedNotes: Note[] = data.map((note) => ({
                      id: note.id,
                      title: note.title || 'Untitled Note',
                      preview: note.content?.substring(0, 150) || note.formatted_content?.substring(0, 150) || 'No content',
                      createdAt: formatDate(note.created_at),
                      duration: formatDuration(note.duration_seconds || 0),
                      template: note.template_label || note.template_type || 'Note',
                      isStarred: true,
                      tags: note.tags || [],
                    }))
                    setNotes(formattedNotes)
                  }
                } catch (error) {
                  console.error('[FounderNote:Starred] Error reloading starred notes:', error)
                }
              }
              reloadStarredNotes()
            }
          }}
          noteId={selectedNoteForTag.id}
          existingTags={selectedNoteForTag.tags}
        />
      )}

      {/* Edit Note Dialog */}
      <EditNoteDialog
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open)
          if (!open) {
            setSelectedNoteForEdit(null)
          }
        }}
        noteId={selectedNoteForEdit}
      />

      {/* Smartify Modal */}
      {selectedNoteForSmartify && (
        <SmartifyModal
          open={showSmartifyModal}
          onOpenChange={(open) => {
            setShowSmartifyModal(open)
            if (!open) {
              setSelectedNoteForSmartify(null)
            }
          }}
          noteId={selectedNoteForSmartify.id}
          noteTitle={selectedNoteForSmartify.title}
        />
      )}

      {/* Note Detail Modal */}
      <NoteDetailModal
        open={showDetailModal}
        onOpenChange={(open) => {
          setShowDetailModal(open)
          if (!open) {
            setSelectedNoteForDetail(null)
          }
        }}
        noteId={selectedNoteForDetail}
      />
    </motion.div>
  )
}



