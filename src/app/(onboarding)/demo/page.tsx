'use client'

import { useState, useEffect, useRef } from 'react'

export const dynamic = 'force-dynamic'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Mic, Mail, Lightbulb, Target, MessageSquare, Rocket, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'

const quickTemplates = [
  { id: 'investor', label: 'Investor Update', icon: Mail, description: 'Draft updates for your investors', color: 'from-blue-500 to-indigo-600' },
  { id: 'idea', label: 'Product Idea', icon: Lightbulb, description: 'Capture and organize feature ideas', color: 'from-amber-500 to-orange-600' },
  { id: 'interview', label: 'User Interview', icon: MessageSquare, description: 'Notes from customer conversations', color: 'from-emerald-500 to-teal-600' },
  { id: 'pitch', label: 'Pitch Practice', icon: Target, description: 'Refine your pitch with AI feedback', color: 'from-purple-500 to-pink-600' },
]

export default function DemoPage() {
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const initRef = useRef(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Prevent double initialization from React Strict Mode
    if (initRef.current) return
    initRef.current = true

    const loadUser = async () => {
      try {
        console.log('[FounderNote:Demo] Loading user for demo page...')
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError) {
          console.error('[FounderNote:Demo] Error getting user:', userError)
          router.push('/login')
          return
        }

        if (!user) {
          console.log('[FounderNote:Demo] No user found, redirecting to login')
          router.push('/login')
          return
        }

        console.log('[FounderNote:Demo] User found:', user.id)

        // Get display name from profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('[FounderNote:Demo] Error loading profile:', profileError.message)
        }

        // If demo already completed, go to dashboard
        if (profile?.demo_completed) {
          console.log('[FounderNote:Demo] Demo already completed, redirecting to dashboard')
          router.push('/dashboard')
          return
        }

        if (profile?.display_name) {
          setDisplayName(profile.display_name)
        }

        // Mark first login time if not set
        await supabase
          .from('profiles')
          .update({ first_login_at: new Date().toISOString() })
          .eq('id', user.id)
          .is('first_login_at', null)

        console.log('[FounderNote:Demo] User ready for demo:', user.email)
        setIsLoading(false)
      } catch (error) {
        console.error('[FounderNote:Demo] Unexpected error:', error)
        setIsLoading(false)
      }
    }

    loadUser()
  }, [router, supabase])

  const handleStartRecording = async () => {
    console.log('[FounderNote:Demo] Starting first recording...')
    setIsRecording(true)
    // TODO: Implement actual recording
    setTimeout(async () => {
      setIsRecording(false)
      await handleSkipTosDashboard()
    }, 2000)
  }

  const handleTemplateClick = async (templateId: string) => {
    console.log('[FounderNote:Demo] Template selected:', templateId)
    setIsSaving(true)
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ demo_completed: true })
          .eq('id', user.id)

        if (updateError) {
          console.error('[FounderNote:Demo] Error updating demo_completed:', updateError)
        } else {
          console.log('[FounderNote:Demo] Demo marked complete')
        }
      }

      router.push(`/dashboard?template=${templateId}`)
    } catch (error) {
      console.error('[FounderNote:Demo] Error handling template click:', error)
      router.push(`/dashboard?template=${templateId}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkipTosDashboard = async () => {
    console.log('[FounderNote:Demo] Skip to dashboard clicked')
    setIsSaving(true)
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('[FounderNote:Demo] Error getting user:', userError)
        router.push('/dashboard')
        return
      }

      // Update demo_completed flag
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ demo_completed: true })
        .eq('id', user.id)

      if (updateError) {
        console.error('[FounderNote:Demo] Error updating demo_completed:', updateError)
        // Still redirect even if update fails
      } else {
        console.log('[FounderNote:Demo] Demo marked as complete successfully')
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('[FounderNote:Demo] Error skipping to dashboard:', error)
      // Still redirect on error
      router.push('/dashboard')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#BD6750]" />
            <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-[#BD6750]" />
          </div>
          <p className="text-gray-500 text-sm">Preparing your workspace...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      className="w-full max-w-2xl px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Glass card container */}
      <div className="glass-card-light p-8 md:p-12 shadow-2xl rounded-3xl">
        <div className="text-center">
          {/* Success badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 mb-6"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
          >
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Account created</span>
          </motion.div>

          {/* Rocket icon */}
          <motion.div
            className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-[#BD6750] to-[#a55a45] mb-6 shadow-xl shadow-[#BD6750]/30"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <Rocket className="h-10 w-10 text-white" />
          </motion.div>

          <motion.h1
            className="text-3xl md:text-4xl font-bold mb-3 text-gray-900"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Ready to go{displayName ? `, ${displayName}` : ''}!
          </motion.h1>

          <motion.p
            className="text-gray-500 text-lg mb-10 max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Start by recording a voice note or choose a template to get started
          </motion.p>

          {/* Main CTA - Record Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-10"
          >
            <Button
              size="xl"
              className={`w-full max-w-md h-16 text-lg shadow-xl transition-all duration-300 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gradient-to-r from-[#BD6750] to-[#a55a45] hover:from-[#a55a45] hover:to-[#8f4d3a] text-white'
              }`}
              onClick={handleStartRecording}
            >
              <motion.div
                className="flex items-center justify-center gap-3"
                animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <div className={`p-2 rounded-full ${isRecording ? 'bg-white/20 animate-pulse' : 'bg-white/20'}`}>
                  <Mic className="h-6 w-6" />
                </div>
                <span className="font-semibold">
                  {isRecording ? 'Recording...' : 'Record Your First Note'}
                </span>
                {!isRecording && <ArrowRight className="h-5 w-5 ml-1" />}
              </motion.div>
            </Button>
          </motion.div>

          {/* Divider */}
          <motion.div
            className="relative mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-6 text-sm text-gray-400 uppercase tracking-wide">
                or choose a template
              </span>
            </div>
          </motion.div>

          {/* Quick Templates Grid - Improved */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {quickTemplates.map((template, index) => {
              const Icon = template.icon
              const isSelected = selectedTemplate === template.id
              return (
                <motion.button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template.id)
                    handleTemplateClick(template.id)
                  }}
                  disabled={isSaving}
                  className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 group overflow-hidden ${
                    isSelected
                      ? 'border-[#BD6750] bg-[#BD6750]/5'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                  }`}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-0 group-hover:opacity-5 transition-opacity`} />

                  <div className={`relative p-3 rounded-xl bg-gradient-to-br ${template.color} shadow-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <span className="text-base font-semibold text-gray-900 block mb-1">
                      {template.label}
                    </span>
                    <span className="text-sm text-gray-500 line-clamp-1">
                      {template.description}
                    </span>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3"
                    >
                      <div className="h-6 w-6 rounded-full bg-[#BD6750] flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </motion.div>

          {/* Skip link */}
          <motion.button
            onClick={handleSkipTosDashboard}
            disabled={isSaving}
            className="mt-10 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>Skip to dashboard</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
