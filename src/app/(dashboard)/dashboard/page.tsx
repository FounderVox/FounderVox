'use client'

import { useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { QuickRecord } from '@/components/dashboard/quick-record'
import { NoteCard } from '@/components/dashboard/note-card'
import { FileText, Mic } from 'lucide-react'
import type { Profile } from '@/types/database'

// Mock data for demo purposes
const mockNotes = [
  {
    id: '1',
    title: 'Product roadmap discussion',
    preview: 'Key points from the team sync: Focus on mobile experience, prioritize user onboarding flow, and schedule user interviews for next sprint...',
    createdAt: '2 hours ago',
    duration: '3:24',
    template: 'Meeting Notes',
    isStarred: true,
  },
  {
    id: '2',
    title: 'Investor update draft',
    preview: 'Q4 highlights: 2x user growth, launched premium tier, closed seed extension. Key metrics: 10k MAU, 85% retention...',
    createdAt: 'Yesterday',
    duration: '5:12',
    template: 'Investor Update',
    isStarred: false,
  },
  {
    id: '3',
    title: 'Feature idea: Voice commands',
    preview: 'What if users could navigate the app entirely with voice? "Record a note", "Play my last recording", "Send to email"...',
    createdAt: '3 days ago',
    duration: '1:45',
    template: 'Product Ideas',
    isStarred: true,
  },
]

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [notes, setNotes] = useState(mockNotes)
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      console.log('[FounderVox:Dashboard] Loading profile data...')
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setProfile(data)
        console.log('[FounderVox:Dashboard] Profile loaded successfully')
      }
    }

    loadProfile()
  }, [supabase])

  const toggleStar = (noteId: string) => {
    setNotes(notes.map(note =>
      note.id === noteId ? { ...note, isStarred: !note.isStarred } : note
    ))
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Quick Record Bar */}
      <QuickRecord />

      {/* Recent Notes Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-violet-400" />
            Recent Notes
          </h2>
          <button className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
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
                  title={note.title}
                  preview={note.preview}
                  createdAt={note.createdAt}
                  duration={note.duration}
                  template={note.template}
                  isStarred={note.isStarred}
                  onStar={() => toggleStar(note.id)}
                  onPlay={() => console.log('[FounderVox:Dashboard] Playing note:', note.id)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800/30 rounded-2xl p-12 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-violet-500/20 mb-4">
              <Mic className="h-8 w-8 text-violet-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">No notes yet</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Start recording your first voice note to see it here.
              Your thoughts, organized and ready to use.
            </p>
          </div>
        )}
      </div>

      {/* Use Cases Summary */}
      {profile?.use_cases && profile.use_cases.length > 0 && (
        <motion.div
          className="bg-gray-800/30 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-medium text-gray-400 mb-3">Your Focus Areas</h3>
          <div className="flex flex-wrap gap-2">
            {profile.use_cases.map((useCase) => (
              <span
                key={useCase}
                className="px-3 py-1.5 bg-violet-500/20 text-violet-300 text-sm rounded-full"
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
