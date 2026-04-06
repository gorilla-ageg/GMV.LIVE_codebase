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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      brand_profiles: {
        Row: {
          campaign_images: string[] | null
          company_name: string
          created_at: string
          id: string
          industries: string[] | null
          industry: string | null
          logo_url: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          campaign_images?: string[] | null
          company_name?: string
          created_at?: string
          id?: string
          industries?: string[] | null
          industry?: string | null
          logo_url?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          campaign_images?: string[] | null
          company_name?: string
          created_at?: string
          id?: string
          industries?: string[] | null
          industry?: string | null
          logo_url?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_profiles_profile_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_profiles_profile_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          brand_signed_at: string | null
          created_at: string
          creator_signed_at: string | null
          deal_id: string
          id: string
          pdf_url: string | null
          terms: Json
        }
        Insert: {
          brand_signed_at?: string | null
          created_at?: string
          creator_signed_at?: string | null
          deal_id: string
          id?: string
          pdf_url?: string | null
          terms?: Json
        }
        Update: {
          brand_signed_at?: string | null
          created_at?: string
          creator_signed_at?: string | null
          deal_id?: string
          id?: string
          pdf_url?: string | null
          terms?: Json
        }
        Relationships: [
          {
            foreignKeyName: "contracts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          brand_user_id: string
          created_at: string
          creator_user_id: string
          id: string
          last_message_at: string | null
          product_id: string | null
        }
        Insert: {
          brand_user_id: string
          created_at?: string
          creator_user_id: string
          id?: string
          last_message_at?: string | null
          product_id?: string | null
        }
        Update: {
          brand_user_id?: string
          created_at?: string
          creator_user_id?: string
          id?: string
          last_message_at?: string | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_brand_profile_fkey"
            columns: ["brand_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_brand_profile_fkey"
            columns: ["brand_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_creator_profile_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_creator_profile_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_profiles: {
        Row: {
          audience_type: string | null
          avg_gmv: number | null
          created_at: string
          experience_level: string | null
          facebook_handle: string | null
          first_name: string | null
          follower_count: number | null
          has_tiktok_affiliate: string | null
          id: string
          instagram_handle: string | null
          last_name: string | null
          location: string | null
          niches: string[] | null
          past_collabs: string[] | null
          payment_handle: string | null
          payment_method: string | null
          platforms: string[] | null
          portfolio_urls: string[] | null
          product_interests: string[] | null
          rating: number | null
          tiktok_handle: string | null
          twitter_handle: string | null
          user_id: string
          youtube_handle: string | null
        }
        Insert: {
          audience_type?: string | null
          avg_gmv?: number | null
          created_at?: string
          experience_level?: string | null
          facebook_handle?: string | null
          first_name?: string | null
          follower_count?: number | null
          has_tiktok_affiliate?: string | null
          id?: string
          instagram_handle?: string | null
          last_name?: string | null
          location?: string | null
          niches?: string[] | null
          past_collabs?: string[] | null
          payment_handle?: string | null
          payment_method?: string | null
          platforms?: string[] | null
          portfolio_urls?: string[] | null
          product_interests?: string[] | null
          rating?: number | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          user_id: string
          youtube_handle?: string | null
        }
        Update: {
          audience_type?: string | null
          avg_gmv?: number | null
          created_at?: string
          experience_level?: string | null
          facebook_handle?: string | null
          first_name?: string | null
          follower_count?: number | null
          has_tiktok_affiliate?: string | null
          id?: string
          instagram_handle?: string | null
          last_name?: string | null
          location?: string | null
          niches?: string[] | null
          past_collabs?: string[] | null
          payment_handle?: string | null
          payment_method?: string | null
          platforms?: string[] | null
          portfolio_urls?: string[] | null
          product_interests?: string[] | null
          rating?: number | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          user_id?: string
          youtube_handle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_profiles_profile_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_profiles_profile_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_offers: {
        Row: {
          commission_percentage: number
          created_at: string
          deal_id: string
          deliverables: string | null
          hourly_rate: number
          hours: number
          id: string
          live_date: string | null
          note: string | null
          rate: number | null
          sender_id: string
          status: Database["public"]["Enums"]["offer_status"]
          usage_rights: string[] | null
        }
        Insert: {
          commission_percentage: number
          created_at?: string
          deal_id: string
          deliverables?: string | null
          hourly_rate: number
          hours: number
          id?: string
          live_date?: string | null
          note?: string | null
          rate?: number | null
          sender_id: string
          status?: Database["public"]["Enums"]["offer_status"]
          usage_rights?: string[] | null
        }
        Update: {
          commission_percentage?: number
          created_at?: string
          deal_id?: string
          deliverables?: string | null
          hourly_rate?: number
          hours?: number
          id?: string
          live_date?: string | null
          note?: string | null
          rate?: number | null
          sender_id?: string
          status?: Database["public"]["Enums"]["offer_status"]
          usage_rights?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_offers_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_signatures: {
        Row: {
          deal_id: string
          full_name: string
          id: string
          signed_at: string
          user_id: string
        }
        Insert: {
          deal_id: string
          full_name: string
          id?: string
          signed_at?: string
          user_id: string
        }
        Update: {
          deal_id?: string
          full_name?: string
          id?: string
          signed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_signatures_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          commission_percentage: number | null
          conversation_id: string
          created_at: string
          deliverables: string | null
          hourly_rate: number | null
          hours: number | null
          id: string
          live_date: string | null
          payment_method_used: string | null
          payment_status: string | null
          rate: number | null
          status: Database["public"]["Enums"]["deal_status"]
          total_amount: number | null
          updated_at: string
          usage_rights: string[] | null
        }
        Insert: {
          commission_percentage?: number | null
          conversation_id: string
          created_at?: string
          deliverables?: string | null
          hourly_rate?: number | null
          hours?: number | null
          id?: string
          live_date?: string | null
          payment_method_used?: string | null
          payment_status?: string | null
          rate?: number | null
          status?: Database["public"]["Enums"]["deal_status"]
          total_amount?: number | null
          updated_at?: string
          usage_rights?: string[] | null
        }
        Update: {
          commission_percentage?: number | null
          conversation_id?: string
          created_at?: string
          deliverables?: string | null
          hourly_rate?: number | null
          hours?: number | null
          id?: string
          live_date?: string | null
          payment_method_used?: string | null
          payment_status?: string | null
          rate?: number | null
          status?: Database["public"]["Enums"]["deal_status"]
          total_amount?: number | null
          updated_at?: string
          usage_rights?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_payments: {
        Row: {
          amount: number
          created_at: string
          deal_id: string
          funded_at: string | null
          id: string
          released_at: string | null
          status: Database["public"]["Enums"]["escrow_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          deal_id: string
          funded_at?: string | null
          id?: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          deal_id?: string
          funded_at?: string | null
          id?: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
        }
        Relationships: [
          {
            foreignKeyName: "escrow_payments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      live_analytics: {
        Row: {
          approved_at: string | null
          created_at: string
          creator_id: string
          deal_id: string
          gmv: number | null
          id: string
          likes: number | null
          orders: number | null
          peak_viewers: number | null
          stream_link: string | null
          submitted_at: string | null
          total_viewers: number | null
          watch_time_avg: number | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          creator_id: string
          deal_id: string
          gmv?: number | null
          id?: string
          likes?: number | null
          orders?: number | null
          peak_viewers?: number | null
          stream_link?: string | null
          submitted_at?: string | null
          total_viewers?: number | null
          watch_time_avg?: number | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          creator_id?: string
          deal_id?: string
          gmv?: number | null
          id?: string
          likes?: number | null
          orders?: number | null
          peak_viewers?: number | null
          stream_link?: string | null
          submitted_at?: string | null
          total_viewers?: number | null
          watch_time_avg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_analytics_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          affiliate_link: string | null
          brand_id: string
          budget_max: number | null
          budget_min: number | null
          category: string | null
          commission_info: string | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          past_month_gmv: number | null
          preferred_date: string | null
          status: Database["public"]["Enums"]["product_status"]
          target_platforms: string[] | null
          title: string
        }
        Insert: {
          affiliate_link?: string | null
          brand_id: string
          budget_max?: number | null
          budget_min?: number | null
          category?: string | null
          commission_info?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          past_month_gmv?: number | null
          preferred_date?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          target_platforms?: string[] | null
          title: string
        }
        Update: {
          affiliate_link?: string | null
          brand_id?: string
          budget_max?: number | null
          budget_min?: number | null
          category?: string | null
          commission_info?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          past_month_gmv?: number | null
          preferred_date?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          target_platforms?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_profile_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_brand_profile_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          onboarding_completed: boolean
          onboarding_step: string | null
          profile_images: string[] | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id: string
          onboarding_completed?: boolean
          onboarding_step?: string | null
          profile_images?: string[] | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          onboarding_completed?: boolean
          onboarding_step?: string | null
          profile_images?: string[] | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      shipments: {
        Row: {
          carrier: string | null
          created_at: string
          deal_id: string
          delivered_at: string | null
          id: string
          shipped_at: string | null
          status: Database["public"]["Enums"]["shipment_status"]
          tracking_number: string | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          deal_id: string
          delivered_at?: string | null
          id?: string
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string | null
        }
        Update: {
          carrier?: string | null
          created_at?: string
          deal_id?: string
          delivered_at?: string | null
          id?: string
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          role: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          display_name: string | null
          id: string | null
          role: Database["public"]["Enums"]["app_role"] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_analytics: { Args: { _deal_id: string }; Returns: undefined }
      fund_escrow: { Args: { _deal_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      release_escrow: { Args: { _deal_id: string }; Returns: undefined }
      set_user_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "creator" | "brand"
      deal_status:
        | "negotiating"
        | "agreed"
        | "signed"
        | "escrow_funded"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "contracted"
        | "funded"
        | "shipped"
        | "delivered"
        | "live"
        | "disputed"
      escrow_status: "pending" | "funded" | "released" | "refunded"
      offer_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "countered"
        | "expired"
      product_status: "active" | "paused" | "closed"
      shipment_status: "pending" | "shipped" | "in_transit" | "delivered"
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
    Enums: {
      app_role: ["creator", "brand"],
      deal_status: [
        "negotiating",
        "agreed",
        "signed",
        "escrow_funded",
        "in_progress",
        "completed",
        "cancelled",
        "contracted",
        "funded",
        "shipped",
        "delivered",
        "live",
        "disputed",
      ],
      escrow_status: ["pending", "funded", "released", "refunded"],
      offer_status: ["pending", "accepted", "rejected", "countered", "expired"],
      product_status: ["active", "paused", "closed"],
      shipment_status: ["pending", "shipped", "in_transit", "delivered"],
    },
  },
} as const
