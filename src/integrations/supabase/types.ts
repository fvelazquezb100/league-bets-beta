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
          created_at: string | null
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
          created_at?: string | null
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
          created_at?: string | null
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
      betting_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          setting_key: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          setting_key: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      leagues: {
        Row: {
          available_leagues: number[] | null
          budget: number | null
          boost_max_stake: number | null
          boost_multiplier: number | null
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
          available_leagues?: number[] | null
          budget?: number | null
          boost_max_stake?: number | null
          boost_multiplier?: number | null
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
          available_leagues?: number[] | null
          budget?: number | null
          boost_max_stake?: number | null
          boost_multiplier?: number | null
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
      match_availability_control: {
        Row: {
          created_at: string | null
          date: string
          id: number
          is_live_betting_enabled: boolean | null
          league_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: number
          is_live_betting_enabled?: boolean | null
          league_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: number
          is_live_betting_enabled?: boolean | null
          league_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_availability_control_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      match_blocks: {
        Row: {
          blocked_user_id: string
          blocker_user_id: string
          created_at: string
          fixture_id: number
          id: number
          league_id: number
          status: string
          updated_at: string
          week: number
        }
        Insert: {
          blocked_user_id: string
          blocker_user_id: string
          created_at?: string
          fixture_id: number
          id?: number
          league_id: number
          status?: string
          updated_at?: string
          week: number
        }
        Update: {
          blocked_user_id?: string
          blocker_user_id?: string
          created_at?: string
          fixture_id?: number
          id?: number
          league_id?: number
          status?: string
          updated_at?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_blocks_blocked_user_id_fkey"
            columns: ["blocked_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_blocks_blocker_user_id_fkey"
            columns: ["blocker_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_blocks_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      match_odds_cache: {
        Row: {
          data: Json
          id: number
          info: string | null
          last_updated: string | null
        }
        Insert: {
          data?: Json
          id?: number
          info?: string | null
          last_updated?: string | null
        }
        Update: {
          data?: Json
          id?: number
          info?: string | null
          last_updated?: string | null
        }
        Relationships: []
      }
      match_results: {
        Row: {
          away_goals: number | null
          away_team: string | null
          finished_at: string | null
          fixture_id: number
          halftime_away: number | null
          halftime_home: number | null
          home_goals: number | null
          home_team: string | null
          kickoff_time: string | null
          league_id: number | null
          match_name: string | null
          match_result: string | null
          match_status: string | null
          outcome: string | null
          penalty_away: number | null
          penalty_home: number | null
          season: number | null
          second_half_away: number | null
          second_half_home: number | null
        }
        Insert: {
          away_goals?: number | null
          away_team?: string | null
          finished_at?: string | null
          fixture_id: number
          halftime_away?: number | null
          halftime_home?: number | null
          home_goals?: number | null
          home_team?: string | null
          kickoff_time?: string | null
          league_id?: number | null
          match_name?: string | null
          match_result?: string | null
          match_status?: string | null
          outcome?: string | null
          penalty_away?: number | null
          penalty_home?: number | null
          season?: number | null
          second_half_away?: number | null
          second_half_home?: number | null
        }
        Update: {
          away_goals?: number | null
          away_team?: string | null
          finished_at?: string | null
          fixture_id?: number
          halftime_away?: number | null
          halftime_home?: number | null
          home_goals?: number | null
          home_team?: string | null
          kickoff_time?: string | null
          league_id?: number | null
          match_name?: string | null
          match_result?: string | null
          match_status?: string | null
          outcome?: string | null
          penalty_away?: number | null
          penalty_home?: number | null
          season?: number | null
          second_half_away?: number | null
          second_half_home?: number | null
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
          is_frozen: boolean
          league_id: number
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: number
          is_active?: boolean
          is_frozen?: boolean
          league_id?: number
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: number
          is_active?: boolean
          is_frozen?: boolean
          league_id?: number
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          blocks_available: number
          blocks_received: number
          global_role: string | null
          id: string
          last_week_points: number | null
          league_id: number | null
          role: string
          total_points: number | null
          username: string
          weekly_budget: number | null
          weekly_points_history: Json | null
        }
        Insert: {
          blocks_available?: number
          blocks_received?: number
          global_role?: string | null
          id?: string
          last_week_points?: number | null
          league_id?: number | null
          role?: string
          total_points?: number | null
          username: string
          weekly_budget?: number | null
          weekly_points_history?: Json | null
        }
        Update: {
          blocks_available?: number
          blocks_received?: number
          global_role?: string | null
          id?: string
          last_week_points?: number | null
          league_id?: number | null
          role?: string
          total_points?: number | null
          username?: string
          weekly_budget?: number | null
          weekly_points_history?: Json | null
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
        Args: never
        Returns: undefined
      }
      cancel_bet: { Args: { bet_id_param: number }; Returns: Json }
      check_username_availability: {
        Args: { username_to_check: string }
        Returns: boolean
      }
      create_league_and_join:
        | {
            Args: { _league_name: string; _user_id: string }
            Returns: undefined
          }
        | {
            Args: { admin_username_param?: string; league_name_param: string }
            Returns: Json
          }
      cron_process_results: { Args: never; Returns: undefined }
      disable_maintenance: { Args: never; Returns: undefined }
      enable_maintenance: { Args: never; Returns: undefined }
      generate_block_news: { Args: never; Returns: Json }
      generate_block_news_for_league: {
        Args: { target_league_id: number }
        Returns: Json
      }
      get_available_leagues: {
        Args: { league_id_param: number }
        Returns: {
          league_id: number
          league_name: string
        }[]
      }
      get_betting_cutoff_minutes: { Args: never; Returns: number }
      get_betting_settings: {
        Args: never
        Returns: {
          description: string
          setting_key: string
          setting_value: string
          updated_at: string
        }[]
      }
      get_current_user_global_role: { Args: never; Returns: string }
      get_current_user_league_id: { Args: never; Returns: number }
      get_current_user_league_role: { Args: never; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_match_availability_status: {
        Args: { check_date?: string }
        Returns: boolean
      }
      get_next_bet_id: { Args: never; Returns: number }
      get_stuck_combo_bets: {
        Args: never
        Returns: {
          id: number
        }[]
      }
      has_admin_privileges: { Args: { user_id?: string }; Returns: boolean }
      initialize_match_availability:
        | {
            Args: {
              default_enabled?: boolean
              end_date: string
              start_date: string
            }
            Returns: undefined
          }
        | {
            Args: {
              default_enabled?: boolean
              end_date: string
              league_id_param?: number
              start_date: string
            }
            Returns: undefined
          }
      is_superadmin: { Args: { user_id?: string }; Returns: boolean }
      join_league_with_code: {
        Args: { _join_code: string; _user_id: string }
        Returns: boolean
      }
      place_combo_bet: {
        Args: { selections: Json; stake_amount: number }
        Returns: number
      }
      place_single_bet: {
        Args: {
          bet_selection: string
          fixture_id_param: number
          market_bets: string
          match_description: string
          odds_value: number
          stake_amount: number
        }
        Returns: number
      }
      process_matchday_results: { Args: never; Returns: undefined }
      recalc_total_points: { Args: never; Returns: undefined }
      reset_bet_sequence: { Args: never; Returns: undefined }
      reset_block_counters: { Args: never; Returns: Json }
      reset_daily_budget: { Args: never; Returns: undefined }
      reset_match_availability: { Args: never; Returns: undefined }
      reset_weekly_budget: { Args: never; Returns: undefined }
      reset_weekly_budgets: { Args: never; Returns: Json }
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
      update_betting_cutoff_minutes: {
        Args: { new_minutes: number }
        Returns: Json
      }
      update_combo_bet_status: {
        Args: { bet_id_to_check: number }
        Returns: undefined
      }
      update_last_week_points: { Args: never; Returns: Json }
      update_league_points: {
        Args: { points_to_add: number; user_id: string }
        Returns: undefined
      }
      update_username: {
        Args: { new_username: string }
        Returns: Database["public"]["CompositeTypes"]["username_update_result"]
        SetofOptions: {
          from: "*"
          to: "username_update_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      validate_available_leagues: {
        Args: { league_ids: number[] }
        Returns: boolean
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
