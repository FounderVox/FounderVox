'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { FileText, TrendingUp, AlertCircle, CheckCircle2, Send, Edit, Trash2, Copy, ArrowRight, Briefcase, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface InvestorUpdate {
  id: string
  draft_subject: string | null
  draft_body: string | null
  wins: string[] | null
  metrics: Record<string, any> | null
  challenges: string[] | null
  asks: string[] | null
  status: 'draft' | 'sent'
  sent_at: string | null
  created_at: string
}

export default function InvestorUpdatePage() {
  const [profile, setProfile] = useState<any>(null)
  const [updates, setUpdates] = useState<InvestorUpdate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUpdate, setSelectedUpdate] = useState<InvestorUpdate | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error('[InvestorUpdate] Error getting user:', userError)
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

        // Load investor updates via recordings
        const { data: recordings } = await supabase
          .from('recordings')
          .select('id')
          .eq('user_id', user.id)

        if (recordings && recordings.length > 0) {
          const recordingIds = recordings.map(r => r.id)
          const { data: updateData, error: updateError } = await supabase
            .from('investor_updates')
            .select('*')
            .in('recording_id', recordingIds)
            .order('created_at', { ascending: false })

          if (updateError) {
            console.error('[InvestorUpdate] Error loading updates:', updateError)
          } else {
            // Filter out empty updates (no subject, no body, no wins, no metrics, no challenges, no asks)
            const filteredUpdates = (updateData || []).filter(update => {
              const hasContent = 
                (update.draft_subject && update.draft_subject.trim()) ||
                (update.draft_body && update.draft_body.trim()) ||
                (update.wins && Array.isArray(update.wins) && update.wins.length > 0) ||
                (update.metrics && typeof update.metrics === 'object' && Object.keys(update.metrics).length > 0) ||
                (update.challenges && Array.isArray(update.challenges) && update.challenges.length > 0) ||
                (update.asks && Array.isArray(update.asks) && update.asks.length > 0)
              return hasContent
            })
            setUpdates(filteredUpdates)
          }
        }

        setIsLoading(false)
      } catch (error) {
        console.error('[InvestorUpdate] Unexpected error:', error)
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const markAsSent = async (updateId: string) => {
    try {
      const { error } = await supabase
        .from('investor_updates')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', updateId)

      if (error) {
        console.error('[InvestorUpdate] Error marking as sent:', error)
        return
      }

      setUpdates(items =>
        items.map(item =>
          item.id === updateId
            ? { ...item, status: 'sent', sent_at: new Date().toISOString() }
            : item
        )
      )
    } catch (error) {
      console.error('[InvestorUpdate] Unexpected error:', error)
    }
  }

  const deleteUpdate = async (updateId: string) => {
    if (!confirm('Are you sure you want to delete this investor update?')) return

    try {
      const { error } = await supabase
        .from('investor_updates')
        .delete()
        .eq('id', updateId)

      if (error) {
        console.error('[InvestorUpdate] Error deleting update:', error)
        return
      }

      setUpdates(items => items.filter(item => item.id !== updateId))
      if (selectedUpdate?.id === updateId) {
        setSelectedUpdate(null)
      }
    } catch (error) {
      console.error('[InvestorUpdate] Unexpected error:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const groupedByDate = updates.reduce((groups, update) => {
    const date = new Date(update.created_at)
    const dateKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(update)
    return groups
  }, {} as Record<string, InvestorUpdate[]>)

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
            <Briefcase className="h-6 w-6 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">Investor Updates</h1>
            <p className="text-gray-600 text-sm mt-1">
              {updates.length} total • {updates.filter(u => u.status === 'draft').length} drafts • {updates.filter(u => u.status === 'sent').length} sent
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Updates List */}
        <div>
          {Object.keys(groupedByDate).length > 0 ? (
            <div className="space-y-8">
              {Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map((dateKey) => (
                <div key={dateKey}>
                  <h2 className="text-2xl font-semibold text-black mb-4">{dateKey}</h2>
                  <div className="space-y-3">
                    {groupedByDate[dateKey].map((update, index) => (
                      <motion.div
                        key={update.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedUpdate(update)}
                        className={cn(
                          'bg-white/60 backdrop-blur-sm border rounded-xl p-5 hover:bg-white/90 hover:border-gray-300 hover:shadow-lg transition-all duration-200 cursor-pointer group',
                          selectedUpdate?.id === update.id && 'bg-gray-50 border-gray-300 shadow-md ring-2 ring-gray-200'
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className={cn(
                              "text-lg font-semibold mb-2",
                              selectedUpdate?.id === update.id ? "text-gray-900" : "text-black"
                            )}>
                              {update.draft_subject || 'Untitled Update'}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                update.status === 'sent'
                                  ? selectedUpdate?.id === update.id 
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-green-100 text-green-700'
                                  : selectedUpdate?.id === update.id
                                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                    : 'bg-yellow-100 text-yellow-700'
                              )}>
                                {update.status.toUpperCase()}
                              </span>
                              {update.sent_at && (
                                <span className={cn(
                                  "text-xs",
                                  selectedUpdate?.id === update.id ? "text-gray-600" : "text-gray-500"
                                )}>
                                  Sent {formatDate(update.sent_at)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {update.draft_body && (
                          <p className={cn(
                            "text-sm line-clamp-2",
                            selectedUpdate?.id === update.id ? "text-gray-700" : "text-gray-600"
                          )}>
                            {update.draft_body.substring(0, 150)}...
                          </p>
                        )}

                        <div className={cn(
                          "flex items-center gap-4 mt-3 text-xs",
                          selectedUpdate?.id === update.id ? "text-gray-600" : "text-gray-500"
                        )}>
                          {update.wins && update.wins.length > 0 && (
                            <span>{update.wins.length} wins</span>
                          )}
                          {update.metrics && Object.keys(update.metrics).length > 0 && (
                            <span>{Object.keys(update.metrics).length} metrics</span>
                          )}
                          {update.challenges && update.challenges.length > 0 && (
                            <span>{update.challenges.length} challenges</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50"
            >
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/60 backdrop-blur-sm border-2 border-gray-200/50 mb-4">
                <Briefcase className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-black font-semibold mb-2">No investor updates yet</h3>
              <p className="text-gray-600 text-sm max-w-sm mx-auto mb-4">
                Use Smartify on a note to generate investor update drafts automatically.
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
        </div>

        {/* Update Detail */}
        {selectedUpdate && (
          <div className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">Update Details</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(selectedUpdate.draft_body || '')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Copy email body"
                >
                  <Copy className="h-4 w-4" />
                </button>
                {selectedUpdate.status === 'draft' && (
                  <button
                    onClick={() => markAsSent(selectedUpdate.id)}
                    className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                    title="Mark as sent"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteUpdate(selectedUpdate.id)}
                  className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Subject */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Subject</label>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-black">
                  {selectedUpdate.draft_subject || 'No subject'}
                </div>
              </div>

              {/* Email Body */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Email Body</label>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-black whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {selectedUpdate.draft_body || 'No content'}
                </div>
              </div>

              {/* Wins */}
              {selectedUpdate.wins && selectedUpdate.wins.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Wins
                  </label>
                  <ul className="space-y-2">
                    {selectedUpdate.wins.map((win, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{win}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Metrics */}
              {selectedUpdate.metrics && Object.keys(selectedUpdate.metrics).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Metrics
                  </label>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    {Object.entries(selectedUpdate.metrics).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                        <span className="font-medium text-gray-700">{key}:</span>
                        <span className="text-gray-600">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Challenges */}
              {selectedUpdate.challenges && selectedUpdate.challenges.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Challenges
                  </label>
                  <ul className="space-y-2">
                    {selectedUpdate.challenges.map((challenge, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{challenge}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Asks */}
              {selectedUpdate.asks && selectedUpdate.asks.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Asks
                  </label>
                  <ul className="space-y-2">
                    {selectedUpdate.asks.map((ask, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{ask}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

