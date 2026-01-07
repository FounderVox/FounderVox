'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopBar } from '@/components/dashboard/top-bar'
import { AnimatedBackground } from '@/components/shared/animated-background'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, setProfile] = useState<{
    display_name: string | null
    avatar_url: string | null
    email: string | null
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      console.log('[FounderVox:Dashboard] Loading user profile...')
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.log('[FounderVox:Dashboard] No user found, redirecting to login')
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, email, onboarding_completed, demo_completed')
        .eq('id', user.id)
        .single()

      if (data && !data.onboarding_completed) {
        console.log('[FounderVox:Dashboard] Onboarding not completed, redirecting to welcome')
        router.push('/welcome')
        return
      }

      if (data && !data.demo_completed) {
        console.log('[FounderVox:Dashboard] Demo not completed, redirecting to demo')
        router.push('/demo')
        return
      }

      setProfile(data)
      setIsLoading(false)
      console.log('[FounderVox:Dashboard] Profile loaded:', data?.display_name)
    }

    loadProfile()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="gradient-bg flex items-center justify-center">
        <AnimatedBackground />
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="ml-64 min-h-screen">
        <TopBar
          displayName={profile?.display_name}
          avatarUrl={profile?.avatar_url}
          email={profile?.email}
        />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
