'use client'

import { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { USE_CASES } from '@/lib/constants/use-cases'

export default function UseCasesPage() {
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      console.log('[Founder Notes:Onboarding] Loading user for use-cases page...')
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.log('[Founder Notes:Onboarding] No user found, redirecting to login')
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
        console.error('[Founder Notes:Onboarding] Error loading profile:', profileError)
      }

      if (profile?.display_name) {
        setDisplayName(profile.display_name)
      }

      console.log('[Founder Notes:Onboarding] User authenticated:', user.email)
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
    console.log('[Founder Notes:Onboarding] Saving use cases:', selectedUseCases)
    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/support')
        return
      }

      // Save use cases and mark onboarding as complete
      // Note: is_paid_beta will be set by the webhook after successful payment
      const { error } = await supabase
        .from('profiles')
        .update({
          use_cases: selectedUseCases,
          onboarding_step: 2,
          onboarding_completed: true,
        })
        .eq('id', user.id)

      if (error) {
        console.error('[Founder Notes:Onboarding] Error saving use cases:', error.message)
      }

      // Redirect to beta support page
      console.log('[Founder Notes:Onboarding] Redirecting to beta support page')
      router.push('/support')
    } catch (error) {
      console.error('[Founder Notes:Onboarding] Error:', error)
      router.push('/support')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkip = async () => {
    console.log('[Founder Notes:Onboarding] Skipping use case selection')
    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/support')
        return
      }

      // Update onboarding step and mark as complete
      // Note: is_paid_beta will be set by the webhook after successful payment
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_step: 2,
          onboarding_completed: true,
        })
        .eq('id', user.id)

      if (error) {
        console.error('[Founder Notes:Onboarding] Error skipping:', error.message)
      }

      // Redirect to beta support page
      console.log('[Founder Notes:Onboarding] Redirecting to beta support page')
      router.push('/support')
    } catch (error) {
      console.error('[Founder Notes:Onboarding] Error skipping:', error)
      router.push('/support')
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
      className="w-full max-w-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Premium card container */}
      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-[#f0ebe6]">
        <div className="text-center mb-8">
          <motion.h1
            className="text-2xl font-semibold font-body text-[#1a1a1a] mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            How will you use FounderNote{displayName ? `, ${displayName}` : ''}?
          </motion.h1>

          <motion.p
            className="text-[#666] font-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Select all that apply
          </motion.p>
        </div>

        {/* Use case grid - cleaner, minimal design */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {USE_CASES.map((useCase, index) => {
            const Icon = useCase.icon
            const isSelected = selectedUseCases.includes(useCase.id)

            return (
              <motion.button
                key={useCase.id}
                onClick={() => toggleUseCase(useCase.id)}
                className={`
                  relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 text-center min-h-[100px]
                  ${isSelected
                    ? 'border-[#BD6750] bg-[#BD6750]/5'
                    : 'border-[#e5e0db] bg-[#faf8f6] hover:border-[#BD6750]/40 hover:bg-[#faf8f6]'
                  }
                `}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    className="absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#BD6750' }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </motion.div>
                )}

                {/* Icon */}
                <div
                  className={`mb-2 p-2 rounded-xl transition-all duration-200 ${
                    isSelected ? 'bg-[#BD6750]/10' : 'bg-white'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 transition-colors duration-200 ${
                      isSelected ? 'text-[#BD6750]' : 'text-[#666]'
                    }`}
                    strokeWidth={1.5}
                  />
                </div>

                {/* Title only - no description */}
                <span
                  className={`text-sm font-medium font-body transition-colors duration-200 ${
                    isSelected ? 'text-[#BD6750]' : 'text-[#1a1a1a]'
                  }`}
                >
                  {useCase.title}
                </span>
              </motion.button>
            )
          })}
        </motion.div>

        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            size="xl"
            className="w-full max-w-xs rounded-xl font-semibold transition-all duration-300 hover:shadow-lg font-body"
            style={{ backgroundColor: '#BD6750', color: 'white' }}
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
            className="text-sm text-[#666] hover:text-[#BD6750] font-medium font-body transition-colors"
          >
            Skip for now
          </button>
        </motion.div>
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
          <div className="h-2 w-8 rounded-full" style={{ backgroundColor: '#BD6750' }} />
        </div>
      </motion.div>
    </motion.div>
  )
}
