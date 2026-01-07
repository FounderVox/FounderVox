'use client'

import { useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { QuickRecord } from '@/components/dashboard/quick-record'
import { NoteCard } from '@/components/dashboard/note-card'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { FileText, Mic } from 'lucide-react'
import type { Profile } from '@/types/database'

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [notes, setNotes] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('[FounderVox:Dashboard:Page] Loading profile data...')
        
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError) {
          console.error('[FounderVox:Dashboard:Page] Error getting user:', userError)
          return
        }

        if (!user) {
          console.warn('[FounderVox:Dashboard:Page] No user found')
          return
        }

        console.log('[FounderVox:Dashboard:Page] User found:', user.id)

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('[FounderVox:Dashboard:Page] Error loading profile:', profileError)
          console.error('[FounderVox:Dashboard:Page] Error details:', {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code
          })
          return
        }

        console.log('[FounderVox:Dashboard:Page] Profile loaded successfully:', {
          display_name: data?.display_name,
          email: data?.email,
          use_cases: data?.use_cases
        })
        setProfile(data)
      } catch (error) {
        console.error('[FounderVox:Dashboard:Page] Unexpected error:', error)
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
          console.error('[FounderVox:Dashboard:Page] Error loading notes:', error)
          return
        }

        setNotes(data || [])
      } catch (error) {
        console.error('[FounderVox:Dashboard:Page] Unexpected error loading notes:', error)
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
        console.error('[FounderVox:Dashboard:Page] Error toggling star:', error)
        return
      }

      setNotes(notes.map(note =>
        note.id === noteId ? { ...note, is_starred: !note.is_starred } : note
      ))
    } catch (error) {
      console.error('[FounderVox:Dashboard:Page] Unexpected error toggling star:', error)
    }
  }

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

      {/* Recent Notes Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-black flex items-center gap-2">
            <FileText className="h-5 w-5 text-black" />
            Recent Notes
          </h2>
          <button className="text-sm text-black hover:bg-black hover:text-white px-3 py-1 rounded-lg transition-colors">
            View all
          </button>
        </div>

        {notes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <NoteCard
                  title={note.title || 'Untitled Note'}
                  preview={note.formatted_content?.substring(0, 150) || note.raw_transcript?.substring(0, 150) || 'No content'}
                  createdAt={new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + new Date(note.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  duration={note.duration || '0:00'}
                  template={note.template_label || note.template_type || 'Note'}
                  isStarred={note.is_starred || false}
                  onStar={() => toggleStar(note.id)}
                  onPlay={() => console.log('[FounderVox:Dashboard] Playing note:', note.id)}
                />
              </motion.div>
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
    </motion.div>
  )
}
