'use client'

import { useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { QuickRecord } from '@/components/dashboard/quick-record'
import { NoteCard } from '@/components/dashboard/note-card'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { AddTagDialog } from '@/components/dashboard/add-tag-dialog'
import { FileText, Mic, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { Profile } from '@/types/database'

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [notes, setNotes] = useState<any[]>([])
  const [isRecentNotesExpanded, setIsRecentNotesExpanded] = useState(false)
  const [showTagDialog, setShowTagDialog] = useState(false)
  const [selectedNoteForTag, setSelectedNoteForTag] = useState<{id: string, tags: string[]} | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('[FounderNote:Dashboard:Page] Loading profile data...')
        
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError) {
          console.error('[FounderNote:Dashboard:Page] Error getting user:', userError)
          return
        }

        if (!user) {
          console.warn('[FounderNote:Dashboard:Page] No user found')
          return
        }

        console.log('[FounderNote:Dashboard:Page] User found:', user.id)

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('[FounderNote:Dashboard:Page] Error loading profile:', profileError)
          console.error('[FounderNote:Dashboard:Page] Error details:', {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code
          })
          return
        }

        console.log('[FounderNote:Dashboard:Page] Profile loaded successfully:', {
          display_name: data?.display_name,
          email: data?.email,
          use_cases: data?.use_cases
        })
        setProfile(data)
      } catch (error) {
        console.error('[FounderNote:Dashboard:Page] Unexpected error:', error)
      }
    }

    loadProfile()
  }, [supabase])

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

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

        setNotes(data || [])
      } catch (error) {
        console.error('[FounderNote:Dashboard:Page] Unexpected error loading notes:', error)
      }
    }

    loadNotes()
  }, [supabase])

  const toggleStar = async (noteId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const note = notes.find(n => n.id === noteId)
      if (!note) return

      const { error } = await supabase
        .from('notes')
        .update({ is_starred: !note.is_starred })
        .eq('id', noteId)
        .eq('user_id', user.id)

      if (error) {
        console.error('[FounderNote:Dashboard:Page] Error toggling star:', error)
        return
      }

      setNotes(notes.map(note =>
        note.id === noteId ? { ...note, is_starred: !note.is_starred } : note
      ))

      // Dispatch event to update sidebar counts
      window.dispatchEvent(new CustomEvent('starToggled'))
    } catch (error) {
      console.error('[FounderNote:Dashboard:Page] Unexpected error toggling star:', error)
    }
  }

  const handleEditNote = (noteId: string) => {
    console.log('[FounderNote:Dashboard] Edit note:', noteId)
    // TODO: Implement edit note dialog
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
        console.error('[FounderNote:Dashboard:Page] Error deleting note:', error)
        return
      }

      console.log('[FounderNote:Dashboard] Note deleted successfully')
      setNotes(notes.filter(note => note.id !== noteId))
    } catch (error) {
      console.error('[FounderNote:Dashboard:Page] Unexpected error deleting note:', error)
    }
  }

  const handleAddTag = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    setSelectedNoteForTag({ id: noteId, tags: note?.tags || [] })
    setShowTagDialog(true)
  }

  // Helper function to get full date label (e.g., "January 8, 2026")
  const getDateLabel = (dateString: string) => {
    const noteDate = new Date(dateString)
    return noteDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Group notes by date
  const groupedNotes = notes.reduce((groups, note) => {
    const dateLabel = getDateLabel(note.created_at)
    if (!groups[dateLabel]) {
      groups[dateLabel] = []
    }
    groups[dateLabel].push(note)
    return groups
  }, {} as Record<string, typeof notes>)

  // Order of date groups
  const dateOrder = ['Today', 'Yesterday', 'Last Week', 'Last Month']
  const sortedDateLabels = Object.keys(groupedNotes).sort((a, b) => {
    const aIndex = dateOrder.indexOf(a)
    const bIndex = dateOrder.indexOf(b)
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return b.localeCompare(a) // For month names, sort reverse alphabetically
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Filter Bar */}
      <FilterBar
        avatarUrl={null}
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
                className="text-sm text-black hover:bg-black hover:text-white px-3 py-1 rounded-lg transition-colors"
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
              {notes.length > 0 ? (
                <div className="space-y-6">
                  {sortedDateLabels.map((dateLabel, groupIndex) => (
                    <div key={dateLabel}>
                      {/* Date Header */}
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 px-1">
                        {dateLabel}
                      </h3>

                      {/* Notes Grid for this date */}
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
                              onStar={() => toggleStar(note.id)}
                              onPlay={() => console.log('[FounderNote:Dashboard] Playing note:', note.id)}
                              onEdit={() => handleEditNote(note.id)}
                              onDelete={() => handleDeleteNote(note.id)}
                              onAddTag={() => handleAddTag(note.id)}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-violet-500/10 mb-4">
                    <Mic className="h-8 w-8 text-violet-600" />
                  </div>
                  <h3 className="text-black font-semibold mb-2">No notes yet</h3>
                  <p className="text-gray-600 text-sm max-w-sm mx-auto">
                    Start recording your first voice note to see it here.
                    Your thoughts, organized and ready to use.
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
                {/* Clear Date Header */}
                <h2 className="text-2xl font-bold text-black mb-6">
                  {dateLabel}
                </h2>

                {/* Notes Grid for this date */}
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
                        onStar={() => toggleStar(note.id)}
                        onPlay={() => console.log('[FounderNote:Dashboard] Playing note:', note.id)}
                        onEdit={() => handleEditNote(note.id)}
                        onDelete={() => handleDeleteNote(note.id)}
                        onAddTag={() => handleAddTag(note.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-violet-500/10 mb-4">
              <Mic className="h-8 w-8 text-violet-600" />
            </div>
            <h3 className="text-black font-semibold mb-2">No notes yet</h3>
            <p className="text-gray-600 text-sm max-w-sm mx-auto">
              Start recording your first voice note to see it here.
              Your thoughts, organized and ready to use.
            </p>
          </div>
        )}
      </div>

      {/* Use Cases Summary */}
      {profile?.use_cases && profile.use_cases.length > 0 && (
        <motion.div
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-medium text-black mb-3">Your Focus Areas</h3>
          <div className="flex flex-wrap gap-2">
            {profile.use_cases.map((useCase) => (
              <span
                key={useCase}
                className="px-3 py-1.5 bg-black text-white text-sm rounded-full hover:bg-gray-900 transition-colors cursor-pointer"
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
          onOpenChange={setShowTagDialog}
          noteId={selectedNoteForTag.id}
          existingTags={selectedNoteForTag.tags}
        />
      )}
    </motion.div>
  )
}
