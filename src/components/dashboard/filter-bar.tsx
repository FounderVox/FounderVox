'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, Bell, ChevronDown, LogOut, User, Settings, BarChart3, Plug, HelpCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  return (
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
          <button className="p-2 rounded-lg text-black hover:bg-black hover:text-white transition-colors">
            <Search className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-lg text-black hover:bg-black hover:text-white transition-colors">
            <Bell className="h-5 w-5" />
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
  )
}
