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
    // #region agent log
    const effectId = Math.random().toString(36).slice(2, 8)
    const effectStart = Date.now()
    fetch('http://127.0.0.1:7242/ingest/d4d21b9d-6b84-4d67-a5bd-a632341af48c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:useEffect',message:'Effect started',data:{effectId,isLoading,initializedRefValue:initializedRef.current},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2'})}).catch(()=>{});
    // #endregion

    // Prevent double initialization - NEVER reset this flag
    if (initializedRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d4d21b9d-6b84-4d67-a5bd-a632341af48c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:useEffect',message:'Skipping - already initialized',data:{effectId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      console.log('[AuthContext] Already initialized, skipping')
      return
    }
    initializedRef.current = true

    let mounted = true

    const initAuth = async () => {
      try {
        // #region agent log
        const getUserStart = Date.now()
        fetch('http://127.0.0.1:7242/ingest/d4d21b9d-6b84-4d67-a5bd-a632341af48c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:initAuth',message:'Starting getUser with timeout',data:{effectId,elapsed:Date.now()-effectStart},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
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
          // getUser timed out - try getSession as fallback
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/d4d21b9d-6b84-4d67-a5bd-a632341af48c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:initAuth',message:'getUser timed out, trying getSession',data:{effectId,elapsed:Date.now()-effectStart},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
          // #endregion
          const { data: { session } } = await supabaseClient.auth.getSession()
          currentUser = session?.user ?? null
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d4d21b9d-6b84-4d67-a5bd-a632341af48c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:initAuth',message:'getUser completed',data:{effectId,getUserDuration:Date.now()-getUserStart,hasUser:!!currentUser,error:userError?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion

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

        // #region agent log
        const profileStart = Date.now()
        fetch('http://127.0.0.1:7242/ingest/d4d21b9d-6b84-4d67-a5bd-a632341af48c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:initAuth',message:'Starting loadProfile',data:{effectId,elapsed:Date.now()-effectStart},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
        const profileData = await loadProfile(currentUser)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d4d21b9d-6b84-4d67-a5bd-a632341af48c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:initAuth',message:'loadProfile completed',data:{effectId,profileDuration:Date.now()-profileStart,hasProfile:!!profileData},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion

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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d4d21b9d-6b84-4d67-a5bd-a632341af48c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:initAuth',message:'Init complete - setting isLoading false',data:{effectId,totalDuration:Date.now()-effectStart,mounted},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        setIsLoading(false)
      } catch (err) {
        console.error('[AuthContext] Init error:', err)
        setError('Failed to initialize authentication')
        setIsLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d4d21b9d-6b84-4d67-a5bd-a632341af48c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:onAuthStateChange',message:'Auth state changed',data:{effectId,event,hasSession:!!session},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d4d21b9d-6b84-4d67-a5bd-a632341af48c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:cleanup',message:'Cleanup running',data:{effectId,elapsed:Date.now()-effectStart},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
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
