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

const filterPills: FilterPill[] = [
  { id: 'all', label: 'All', count: 24 },
  { id: 'investor', label: 'Investor', count: 8 },
  { id: 'ideas', label: 'Ideas', count: 15 },
  { id: 'meeting', label: 'Meeting', count: 5 },
  { id: 'interview', label: 'Interview', count: 3 },
]

interface FilterBarProps {
  avatarUrl?: string | null
  displayName?: string | null
  email?: string | null
  recordingsCount?: number
}

export function FilterBar({ avatarUrl, displayName, email, recordingsCount = 0 }: FilterBarProps) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0].toUpperCase() || 'U'

  const maxNotes = 10
  const progressPercentage = Math.min(((recordingsCount || 0) / maxNotes) * 100, 100)

  const handleSignOut = async () => {
    console.log('[FounderVox:Dashboard:FilterBar] Signing out...')
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleSearchClick = () => {
    setIsSearchOpen(true)
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      console.log('[FounderVox:Dashboard:FilterBar] Searching for:', searchQuery)
      // TODO: Implement search functionality
      // For now, just log the query
    }
  }

  const handleCloseSearch = () => {
    setIsSearchOpen(false)
    setSearchQuery('')
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
              <div className="mt-6">
                {searchQuery.trim() ? (
                  <div className="text-sm text-gray-600">
                    Search results for &quot;{searchQuery}&quot; will appear here...
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-12">
                    Start typing to search through your note transcripts
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
