'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar, useSidebar, SidebarContext } from '@/components/dashboard/sidebar'
import { motion } from 'framer-motion'
import { Mic, FileText, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import CloudBackground from '@/components/shared/cloud-background'
import { ManualNoteDialog } from '@/components/dashboard/manual-note-dialog'
import { TemplateSelectorDialog } from '@/components/dashboard/template-selector-dialog'
import { UseCase } from '@/lib/constants/use-cases'


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
      <div className="flex items-center justify-center min-h-screen">
        <CloudBackground />
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
      <CloudBackground />

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
    <>
      <div
        className="fixed top-0 bottom-0 right-0 transition-[left] duration-200 z-10"
        style={{ left: sidebarWidth }}
      >
        {/* Main Content Area - scrollable */}
        <main className="h-full w-full overflow-y-auto p-6 pb-24">
          {children}
        </main>
      </div>

      {/* Floating Record Button - Bottom Center */}
      <FloatingRecordButton sidebarWidth={sidebarWidth} />
    </>
  )
}

function FloatingRecordButton({ sidebarWidth }: { sidebarWidth: number }) {
  const [isRecording, setIsRecording] = useState(false)
  const [showManualNoteDialog, setShowManualNoteDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<{ useCase: string; template: string } | null>(null)

  const handleRecord = () => {
    setIsRecording(!isRecording)
    console.log('[FounderVox:Dashboard] Recording:', !isRecording)
  }

  const handleTemplateSelect = (useCase: UseCase, template: string) => {
    setSelectedTemplate({ useCase: useCase.title, template })
    console.log('[FounderVox:Dashboard] Template selected:', { useCase: useCase.title, template })
  }

  return (
    <>
      <div
        className="fixed bottom-6 z-50 transition-[left] duration-200 flex justify-center items-center gap-3"
        style={{
          left: sidebarWidth,
          right: 0
        }}
      >
        {/* Left Button - Manual Note */}
        <motion.button
          onClick={() => setShowManualNoteDialog(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="h-14 w-14 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-gray-200 hover:border-black transition-colors group"
          title="Create manual note or upload audio"
        >
          <FileText className="h-5 w-5 text-gray-700 group-hover:text-black transition-colors" />
        </motion.button>

        {/* Center Button - Tap to Record */}
        <motion.button
          onClick={handleRecord}
          animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className={cn(
            'h-14 px-8 rounded-full shadow-xl flex items-center gap-3 font-medium transition-colors',
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-black hover:bg-gray-900 text-white'
          )}
        >
          <div className={cn(
            'p-1.5 rounded-full',
            isRecording ? 'bg-white/20 animate-pulse' : 'bg-white/20'
          )}>
            <Mic className="h-5 w-5" />
          </div>
          {isRecording ? 'Stop Recording' : 'Tap to record'}
        </motion.button>

        {/* Right Button - Template Selector */}
        <motion.button
          onClick={() => setShowTemplateDialog(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'h-14 w-14 rounded-full shadow-xl flex items-center justify-center border-2 transition-colors group',
            selectedTemplate
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-700 border-gray-200 hover:border-black'
          )}
          title={selectedTemplate ? `Template: ${selectedTemplate.template}` : 'Select recording template'}
        >
          <Wand2 className={cn(
            'h-5 w-5 transition-colors',
            selectedTemplate ? 'text-white' : 'text-gray-700 group-hover:text-black'
          )} />
        </motion.button>
      </div>

      {/* Dialogs */}
      <ManualNoteDialog
        open={showManualNoteDialog}
        onOpenChange={setShowManualNoteDialog}
      />
      <TemplateSelectorDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        onSelectTemplate={handleTemplateSelect}
      />
    </>
  )
}
