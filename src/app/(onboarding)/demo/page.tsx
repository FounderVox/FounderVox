'use client'

import { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Mic, Mail, Lightbulb, Target, MessageSquare, PartyPopper } from 'lucide-react'

const quickTemplates = [
  { id: 'investor', label: 'Investor Update', icon: Mail },
  { id: 'idea', label: 'Product Idea', icon: Lightbulb },
  { id: 'interview', label: 'User Interview', icon: MessageSquare },
  { id: 'pitch', label: 'Pitch Practice', icon: Target },
]

export default function DemoPage() {
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('[FounderVox:Demo] Loading user for demo page...')
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError) {
          console.error('[FounderVox:Demo] Error getting user:', userError)
          router.push('/login')
          return
        }

        if (!user) {
          console.log('[FounderVox:Demo] No user found, redirecting to login')
          router.push('/login')
          return
        }

        console.log('[FounderVox:Demo] User found:', user.id)

        // Get display name from profile - use select('*') to avoid column errors
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('[FounderVox:Demo] Error loading profile:', profileError)
          console.error('[FounderVox:Demo] Error details:', {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code
          })
          // Continue anyway with default values
        }

        // If demo already completed, go to dashboard
        if (profile?.demo_completed) {
          console.log('[FounderVox:Demo] Demo already completed, redirecting to dashboard')
          router.push('/dashboard')
          return
        }

        if (profile?.display_name) {
          setDisplayName(profile.display_name)
        }

        // Mark first login time if not set - only if column exists
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ first_login_at: new Date().toISOString() })
          .eq('id', user.id)
          .is('first_login_at', null)

        if (updateError) {
          console.warn('[FounderVox:Demo] Could not update first_login_at (column may not exist):', updateError.message)
        }

        console.log('[FounderVox:Demo] User ready for demo:', user.email)
        setIsLoading(false)
      } catch (error) {
        console.error('[FounderVox:Demo] Unexpected error:', error)
        setIsLoading(false)
      }
    }

    loadUser()
  }, [router, supabase])

  const handleStartRecording = async () => {
    console.log('[FounderVox:Demo] Starting first recording...')
    setIsRecording(true)
    // TODO: Implement actual recording
    setTimeout(async () => {
      setIsRecording(false)
      await handleSkipTosDashboard()
    }, 2000)
  }

  const handleTemplateClick = async (templateId: string) => {
    console.log('[FounderVox:Demo] Template selected:', templateId)
    setIsSaving(true)
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ demo_completed: true })
          .eq('id', user.id)

        if (updateError) {
          console.error('[FounderVox:Demo] Error updating demo_completed:', updateError)
        } else {
          console.log('[FounderVox:Demo] Demo marked complete')
        }
      }

      router.push(`/dashboard?template=${templateId}`)
    } catch (error) {
      console.error('[FounderVox:Demo] Error handling template click:', error)
      router.push(`/dashboard?template=${templateId}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkipTosDashboard = async () => {
    console.log('[FounderVox:Demo] Skip to dashboard clicked')
    setIsSaving(true)
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('[FounderVox:Demo] Error getting user:', userError)
        router.push('/dashboard')
        return
      }

      // Update demo_completed flag
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ demo_completed: true })
        .eq('id', user.id)

      if (updateError) {
        console.error('[FounderVox:Demo] Error updating demo_completed:', updateError)
        // Still redirect even if update fails
      } else {
        console.log('[FounderVox:Demo] Demo marked as complete successfully')
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('[FounderVox:Demo] Error skipping to dashboard:', error)
      // Still redirect on error
      router.push('/dashboard')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent" />
      </div>
    )
  }

  return (
    <motion.div
      className="w-full max-w-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Glass card container */}
      <div className="glass-card-light p-8 md:p-10 shadow-xl">
        <div className="text-center">
          {/* Celebration icon */}
          <motion.div
            className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-6 shadow-lg shadow-orange-500/30"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <PartyPopper className="h-8 w-8 text-white" />
          </motion.div>

          <motion.h1
            className="text-2xl md:text-3xl font-bold mb-3 text-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            You&apos;re all set{displayName ? `, ${displayName}` : ''}!
          </motion.h1>

          <motion.p
            className="text-gray-600 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Let&apos;s capture your first thought
          </motion.p>

          {/* Main CTA - Record Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              size="xl"
              className={`w-full h-16 text-lg bg-black hover:bg-gray-900 text-white shadow-xl ${
                isRecording ? 'animate-pulse bg-red-600 hover:bg-red-700' : ''
              }`}
              onClick={handleStartRecording}
            >
              <motion.div
                className="flex items-center justify-center gap-3"
                animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <div className={`p-2 rounded-full ${isRecording ? 'bg-red-500' : 'bg-white/20'}`}>
                  <Mic className="h-6 w-6 text-white" />
                </div>
                {isRecording ? 'Recording...' : 'Record Your First Note'}
              </motion.div>
            </Button>
          </motion.div>

          {/* Divider */}
          <motion.div
            className="relative my-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-500">
                or try a quick template
              </span>
            </div>
          </motion.div>

          {/* Quick Templates Grid */}
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {quickTemplates.map((template, index) => {
              const Icon = template.icon
              return (
                <motion.button
                  key={template.id}
                  onClick={() => handleTemplateClick(template.id)}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/60 border border-gray-200 text-black hover:bg-black hover:text-white hover:border-black transition-all text-left group shadow-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <div className="p-2 rounded-lg bg-black/5 group-hover:bg-white/20 transition-colors">
                    <Icon className="h-4 w-4 text-black group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-sm font-medium group-hover:text-white transition-colors">
                    {template.label}
                  </span>
                </motion.button>
              )
            })}
          </motion.div>

          {/* Skip link */}
          <motion.button
            onClick={handleSkipTosDashboard}
            disabled={isSaving}
            className="mt-8 text-sm text-gray-600 hover:text-black font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {isSaving ? 'Saving...' : 'Skip to dashboard'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
