export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ad_metrics_logs: {
        Row: {
          edit_details: Json
          level: string
          log_created_at: string | null
          log_id: number
          metrics_details: Json
          object_id: string
          user: string
        }
        Insert: {
          edit_details: Json
          level: string
          log_created_at?: string | null
          log_id?: number
          metrics_details: Json
          object_id: string
          user: string
        }
        Update: {
          edit_details?: Json
          level?: string
          log_created_at?: string | null
          log_id?: number
          metrics_details?: Json
          object_id?: string
          user?: string
        }
        Relationships: []
      }
      ad_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          level: string
          name: string
          sql_query: string | null
          target_id: string | null
          updated_at: string | null
        }
        Insert: {
          actions: Json
          conditions: Json
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          level: string
          name: string
          sql_query?: string | null
          target_id?: string | null
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          level?: string
          name?: string
          sql_query?: string | null
          target_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ad_rules_logs: {
        Row: {
          created_at: string | null
          details: string
          id: number
          new_rule: boolean | null
          user: string
        }
        Insert: {
          created_at?: string | null
          details: string
          id?: number
          new_rule?: boolean | null
          user: string
        }
        Update: {
          created_at?: string | null
          details?: string
          id?: number
          new_rule?: boolean | null
          user?: string
        }
        Relationships: []
      }
      ad_tasks: {
        Row: {
          created_at: string | null
          details: Json
          execute_at: string | null
          id: number
        }
        Insert: {
          created_at?: string | null
          details: Json
          execute_at?: string | null
          id?: number
        }
        Update: {
          created_at?: string | null
          details?: Json
          execute_at?: string | null
          id?: number
        }
        Relationships: []
      }
      meta_ads_activies: {
        Row: {
          account_name: string | null
          actor_id: string | null
          actor_name: string | null
          application_id: string | null
          application_name: string | null
          date_time_in_timezone: string | null
          event_time: string | null
          event_type: string | null
          extra_data: string | null
          id: string
          object_id: string | null
          object_name: string | null
          object_type: string | null
          translated_event_type: string | null
        }
        Insert: {
          account_name?: string | null
          actor_id?: string | null
          actor_name?: string | null
          application_id?: string | null
          application_name?: string | null
          date_time_in_timezone?: string | null
          event_time?: string | null
          event_type?: string | null
          extra_data?: string | null
          id: string
          object_id?: string | null
          object_name?: string | null
          object_type?: string | null
          translated_event_type?: string | null
        }
        Update: {
          account_name?: string | null
          actor_id?: string | null
          actor_name?: string | null
          application_id?: string | null
          application_name?: string | null
          date_time_in_timezone?: string | null
          event_time?: string | null
          event_type?: string | null
          extra_data?: string | null
          id?: string
          object_id?: string | null
          object_name?: string | null
          object_type?: string | null
          translated_event_type?: string | null
        }
        Relationships: []
      }
      meta_ads_metrics: {
        Row: {
          account_id: string | null
          account_name: string | null
          ad_id: string
          ad_name: string | null
          adset_budget: number | null
          adset_id: string | null
          adset_name: string | null
          adset_status: string | null
          campaign_budget: number | null
          campaign_id: string | null
          campaign_name: string | null
          campaign_status: string | null
          cpm: number | null
          created_at: string | null
          date_start: string | null
          date_stop: string | null
          device_platform: string | null
          effective_status: string | null
          frequency: number | null
          full_view_impressions: number | null
          full_view_reach: number | null
          guru_return: number | null
          guru_sales: number | null
          id: number
          impressions: number | null
          inline_post_engagement: number | null
          objective: string | null
          omni_purchase: number | null
          outbound_clicks: number | null
          outbound_clicks_ctr: number | null
          platform_position: string | null
          preview_shareable_link: string | null
          publisher_platform: string | null
          spend: number | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          ad_id: string
          ad_name?: string | null
          adset_budget?: number | null
          adset_id?: string | null
          adset_name?: string | null
          adset_status?: string | null
          campaign_budget?: number | null
          campaign_id?: string | null
          campaign_name?: string | null
          campaign_status?: string | null
          cpm?: number | null
          created_at?: string | null
          date_start?: string | null
          date_stop?: string | null
          device_platform?: string | null
          effective_status?: string | null
          frequency?: number | null
          full_view_impressions?: number | null
          full_view_reach?: number | null
          guru_return?: number | null
          guru_sales?: number | null
          id?: number
          impressions?: number | null
          inline_post_engagement?: number | null
          objective?: string | null
          omni_purchase?: number | null
          outbound_clicks?: number | null
          outbound_clicks_ctr?: number | null
          platform_position?: string | null
          preview_shareable_link?: string | null
          publisher_platform?: string | null
          spend?: number | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          ad_id?: string
          ad_name?: string | null
          adset_budget?: number | null
          adset_id?: string | null
          adset_name?: string | null
          adset_status?: string | null
          campaign_budget?: number | null
          campaign_id?: string | null
          campaign_name?: string | null
          campaign_status?: string | null
          cpm?: number | null
          created_at?: string | null
          date_start?: string | null
          date_stop?: string | null
          device_platform?: string | null
          effective_status?: string | null
          frequency?: number | null
          full_view_impressions?: number | null
          full_view_reach?: number | null
          guru_return?: number | null
          guru_sales?: number | null
          id?: number
          impressions?: number | null
          inline_post_engagement?: number | null
          objective?: string | null
          omni_purchase?: number | null
          outbound_clicks?: number | null
          outbound_clicks_ctr?: number | null
          platform_position?: string | null
          preview_shareable_link?: string | null
          publisher_platform?: string | null
          spend?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      meta_ads_metrics_temp: {
        Row: {
          account_id: string | null
          account_name: string | null
          ad_id: string
          ad_name: string | null
          adset_id: string | null
          adset_name: string | null
          adset_status: string | null
          age: string | null
          campaign_id: string | null
          campaign_name: string | null
          campaign_status: string | null
          cpm: number | null
          created_at: string | null
          date_start: string | null
          date_stop: string | null
          device_platform: string | null
          effective_status: string | null
          frequency: number | null
          full_view_impressions: number | null
          full_view_reach: number | null
          gender: string | null
          guru_return: number | null
          guru_sales: number | null
          id: number
          impression_device: string | null
          impressions: number | null
          inline_post_engagement: number | null
          objective: string | null
          omni_purchase: number | null
          outbound_clicks: number | null
          outbound_clicks_ctr: number | null
          platform_position: string | null
          preview_shareable_link: string | null
          publisher_platform: string | null
          spend: number | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          ad_id: string
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          adset_status?: string | null
          age?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          campaign_status?: string | null
          cpm?: number | null
          created_at?: string | null
          date_start?: string | null
          date_stop?: string | null
          device_platform?: string | null
          effective_status?: string | null
          frequency?: number | null
          full_view_impressions?: number | null
          full_view_reach?: number | null
          gender?: string | null
          guru_return?: number | null
          guru_sales?: number | null
          id?: number
          impression_device?: string | null
          impressions?: number | null
          inline_post_engagement?: number | null
          objective?: string | null
          omni_purchase?: number | null
          outbound_clicks?: number | null
          outbound_clicks_ctr?: number | null
          platform_position?: string | null
          preview_shareable_link?: string | null
          publisher_platform?: string | null
          spend?: number | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          ad_id?: string
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          adset_status?: string | null
          age?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          campaign_status?: string | null
          cpm?: number | null
          created_at?: string | null
          date_start?: string | null
          date_stop?: string | null
          device_platform?: string | null
          effective_status?: string | null
          frequency?: number | null
          full_view_impressions?: number | null
          full_view_reach?: number | null
          gender?: string | null
          guru_return?: number | null
          guru_sales?: number | null
          id?: number
          impression_device?: string | null
          impressions?: number | null
          inline_post_engagement?: number | null
          objective?: string | null
          omni_purchase?: number | null
          outbound_clicks?: number | null
          outbound_clicks_ctr?: number | null
          platform_position?: string | null
          preview_shareable_link?: string | null
          publisher_platform?: string | null
          spend?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      meta_ads_sales: {
        Row: {
          ad_id: string | null
          ad_name: string | null
          adset_name: string | null
          campaign_name: string | null
          confirmed_at: string | null
          product_name: string | null
          product_value: number | null
          status: string | null
          transaction_id: string
        }
        Insert: {
          ad_id?: string | null
          ad_name?: string | null
          adset_name?: string | null
          campaign_name?: string | null
          confirmed_at?: string | null
          product_name?: string | null
          product_value?: number | null
          status?: string | null
          transaction_id: string
        }
        Update: {
          ad_id?: string | null
          ad_name?: string | null
          adset_name?: string | null
          campaign_name?: string | null
          confirmed_at?: string | null
          product_name?: string | null
          product_value?: number | null
          status?: string | null
          transaction_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      meta_ads_view: {
        Row: {
          account_name: string | null
          ad_id: string | null
          ad_name: string | null
          ad_status_final: string | null
          ad_status_native: string | null
          adset_id: string | null
          adset_name: string | null
          adset_status_final: string | null
          adset_status_native: string | null
          campaign_id: string | null
          campaign_name: string | null
          campaign_status_final: string | null
          campaign_status_native: string | null
          clicks: number | null
          daily_budget: number | null
          daily_budget_per_row: number | null
          date_start: string | null
          impressions: number | null
          is_adset_level_budget: boolean | null
          preview_shareable_link: string | null
          profit: number | null
          real_revenue: number | null
          real_sales: number | null
          spend: number | null
        }
        Relationships: []
      }
      meta_ads_account_hourly_view: {
        Row: {
          account_name: string | null
          date_brt: string | null
          hour_of_day: number | null
          spend_hour: number | null
          real_sales_hour: number | null
          impressions_hour: number | null
          clicks_hour: number | null
        }
        Relationships: []
      }
      meta_ads_view_temp: {
        Row: {
          account_name: string | null
          ad_id: string | null
          ad_name: string | null
          adset_name: string | null
          adset_status: string | null
          campaign_name: string | null
          campaign_status: string | null
          clicks: number | null
          date_start: string | null
          device_platform: string | null
          effective_status: string | null
          impression_device: string | null
          impressions: number | null
          platform_position: string | null
          profit: number | null
          publisher_platform: string | null
          real_revenue: number | null
          real_sales: number | null
          spend: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_ad_logs: {
        Args: { ad_id: string }
        Returns: {
          log_id: number
          log_created_at: string
          edit_details: string
          metrics_details: Json
          user: string
          object_id: string
          level: string
        }[]
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
