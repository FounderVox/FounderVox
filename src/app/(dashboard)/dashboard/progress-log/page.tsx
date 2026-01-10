'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { TrendingUp, CheckCircle2, Clock, AlertTriangle, Calendar, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface ProgressLog {
  id: string
  week_of: string
  completed: string[] | null
  in_progress: string[] | null
  blocked: string[] | null
  created_at: string
}

export default function ProgressLogPage() {
  const [profile, setProfile] = useState<any>(null)
  const [logs, setLogs] = useState<ProgressLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error('[ProgressLog] Error getting user:', userError)
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

        // Load progress logs via recordings
        const { data: recordings } = await supabase
          .from('recordings')
          .select('id')
          .eq('user_id', user.id)

        if (recordings && recordings.length > 0) {
          const recordingIds = recordings.map(r => r.id)
          const { data: logData, error: logError } = await supabase
            .from('progress_logs')
            .select('*')
            .in('recording_id', recordingIds)
            .order('week_of', { ascending: false })

          if (logError) {
            console.error('[ProgressLog] Error loading logs:', logError)
          } else {
            setLogs(logData || [])
          }
        }

        setIsLoading(false)
      } catch (error) {
        console.error('[ProgressLog] Unexpected error:', error)
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const deleteLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this progress log?')) return

    try {
      const { error } = await supabase
        .from('progress_logs')
        .delete()
        .eq('id', logId)

      if (error) {
        console.error('[ProgressLog] Error deleting log:', error)
        return
      }

      setLogs(items => items.filter(item => item.id !== logId))
    } catch (error) {
      console.error('[ProgressLog] Unexpected error:', error)
    }
  }

  const formatWeek = (weekOf: string) => {
    const date = new Date(weekOf)
    const endDate = new Date(date)
    endDate.setDate(date.getDate() + 6)
    
    const startStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    
    return `${startStr} - ${endStr}`
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

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-green-100">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">Progress Logs</h1>
            <p className="text-gray-600 text-sm mt-1">
              {logs.length} weeks tracked
            </p>
          </div>
        </div>
      </div>

      {/* Progress Logs */}
      {logs.length > 0 ? (
        <div className="space-y-6">
          {logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 hover:bg-white/90 hover:border-gray-300 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Week of {formatWeek(log.week_of)}</h2>
                    <p className="text-sm text-gray-500">
                      Created {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteLog(log.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-red-600 hover:bg-red-50 hover:shadow-sm transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Completed */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold">
                      Completed ({log.completed?.length || 0})
                    </h3>
                  </div>
                  {log.completed && log.completed.length > 0 ? (
                    <ul className="space-y-2">
                      {log.completed.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No completed items</p>
                  )}
                </div>

                {/* In Progress */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">
                      In Progress ({log.in_progress?.length || 0})
                    </h3>
                  </div>
                  {log.in_progress && log.in_progress.length > 0 ? (
                    <ul className="space-y-2">
                      {log.in_progress.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No items in progress</p>
                  )}
                </div>

                {/* Blocked */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-semibold">
                      Blocked ({log.blocked?.length || 0})
                    </h3>
                  </div>
                  {log.blocked && log.blocked.length > 0 ? (
                    <ul className="space-y-2">
                      {log.blocked.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No blocked items</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50"
        >
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-green-100 mb-4">
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-black font-semibold mb-2">No progress logs yet</h3>
          <p className="text-gray-600 text-sm max-w-sm mx-auto mb-4">
            Use Smartify on a note to extract progress updates automatically.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors text-sm"
          >
            Go to Notes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      )}
    </motion.div>
  )
}

