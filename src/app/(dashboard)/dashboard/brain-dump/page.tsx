'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { Brain, Users, MessageSquare, HelpCircle, AlertCircle, UserCircle, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useSidebar } from '@/components/dashboard/sidebar'

export const dynamic = 'force-dynamic'

interface BrainDumpItem {
  id: string
  content: string
  category: 'meeting' | 'thought' | 'question' | 'concern' | 'personal'
  participants: string[] | null
  created_at: string
}

type CategoryColumn = 'meeting' | 'thought' | 'question' | 'concern' | 'personal'

export default function BrainDumpPage() {
  const [profile, setProfile] = useState<any>(null)
  const [items, setItems] = useState<BrainDumpItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draggedItem, setDraggedItem] = useState<{ itemId: string; category: CategoryColumn; index: number } | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<CategoryColumn | null>(null)
  const supabase = createClient()
  const { setIsCollapsed } = useSidebar()

  // Collapse sidebar when page loads
  useEffect(() => {
    setIsCollapsed(true)
  }, [setIsCollapsed])

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

  useEffect(() => {
    loadData()
  }, [supabase])

  const handleDragStart = (e: React.DragEvent, itemId: string, category: CategoryColumn, index: number) => {
    setDraggedItem({ itemId, category, index })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
  }

  const handleDragOver = (e: React.DragEvent, category: CategoryColumn) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(category)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, targetCategory: CategoryColumn) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedItem || draggedItem.category === targetCategory) {
      setDraggedItem(null)
      return
    }

    const item = items.find(i => i.id === draggedItem.itemId)
    if (!item) {
      setDraggedItem(null)
      return
    }

    // Update state optimistically
    setItems(prevItems =>
      prevItems.map(i =>
        i.id === draggedItem.itemId
          ? { ...i, category: targetCategory }
          : i
      )
    )

    // Update database
    try {
      const { error } = await supabase
        .from('brain_dump')
        .update({ category: targetCategory })
        .eq('id', draggedItem.itemId)

      if (error) {
        console.error('[BrainDump] Error updating category:', error)
        // Revert optimistic update on error
        loadData()
      }
    } catch (error) {
      console.error('[BrainDump] Unexpected error updating category:', error)
      loadData()
    }

    setDraggedItem(null)
  }

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

  const getCategoryConfig = (category: CategoryColumn) => {
    switch (category) {
      case 'meeting':
        return {
          label: 'Meeting',
          icon: Users,
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          iconColor: 'text-blue-600',
          itemBg: 'bg-blue-50',
          itemBorder: 'border-blue-200'
        }
      case 'thought':
        return {
          label: 'Thought',
          icon: MessageSquare,
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-700',
          iconColor: 'text-purple-600',
          itemBg: 'bg-purple-50',
          itemBorder: 'border-purple-200'
        }
      case 'question':
        return {
          label: 'Question',
          icon: HelpCircle,
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          iconColor: 'text-yellow-600',
          itemBg: 'bg-yellow-50',
          itemBorder: 'border-yellow-200'
        }
      case 'concern':
        return {
          label: 'Concern',
          icon: AlertCircle,
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          iconColor: 'text-red-600',
          itemBg: 'bg-red-50',
          itemBorder: 'border-red-200'
        }
      case 'personal':
        return {
          label: 'People',
          icon: UserCircle,
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          iconColor: 'text-green-600',
          itemBg: 'bg-green-50',
          itemBorder: 'border-green-200'
        }
    }
  }

  const itemsByCategory = {
    meeting: items.filter(i => i.category === 'meeting'),
    thought: items.filter(i => i.category === 'thought'),
    question: items.filter(i => i.category === 'question'),
    concern: items.filter(i => i.category === 'concern'),
    personal: items.filter(i => i.category === 'personal')
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
            <Brain className="h-6 w-6 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">Brain Dump</h1>
            <p className="text-gray-600 text-sm mt-1">
              {items.length} items • {itemsByCategory.meeting.length} meetings • {itemsByCategory.thought.length} thoughts • {itemsByCategory.question.length} questions
            </p>
          </div>
        </div>
      </div>

      {/* Column Layout */}
      {items.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          {(['meeting', 'thought', 'question', 'concern', 'personal'] as CategoryColumn[]).map((category) => {
            const config = getCategoryConfig(category)
            const Icon = config.icon
            const categoryItems = itemsByCategory[category]

            return (
              <div
                key={category}
                className={cn(
                  "flex-1 min-h-[400px] rounded-xl transition-all duration-200",
                  dragOverColumn === category && "ring-2 ring-gray-300 ring-offset-2"
                )}
                onDragOver={(e) => handleDragOver(e, category)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, category)}
              >
                {/* Column Header */}
                <div className={cn(
                  "flex items-center justify-between mb-4 p-3 rounded-lg",
                  config.bg,
                  config.border,
                  "border"
                )}>
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-5 w-5", config.iconColor)} />
                    <h3 className={cn("font-semibold text-sm", config.text)}>
                      {config.label}
                    </h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      config.bg,
                      config.text,
                      "border",
                      config.border
                    )}>
                      {categoryItems.length}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3 min-h-[300px]">
                  {categoryItems.length > 0 ? (
                    categoryItems.map((item, index) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id, category, index)}
                        className={cn(
                          "rounded-xl p-3 cursor-move transition-all duration-200 group border relative",
                          config.itemBg,
                          config.itemBorder,
                          draggedItem?.itemId === item.id && draggedItem?.category === category
                            ? "opacity-50 scale-95"
                            : "hover:shadow-lg hover:scale-[1.02]"
                        )}
                      >
                        {/* Delete button - top right corner, only on hover */}
                        <button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            deleteItem(item.id)
                          }}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg text-red-600 hover:bg-red-100 transition-all z-10"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        
                        <div className="flex items-start gap-2">
                          <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", config.iconColor)} />
                          <div className="flex-1 min-w-0 pr-6">
                            <p className={cn("text-sm whitespace-pre-wrap", config.text)}>
                              {item.content}
                            </p>
                            {item.participants && item.participants.length > 0 && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                <Users className="h-3 w-3" />
                                <span>{item.participants.join(', ')}</span>
                              </div>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(item.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={cn(
                      "text-xs text-gray-400 italic py-8 text-center border-2 border-dashed rounded-lg",
                      config.border
                    )}>
                      Drop items here
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200/50"
        >
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/60 backdrop-blur-sm border-2 border-gray-200/50 mb-4">
            <Brain className="h-8 w-8 text-black" />
          </div>
          <h3 className="text-black font-semibold mb-2">No brain dump items yet</h3>
          <p className="text-gray-600 text-sm max-w-sm mx-auto mb-4">
            Use Smartify on a note to extract thoughts, meetings, and ideas automatically.
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
