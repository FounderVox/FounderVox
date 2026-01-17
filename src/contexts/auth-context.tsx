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
  supabase: ReturnType<typeof createClient> | null
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Create a singleton Supabase client outside the component
// If this fails, we handle it gracefully instead of crashing
let supabaseClient: ReturnType<typeof createClient> | null = null
let supabaseInitError: string | null = null

try {
  supabaseClient = createClient()
} catch (error) {
  console.error('[AuthContext] Failed to create Supabase client:', error)
  supabaseInitError = 'Configuration Error: Authentication service is not properly configured. Please contact support.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(supabaseInitError)
  const router = useRouter()
  const pathname = usePathname()
  const initializedRef = useRef(false)

  // If Supabase failed to initialize, stop loading and show error
  useEffect(() => {
    if (supabaseInitError) {
      setIsLoading(false)
    }
  }, [])

  const loadProfile = useCallback(async (currentUser: User): Promise<Profile | null> => {
    if (!supabaseClient) {
      console.error('[AuthContext] Cannot load profile: Supabase client not initialized')
      return null
    }
    try {
      console.log('[AuthContext] Loading profile for user:', currentUser.id)

      // Add 5-second timeout to profile query to prevent hanging
      const profileQueryWithTimeout = Promise.race([
        supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single(),
        new Promise<{ data: null; error: { code: string; message: string } }>((_, reject) =>
          setTimeout(() => reject(new Error('Profile query timeout after 5s')), 5000)
        )
      ])

      const { data, error: profileError } = await profileQueryWithTimeout

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
    // Prevent double initialization - NEVER reset this flag
    if (initializedRef.current) {
      console.log('[AuthContext] Already initialized, skipping')
      return
    }
    initializedRef.current = true

    let mounted = true

    const initAuth = async () => {
      // Skip initialization if Supabase client failed to initialize
      if (!supabaseClient) {
        console.error('[AuthContext] Skipping auth init: Supabase client not available')
        return
      }

      try {
        console.log('[AuthContext] Initializing auth...')

        // Add 5-second timeout to getUser() to prevent hanging
        const getUserWithTimeout = Promise.race([
          supabaseClient.auth.getUser(),
          new Promise<{ data: { user: null }; error: Error }>((_, reject) => 
            setTimeout(() => reject(new Error('getUser timeout after 5s')), 5000)
          )
        ])
        
        let currentUser = null
        let userError = null
        try {
          const result = await getUserWithTimeout
          currentUser = result.data.user
          userError = result.error
        } catch (e) {
          // getUser timed out - try getSession as fallback with its own timeout
          console.log('[AuthContext] getUser timed out, trying getSession as fallback')
          try {
            const getSessionWithTimeout = Promise.race([
              supabaseClient.auth.getSession(),
              new Promise<{ data: { session: null } }>((_, reject) =>
                setTimeout(() => reject(new Error('getSession timeout after 3s')), 3000)
              )
            ])
            const { data: { session } } = await getSessionWithTimeout
            currentUser = session?.user ?? null
          } catch (sessionError) {
            console.error('[AuthContext] getSession also timed out:', sessionError)
            throw new Error('AUTH_TIMEOUT')
          }
        }

        // Don't abort on unmount - React Strict Mode causes remounts, we should complete initialization
        if (userError || !currentUser) {
          console.log('[AuthContext] No user found, redirecting to login:', userError?.message)
          // Always set isLoading false - React handles unmounted component state updates safely
          setIsLoading(false)
          if (mounted) {
            router.push('/login')
          }
          return
        }

        console.log('[AuthContext] User found:', currentUser.id)
        setUser(currentUser)

        const profileData = await loadProfile(currentUser)

        // Always update state - React handles unmounted component state updates safely
        // This is necessary for Strict Mode where the first mount's async work completes after cleanup
        if (profileData) {
          console.log('[AuthContext] Profile loaded:', profileData.id)
          setProfile(profileData)

          // Only redirect to welcome if user is trying to access protected routes
          // Allow landing page and public routes to be accessible
          if (!profileData.onboarding_completed) {
            const publicRoutes = ['/', '/login', '/signup', '/pricing', '/download', '/auth/callback']
            const isPublicRoute = publicRoutes.includes(pathname || '/')
            
            if (!isPublicRoute) {
              console.log('[AuthContext] Onboarding not completed, redirecting to welcome from:', pathname)
              setIsLoading(false)
              if (mounted) router.push('/welcome')
              return
            } else {
              console.log('[AuthContext] Onboarding not completed, but on public route, allowing access to:', pathname)
            }
          }
        } else {
          console.warn('[AuthContext] Profile data is null, but user exists. This may indicate a database issue.')
          setError('Profile could not be loaded. Please try refreshing the page.')
        }

        console.log('[AuthContext] Auth initialization complete')
        setIsLoading(false)
      } catch (err) {
        console.error('[AuthContext] Init error:', err)
        // Provide specific error messages based on error type
        const errorMessage = err instanceof Error ? err.message : String(err)
        if (errorMessage === 'AUTH_TIMEOUT') {
          setError('Authentication timed out. Please check your network connection and try again.')
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          setError('Network error. Please check your internet connection and try again.')
        } else if (errorMessage.includes('config') || errorMessage.includes('Configuration')) {
          setError('Configuration Error: Authentication service is not properly configured. Please contact support.')
        } else {
          setError('Failed to initialize authentication. Please refresh the page or try again later.')
        }
        setIsLoading(false)
      }
    }

    initAuth()

    // Only set up auth state change listener if Supabase client is available
    let subscription: { unsubscribe: () => void } | null = null
    if (supabaseClient) {
      const { data } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log('[AuthContext] Auth state changed:', event)
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
      subscription = data.subscription
    }

    return () => {
      mounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
      // DO NOT reset initializedRef - it should stay true to prevent re-initialization race conditions
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, loadProfile])

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
