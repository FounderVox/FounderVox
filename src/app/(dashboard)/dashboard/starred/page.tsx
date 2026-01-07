'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { NoteCard } from '@/components/dashboard/note-card'
import { Star, Mic } from 'lucide-react'

interface Note {
  id: string
  title: string
  preview: string
  createdAt: string
  duration: string
  template: string
  isStarred: boolean
}

export default function StarredPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadStarredNotes = async () => {
      console.log('[FounderVox:Starred] Loading starred notes...')
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
          console.error('[FounderVox:Starred] Error loading notes:', error)
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
          }))
          setNotes(formattedNotes)
        }
      } catch (err) {
        console.error('[FounderVox:Starred] Error:', err)
        setNotes([])
      } finally {
        setIsLoading(false)
      }
    }

    loadStarredNotes()
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
      }
    } catch (err) {
      console.error('[FounderVox:Starred] Error toggling star:', err)
    }
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
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
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
                onStar={() => toggleStar(note.id)}
                onPlay={() => console.log('[FounderVox:Starred] Playing note:', note.id)}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-violet-500/10 mb-4">
            <Star className="h-8 w-8 text-violet-600" />
          </div>
          <h3 className="text-gray-900 font-semibold mb-2">No starred notes</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Star notes you want to quickly access later. Click the star icon on any note to add it here.
          </p>
        </div>
      )}
    </motion.div>
  )
}

