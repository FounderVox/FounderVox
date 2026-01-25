import { useAuth } from '@/contexts/auth-context'

/**
 * Hook to get the cached Supabase client.
 * Uses the singleton client from AuthContext instead of creating new instances.
 *
 * This prevents performance issues from creating new Supabase clients on every render.
 */
export function useSupabase() {
  const { supabase } = useAuth()
  return supabase
}
