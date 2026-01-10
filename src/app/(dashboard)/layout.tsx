'use client'

import { useEffect, useState } from 'react'
import { Sidebar, useSidebar, SidebarContext } from '@/components/dashboard/sidebar'
import { motion } from 'framer-motion'
import { Mic, FileText, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import CloudBackground from '@/components/shared/cloud-background'
import { ManualNoteDialog } from '@/components/dashboard/manual-note-dialog'
import { TemplateSelectorDialog } from '@/components/dashboard/template-selector-dialog'
import { RecordingModal } from '@/components/recording/recording-modal'
import { ProcessingModal } from '@/components/recording/processing-modal'
import { RecordingProvider } from '@/contexts/recording-context'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { UseCase } from '@/lib/constants/use-cases'
import { ErrorBoundary } from '@/components/error-boundary'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DashboardLayoutContent>
          {children}
        </DashboardLayoutContent>
      </AuthProvider>
    </ErrorBoundary>
  )
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isLoading, error, profile } = useAuth()

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Configuration Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CloudBackground />
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent relative z-10" />
      </div>
    )
  }

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
  const [notesCount, setNotesCount] = useState(0)
  const [starredCount, setStarredCount] = useState(0)
  const { supabase, user } = useAuth()

  const loadCounts = async () => {
    if (!user) return

    try {
      // Load total notes count
      const { count, error } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (!error && count !== null) {
        setNotesCount(count)
      }

      // Load starred notes count
      const { count: starredCountResult, error: starredError } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_starred', true)

      if (!starredError && starredCountResult !== null) {
        setStarredCount(starredCountResult)
      }
    } catch (error) {
      console.error('[FounderNote:Dashboard:Layout] Error loading counts:', error)
    }
  }

  // Load notes count and starred count for sidebar
  useEffect(() => {
    loadCounts()

    // Listen for note events to refresh counts
    const handleNoteEvent = () => loadCounts()

    window.addEventListener('noteCreated', handleNoteEvent)
    window.addEventListener('noteUpdated', handleNoteEvent)
    window.addEventListener('noteDeleted', handleNoteEvent)
    window.addEventListener('tagsUpdated', handleNoteEvent)
    window.addEventListener('starToggled', handleNoteEvent)

    return () => {
      window.removeEventListener('noteCreated', handleNoteEvent)
      window.removeEventListener('noteUpdated', handleNoteEvent)
      window.removeEventListener('noteDeleted', handleNoteEvent)
      window.removeEventListener('tagsUpdated', handleNoteEvent)
      window.removeEventListener('starToggled', handleNoteEvent)
    }
  }, [user])

  return (
    <ErrorBoundary>
      <RecordingProvider>
        <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
          <CloudBackground />

          {/* Sidebar - fixed on left */}
          <Sidebar notesCount={notesCount} starredCount={starredCount} />

          {/* Main Content - fixed on right */}
          <SidebarContent profile={profile}>
            {children}
          </SidebarContent>
        </SidebarContext.Provider>
      </RecordingProvider>
    </ErrorBoundary>
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
  const [showRecordingModal, setShowRecordingModal] = useState(false)
  const [showManualNoteDialog, setShowManualNoteDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<{ useCase: string; template: string } | null>(null)

  const handleRecord = () => {
    setShowRecordingModal(true)
  }

  const handleRecordingStop = () => {
    setShowRecordingModal(false)
  }

  const handleProcessingComplete = () => {
    // Processing modal handles its own closing
  }

  const handleTemplateSelect = (useCase: UseCase, template: string) => {
    setSelectedTemplate({ useCase: useCase.title, template })
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
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="h-14 px-8 rounded-full shadow-xl flex items-center gap-3 font-medium transition-colors text-white"
          style={{ backgroundColor: '#BD6750' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#a55a45'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#BD6750'
          }}
        >
          <div className="p-1.5 rounded-full bg-white/20">
            <Mic className="h-5 w-5" />
          </div>
          Tap to record
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
      <RecordingModal
        isOpen={showRecordingModal}
        onClose={() => setShowRecordingModal(false)}
        onStop={handleRecordingStop}
      />
      {/* Processing modal - always mounted, shows when processing */}
      <ProcessingModal
        isOpen={true}
        onComplete={handleProcessingComplete}
      />
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
