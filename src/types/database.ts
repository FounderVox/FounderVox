export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          email: string | null
          use_cases: string[]
          onboarding_completed: boolean
          onboarding_step: number
          subscription_tier: string
          recordings_count: number
          created_at: string
          updated_at: string
          last_active_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          email?: string | null
          use_cases?: string[]
          onboarding_completed?: boolean
          onboarding_step?: number
          subscription_tier?: string
          recordings_count?: number
          created_at?: string
          updated_at?: string
          last_active_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          email?: string | null
          use_cases?: string[]
          onboarding_completed?: boolean
          onboarding_step?: number
          subscription_tier?: string
          recordings_count?: number
          created_at?: string
          updated_at?: string
          last_active_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
