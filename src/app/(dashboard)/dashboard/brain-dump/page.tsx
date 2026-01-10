'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { Zap, Users, MessageSquare, HelpCircle, AlertCircle, Heart, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface BrainDumpItem {
  id: string
  content: string
  category: 'meeting' | 'thought' | 'question' | 'concern' | 'personal'
  participants: string[] | null
  created_at: string
}

export default function BrainDumpPage() {
  const [profile, setProfile] = useState<any>(null)
  const [items, setItems] = useState<BrainDumpItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<'all' | 'meeting' | 'thought' | 'question' | 'concern' | 'personal'>('all')
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error('[BrainDump] Error getting user:', userError)
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

        // Load brain dump items via recordings
        const { data: recordings } = await supabase
          .from('recordings')
          .select('id')
          .eq('user_id', user.id)

        if (recordings && recordings.length > 0) {
          const recordingIds = recordings.map(r => r.id)
          const { data: itemsData, error: itemsError } = await supabase
            .from('brain_dump')
            .select('*')
            .in('recording_id', recordingIds)
            .order('created_at', { ascending: false })

          if (itemsError) {
            console.error('[BrainDump] Error loading items:', itemsError)
          } else {
            setItems(itemsData || [])
          }
        }

        setIsLoading(false)
      } catch (error) {
        console.error('[BrainDump] Unexpected error:', error)
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const deleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const { error } = await supabase
        .from('brain_dump')
        .delete()
        .eq('id', itemId)

      if (error) {
        console.error('[BrainDump] Error deleting item:', error)
        return
      }

      setItems(items => items.filter(item => item.id !== itemId))
    } catch (error) {
      console.error('[BrainDump] Unexpected error:', error)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meeting':
        return Users
      case 'thought':
        return MessageSquare
      case 'question':
        return HelpCircle
      case 'concern':
        return AlertCircle
      case 'personal':
        return Heart
      default:
        return Zap
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'meeting':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'thought':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'question':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'concern':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'personal':
        return 'bg-pink-100 text-pink-700 border-pink-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const filteredItems = items.filter(item => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false
    return true
  })

  const groupedByDate = filteredItems.reduce((groups, item) => {
    const date = new Date(item.created_at)
    const dateKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(item)
    return groups
  }, {} as Record<string, BrainDumpItem[]>)

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
          <div className="p-3 rounded-xl bg-violet-100">
            <Zap className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">Brain Dump</h1>
            <p className="text-gray-600 text-sm mt-1">
              {items.length} items • {items.filter(i => i.category === 'meeting').length} meetings • {items.filter(i => i.category === 'thought').length} thoughts
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-lg p-2">
            <span className="text-sm text-gray-600">Category:</span>
            {(['all', 'meeting', 'thought', 'question', 'concern', 'personal'] as const).map(category => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  filterCategory === category
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items List */}
      {Object.keys(groupedByDate).length > 0 ? (
        <div className="space-y-8">
          {Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map((dateKey) => (
            <div key={dateKey}>
              <h2 className="text-2xl font-semibold text-black mb-4">{dateKey}</h2>
              <div className="space-y-3">
                {groupedByDate[dateKey].map((item, index) => {
                  const Icon = getCategoryIcon(item.category)
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-5 hover:bg-black hover:text-white hover:border-black transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={cn(
                            'p-2 rounded-lg',
                            getCategoryColor(item.category)
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium border',
                                getCategoryColor(item.category)
                              )}>
                                {item.category.toUpperCase()}
                              </span>
                              {item.participants && item.participants.length > 0 && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 group-hover:text-white/70">
                                  <Users className="h-3 w-3" />
                                  <span>{item.participants.join(', ')}</span>
                                </div>
                              )}
                            </div>
                            <p className="text-gray-700 group-hover:text-white/90 whitespace-pre-wrap">
                              {item.content}
                            </p>
                            <p className="text-xs text-gray-400 group-hover:text-white/50 mt-2">
                              {new Date(item.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-red-600 hover:bg-red-50 group-hover:bg-red-500 group-hover:text-white transition-all"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-violet-100 mb-4">
            <Zap className="h-8 w-8 text-violet-600" />
          </div>
          <h3 className="text-black font-semibold mb-2">No brain dump items yet</h3>
          <p className="text-gray-600 text-sm max-w-sm mx-auto">
            Use Smartify on a note to extract thoughts, meetings, and ideas automatically.
          </p>
        </div>
      )}
    </motion.div>
  )
}

