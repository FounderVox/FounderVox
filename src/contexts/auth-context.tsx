'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  email: string | null
  recordings_count: number
  onboarding_completed: boolean
  demo_completed: boolean
  use_cases: string[] | null
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  error: string | null
  supabase: ReturnType<typeof createClient>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Create a singleton Supabase client outside the component
// If this fails, the app won't work anyway, so we let it throw
let supabaseClient: ReturnType<typeof createClient>

try {
  supabaseClient = createClient()
} catch (error) {
  console.error('[AuthContext] Failed to create Supabase client:', error)
  // Re-throw to prevent app from running with invalid config
  throw error
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const initializedRef = useRef(false)

  const loadProfile = useCallback(async (currentUser: User): Promise<Profile | null> => {
    try {
      console.log('[AuthContext] Loading profile for user:', currentUser.id)
      const { data, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (profileError) {
        console.log('[AuthContext] Profile error:', profileError.code, profileError.message)
        if (profileError.code === 'PGRST116') {
          console.log('[AuthContext] Profile not found, creating new profile')
          const { data: newProfile, error: insertError } = await supabaseClient
            .from('profiles')
            .insert({
              id: currentUser.id,
              email: currentUser.email,
              display_name: currentUser.email?.split('@')[0] || 'User',
              onboarding_completed: false,
              demo_completed: false,
              recordings_count: 0
            })
            .select()
            .single()

          if (insertError) {
            console.error('[AuthContext] Error creating profile:', insertError)
            return null
          }
          console.log('[AuthContext] Profile created successfully')
          return newProfile as Profile
        }
        console.error('[AuthContext] Error loading profile:', profileError)
        return null
      }

      if (!data) {
        console.warn('[AuthContext] Profile query returned no data')
        return null
      }

      console.log('[AuthContext] Profile loaded successfully')
      return data as Profile
    } catch (err) {
      console.error('[AuthContext] Unexpected error loading profile:', err)
      return null
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const updatedProfile = await loadProfile(user)
    if (updatedProfile) {
      setProfile(updatedProfile)
    }
  }, [user, loadProfile])

  useEffect(() => {
    // Prevent double initialization in development strict mode
    if (initializedRef.current) {
      console.log('[AuthContext] Already initialized, skipping')
      return
    }
    initializedRef.current = true

    let mounted = true
    let initComplete = false

    // Timeout safeguard - if auth takes more than 10 seconds, stop loading
    const timeoutId = setTimeout(() => {
      if (mounted && !initComplete) {
        console.error('[AuthContext] Auth initialization timeout - forcing loading to stop')
        setIsLoading(false)
        setError('Authentication is taking longer than expected. Please refresh the page.')
      }
    }, 10000)

    const initAuth = async () => {
      try {
        console.log('[AuthContext] Initializing auth...')
        const { data: { user: currentUser }, error: userError } = await supabaseClient.auth.getUser()

        // Don't abort on unmount - React Strict Mode causes remounts, we should complete initialization
        if (userError || !currentUser) {
          console.log('[AuthContext] No user found, redirecting to login:', userError?.message)
          if (mounted) {
            setIsLoading(false)
            router.push('/login')
          }
          initComplete = true
          return
        }

        console.log('[AuthContext] User found:', currentUser.id)
        if (mounted) {
          setUser(currentUser)
        }

        const profileData = await loadProfile(currentUser)

        // Complete initialization even if component unmounted (React Strict Mode)
        // Only update state if still mounted to avoid memory leaks
        if (profileData) {
          console.log('[AuthContext] Profile loaded:', profileData.id)
          if (mounted) {
            setProfile(profileData)

            // Only redirect to welcome if user is trying to access protected routes
            // Allow landing page and public routes to be accessible
            if (!profileData.onboarding_completed) {
              const publicRoutes = ['/', '/login', '/signup', '/pricing', '/download', '/auth/callback']
              const isPublicRoute = publicRoutes.includes(pathname || '/')
              
              if (!isPublicRoute) {
                console.log('[AuthContext] Onboarding not completed, redirecting to welcome from:', pathname)
                setIsLoading(false)
                router.push('/welcome')
                initComplete = true
                return
              } else {
                console.log('[AuthContext] Onboarding not completed, but on public route, allowing access to:', pathname)
              }
            }
          }
        } else {
          console.warn('[AuthContext] Profile data is null, but user exists. This may indicate a database issue.')
          // If profile loading failed but user exists, still allow access but show error
          if (mounted) {
            setError('Profile could not be loaded. Please try refreshing the page.')
          }
        }

        console.log('[AuthContext] Auth initialization complete')
        if (mounted) {
          setIsLoading(false)
        }
        initComplete = true
      } catch (err) {
        console.error('[AuthContext] Init error:', err)
        if (mounted) {
          setError('Failed to initialize authentication')
          setIsLoading(false)
        }
        initComplete = true
      }
    }

    initAuth()

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        router.push('/login')
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        const profileData = await loadProfile(session.user)
        if (profileData) {
          setProfile(profileData)
        }
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      if (subscription) {
        subscription.unsubscribe()
      }
      // Reset initialization flag on unmount to allow re-initialization on remount
      // This handles React Strict Mode's double-mount behavior
      if (!initComplete) {
        console.log('[AuthContext] Component unmounting before init complete, resetting flag')
        initializedRef.current = false
      }
    }
  }, [router, loadProfile, isLoading])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AuthContextType>(() => ({
    user,
    profile,
    isLoading,
    error,
    supabase: supabaseClient,
    refreshProfile
  }), [user, profile, isLoading, error, refreshProfile])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
