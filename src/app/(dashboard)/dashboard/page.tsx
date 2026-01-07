'use client'

import { useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mic, LogOut } from 'lucide-react'
import type { Profile } from '@/types/database'

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data && !data.onboarding_completed) {
        router.push('/welcome')
        return
      }

      setProfile(data)
      setIsLoading(false)
    }

    loadProfile()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back{profile?.display_name ? `, ${profile.display_name}` : ''}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Ready to capture your thoughts?
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              Start Recording
            </CardTitle>
            <CardDescription>
              Capture your voice and transform it into actionable content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" className="w-full">
              <Mic className="h-4 w-4 mr-2" />
              New Voice Note
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Use Cases</CardTitle>
            <CardDescription>
              {profile?.use_cases?.length
                ? `${profile.use_cases.length} selected`
                : 'No use cases selected'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile?.use_cases?.length ? (
              <div className="flex flex-wrap gap-2">
                {profile.use_cases.map((useCase) => (
                  <span
                    key={useCase}
                    className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                  >
                    {useCase}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Configure your use cases to get personalized templates
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Notes</CardTitle>
            <CardDescription>Your latest voice notes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No voice notes yet. Start recording to see them here!
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 p-6 bg-muted/50 rounded-lg text-center">
        <h2 className="text-lg font-semibold mb-2">Coming Soon</h2>
        <p className="text-muted-foreground">
          Voice recording, AI transcription, and smart templates are in development.
          Stay tuned for updates!
        </p>
      </div>
    </motion.div>
  )
}
