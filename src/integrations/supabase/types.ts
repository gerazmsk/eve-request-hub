export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          provider_id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string
          id?: string
          provider_id: string
          type?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          provider_id?: string
          type?: string
        }
        Relationships: []
      }
      group_chat_members: {
        Row: {
          group_chat_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_chat_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_chat_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_members_group_chat_id_fkey"
            columns: ["group_chat_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chats: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      group_messages: {
        Row: {
          created_at: string
          group_chat_id: string
          id: string
          sender_id: string
          text: string
        }
        Insert: {
          created_at?: string
          group_chat_id: string
          id?: string
          sender_id: string
          text: string
        }
        Update: {
          created_at?: string
          group_chat_id?: string
          id?: string
          sender_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_chat_id_fkey"
            columns: ["group_chat_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          client_id: string
          created_at: string
          id: string
          provider_id: string
          request_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          provider_id: string
          request_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          provider_id?: string
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string
          id: string
          sender_id: string
          text: string
          thread_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sender_id: string
          text: string
          thread_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sender_id?: string
          text?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string
          id: string
          is_verified: boolean
          last_name: string
          phone: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name?: string
          id?: string
          is_verified?: boolean
          last_name?: string
          phone?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          is_verified?: boolean
          last_name?: string
          phone?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_availability: {
        Row: {
          created_at: string
          date: string
          id: string
          provider_id: string
          time_slots: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          provider_id: string
          time_slots?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          provider_id?: string
          time_slots?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      provider_credits: {
        Row: {
          balance: number
          id: string
          provider_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          id?: string
          provider_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          id?: string
          provider_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_events: {
        Row: {
          address: string
          client_name: string
          created_at: string
          date: string
          email: string
          id: string
          job_cost: string
          phone: string
          provider_id: string
          status: string
          updated_at: string
        }
        Insert: {
          address?: string
          client_name?: string
          created_at?: string
          date: string
          email?: string
          id?: string
          job_cost?: string
          phone?: string
          provider_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string
          client_name?: string
          created_at?: string
          date?: string
          email?: string
          id?: string
          job_cost?: string
          phone?: string
          provider_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_profiles: {
        Row: {
          about: string
          category: string
          cover_image: string
          created_at: string
          gallery: string[]
          id: string
          location: string
          price_label: string
          profile_image: string
          rating: number
          review_count: number
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          about?: string
          category?: string
          cover_image?: string
          created_at?: string
          gallery?: string[]
          id?: string
          location?: string
          price_label?: string
          profile_image?: string
          rating?: number
          review_count?: number
          tags?: string[]
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          about?: string
          category?: string
          cover_image?: string
          created_at?: string
          gallery?: string[]
          id?: string
          location?: string
          price_label?: string
          profile_image?: string
          rating?: number
          review_count?: number
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_profiles_profile_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      provider_unlocks: {
        Row: {
          created_at: string
          id: string
          provider_id: string
          target_id: string
          unlock_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          provider_id: string
          target_id: string
          unlock_type: string
        }
        Update: {
          created_at?: string
          id?: string
          provider_id?: string
          target_id?: string
          unlock_type?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          service_request_id: string
        }
        Insert: {
          comment?: string
          created_at?: string
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          service_request_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          service_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          budget: string
          category: string
          client_id: string
          created_at: string
          event_date: string
          event_time: string
          event_type: string
          hours: number | null
          id: string
          location: string
          notes: string
          provider_id: string
          status: string
        }
        Insert: {
          budget?: string
          category: string
          client_id: string
          created_at?: string
          event_date: string
          event_time: string
          event_type: string
          hours?: number | null
          id?: string
          location?: string
          notes?: string
          provider_id: string
          status?: string
        }
        Update: {
          budget?: string
          category?: string
          client_id?: string
          created_at?: string
          event_date?: string
          event_time?: string
          event_type?: string
          hours?: number | null
          id?: string
          location?: string
          notes?: string
          provider_id?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      unlock_provider_target: {
        Args: { _cost?: number; _target_id: string; _unlock_type: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
