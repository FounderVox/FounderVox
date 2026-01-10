'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { BarChart3, CheckCircle2, Clock, AlertTriangle, Calendar, X, ArrowRight } from 'lucide-react'
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

type StatusColumn = 'completed' | 'in_progress' | 'blocked'

export default function ProgressLogPage() {
  const [profile, setProfile] = useState<any>(null)
  const [logs, setLogs] = useState<ProgressLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draggedItem, setDraggedItem] = useState<{ logId: string; status: StatusColumn; index: number; text: string } | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<{ logId: string; status: StatusColumn } | null>(null)
  const supabase = createClient()

  useEffect(() => {
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

  const handleDragStart = (e: React.DragEvent, logId: string, status: StatusColumn, index: number, text: string) => {
    setDraggedItem({ logId, status, index, text })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '') // Required for Firefox
  }

  const handleDragOver = (e: React.DragEvent, logId: string, status: StatusColumn) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn({ logId, status })
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, logId: string, targetStatus: StatusColumn) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedItem || draggedItem.logId !== logId || draggedItem.status === targetStatus) {
      setDraggedItem(null)
      return
    }

    const log = logs.find(l => l.id === logId)
    if (!log) {
      setDraggedItem(null)
      return
    }

    // Get current arrays
    const sourceArray = [...(log[draggedItem.status] || [])]
    const targetArray = [...(log[targetStatus] || [])]

    // Remove from source
    sourceArray.splice(draggedItem.index, 1)

    // Add to target
    targetArray.push(draggedItem.text)

    // Update state optimistically
    setLogs(prevLogs =>
      prevLogs.map(l => {
        if (l.id === logId) {
          return {
            ...l,
            [draggedItem.status]: sourceArray.length > 0 ? sourceArray : null,
            [targetStatus]: targetArray
          }
        }
        return l
      })
    )

    // Update database
    try {
      const updateData: any = {
        [draggedItem.status]: sourceArray.length > 0 ? sourceArray : null,
        [targetStatus]: targetArray
      }

      const { error } = await supabase
        .from('progress_logs')
        .update(updateData)
        .eq('id', logId)

      if (error) {
        console.error('[ProgressLog] Error updating log:', error)
        // Revert optimistic update on error
        loadData()
      }
    } catch (error) {
      console.error('[ProgressLog] Unexpected error updating log:', error)
      // Revert optimistic update on error
      loadData()
    }

    setDraggedItem(null)
  }

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
          <div className="p-3 rounded-xl bg-gray-100">
            <BarChart3 className="h-6 w-6 text-black" />
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
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Calendar className="h-5 w-5 text-black" />
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
                <div
                  className={cn(
                    "flex-1 min-h-[200px] rounded-lg transition-all duration-200",
                    dragOverColumn?.logId === log.id && dragOverColumn?.status === 'completed' && "bg-green-50/50 border-2 border-green-300 border-dashed"
                  )}
                  onDragOver={(e) => handleDragOver(e, log.id, 'completed')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, log.id, 'completed')}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold">
                      Completed ({log.completed?.length || 0})
                    </h3>
                  </div>
                  {log.completed && log.completed.length > 0 ? (
                    <ul className="space-y-2">
                      {log.completed.map((item, idx) => (
                        <li
                          key={idx}
                          draggable
                          onDragStart={(e) => handleDragStart(e, log.id, 'completed', idx, item)}
                          className={cn(
                            "flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3 cursor-move transition-all duration-200",
                            draggedItem?.logId === log.id && draggedItem?.status === 'completed' && draggedItem?.index === idx
                              ? "opacity-50 scale-95"
                              : "hover:bg-green-100 hover:border-green-300 hover:shadow-sm"
                          )}
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-400 italic py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                      Drop items here
                    </div>
                  )}
                </div>

                {/* In Progress */}
                <div
                  className={cn(
                    "flex-1 min-h-[200px] rounded-lg transition-all duration-200",
                    dragOverColumn?.logId === log.id && dragOverColumn?.status === 'in_progress' && "bg-blue-50/50 border-2 border-blue-300 border-dashed"
                  )}
                  onDragOver={(e) => handleDragOver(e, log.id, 'in_progress')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, log.id, 'in_progress')}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">
                      In Progress ({log.in_progress?.length || 0})
                    </h3>
                  </div>
                  {log.in_progress && log.in_progress.length > 0 ? (
                    <ul className="space-y-2">
                      {log.in_progress.map((item, idx) => (
                        <li
                          key={idx}
                          draggable
                          onDragStart={(e) => handleDragStart(e, log.id, 'in_progress', idx, item)}
                          className={cn(
                            "flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-move transition-all duration-200",
                            draggedItem?.logId === log.id && draggedItem?.status === 'in_progress' && draggedItem?.index === idx
                              ? "opacity-50 scale-95"
                              : "hover:bg-blue-100 hover:border-blue-300 hover:shadow-sm"
                          )}
                        >
                          <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-400 italic py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                      Drop items here
                    </div>
                  )}
                </div>

                {/* Blocked */}
                <div
                  className={cn(
                    "flex-1 min-h-[200px] rounded-lg transition-all duration-200",
                    dragOverColumn?.logId === log.id && dragOverColumn?.status === 'blocked' && "bg-yellow-50/50 border-2 border-yellow-300 border-dashed"
                  )}
                  onDragOver={(e) => handleDragOver(e, log.id, 'blocked')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, log.id, 'blocked')}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-semibold">
                      Blocked ({log.blocked?.length || 0})
                    </h3>
                  </div>
                  {log.blocked && log.blocked.length > 0 ? (
                    <ul className="space-y-2">
                      {log.blocked.map((item, idx) => (
                        <li
                          key={idx}
                          draggable
                          onDragStart={(e) => handleDragStart(e, log.id, 'blocked', idx, item)}
                          className={cn(
                            "flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 cursor-move transition-all duration-200",
                            draggedItem?.logId === log.id && draggedItem?.status === 'blocked' && draggedItem?.index === idx
                              ? "opacity-50 scale-95"
                              : "hover:bg-yellow-100 hover:border-yellow-300 hover:shadow-sm"
                          )}
                        >
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-400 italic py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                      Drop items here
                    </div>
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
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/60 backdrop-blur-sm border-2 border-gray-200/50 mb-4">
            <BarChart3 className="h-8 w-8 text-black" />
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

