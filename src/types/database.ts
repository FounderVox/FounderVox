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
          first_login_at: string | null
          demo_completed: boolean
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
          first_login_at?: string | null
          demo_completed?: boolean
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
          first_login_at?: string | null
          demo_completed?: boolean
        }
      }
      notes: {
        Row: {
          id: string
          user_id: string
          title: string | null
          content: string | null
          formatted_content: string | null
          raw_transcript: string | null
          template_type: string | null
          template_label: string | null
          is_starred: boolean
          tags: string[]
          audio_url: string | null
          duration_seconds: number | null
          embedding: number[] | null
          smartified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          content?: string | null
          formatted_content?: string | null
          raw_transcript?: string | null
          template_type?: string | null
          template_label?: string | null
          is_starred?: boolean
          tags?: string[]
          audio_url?: string | null
          duration_seconds?: number | null
          embedding?: number[] | null
          smartified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          content?: string | null
          formatted_content?: string | null
          raw_transcript?: string | null
          template_type?: string | null
          template_label?: string | null
          is_starred?: boolean
          tags?: string[]
          audio_url?: string | null
          duration_seconds?: number | null
          embedding?: number[] | null
          smartified_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recordings: {
        Row: {
          id: string
          user_id: string
          note_id: string | null
          audio_url: string | null
          raw_transcript: string | null
          cleaned_transcript: string | null
          duration_seconds: number | null
          processing_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          note_id?: string | null
          audio_url?: string | null
          raw_transcript?: string | null
          cleaned_transcript?: string | null
          duration_seconds?: number | null
          processing_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          note_id?: string | null
          audio_url?: string | null
          raw_transcript?: string | null
          cleaned_transcript?: string | null
          duration_seconds?: number | null
          processing_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      action_items: {
        Row: {
          id: string
          recording_id: string
          user_id: string
          task: string
          assignee: string | null
          deadline: string | null
          priority: 'high' | 'medium' | 'low'
          status: 'open' | 'in_progress' | 'done'
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recording_id: string
          user_id: string
          task: string
          assignee?: string | null
          deadline?: string | null
          priority?: 'high' | 'medium' | 'low'
          status?: 'open' | 'in_progress' | 'done'
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recording_id?: string
          user_id?: string
          task?: string
          assignee?: string | null
          deadline?: string | null
          priority?: 'high' | 'medium' | 'low'
          status?: 'open' | 'in_progress' | 'done'
          completed_at?: string | null
          created_at?: string
        }
      }
      brain_dump: {
        Row: {
          id: string
          recording_id: string
          user_id: string
          content: string
          category: 'meeting' | 'blocker' | 'decision' | 'question' | 'followup'
          participants: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          recording_id: string
          user_id: string
          content: string
          category: 'meeting' | 'blocker' | 'decision' | 'question' | 'followup'
          participants?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          recording_id?: string
          user_id?: string
          content?: string
          category?: 'meeting' | 'blocker' | 'decision' | 'question' | 'followup'
          participants?: string[] | null
          created_at?: string
        }
      }
      investor_updates: {
        Row: {
          id: string
          recording_id: string
          user_id: string
          draft_subject: string | null
          draft_body: string | null
          wins: string[] | null
          metrics: Json | null
          challenges: string[] | null
          asks: string[] | null
          status: 'draft' | 'sent'
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recording_id: string
          user_id: string
          draft_subject?: string | null
          draft_body?: string | null
          wins?: string[] | null
          metrics?: Json | null
          challenges?: string[] | null
          asks?: string[] | null
          status?: 'draft' | 'sent'
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recording_id?: string
          user_id?: string
          draft_subject?: string | null
          draft_body?: string | null
          wins?: string[] | null
          metrics?: Json | null
          challenges?: string[] | null
          asks?: string[] | null
          status?: 'draft' | 'sent'
          sent_at?: string | null
          created_at?: string
        }
      }
      user_events: {
        Row: {
          id: string
          user_id: string | null
          anonymous_id: string | null
          session_id: string | null
          event_name: string
          event_category: string
          event_properties: Json | null
          platform: string
          app_version: string | null
          page_path: string | null
          referrer: string | null
          timezone: string | null
          device_type: string | null
          browser: string | null
          os: string | null
          screen_width: number | null
          screen_height: number | null
          client_timestamp: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          anonymous_id?: string | null
          session_id?: string | null
          event_name: string
          event_category: string
          event_properties?: Json | null
          platform: string
          app_version?: string | null
          page_path?: string | null
          referrer?: string | null
          timezone?: string | null
          device_type?: string | null
          browser?: string | null
          os?: string | null
          screen_width?: number | null
          screen_height?: number | null
          client_timestamp?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          anonymous_id?: string | null
          session_id?: string | null
          event_name?: string
          event_category?: string
          event_properties?: Json | null
          platform?: string
          app_version?: string | null
          page_path?: string | null
          referrer?: string | null
          timezone?: string | null
          device_type?: string | null
          browser?: string | null
          os?: string | null
          screen_width?: number | null
          screen_height?: number | null
          client_timestamp?: string | null
          created_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string | null
          anonymous_id: string
          platform: string
          app_version: string | null
          entry_page: string | null
          entry_referrer: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          timezone: string | null
          device_type: string | null
          browser: string | null
          os: string | null
          started_at: string
          ended_at: string | null
          page_views: number
          events_count: number
          had_recording: boolean
          had_smartify: boolean
          had_ask_query: boolean
        }
        Insert: {
          id?: string
          user_id?: string | null
          anonymous_id: string
          platform: string
          app_version?: string | null
          entry_page?: string | null
          entry_referrer?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          timezone?: string | null
          device_type?: string | null
          browser?: string | null
          os?: string | null
          started_at?: string
          ended_at?: string | null
          page_views?: number
          events_count?: number
          had_recording?: boolean
          had_smartify?: boolean
          had_ask_query?: boolean
        }
        Update: {
          id?: string
          user_id?: string | null
          anonymous_id?: string
          platform?: string
          app_version?: string | null
          entry_page?: string | null
          entry_referrer?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          timezone?: string | null
          device_type?: string | null
          browser?: string | null
          os?: string | null
          started_at?: string
          ended_at?: string | null
          page_views?: number
          events_count?: number
          had_recording?: boolean
          had_smartify?: boolean
          had_ask_query?: boolean
        }
      }
      user_properties: {
        Row: {
          user_id: string
          signup_platform: string | null
          signup_source: string | null
          signup_utm_source: string | null
          signup_utm_medium: string | null
          signup_utm_campaign: string | null
          first_recording_at: string | null
          first_smartify_at: string | null
          first_ask_query_at: string | null
          first_action_item_completed_at: string | null
          total_recordings: number
          total_notes: number
          total_smartify_runs: number
          total_ask_queries: number
          total_action_items_created: number
          total_action_items_completed: number
          total_brain_dump_items: number
          total_investor_updates_sent: number
          total_sessions: number
          total_recording_minutes: number
          last_recording_at: string | null
          last_smartify_at: string | null
          last_active_at: string | null
          metrics_consent: boolean
          current_month_recordings: number
          current_month_recording_minutes: number
          current_month_smartify_runs: number
          current_month_ask_queries: number
          current_month_storage_mb: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          signup_platform?: string | null
          signup_source?: string | null
          signup_utm_source?: string | null
          signup_utm_medium?: string | null
          signup_utm_campaign?: string | null
          first_recording_at?: string | null
          first_smartify_at?: string | null
          first_ask_query_at?: string | null
          first_action_item_completed_at?: string | null
          total_recordings?: number
          total_notes?: number
          total_smartify_runs?: number
          total_ask_queries?: number
          total_action_items_created?: number
          total_action_items_completed?: number
          total_brain_dump_items?: number
          total_investor_updates_sent?: number
          total_sessions?: number
          total_recording_minutes?: number
          last_recording_at?: string | null
          last_smartify_at?: string | null
          last_active_at?: string | null
          metrics_consent?: boolean
          current_month_recordings?: number
          current_month_recording_minutes?: number
          current_month_smartify_runs?: number
          current_month_ask_queries?: number
          current_month_storage_mb?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          signup_platform?: string | null
          signup_source?: string | null
          signup_utm_source?: string | null
          signup_utm_medium?: string | null
          signup_utm_campaign?: string | null
          first_recording_at?: string | null
          first_smartify_at?: string | null
          first_ask_query_at?: string | null
          first_action_item_completed_at?: string | null
          total_recordings?: number
          total_notes?: number
          total_smartify_runs?: number
          total_ask_queries?: number
          total_action_items_created?: number
          total_action_items_completed?: number
          total_brain_dump_items?: number
          total_investor_updates_sent?: number
          total_sessions?: number
          total_recording_minutes?: number
          last_recording_at?: string | null
          last_smartify_at?: string | null
          last_active_at?: string | null
          metrics_consent?: boolean
          current_month_recordings?: number
          current_month_recording_minutes?: number
          current_month_smartify_runs?: number
          current_month_ask_queries?: number
          current_month_storage_mb?: number
          created_at?: string
          updated_at?: string
        }
      }
      api_usage: {
        Row: {
          id: string
          user_id: string
          operation_type: string
          provider: string
          model: string | null
          input_tokens: number | null
          output_tokens: number | null
          audio_seconds: number | null
          estimated_cost_cents: number | null
          source_type: string | null
          source_id: string | null
          status: string
          error_message: string | null
          duration_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          operation_type: string
          provider: string
          model?: string | null
          input_tokens?: number | null
          output_tokens?: number | null
          audio_seconds?: number | null
          estimated_cost_cents?: number | null
          source_type?: string | null
          source_id?: string | null
          status?: string
          error_message?: string | null
          duration_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          operation_type?: string
          provider?: string
          model?: string | null
          input_tokens?: number | null
          output_tokens?: number | null
          audio_seconds?: number | null
          estimated_cost_cents?: number | null
          source_type?: string | null
          source_id?: string | null
          status?: string
          error_message?: string | null
          duration_ms?: number | null
          created_at?: string
        }
      }
      feature_flags: {
        Row: {
          id: string
          flag_name: string
          description: string | null
          enabled: boolean
          rollout_percentage: number
          target_platforms: string[]
          target_user_ids: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          flag_name: string
          description?: string | null
          enabled?: boolean
          rollout_percentage?: number
          target_platforms?: string[]
          target_user_ids?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          flag_name?: string
          description?: string | null
          enabled?: boolean
          rollout_percentage?: number
          target_platforms?: string[]
          target_user_ids?: string[]
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_notes: {
        Args: {
          query_embedding: number[]
          match_threshold?: number
          match_count?: number
          filter_user_id?: string
          filter_starred?: boolean
          filter_template?: string
          filter_tags?: string[]
          filter_date_from?: string
          filter_date_to?: string
        }
        Returns: {
          id: string
          user_id: string
          title: string
          content: string
          formatted_content: string
          raw_transcript: string
          template_type: string
          template_label: string
          is_starred: boolean
          tags: string[]
          created_at: string
          updated_at: string
          similarity: number
        }[]
      }
      increment_user_property: {
        Args: {
          p_user_id: string
          p_property: string
          p_increment: number
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Note = Database['public']['Tables']['notes']['Row']
export type Recording = Database['public']['Tables']['recordings']['Row']
export type ActionItem = Database['public']['Tables']['action_items']['Row']
export type BrainDump = Database['public']['Tables']['brain_dump']['Row']
export type InvestorUpdate = Database['public']['Tables']['investor_updates']['Row']
export type UserEvent = Database['public']['Tables']['user_events']['Row']
export type UserSession = Database['public']['Tables']['user_sessions']['Row']
export type UserProperties = Database['public']['Tables']['user_properties']['Row']
export type APIUsage = Database['public']['Tables']['api_usage']['Row']
export type FeatureFlag = Database['public']['Tables']['feature_flags']['Row']
