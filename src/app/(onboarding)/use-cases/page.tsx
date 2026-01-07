'use client'

import { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { UseCaseGrid } from '@/components/onboarding/use-case-grid'
import { ProgressIndicator } from '@/components/onboarding/progress-indicator'
import { Button } from '@/components/ui/button'

export default function UseCasesPage() {
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

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
    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase
          .from('profiles')
          .update({
            use_cases: selectedUseCases,
            onboarding_completed: true,
          })
          .eq('id', user.id)
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving use cases:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkip = async () => {
    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase
          .from('profiles')
          .update({
            onboarding_completed: true,
          })
          .eq('id', user.id)
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Error skipping:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <motion.div
      className="pt-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <motion.h1
          className="text-3xl md:text-4xl font-bold mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          What will you use voice notes for?
        </motion.h1>

        <motion.p
          className="text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Select all that apply
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
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
        transition={{ delay: 0.4 }}
      >
        <Button
          size="xl"
          className="w-full max-w-xs"
          onClick={handleContinue}
          disabled={isSaving}
        >
          {isSaving ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            'Continue'
          )}
        </Button>

        <button
          onClick={handleSkip}
          disabled={isSaving}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>

        <div className="mt-4">
          <ProgressIndicator current={2} total={2} />
        </div>
      </motion.div>
    </motion.div>
  )
}
