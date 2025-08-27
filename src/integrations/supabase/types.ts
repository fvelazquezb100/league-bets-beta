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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      backup_bet_selections: {
        Row: {
          bet_id: number | null
          created_at: string | null
          fixture_id: number | null
          id: number | null
          market: string | null
          match_description: string | null
          odds: number | null
          selection: string | null
          status: string | null
        }
        Insert: {
          bet_id?: number | null
          created_at?: string | null
          fixture_id?: number | null
          id?: number | null
          market?: string | null
          match_description?: string | null
          odds?: number | null
          selection?: string | null
          status?: string | null
        }
        Update: {
          bet_id?: number | null
          created_at?: string | null
          fixture_id?: number | null
          id?: number | null
          market?: string | null
          match_description?: string | null
          odds?: number | null
          selection?: string | null
          status?: string | null
        }
        Relationships: []
      }
      backup_bets: {
        Row: {
          bet_selection: string | null
          bet_type: string | null
          fixture_id: number | null
          id: number | null
          match_description: string | null
          odds: number | null
          payout: number | null
          stake: number | null
          status: string | null
          user_id: string | null
          week: string | null
        }
        Insert: {
          bet_selection?: string | null
          bet_type?: string | null
          fixture_id?: number | null
          id?: number | null
          match_description?: string | null
          odds?: number | null
          payout?: number | null
          stake?: number | null
          status?: string | null
          user_id?: string | null
          week?: string | null
        }
        Update: {
          bet_selection?: string | null
          bet_type?: string | null
          fixture_id?: number | null
          id?: number | null
          match_description?: string | null
          odds?: number | null
          payout?: number | null
          stake?: number | null
          status?: string | null
          user_id?: string | null
          week?: string | null
        }
        Relationships: []
      }
      backup_profiles_points: {
        Row: {
          id: string | null
          total_points: number | null
        }
        Insert: {
          id?: string | null
          total_points?: number | null
        }
        Update: {
          id?: string | null
          total_points?: number | null
        }
        Relationships: []
      }
      bet_selections: {
        Row: {
          bet_id: number
          created_at: string | null
          fixture_id: number | null
          id: number
          market: string | null
          match_description: string | null
          odds: number | null
          selection: string | null
          status: string | null
        }
        Insert: {
          bet_id: number
          created_at?: string | null
          fixture_id?: number | null
          id?: number
          market?: string | null
          match_description?: string | null
          odds?: number | null
          selection?: string | null
          status?: string | null
        }
        Update: {
          bet_id?: number
          created_at?: string | null
          fixture_id?: number | null
          id?: number
          market?: string | null
          match_description?: string | null
          odds?: number | null
          selection?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bet_selections_bet_id_fkey"
            columns: ["bet_id"]
            isOneToOne: false
            referencedRelation: "bets"
            referencedColumns: ["id"]
          },
        ]
      }
      bets: {
        Row: {
          bet_selection: string | null
          bet_type: string | null
          fixture_id: number | null
          id: number
          market_bets: string | null
          match_description: string | null
          odds: number | null
          payout: number | null
          stake: number | null
          status: string | null
          user_id: string
          week: string | null
        }
        Insert: {
          bet_selection?: string | null
          bet_type?: string | null
          fixture_id?: number | null
          id?: number
          market_bets?: string | null
          match_description?: string | null
          odds?: number | null
          payout?: number | null
          stake?: number | null
          status?: string | null
          user_id: string
          week?: string | null
        }
        Update: {
          bet_selection?: string | null
          bet_type?: string | null
          fixture_id?: number | null
          id?: number
          market_bets?: string | null
          match_description?: string | null
          odds?: number | null
          payout?: number | null
          stake?: number | null
          status?: string | null
          user_id?: string
          week?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          budget: number | null
          created_at: string
          id: number
          join_code: string | null
          league_season: number | null
          max_bet: number | null
          min_bet: number | null
          name: string | null
          previous_champion: string | null
          previous_last: string | null
          reset_budget: string | null
          type: Database["public"]["Enums"]["league_type"]
          week: number
        }
        Insert: {
          budget?: number | null
          created_at?: string
          id?: number
          join_code?: string | null
          league_season?: number | null
          max_bet?: number | null
          min_bet?: number | null
          name?: string | null
          previous_champion?: string | null
          previous_last?: string | null
          reset_budget?: string | null
          type?: Database["public"]["Enums"]["league_type"]
          week?: number
        }
        Update: {
          budget?: number | null
          created_at?: string
          id?: number
          join_code?: string | null
          league_season?: number | null
          max_bet?: number | null
          min_bet?: number | null
          name?: string | null
          previous_champion?: string | null
          previous_last?: string | null
          reset_budget?: string | null
          type?: Database["public"]["Enums"]["league_type"]
          week?: number
        }
        Relationships: []
      }
      match_odds_cache: {
        Row: {
          data: Json
          id: number
          last_updated: string | null
        }
        Insert: {
          data: Json
          id?: number
          last_updated?: string | null
        }
        Update: {
          data?: Json
          id?: number
          last_updated?: string | null
        }
        Relationships: []
      }
      news: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: number
          is_active: boolean
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: number
          is_active?: boolean
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: number
          is_active?: boolean
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          global_role: string | null
          id: string
          last_week_points: number | null
          league_id: number | null
          role: string
          total_points: number | null
          username: string
          weekly_budget: number | null
        }
        Insert: {
          global_role?: string | null
          id?: string
          last_week_points?: number | null
          league_id?: number | null
          role?: string
          total_points?: number | null
          username: string
          weekly_budget?: number | null
        }
        Update: {
          global_role?: string | null
          id?: string
          last_week_points?: number | null
          league_id?: number | null
          role?: string
          total_points?: number | null
          username?: string
          weekly_budget?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_performance: {
        Row: {
          created_at: string
          end_date: string
          id: number
          league_id: number | null
          net_profit: number
          start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: number
          league_id?: number | null
          net_profit?: number
          start_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: number
          league_id?: number | null
          net_profit?: number
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_performance_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_performance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_and_store_weekly_performance: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cancel_bet: {
        Args: { bet_id_param: number }
        Returns: Json
      }
      check_username_availability: {
        Args: { username_to_check: string }
        Returns: boolean
      }
      create_league_and_join: {
        Args: { _league_name: string; _user_id: string }
        Returns: undefined
      }
      cron_process_results: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_user_global_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_league_id: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_current_user_league_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_stuck_combo_bets: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
        }[]
      }
      has_admin_privileges: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_superadmin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      join_league_with_code: {
        Args: { _join_code: string; _user_id: string }
        Returns: boolean
      }
      place_combo_bet: {
        Args: { selections: Json; stake_amount: number }
        Returns: number
      }
      recalc_total_points: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reset_weekly_budgets: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      schedule_one_time_http_call: {
        Args: {
          auth_header: string
          body: string
          job_name: string
          schedule: string
          url: string
        }
        Returns: string
      }
      update_combo_bet_status: {
        Args: { bet_id_to_check: number }
        Returns: undefined
      }
      update_last_week_points: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_league_points: {
        Args: { points_to_add: number; user_id: string }
        Returns: undefined
      }
      update_username: {
        Args: { new_username: string }
        Returns: Database["public"]["CompositeTypes"]["username_update_result"]
      }
    }
    Enums: {
      league_type: "free" | "premium"
    }
    CompositeTypes: {
      username_update_result: {
        success: boolean | null
        message: string | null
      }
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
      league_type: ["free", "premium"],
    },
  },
} as const
