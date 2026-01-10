'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { Lightbulb, Tag, AlertCircle, X, ThumbsUp, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface ProductIdea {
  id: string
  idea: string
  category: 'feature' | 'improvement' | 'integration' | 'pivot' | 'experiment' | 'new_product'
  priority: 'high' | 'medium' | 'low'
  context: string | null
  votes: number
  status: 'idea' | 'considering' | 'building' | 'shipped' | 'archived'
  created_at: string
}

export default function ProductIdeasPage() {
  const [profile, setProfile] = useState<any>(null)
  const [ideas, setIdeas] = useState<ProductIdea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'idea' | 'considering' | 'building' | 'shipped' | 'archived'>('all')
  const [filterCategory, setFilterCategory] = useState<'all' | 'feature' | 'improvement' | 'integration' | 'pivot' | 'experiment' | 'new_product'>('all')
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error('[ProductIdeas] Error getting user:', userError)
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

        // Load product ideas via recordings
        const { data: recordings } = await supabase
          .from('recordings')
          .select('id')
          .eq('user_id', user.id)

        if (recordings && recordings.length > 0) {
          const recordingIds = recordings.map(r => r.id)
          const { data: ideasData, error: ideasError } = await supabase
            .from('product_ideas')
            .select('*')
            .in('recording_id', recordingIds)
            .order('created_at', { ascending: false })

          if (ideasError) {
            console.error('[ProductIdeas] Error loading ideas:', ideasError)
          } else {
            setIdeas(ideasData || [])
          }
        }

        setIsLoading(false)
      } catch (error) {
        console.error('[ProductIdeas] Unexpected error:', error)
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const updateStatus = async (ideaId: string, newStatus: ProductIdea['status']) => {
    try {
      const { error } = await supabase
        .from('product_ideas')
        .update({ status: newStatus })
        .eq('id', ideaId)

      if (error) {
        console.error('[ProductIdeas] Error updating status:', error)
        return
      }

      setIdeas(items =>
        items.map(item =>
          item.id === ideaId ? { ...item, status: newStatus } : item
        )
      )
    } catch (error) {
      console.error('[ProductIdeas] Unexpected error:', error)
    }
  }

  const deleteIdea = async (ideaId: string) => {
    if (!confirm('Are you sure you want to delete this product idea?')) return

    try {
      const { error } = await supabase
        .from('product_ideas')
        .delete()
        .eq('id', ideaId)

      if (error) {
        console.error('[ProductIdeas] Error deleting idea:', error)
        return
      }

      setIdeas(items => items.filter(item => item.id !== ideaId))
    } catch (error) {
      console.error('[ProductIdeas] Unexpected error:', error)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feature':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'improvement':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'integration':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'pivot':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'experiment':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'new_product':
        return 'bg-pink-100 text-pink-700 border-pink-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shipped':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'building':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'considering':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'archived':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-purple-100 text-purple-700 border-purple-200'
    }
  }

  const filteredIdeas = ideas.filter(idea => {
    if (filterStatus !== 'all' && idea.status !== filterStatus) return false
    if (filterCategory !== 'all' && idea.category !== filterCategory) return false
    return true
  })

  const groupedByDate = filteredIdeas.reduce((groups, idea) => {
    const date = new Date(idea.created_at)
    const dateKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(idea)
    return groups
  }, {} as Record<string, ProductIdea[]>)

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
          <div className="p-3 rounded-xl bg-amber-100">
            <Lightbulb className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">Product Ideas</h1>
            <p className="text-gray-600 text-sm mt-1">
              {ideas.length} total • {ideas.filter(i => i.status === 'idea').length} new • {ideas.filter(i => i.status === 'shipped').length} shipped
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-lg p-2">
            <span className="text-sm text-gray-600">Status:</span>
            {(['all', 'idea', 'considering', 'building', 'shipped', 'archived'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  filterStatus === status
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-lg p-2">
            <span className="text-sm text-gray-600">Category:</span>
            {(['all', 'feature', 'improvement', 'integration', 'pivot', 'experiment', 'new_product'] as const).map(category => (
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
                {category === 'all' ? 'All' : category === 'new_product' ? 'New Product' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ideas List */}
      {Object.keys(groupedByDate).length > 0 ? (
        <div className="space-y-8">
          {Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map((dateKey) => (
            <div key={dateKey}>
              <h2 className="text-2xl font-semibold text-black mb-4">{dateKey}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedByDate[dateKey].map((idea, index) => (
                  <motion.div
                    key={idea.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-5 hover:bg-black hover:text-white hover:border-black transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium border',
                            getCategoryColor(idea.category)
                          )}>
                            {idea.category === 'new_product' ? 'New Product' : idea.category.toUpperCase()}
                          </span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium border',
                            getPriorityColor(idea.priority)
                          )}>
                            {idea.priority.toUpperCase()}
                          </span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium border',
                            getStatusColor(idea.status)
                          )}>
                            {idea.status.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{idea.idea}</h3>
                        {idea.context && (
                          <p className="text-sm text-gray-600 group-hover:text-white/90 mb-3">
                            {idea.context}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteIdea(idea.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-red-600 hover:bg-red-50 group-hover:bg-red-500 group-hover:text-white transition-all"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-white/70">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{idea.votes} votes</span>
                      </div>
                      <select
                        value={idea.status}
                        onChange={(e) => updateStatus(idea.id, e.target.value as ProductIdea['status'])}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs bg-white border border-gray-200 rounded-md px-2 py-1 text-gray-700 group-hover:bg-gray-800 group-hover:text-white group-hover:border-gray-600"
                      >
                        <option value="idea">Idea</option>
                        <option value="considering">Considering</option>
                        <option value="building">Building</option>
                        <option value="shipped">Shipped</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-100 mb-4">
            <Lightbulb className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="text-black font-semibold mb-2">No product ideas yet</h3>
          <p className="text-gray-600 text-sm max-w-sm mx-auto mb-4">
            Use Smartify on a note to extract product ideas automatically.
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

