'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { Mic } from 'lucide-react'
import { NoteCard } from '@/components/dashboard/note-card'

export const dynamic = 'force-dynamic'

interface Note {
  id: string
  title: string
  formatted_content: string | null
  raw_transcript: string | null
  created_at: string
  duration: string | null
  template_label: string | null
  template_type: string | null
  is_starred: boolean
}

interface GroupedNotes {
  [key: string]: Note[]
}

export default function AllNotesPage() {
  const [profile, setProfile] = useState<any>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [groupedNotes, setGroupedNotes] = useState<GroupedNotes>({})
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error('[FounderVox:AllNotes] Error getting user:', userError)
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

        // Load all notes
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (notesError) {
          console.error('[FounderVox:AllNotes] Error loading notes:', notesError)
          setIsLoading(false)
          return
        }

        setNotes(notesData || [])
        
        // Group notes by date
        const grouped: GroupedNotes = {}
        ;(notesData || []).forEach((note) => {
          const date = new Date(note.created_at)
          const today = new Date()
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)

          let dateKey: string
          if (date.toDateString() === today.toDateString()) {
            dateKey = 'Today'
          } else if (date.toDateString() === yesterday.toDateString()) {
            dateKey = 'Yesterday'
          } else {
            dateKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
          }

          if (!grouped[dateKey]) {
            grouped[dateKey] = []
          }
          grouped[dateKey].push(note)
        })

        setGroupedNotes(grouped)
        setIsLoading(false)
      } catch (error) {
        console.error('[FounderVox:AllNotes] Unexpected error:', error)
        setIsLoading(false)
      }
    }

    loadData()
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
        console.error('[FounderVox:AllNotes] Error toggling star:', error)
        return
      }

      // Update local state
      const updatedNotes = notes.map(note =>
        note.id === noteId ? { ...note, is_starred: !note.is_starred } : note
      )
      setNotes(updatedNotes)

      // Update grouped notes
      const updatedGrouped: GroupedNotes = {}
      Object.keys(groupedNotes).forEach(dateKey => {
        updatedGrouped[dateKey] = groupedNotes[dateKey].map(note =>
          note.id === noteId ? { ...note, is_starred: !note.is_starred } : note
        )
      })
      setGroupedNotes(updatedGrouped)
    } catch (error) {
      console.error('[FounderVox:AllNotes] Unexpected error toggling star:', error)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

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

      {/* Notes List */}
      {Object.keys(groupedNotes).length > 0 ? (
        <div className="space-y-8">
          {Object.keys(groupedNotes).map((dateKey) => (
            <div key={dateKey}>
              {/* Date Header */}
              <h2 className="text-2xl font-semibold text-black mb-4">
                {dateKey === 'Today' 
                  ? `Today, ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                  : dateKey === 'Yesterday'
                  ? `Yesterday, ${new Date(Date.now() - 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                  : (() => {
                      const date = new Date(groupedNotes[dateKey][0].created_at)
                      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                    })()}
              </h2>

              {/* Notes for this date */}
              <div className="space-y-3">
                {groupedNotes[dateKey].map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 hover:bg-black hover:text-white hover:border-black transition-all cursor-pointer group">
                      {/* Header with time and title */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm text-gray-500 group-hover:text-white/70">
                              {formatTime(note.created_at)}
                            </span>
                            {note.template_label && (
                              <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full group-hover:bg-white group-hover:text-black">
                                {note.template_label}
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-black group-hover:text-white">
                            {note.title || 'Untitled Note'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleStar(note.id)
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              note.is_starred
                                ? 'text-amber-500 hover:bg-white/20'
                                : 'text-white hover:bg-white/20'
                            }`}
                          >
                            <svg
                              className={`h-4 w-4 ${note.is_starred ? 'fill-current' : ''}`}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <p className="text-sm text-gray-600 line-clamp-2 group-hover:text-white/90">
                        {note.formatted_content?.substring(0, 200) || note.raw_transcript?.substring(0, 200) || 'No content'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-black/10 mb-4">
            <Mic className="h-8 w-8 text-black" />
          </div>
          <h3 className="text-black font-semibold mb-2">No notes yet</h3>
          <p className="text-gray-600 text-sm max-w-sm mx-auto">
            Start recording your first voice note to see it here.
            Your thoughts, organized and ready to use.
          </p>
        </div>
      )}
    </motion.div>
  )
}

