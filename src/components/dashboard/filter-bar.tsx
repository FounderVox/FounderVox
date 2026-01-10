'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, ChevronDown, LogOut, Settings, BarChart3, Plug, HelpCircle, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface FilterPill {
  id: string
  label: string
  count: number
}

interface FilterBarProps {
  avatarUrl?: string | null
  displayName?: string | null
  email?: string | null
  recordingsCount?: number
}

interface SearchResult {
  id: string
  title: string
  formatted_content: string | null
  raw_transcript: string | null
  created_at: string
  template_label: string | null
}

export function FilterBar({ avatarUrl, displayName, email, recordingsCount = 0 }: FilterBarProps) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [filterPills, setFilterPills] = useState<FilterPill[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Load note counts and tags from Supabase
  useEffect(() => {
    const loadFilterPills = async () => {
      try {
        console.log('[FounderNote:FilterBar] Loading filter pills...')
        
        // Check if supabase and auth are available
        if (!supabase || !supabase.auth) {
          console.error('[FounderNote:FilterBar] Supabase client or auth not available')
          return
        }
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get all notes with template_type and tags (tags may not exist yet)
        const { data: allNotes, error: allError } = await supabase
          .from('notes')
          .select('template_type')
          .eq('user_id', user.id)

        if (allError) {
          console.error('[FounderNote:FilterBar] Error loading notes:', allError)
          return
        }

        // Try to get tags separately (in case column doesn't exist)
        let notesWithTags: any[] = []
        try {
          const { data: notesWithTagsData, error: tagsError } = await supabase
            .from('notes')
            .select('id, tags')
            .eq('user_id', user.id)
          
          if (!tagsError && notesWithTagsData) {
            notesWithTags = notesWithTagsData
          }
        } catch (err) {
          // Tags column doesn't exist, that's okay
          console.log('[FounderNote:FilterBar] Tags column not available, skipping tag filters')
        }

        // Count notes by template type
        const counts: Record<string, number> = {}
        allNotes?.forEach(note => {
          const type = note.template_type || 'none'
          counts[type] = (counts[type] || 0) + 1
        })

        // Extract unique tags and count them (merge with notesWithTags)
        const tagCounts: Record<string, number> = {}
        const notesMap = new Map(notesWithTags.map(n => [n.id, n]))
        
        allNotes?.forEach((note: any) => {
          const noteWithTags = notesMap.get(note.id)
          const tags = noteWithTags?.tags || note.tags
          if (tags && Array.isArray(tags)) {
            tags.forEach((tag: string) => {
              if (tag && typeof tag === 'string') {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1
              }
            })
          }
        })

        // Build filter pills
        const pills: FilterPill[] = [
          { id: 'all', label: 'All', count: allNotes?.length || 0 }
        ]

        // Add template-specific filters
        const templateLabels: Record<string, string> = {
          'investor': 'Investor',
          'ideas': 'Ideas',
          'meeting': 'Meeting',
          'interview': 'Interview',
          'pitch': 'Pitch',
          'braindump': 'Brain Dump',
          'email': 'Email',
          'standup': 'Standup',
          'recording': 'Recording'
        }

        Object.entries(counts).forEach(([type, count]) => {
          if (type !== 'none' && count > 0) {
            pills.push({
              id: type,
              label: templateLabels[type] || type,
              count
            })
          }
        })

        // Add tag pills (sorted by count descending)
        const tagPills: FilterPill[] = Object.entries(tagCounts)
          .map(([tag, count]) => ({
            id: `tag:${tag}`,
            label: tag,
            count
          }))
          .sort((a, b) => b.count - a.count)

        pills.push(...tagPills)

        console.log('[FounderNote:FilterBar] Filter pills loaded:', {
          total: pills.length,
          templates: Object.keys(counts).length,
          tags: Object.keys(tagCounts).length
        })

        setFilterPills(pills)
      } catch (error) {
        console.error('[FounderNote:FilterBar] Error loading filter pills:', error)
      }
    }

    loadFilterPills()

    // Listen for note creation and tag update events to refresh counts
    const handleNoteCreated = () => {
      console.log('[FounderNote:FilterBar] Note created event, reloading filter pills...')
      loadFilterPills()
    }
    const handleTagsUpdated = () => {
      console.log('[FounderNote:FilterBar] Tags updated event, reloading filter pills...')
      loadFilterPills()
    }

    window.addEventListener('noteCreated', handleNoteCreated)
    window.addEventListener('tagsUpdated', handleTagsUpdated)

    return () => {
      window.removeEventListener('noteCreated', handleNoteCreated)
      window.removeEventListener('tagsUpdated', handleTagsUpdated)
    }
  }, [supabase])

  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0].toUpperCase() || 'U'

  const maxNotes = 10
  const progressPercentage = Math.min(((recordingsCount || 0) / maxNotes) * 100, 100)

  const handleSignOut = async () => {
    console.log('[FounderNote:Dashboard:FilterBar] Signing out...')
    await supabase.auth.signOut()
    // Redirect to landing page after sign out
    window.location.href = '/'
  }

  const handleSearchClick = () => {
    setIsSearchOpen(true)
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
  }

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    console.log('[FounderNote:Dashboard:FilterBar] Searching for:', searchQuery)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Search across title, formatted_content, and raw_transcript
      const { data, error } = await supabase
        .from('notes')
        .select('id, title, formatted_content, raw_transcript, created_at, template_label')
        .eq('user_id', user.id)
        .or(`title.ilike.%${searchQuery}%,formatted_content.ilike.%${searchQuery}%,raw_transcript.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('[FounderNote:Dashboard:FilterBar] Search error:', error)
        setSearchResults([])
      } else {
        setSearchResults(data || [])
      }
    } catch (error) {
      console.error('[FounderNote:Dashboard:FilterBar] Unexpected search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleCloseSearch = () => {
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  return (
    <>
      {/* Search Overlay - expands from right */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90]"
              onClick={handleCloseSearch}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-white/95 backdrop-blur-xl border-l border-gray-200/50 shadow-2xl z-[91] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleCloseSearch}
                  className="p-2 rounded-lg text-black hover:bg-black hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notes by transcript..."
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/60 border border-gray-300 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-500"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
                >
                  Search
                </button>
              </form>
              
              {/* Search Results Area */}
              <div className="mt-6 overflow-y-auto max-h-[calc(100vh-200px)]">
                {isSearching ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 mb-4">
                      Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
                    </div>
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        onClick={() => {
                          console.log('[FounderNote:FilterBar] Navigate to note:', result.id)
                          // TODO: Navigate to note detail page when implemented
                          handleCloseSearch()
                        }}
                        className="p-4 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl hover:bg-black hover:text-white hover:border-black transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-black group-hover:text-white truncate">
                              {result.title || 'Untitled Note'}
                            </h3>
                            <p className="text-xs text-gray-500 group-hover:text-white/70 mt-1">
                              {new Date(result.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {result.template_label && (
                            <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full group-hover:bg-white group-hover:text-black ml-2 flex-shrink-0">
                              {result.template_label}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 group-hover:text-white/90">
                          {result.formatted_content?.substring(0, 150) || result.raw_transcript?.substring(0, 150) || 'No content'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="text-center py-12">
                    <div className="text-gray-600 mb-2">No results found for &quot;{searchQuery}&quot;</div>
                    <div className="text-sm text-gray-500">Try searching with different keywords</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-12">
                    Start typing to search through your notes
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Filter Bar */}
      <div className="mb-6 px-1">
        <div className="flex items-center justify-between">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-1">
            {filterPills.map((pill) => (
              <button
                key={pill.id}
                onClick={() => setActiveFilter(pill.id)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  activeFilter === pill.id
                    ? 'bg-black text-white shadow-md'
                    : 'bg-white/60 border border-gray-200 text-black hover:bg-black hover:text-white hover:border-black'
                )}
              >
                {pill.label} ({pill.count})
              </button>
            ))}
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-3 ml-4">
            {/* Search Button */}
            <button
              onClick={handleSearchClick}
              className="p-2 rounded-lg text-black hover:bg-black hover:text-white transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
            
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-black hover:bg-black hover:text-white transition-colors"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName || 'Profile'}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium">
                    {initials}
                  </div>
                )}
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* Enhanced Dropdown Menu */}
              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[100]"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-2xl z-[101] overflow-hidden">
                    {/* Profile Info */}
                    <div className="p-4 border-b border-gray-200/50">
                      <div className="flex items-center gap-3 mb-3">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={displayName || 'Profile'}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-black text-white flex items-center justify-center text-lg font-medium">
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-black truncate">
                            {displayName || 'User'}
                          </p>
                          <p className="text-xs text-gray-600 truncate">{email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Plan Status */}
                    <div className="p-4 border-b border-gray-200/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-black">Free Plan</span>
                        <span className="text-xs text-gray-600">{recordingsCount || 0}/{maxNotes} notes</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className="bg-black h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        />
                      </div>
                      <button className="w-full px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Upgrade to Pro
                      </button>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false)
                          router.push('/dashboard/settings')
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-black hover:bg-black hover:text-white rounded-lg transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false)
                          router.push('/dashboard/analytics')
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-black hover:bg-black hover:text-white rounded-lg transition-colors"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false)
                          router.push('/dashboard/integrations')
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-black hover:bg-black hover:text-white rounded-lg transition-colors"
                      >
                        <Plug className="h-4 w-4" />
                        Integrations
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false)
                          router.push('/dashboard/help')
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-black hover:bg-black hover:text-white rounded-lg transition-colors"
                      >
                        <HelpCircle className="h-4 w-4" />
                        Help
                      </button>
                    </div>

                    {/* Sign Out */}
                    <div className="p-2 border-t border-gray-200/50">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
