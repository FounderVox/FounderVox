'use client'

import { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { UseCaseGrid } from '@/components/onboarding/use-case-grid'
import { ProgressIndicator } from '@/components/onboarding/progress-indicator'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

export default function UseCasesPage() {
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      console.log('[FounderNote:Onboarding] Loading user for use-cases page...')
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.log('[FounderNote:Onboarding] No user found, redirecting to login')
        router.push('/login')
        return
      }

      // Get display name from profile - use select('*') to avoid column errors
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('[FounderNote:Onboarding] Error loading profile:', profileError)
      }

      if (profile?.display_name) {
        setDisplayName(profile.display_name)
      }

      console.log('[FounderNote:Onboarding] User authenticated:', user.email)
      setIsLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const toggleUseCase = (id: string) => {
    setSelectedUseCases((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    )
  }

  const handleContinue = async () => {
    console.log('[FounderNote:Onboarding] Saving use cases:', selectedUseCases)
    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            use_cases: selectedUseCases,
            onboarding_completed: true,
            onboarding_step: 2,
          })
          .eq('id', user.id)

        if (error) {
          console.error('[FounderNote:Onboarding] Error saving use cases:', error.message)
          throw error
        }

        console.log('[FounderNote:Onboarding] Use cases saved, redirecting to demo')
      }

      router.push('/demo')
    } catch (error) {
      console.error('[FounderNote:Onboarding] Error saving use cases:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkip = async () => {
    console.log('[FounderNote:Onboarding] Skipping use case selection')
    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            onboarding_completed: true,
            onboarding_step: 2,
          })
          .eq('id', user.id)

        if (error) {
          console.error('[FounderNote:Onboarding] Error skipping:', error.message)
          throw error
        }
      }

      router.push('/demo')
    } catch (error) {
      console.error('[FounderNote:Onboarding] Error skipping:', error)
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
      className="w-full max-w-3xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Glass card container */}
      <div className="glass-card-light p-8 md:p-10 shadow-xl">
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 border border-black/10 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Sparkles className="h-4 w-4 text-black" />
            <span className="text-sm text-black font-medium">
              Personalize your experience
            </span>
          </motion.div>

          <motion.h1
            className="text-2xl md:text-3xl font-bold mb-3 text-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            What will you use voice notes for{displayName ? `, ${displayName}` : ''}?
          </motion.h1>

          <motion.p
            className="text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Select all that apply - this helps us customize your templates
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <UseCaseGrid
            selectedUseCases={selectedUseCases}
            onToggle={toggleUseCase}
          />
        </motion.div>

        <motion.div
          className="mt-8 flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            size="xl"
            className="w-full max-w-xs bg-black hover:bg-black text-white shadow-lg"
            onClick={handleContinue}
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Continue'
            )}
          </Button>

          <button
            onClick={handleSkip}
            disabled={isSaving}
            className="text-sm text-gray-600 hover:text-black font-medium transition-colors"
          >
            Skip for now
          </button>
        </motion.div>
      </div>

      <motion.div
        className="mt-8 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <ProgressIndicator current={2} total={2} />
      </motion.div>
    </motion.div>
  )
}
