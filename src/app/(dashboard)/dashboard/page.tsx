'use client'

import { useEffect, useState, useCallback } from 'react'

export const dynamic = 'force-dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { QuickRecord } from '@/components/dashboard/quick-record'
import { NoteCard } from '@/components/dashboard/note-card'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { AddTagDialog } from '@/components/dashboard/add-tag-dialog'
import { EditNoteDialog } from '@/components/dashboard/edit-note-dialog'
import { SmartifyModal } from '@/components/dashboard/smartify-modal'
import { NoteDetailModal } from '@/components/dashboard/note-detail-modal'
import { DeleteNoteDialog } from '@/components/dashboard/delete-note-dialog'
import { FileText, Mic, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'

export default function DashboardPage() {
  const { user, profile, supabase } = useAuth()
  const [notes, setNotes] = useState<any[]>([])
  const [filteredNotes, setFilteredNotes] = useState<any[]>([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [isRecentNotesExpanded, setIsRecentNotesExpanded] = useState(false)
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

  const loadNotes = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) {
        console.error('[FounderNote:Dashboard:Page] Error loading notes:', error)
        return
      }

      const notesData = data || []
      setNotes(notesData)
      applyFilter(notesData, activeFilter)
    } catch (error) {
      console.error('[FounderNote:Dashboard:Page] Unexpected error loading notes:', error)
    }
  }, [user, supabase, activeFilter])

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

  // Listen for filter changes
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

  // Apply filter when notes or activeFilter changes
  useEffect(() => {
    if (notes.length > 0) {
      applyFilter(notes, activeFilter)
    }
  }, [notes, activeFilter, applyFilter])

  useEffect(() => {
    loadNotes()

    // Listen for note events to refresh
    const handleNoteEvent = (event?: CustomEvent) => {
      console.log('[FounderNote:Dashboard] Note event received:', event?.detail)
      loadNotes()
    }
    const handleTagsUpdated = () => loadNotes()

    window.addEventListener('noteCreated', handleNoteEvent as EventListener)
    window.addEventListener('noteUpdated', handleNoteEvent as EventListener)
    window.addEventListener('noteDeleted', handleNoteEvent as EventListener)
    window.addEventListener('tagsUpdated', handleTagsUpdated)

    return () => {
      window.removeEventListener('noteCreated', handleNoteEvent as EventListener)
      window.removeEventListener('noteUpdated', handleNoteEvent as EventListener)
      window.removeEventListener('noteDeleted', handleNoteEvent as EventListener)
      window.removeEventListener('tagsUpdated', handleTagsUpdated)
    }
  }, [loadNotes])

  const toggleStar = async (noteId: string) => {
    if (!user) return

    const note = notes.find(n => n.id === noteId)
    if (!note) return

    const newStarredState = !note.is_starred

    // Optimistic update
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
        console.error('[FounderNote:Dashboard:Page] Error toggling star:', error)
        // Revert on error
        setNotes(notes)
        return
      }

      window.dispatchEvent(new CustomEvent('starToggled', {
        detail: { noteId, isStarred: newStarredState }
      }))
    } catch (error) {
      console.error('[FounderNote:Dashboard:Page] Unexpected error toggling star:', error)
      setNotes(notes)
    }
  }

  const handleDeleteNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    setSelectedNoteForDelete({ id: noteId, title: note?.title || 'Untitled Note' })
    setShowDeleteDialog(true)
  }

  const confirmDeleteNote = async () => {
    if (!user || !selectedNoteForDelete) return

    const noteId = selectedNoteForDelete.id
    const originalNotes = notes

    // Optimistic update
    setNotes(notes.filter(note => note.id !== noteId))

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id)

      if (error) {
        console.error('[FounderNote:Dashboard:Page] Error deleting note:', error)
        setNotes(originalNotes)
        return
      }

      window.dispatchEvent(new CustomEvent('noteDeleted', { detail: { noteId } }))
    } catch (error) {
      console.error('[FounderNote:Dashboard:Page] Unexpected error deleting note:', error)
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
    window.location.href = `/dashboard/notes/${noteId}`
  }

  // Helper function to get full date label
  const getDateLabel = (dateString: string) => {
    const noteDate = new Date(dateString)
    return noteDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Group notes by date (use filtered notes when filter is active)
  const displayNotes = activeFilter === 'all' ? notes : filteredNotes
  const groupedNotes = displayNotes.reduce((groups, note) => {
    const dateLabel = getDateLabel(note.created_at)
    if (!groups[dateLabel]) {
      groups[dateLabel] = []
    }
    groups[dateLabel].push(note)
    return groups
  }, {} as Record<string, Array<typeof notes[number]>>)

  const dateOrder = ['Today', 'Yesterday', 'Last Week', 'Last Month']
  const sortedDateLabels = Object.keys(groupedNotes).sort((a, b) => {
    const aIndex = dateOrder.indexOf(a)
    const bIndex = dateOrder.indexOf(b)
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return b.localeCompare(a)
  })

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

      {/* Recent Notes Section - Collapsible */}
      <div className="mb-8">
        <button
          onClick={() => setIsRecentNotesExpanded(!isRecentNotesExpanded)}
          className="flex items-center justify-between w-full hover:bg-white/80 hover:shadow-md transition-all rounded-xl p-4 -mx-4 mb-4"
        >
          <h2 className="text-lg font-semibold text-black flex items-center gap-2">
            <FileText className="h-5 w-5 text-black" />
            Recent Notes
          </h2>
          <div className="flex items-center gap-3">
            {isRecentNotesExpanded && (
              <Link
                href="/dashboard/notes"
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-black hover:bg-gray-100/80 hover:shadow-sm px-3 py-1 rounded-lg transition-all duration-200"
              >
                View all
              </Link>
            )}
            <ChevronDown
              className={cn(
                'h-5 w-5 text-black transition-transform duration-300',
                isRecentNotesExpanded && 'rotate-180'
              )}
            />
          </div>
        </button>

        <AnimatePresence>
          {isRecentNotesExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              {displayNotes.length > 0 ? (
                <div className="space-y-6">
                  {sortedDateLabels.map((dateLabel, groupIndex) => (
                    <div key={dateLabel}>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 px-1">
                        {dateLabel}
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {groupedNotes[dateLabel]?.map((note: any, index: number) => (
                          <motion.div
                            key={note.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
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
                              onPlay={() => console.log('[FounderNote:Dashboard] Playing note:', note.id)}
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white shadow-sm rounded-2xl p-12 text-center border border-gray-200">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-brand-light border-2 border-brand/20 mb-4">
                    <Mic className="h-8 w-8 text-brand" />
                  </div>
                  <h3 className="text-gray-900 font-semibold mb-2">No notes yet</h3>
                  <p className="text-gray-600 text-sm max-w-sm mx-auto">
                    Start recording your first voice note to see it here.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* All Notes Section with Date Headers */}
      <div className="mb-8">
        {notes.length > 0 ? (
          <div className="space-y-8">
            {sortedDateLabels.map((dateLabel, groupIndex) => (
              <div key={dateLabel}>
                <h2 className="text-2xl font-bold text-black mb-6">
                  {dateLabel}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedNotes[dateLabel].map((note: any, index: number) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
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
                        onPlay={() => console.log('[FounderNote:Dashboard] Playing note:', note.id)}
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
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-2xl p-12 text-center border border-gray-200">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-brand-light border-2 border-brand/20 mb-4">
              <Mic className="h-8 w-8 text-brand" />
            </div>
            <h3 className="text-gray-900 font-semibold mb-2">No notes yet</h3>
            <p className="text-gray-600 text-sm max-w-sm mx-auto">
              Start recording your first voice note to see it here.
            </p>
          </div>
        )}
      </div>

      {/* Use Cases Summary */}
      {profile?.use_cases && profile.use_cases.length > 0 && (
        <motion.div
          className="bg-white shadow-sm rounded-2xl p-6 border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-medium text-gray-900 mb-3">Your Focus Areas</h3>
          <div className="flex flex-wrap gap-2">
            {profile.use_cases.map((useCase: string) => (
              <span
                key={useCase}
                className="px-3 py-1.5 bg-brand text-white text-sm rounded-full hover:opacity-90 transition-colors cursor-pointer"
              >
                {useCase}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Add Tag Dialog */}
      {selectedNoteForTag && (
        <AddTagDialog
          open={showTagDialog}
          onOpenChange={async (open) => {
            setShowTagDialog(open)
            if (!open) {
              // Reload notes to get updated tags
              await loadNotes()
              // Also reload the specific note to update existingTags
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

      {/* Delete Note Dialog */}
      <DeleteNoteDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open)
          if (!open) {
            setSelectedNoteForDelete(null)
          }
        }}
        onConfirm={confirmDeleteNote}
        noteTitle={selectedNoteForDelete?.title}
      />
    </motion.div>
  )
}
