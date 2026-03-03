// Types générés manuellement à partir de supabase/migrations/00001_initial_schema.sql
// Sera remplacé par supabase gen types quand le projet Supabase sera connecté

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          plan: 'pro' | 'business' | 'enterprise'
          subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled'
          refund_policy: string | null
          sav_policy: string | null
          brand_logo_url: string | null
          brand_accent_color: string | null
          brand_email_footer: string | null
          sso_enabled: boolean
          sso_provider: string | null
          sso_idp_metadata_url: string | null
          sso_connection_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          plan?: 'pro' | 'business' | 'enterprise'
          subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled'
          refund_policy?: string | null
          sav_policy?: string | null
          brand_logo_url?: string | null
          brand_accent_color?: string | null
          brand_email_footer?: string | null
          sso_enabled?: boolean
          sso_provider?: string | null
          sso_idp_metadata_url?: string | null
          sso_connection_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          plan?: 'pro' | 'business' | 'enterprise'
          subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled'
          refund_policy?: string | null
          sav_policy?: string | null
          brand_logo_url?: string | null
          brand_accent_color?: string | null
          brand_email_footer?: string | null
          sso_enabled?: boolean
          sso_provider?: string | null
          sso_idp_metadata_url?: string | null
          sso_connection_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          organization_id: string
          full_name: string | null
          email: string
          role: 'owner' | 'admin' | 'agent'
          avatar_url: string | null
          is_onboarded: boolean
          industry: string | null
          team_size: string | null
          ticket_volume: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          full_name?: string | null
          email: string
          role?: 'owner' | 'admin' | 'agent'
          avatar_url?: string | null
          is_onboarded?: boolean
          industry?: string | null
          team_size?: string | null
          ticket_volume?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          full_name?: string | null
          email?: string
          role?: 'owner' | 'admin' | 'agent'
          avatar_url?: string | null
          is_onboarded?: boolean
          industry?: string | null
          team_size?: string | null
          ticket_volume?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      customers: {
        Row: {
          id: string
          organization_id: string
          email: string
          full_name: string | null
          phone: string | null
          metadata: Json | null
          health_score: number
          segment: string
          total_spent: number
          notes: string | null
          tags: string[]
          last_satisfaction_score: number | null
          first_contact_at: string | null
          lifetime_tickets: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          full_name?: string | null
          phone?: string | null
          metadata?: Json | null
          health_score?: number
          segment?: string
          total_spent?: number
          notes?: string | null
          tags?: string[]
          last_satisfaction_score?: number | null
          first_contact_at?: string | null
          lifetime_tickets?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          metadata?: Json | null
          health_score?: number
          segment?: string
          total_spent?: number
          notes?: string | null
          tags?: string[]
          last_satisfaction_score?: number | null
          first_contact_at?: string | null
          lifetime_tickets?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'customers_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      tickets: {
        Row: {
          id: string
          organization_id: string
          customer_id: string
          assigned_to: string | null
          subject: string
          status: 'open' | 'pending' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          channel: 'email' | 'form' | 'google_review' | 'manual' | 'instagram' | 'messenger'
          metadata: Json | null
          ai_summary: string | null
          csat_rating: number | null
          csat_comment: string | null
          csat_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          customer_id: string
          assigned_to?: string | null
          subject: string
          status?: 'open' | 'pending' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          channel?: 'email' | 'form' | 'google_review' | 'manual' | 'instagram' | 'messenger'
          metadata?: Json | null
          ai_summary?: string | null
          csat_rating?: number | null
          csat_comment?: string | null
          csat_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          customer_id?: string
          assigned_to?: string | null
          subject?: string
          status?: 'open' | 'pending' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          channel?: 'email' | 'form' | 'google_review' | 'manual' | 'instagram' | 'messenger'
          metadata?: Json | null
          ai_summary?: string | null
          csat_rating?: number | null
          csat_comment?: string | null
          csat_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tickets_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tickets_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tickets_assigned_to_fkey'
            columns: ['assigned_to']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      messages: {
        Row: {
          id: string
          ticket_id: string
          sender_type: 'customer' | 'agent' | 'ai' | 'system'
          sender_id: string | null
          body: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          sender_type: 'customer' | 'agent' | 'ai' | 'system'
          sender_id?: string | null
          body: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          sender_type?: 'customer' | 'agent' | 'ai' | 'system'
          sender_id?: string | null
          body?: string
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'tickets'
            referencedColumns: ['id']
          },
        ]
      }
      tags: {
        Row: {
          id: string
          organization_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          color?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tags_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      integrations: {
        Row: {
          id: string
          organization_id: string
          provider: string
          status: string
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          email: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          provider: string
          status?: string
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          email?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          provider?: string
          status?: string
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          email?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'integrations_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      integration_event_receipts: {
        Row: {
          id: string
          organization_id: string
          provider: string
          external_id: string
          source: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          provider: string
          external_id: string
          source?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          provider?: string
          external_id?: string
          source?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'integration_event_receipts_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          organization_id: string
          ticket_id: string
          type: string
          title: string
          body: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          ticket_id: string
          type?: string
          title: string
          body: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          ticket_id?: string
          type?: string
          title?: string
          body?: string
          read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'tickets'
            referencedColumns: ['id']
          },
        ]
      }
      invitations: {
        Row: {
          id: string
          organization_id: string
          email: string
          role: 'owner' | 'admin' | 'agent'
          invited_by: string
          token: string
          status: 'pending' | 'accepted' | 'expired' | 'revoked'
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          role?: 'owner' | 'admin' | 'agent'
          invited_by: string
          token?: string
          status?: 'pending' | 'accepted' | 'expired' | 'revoked'
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          role?: 'owner' | 'admin' | 'agent'
          invited_by?: string
          token?: string
          status?: 'pending' | 'accepted' | 'expired' | 'revoked'
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'invitations_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invitations_invited_by_fkey'
            columns: ['invited_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      automations: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          is_active: boolean
          trigger_type: string
          trigger_config: Json
          conditions: Json
          action_type: string
          action_config: Json
          execution_count: number
          last_executed_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          is_active?: boolean
          trigger_type: string
          trigger_config?: Json
          conditions?: Json
          action_type: string
          action_config?: Json
          execution_count?: number
          last_executed_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          trigger_type?: string
          trigger_config?: Json
          conditions?: Json
          action_type?: string
          action_config?: Json
          execution_count?: number
          last_executed_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'automations_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'automations_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      automation_logs: {
        Row: {
          id: string
          automation_id: string
          ticket_id: string
          executed_at: string
        }
        Insert: {
          id?: string
          automation_id: string
          ticket_id: string
          executed_at?: string
        }
        Update: {
          id?: string
          automation_id?: string
          ticket_id?: string
          executed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'automation_logs_automation_id_fkey'
            columns: ['automation_id']
            isOneToOne: false
            referencedRelation: 'automations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'automation_logs_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'tickets'
            referencedColumns: ['id']
          },
        ]
      }
      ticket_tags: {
        Row: {
          ticket_id: string
          tag_id: string
        }
        Insert: {
          ticket_id: string
          tag_id: string
        }
        Update: {
          ticket_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ticket_tags_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'tickets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ticket_tags_tag_id_fkey'
            columns: ['tag_id']
            isOneToOne: false
            referencedRelation: 'tags'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      check_rate_limit: {
        Args: {
          p_key: string
          p_max_requests: number
          p_window_ms: number
        }
        Returns: {
          success: boolean
          remaining: number
        }[]
      }
    }
    Enums: {
      user_role: 'owner' | 'admin' | 'agent'
      ticket_status: 'open' | 'pending' | 'resolved' | 'closed'
      ticket_priority: 'low' | 'medium' | 'high' | 'urgent'
      ticket_channel: 'email' | 'form' | 'google_review' | 'manual' | 'instagram' | 'messenger'
      sender_type: 'customer' | 'agent' | 'ai' | 'system'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ---------------------------------------------------------------------------
// Helper types — raccourcis pour accéder aux Row de chaque table
// ---------------------------------------------------------------------------

export type Organization = Database['public']['Tables']['organizations']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Ticket = Database['public']['Tables']['tickets']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
export type TicketTag = Database['public']['Tables']['ticket_tags']['Row']
export type Integration = Database['public']['Tables']['integrations']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Invitation = Database['public']['Tables']['invitations']['Row']
export type Automation = Database['public']['Tables']['automations']['Row']
export type AutomationLog = Database['public']['Tables']['automation_logs']['Row']
