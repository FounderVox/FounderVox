'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar, useSidebar, SidebarContext } from '@/components/dashboard/sidebar'


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, setProfile] = useState<{
    display_name: string | null
    avatar_url: string | null
    email: string | null
    recordings_count?: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('[FounderVox:Dashboard:Layout] Starting profile load...')
        
        // Get user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('[FounderVox:Dashboard:Layout] Error getting user:', userError)
          router.push('/login')
          return
        }

        if (!user) {
          console.warn('[FounderVox:Dashboard:Layout] No user found, redirecting to login')
          router.push('/login')
          return
        }

        console.log('[FounderVox:Dashboard:Layout] User found:', user.id)

        // Try to get profile - use select * first to see what columns exist
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('[FounderVox:Dashboard:Layout] Error loading profile:', profileError)
          console.error('[FounderVox:Dashboard:Layout] Error details:', {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code
          })
          
          // If profile doesn't exist, create a default one
          if (profileError.code === 'PGRST116') {
            console.log('[FounderVox:Dashboard:Layout] Profile not found, creating default profile...')
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                display_name: user.email?.split('@')[0] || 'User',
                onboarding_completed: false,
                demo_completed: false,
                recordings_count: 0
              })
              .select()
              .single()

            if (insertError) {
              console.error('[FounderVox:Dashboard:Layout] Error creating profile:', insertError)
              setIsLoading(false)
              return
            }

            console.log('[FounderVox:Dashboard:Layout] Default profile created:', newProfile)
            setProfile({
              display_name: newProfile?.display_name || null,
              avatar_url: newProfile?.avatar_url || null,
              email: newProfile?.email || user.email || null,
              recordings_count: newProfile?.recordings_count || 0
            })
            setIsLoading(false)
            return
          }
          
          setIsLoading(false)
          return
        }

        console.log('[FounderVox:Dashboard:Layout] Profile loaded successfully:', {
          display_name: data?.display_name,
          email: data?.email,
          recordings_count: data?.recordings_count,
          onboarding_completed: data?.onboarding_completed,
          demo_completed: data?.demo_completed
        })

        if (data && !data.onboarding_completed) {
          console.log('[FounderVox:Dashboard:Layout] Onboarding not completed, redirecting to welcome')
          router.push('/welcome')
          return
        }

        // Allow dashboard access - demo completion is optional

        // Set profile - use defaults if data is null
        setProfile({
          display_name: data?.display_name || user.email?.split('@')[0] || null,
          avatar_url: data?.avatar_url || null,
          email: data?.email || user.email || null,
          recordings_count: data?.recordings_count ?? 0
        })
        setIsLoading(false)
        console.log('[FounderVox:Dashboard:Layout] Profile state set successfully, dashboard ready')
      } catch (error) {
        console.error('[FounderVox:Dashboard:Layout] Unexpected error:', error)
        // Set default profile even on error so dashboard can render
        const { data: { user: errorUser } } = await supabase.auth.getUser()
        if (errorUser) {
          setProfile({
            display_name: errorUser.email?.split('@')[0] || null,
            avatar_url: null,
            email: errorUser.email || null,
            recordings_count: 0
          })
        }
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [router, supabase])

  if (isLoading) {
    console.log('[FounderVox:Dashboard:Layout] Still loading, showing loading screen...')
    return (
      <div className="dashboard-bg-light flex items-center justify-center min-h-screen">
        {/* Animated Background Orbs */}
        <div className="dashboard-orb dashboard-orb-1" aria-hidden="true" />
        <div className="dashboard-orb dashboard-orb-2" aria-hidden="true" />
        <div className="dashboard-orb dashboard-orb-3" aria-hidden="true" />
        <div className="dashboard-orb dashboard-orb-4" aria-hidden="true" />
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent relative z-10" />
      </div>
    )
  }

  console.log('[FounderVox:Dashboard:Layout] Rendering dashboard, profile:', {
    display_name: profile?.display_name,
    email: profile?.email,
    recordings_count: profile?.recordings_count
  })

  return (
    <DashboardContent profile={profile}>
      {children}
    </DashboardContent>
  )
}

function DashboardContent({
  children,
  profile
}: {
  children: React.ReactNode
  profile: { display_name: string | null; avatar_url: string | null; email: string | null; recordings_count?: number } | null
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      {/* Background - fixed behind everything */}
      <div className="fixed inset-0 dashboard-bg-light -z-10">
        {/* Animated Background Orbs */}
        <div className="dashboard-orb dashboard-orb-1" aria-hidden="true" />
        <div className="dashboard-orb dashboard-orb-2" aria-hidden="true" />
        <div className="dashboard-orb dashboard-orb-3" aria-hidden="true" />
        <div className="dashboard-orb dashboard-orb-4" aria-hidden="true" />
      </div>
      
      {/* Sidebar - fixed on left */}
      <Sidebar />

      {/* Main Content - fixed on right */}
      <SidebarContent profile={profile}>
        {children}
      </SidebarContent>
    </SidebarContext.Provider>
  )
}

function SidebarContent({
  children,
  profile
}: {
  children: React.ReactNode
  profile: { display_name: string | null; avatar_url: string | null; email: string | null; recordings_count?: number } | null
}) {
  const { isCollapsed } = useSidebar()

  console.log('[FounderVox:Dashboard:SidebarContent] Rendering with profile:', {
    display_name: profile?.display_name,
    email: profile?.email,
    recordings_count: profile?.recordings_count
  })

  const sidebarWidth = isCollapsed ? 72 : 256

  return (
    <div
      className="fixed top-0 bottom-0 right-0 transition-[left] duration-200 z-10"
      style={{ left: sidebarWidth }}
    >
      {/* Main Content Area - scrollable */}
      <main className="h-full w-full overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
