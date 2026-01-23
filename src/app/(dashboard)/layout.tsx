'use client'

import { useEffect, useState, useCallback } from 'react'
import { Sidebar, useSidebar, SidebarContext } from '@/components/dashboard/sidebar'
import { motion } from 'framer-motion'
import { Mic, FileText } from 'lucide-react'
import { ManualNoteDialog } from '@/components/dashboard/manual-note-dialog'
import { RecordingModal } from '@/components/recording/recording-modal'
import { ProcessingModal } from '@/components/recording/processing-modal'
import { RecordingProvider } from '@/contexts/recording-context'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { MenuProvider } from '@/contexts/menu-context'
import { ErrorBoundary } from '@/components/error-boundary'
import { MetricsProvider } from '@/components/providers/metrics-provider'
import { usePathname } from 'next/navigation'
import { useDebouncedEventListeners } from '@/hooks/useDebouncedEventListener'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MetricsProvider>
          <DashboardLayoutContent>
            {children}
          </DashboardLayoutContent>
        </MetricsProvider>
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

  // Show layout shell immediately while auth loads - better perceived performance
  return (
    <DashboardContent profile={profile} isAuthLoading={isLoading}>
      {children}
    </DashboardContent>
  )
}

function DashboardContent({
  children,
  profile,
  isAuthLoading = false
}: {
  children: React.ReactNode
  profile: { display_name: string | null; avatar_url: string | null; email: string | null; recordings_count?: number } | null
  isAuthLoading?: boolean
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [notesCount, setNotesCount] = useState(0)
  const [starredCount, setStarredCount] = useState(0)
  const { supabase, user } = useAuth()

  const loadCounts = async () => {
    if (!user || !supabase) return

    try {
      // Run both COUNT queries in parallel for faster loading
      const [totalResult, starredResult] = await Promise.all([
        supabase
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_starred', true)
      ])

      if (!totalResult.error && totalResult.count !== null) {
        setNotesCount(totalResult.count)
      }

      if (!starredResult.error && starredResult.count !== null) {
        setStarredCount(starredResult.count)
      }
    } catch (error) {
      console.error('[Founder Notes:Dashboard:Layout] Error loading counts:', error)
    }
  }

  // Memoize loadCounts for use in debounced listener
  const memoizedLoadCounts = useCallback(() => {
    loadCounts()
  }, [loadCounts])

  // Load notes count on mount
  useEffect(() => {
    loadCounts()
  }, [user])

  // Listen for note events with debouncing to prevent event storms
  // Multiple rapid events (e.g., during Smartify) will only trigger one reload
  useDebouncedEventListeners(
    ['noteCreated', 'noteUpdated', 'noteDeleted', 'tagsUpdated', 'starToggled'],
    memoizedLoadCounts,
    300 // 300ms debounce - batches rapid events together
  )

  return (
    <ErrorBoundary>
      <RecordingProvider>
        <MenuProvider>
          <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
            {/* Sidebar - fixed on left */}
            <Sidebar notesCount={notesCount} starredCount={starredCount} />

            {/* Main Content - fixed on right */}
            <SidebarContent profile={profile} isAuthLoading={isAuthLoading}>
              {children}
            </SidebarContent>
          </SidebarContext.Provider>
        </MenuProvider>
      </RecordingProvider>
    </ErrorBoundary>
  )
}

function SidebarContent({
  children,
  profile,
  isAuthLoading = false
}: {
  children: React.ReactNode
  profile: { display_name: string | null; avatar_url: string | null; email: string | null; recordings_count?: number } | null
  isAuthLoading?: boolean
}) {
  const { isCollapsed } = useSidebar()
  const pathname = usePathname()
  // Updated sidebar widths: 20% reduction from original, collapsed gets additional 15% reduction
  const sidebarWidth = isCollapsed ? 61 : 205

  // Pages where recording buttons should be shown (only dashboard and all notes, not individual note view)
  const isNoteDetailPage = pathname?.match(/^\/dashboard\/notes\/[^/]+$/)
  const showRecordingButtons = (pathname === '/dashboard' || pathname === '/dashboard/notes') && !isNoteDetailPage

  // Show skeleton content while auth is loading - layout shell is visible immediately
  const contentToRender = isAuthLoading ? (
    <div className="animate-pulse p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gray-200 rounded-full" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
      </div>
      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-32 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-200">
              <div className="space-y-3">
                <div className="h-5 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-2/3 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : children

  // For note detail page, render with sidebar offset but full width content
  if (isNoteDetailPage) {
    return (
      <>
        <div
          className="fixed top-0 bottom-0 right-0 transition-[left] duration-200 z-10"
          style={{ left: sidebarWidth }}
        >
          {contentToRender}
        </div>
        {/* Floating Record Button - visible on note detail page */}
        {!isAuthLoading && <FloatingRecordButton sidebarWidth={sidebarWidth} />}
      </>
    )
  }

  return (
    <>
      <div
        className="fixed top-0 bottom-0 right-0 transition-[left] duration-200 z-10"
        style={{ left: sidebarWidth }}
      >
        {/* Main Content Area - scrollable */}
        <main className="h-full w-full overflow-y-auto p-6 pb-24">
          {contentToRender}
        </main>
      </div>

      {/* Floating Record Button - Bottom Center (only on dashboard and all notes pages) */}
      {showRecordingButtons && !isAuthLoading && <FloatingRecordButton sidebarWidth={sidebarWidth} />}
    </>
  )
}

function FloatingRecordButton({ sidebarWidth }: { sidebarWidth: number }) {
  const [showRecordingModal, setShowRecordingModal] = useState(false)
  const [showManualNoteDialog, setShowManualNoteDialog] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Listen for search state changes
  useEffect(() => {
    const handleSearchStateChanged = (event: CustomEvent<{ isOpen: boolean }>) => {
      setIsSearchOpen(event.detail.isOpen)
    }

    window.addEventListener('searchStateChanged', handleSearchStateChanged as EventListener)
    return () => {
      window.removeEventListener('searchStateChanged', handleSearchStateChanged as EventListener)
    }
  }, [])

  const handleRecord = () => {
    setShowRecordingModal(true)
  }

  const handleRecordingStop = () => {
    setShowRecordingModal(false)
  }

  const handleProcessingComplete = () => {
    // Processing modal handles its own closing
  }

  // Don't render buttons when search is open
  if (isSearchOpen) {
    return (
      <>
        {/* Dialogs still need to be mounted */}
        <RecordingModal
          isOpen={showRecordingModal}
          onClose={() => setShowRecordingModal(false)}
          onStop={handleRecordingStop}
        />
        <ProcessingModal
          isOpen={true}
          onComplete={handleProcessingComplete}
        />
        <ManualNoteDialog
          open={showManualNoteDialog}
          onOpenChange={setShowManualNoteDialog}
        />
      </>
    )
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
    </>
  )
}
