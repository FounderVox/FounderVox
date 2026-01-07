'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
} from 'lucide-react'

interface TopBarProps {
  displayName?: string | null
  avatarUrl?: string | null
  email?: string | null
}

export function TopBar({ displayName, avatarUrl, email }: TopBarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    console.log('[FounderVox:Dashboard] Signing out...')
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0].toUpperCase() || 'U'

  return (
    <header className="h-16 bg-gray-900/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search notes..."
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-white hover:bg-white/5"
        >
          <Bell className="h-5 w-5" />
        </Button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName || 'Profile'}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 text-sm font-medium">
                {initials}
              </div>
            )}
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 rounded-xl border border-white/10 shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-white/10">
                  <p className="text-sm font-medium text-white">
                    {displayName || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false)
                      router.push('/dashboard/profile')
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false)
                      router.push('/dashboard/settings')
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                </div>
                <div className="p-1 border-t border-white/10">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
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
    </header>
  )
}
