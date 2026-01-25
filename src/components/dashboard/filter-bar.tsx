'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Search, ChevronDown, LogOut, Settings } from 'lucide-react'
import { SearchPanel } from './search-panel'

interface FilterBarProps {
  avatarUrl?: string | null
  displayName?: string | null
  email?: string | null
}

export function FilterBar({ avatarUrl, displayName, email }: FilterBarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const router = useRouter()
  const { supabase } = useAuth()

  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0].toUpperCase() || 'U'

  const handleSignOut = async () => {
    if (!supabase) return
    console.log('[Founder Notes:Dashboard:FilterBar] Signing out...')
    await supabase.auth.signOut()
    // Redirect to landing page after sign out
    window.location.href = '/'
  }

  const handleSearchClick = () => {
    setIsSearchOpen(true)
    // Dispatch event to hide recording buttons
    window.dispatchEvent(new CustomEvent('searchStateChanged', { detail: { isOpen: true } }))
  }

  const handleCloseSearch = () => {
    setIsSearchOpen(false)
    // Dispatch event to show recording buttons
    window.dispatchEvent(new CustomEvent('searchStateChanged', { detail: { isOpen: false } }))
  }

  return (
    <>
      {/* Search Panel */}
      <SearchPanel open={isSearchOpen} onClose={handleCloseSearch} />

      {/* Top Bar - Search and Profile */}
      <div className="mb-6 px-1">
        <div className="flex items-center justify-end">
          {/* Right Side Icons */}
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <button
              onClick={handleSearchClick}
              className="p-2 rounded-lg text-black hover:bg-gray-100/80 hover:shadow-sm transition-all duration-200"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-black transition-colors group"
              >
                {avatarUrl ? (
                  <div className="h-8 w-8 rounded-full overflow-hidden group-hover:ring-2 group-hover:ring-[#BD6750] transition-all">
                    <img
                      src={avatarUrl}
                      alt={displayName || 'Profile'}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium transition-colors group-hover:bg-[#BD6750]"
                  >
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

                    {/* Beta Status */}
                    <div className="p-4 border-b border-gray-200/50">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 text-sm font-semibold rounded-full bg-[#BD6750]/10 text-[#BD6750] border border-[#BD6750]/20">
                          Beta Access
                        </span>
                        <span className="text-xs text-gray-500">Early adopter</span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false)
                          router.push('/dashboard/settings')
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-black hover:bg-gray-200 rounded-lg transition-all duration-200"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
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
