'use client'

import { useState, useEffect, useRef } from 'react'

export const dynamic = 'force-dynamic'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User } from 'lucide-react'

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
      console.log('[Founder Notes:Onboarding] Loading user for welcome page...')
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        console.error('[Founder Notes:Onboarding] Error loading user:', error.message)
      }

      if (!user) {
        console.log('[Founder Notes:Onboarding] No user found, redirecting to login')
        router.push('/login')
        return
      }

      console.log('[Founder Notes:Onboarding] User loaded:', user.email)

      // Get name from OAuth metadata or profile
      const fullName = user.user_metadata?.full_name ||
                       user.user_metadata?.name ||
                       ''
      const firstNamePart = fullName.split(' ')[0] || ''

      console.log('[Founder Notes:Onboarding] Pre-filling name:', firstNamePart || '(none)')
      setFirstName(firstNamePart)
      setDisplayName(firstNamePart)
      setIsLoading(false)
    }

    loadUser()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!displayName.trim()) return

    console.log('[Founder Notes:Onboarding] Saving display name:', displayName.trim())
    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ display_name: displayName.trim(), onboarding_step: 1 })
          .eq('id', user.id)

        if (error) {
          console.error('[Founder Notes:Onboarding] Error updating profile:', error.message)
          throw error
        }

        console.log('[Founder Notes:Onboarding] Display name saved successfully')
      }

      router.push('/use-cases')
    } catch (error) {
      console.error('[Founder Notes:Onboarding] Error saving name:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#BD6750] border-t-transparent" />
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
      {/* Premium card container */}
      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-[#f0ebe6]">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <motion.div
            className="mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(189, 103, 80, 0.1)' }}
            >
              <User className="h-8 w-8" style={{ color: '#BD6750' }} />
            </div>
          </motion.div>

          <motion.h1
            className="text-2xl font-semibold font-body text-[#1a1a1a] mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {firstName ? `Welcome, ${firstName}` : 'Welcome'}
          </motion.h1>

          <motion.p
            className="text-[#666] font-body mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            What should we call you?
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
              className="h-12 bg-[#faf8f6] border-[#e5e0db] text-[#1a1a1a] placeholder:text-[#999] focus:border-[#BD6750] focus-visible:ring-[#BD6750]/20 focus:ring-offset-0 rounded-xl font-body text-center text-lg"
              autoFocus
            />

            <Button
              type="submit"
              size="xl"
              className="w-full rounded-xl font-semibold transition-all duration-300 hover:shadow-lg font-body"
              style={{ backgroundColor: '#BD6750', color: 'white' }}
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

      {/* Progress indicator */}
      <motion.div
        className="mt-8 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-8 rounded-full" style={{ backgroundColor: '#BD6750' }} />
          <div className="h-2 w-8 rounded-full bg-[#e5e0db]" />
        </div>
      </motion.div>
    </motion.div>
  )
}
