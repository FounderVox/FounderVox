'use client'

import { useState, useEffect, useRef } from 'react'

export const dynamic = 'force-dynamic'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { AnimatedMic } from '@/components/onboarding/animated-mic'
import { ProgressIndicator } from '@/components/onboarding/progress-indicator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function WelcomePage() {
  const [displayName, setDisplayName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const initRef = useRef(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Prevent double initialization from React Strict Mode
    if (initRef.current) return
    initRef.current = true

    const loadUser = async () => {
      console.log('[FounderNote:Onboarding] Loading user for welcome page...')
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        console.error('[FounderNote:Onboarding] Error loading user:', error.message)
      }

      if (!user) {
        console.log('[FounderNote:Onboarding] No user found, redirecting to login')
        router.push('/login')
        return
      }

      console.log('[FounderNote:Onboarding] User loaded:', user.email)

      // Get name from OAuth metadata or profile
      const fullName = user.user_metadata?.full_name ||
                       user.user_metadata?.name ||
                       ''
      const firstNamePart = fullName.split(' ')[0] || ''

      console.log('[FounderNote:Onboarding] Pre-filling name:', firstNamePart || '(none)')
      setFirstName(firstNamePart)
      setDisplayName(firstNamePart)
      setIsLoading(false)
    }

    loadUser()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!displayName.trim()) return

    console.log('[FounderNote:Onboarding] Saving display name:', displayName.trim())
    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ display_name: displayName.trim(), onboarding_step: 1 })
          .eq('id', user.id)

        if (error) {
          console.error('[FounderNote:Onboarding] Error updating profile:', error.message)
          throw error
        }

        console.log('[FounderNote:Onboarding] Display name saved successfully')
      }

      router.push('/use-cases')
    } catch (error) {
      console.error('[FounderNote:Onboarding] Error saving name:', error)
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
      className="w-full max-w-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Glass card container */}
      <div className="glass-card-light p-8 md:p-10 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <motion.div
            className="mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <AnimatedMic />
          </motion.div>

          <motion.h1
            className="text-2xl md:text-3xl font-bold mb-3 text-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Hi{firstName ? ` ${firstName}` : ''}, what should we call you?
          </motion.h1>

          <motion.p
            className="text-gray-600 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            We&apos;ll use this to personalize your experience
          </motion.p>

          <motion.form
            onSubmit={handleSubmit}
            className="w-full space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Input
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="text-center text-lg h-14 bg-white/60 border-gray-300 text-black placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-300 focus:ring-offset-0"
              autoFocus
            />

            <Button
              type="submit"
              size="xl"
              className="w-full bg-black hover:bg-black text-white shadow-lg"
              disabled={!displayName.trim() || isSaving}
            >
              {isSaving ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Continue'
              )}
            </Button>
          </motion.form>
        </div>
      </div>

      <motion.div
        className="mt-8 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <ProgressIndicator current={1} total={2} />
      </motion.div>
    </motion.div>
  )
}
