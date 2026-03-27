export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
  public: {
    Tables: {
      answer_history: {
        Row: {
          answered_at: string
          client_event_id: string | null
          created_at: string
          id: string
          is_correct: boolean | null
          question_id: string
          selected_answer: number[] | null
          session_id: string | null
          skipped: boolean
          synced_at: string | null
          time_spent_capped: boolean
          time_spent_ms: number | null
          user_id: string
        }
        Insert: {
          answered_at?: string
          client_event_id?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id: string
          selected_answer?: number[] | null
          session_id?: string | null
          skipped?: boolean
          synced_at?: string | null
          time_spent_capped?: boolean
          time_spent_ms?: number | null
          user_id: string
        }
        Update: {
          answered_at?: string
          client_event_id?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string
          selected_answer?: number[] | null
          session_id?: string | null
          skipped?: boolean
          synced_at?: string | null
          time_spent_capped?: boolean
          time_spent_ms?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_history_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "study_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_invitations: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          invite_code: string
          max_uses: number
          used_count: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          invite_code: string
          max_uses?: number
          used_count?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          invite_code?: string
          max_uses?: number
          used_count?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beta_invitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_customers: {
        Row: {
          app_store_original_tx_id: string | null
          created_at: string
          google_play_token: string | null
          id: string
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_store_original_tx_id?: string | null
          created_at?: string
          google_play_token?: string | null
          id?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_store_original_tx_id?: string | null
          created_at?: string
          google_play_token?: string | null
          id?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_transactions: {
        Row: {
          amount_jpy: number
          contract_id: string | null
          created_at: string
          currency: string
          id: string
          occurred_at: string
          payment_platform: string
          product_id: string
          provider_txn_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount_jpy: number
          contract_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          occurred_at: string
          payment_platform: string
          product_id: string
          provider_txn_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount_jpy?: number
          contract_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          occurred_at?: string
          payment_platform?: string
          product_id?: string
          provider_txn_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_transactions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "subscription_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          note_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          note_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      card_progress: {
        Row: {
          client_updated_at: string | null
          correct_streak: number
          created_at: string
          ease_factor: number
          id: string
          interval_days: number
          last_reviewed_at: string | null
          next_review_at: string
          review_count: number
          sync_version: number
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_updated_at?: string | null
          correct_streak?: number
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          review_count?: number
          sync_version?: number
          template_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_updated_at?: string | null
          correct_streak?: number
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          review_count?: number
          sync_version?: number
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      card_review_history: {
        Row: {
          client_event_id: string | null
          created_at: string
          ease_factor_after: number | null
          ease_factor_before: number | null
          id: string
          result: string
          reviewed_at: string
          synced_at: string | null
          template_id: string
          user_id: string
        }
        Insert: {
          client_event_id?: string | null
          created_at?: string
          ease_factor_after?: number | null
          ease_factor_before?: number | null
          id?: string
          result: string
          reviewed_at?: string
          synced_at?: string | null
          template_id: string
          user_id: string
        }
        Update: {
          client_event_id?: string | null
          created_at?: string
          ease_factor_after?: number | null
          ease_factor_before?: number | null
          id?: string
          result?: string
          reviewed_at?: string
          synced_at?: string | null
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_review_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_card_stats: {
        Row: {
          again_count: number
          date: string
          easy_count: number
          good_count: number
          hard_count: number
          review_count: number
          template_id: string
        }
        Insert: {
          again_count?: number
          date: string
          easy_count?: number
          good_count?: number
          hard_count?: number
          review_count?: number
          template_id: string
        }
        Update: {
          again_count?: number
          date?: string
          easy_count?: number
          good_count?: number
          hard_count?: number
          review_count?: number
          template_id?: string
        }
        Relationships: []
      }
      daily_question_stats: {
        Row: {
          attempt_count: number
          correct_count: number
          date: string
          question_id: string
          skip_count: number
          total_time_ms: number | null
        }
        Insert: {
          attempt_count?: number
          correct_count?: number
          date: string
          question_id: string
          skip_count?: number
          total_time_ms?: number | null
        }
        Update: {
          attempt_count?: number
          correct_count?: number
          date?: string
          question_id?: string
          skip_count?: number
          total_time_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_question_stats_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tokens: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlements: {
        Row: {
          created_at: string
          entitlement_key: string
          exam_year: number | null
          expires_at: string | null
          granted_at: string
          id: string
          revoked_at: string | null
          source_id: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entitlement_key: string
          exam_year?: number | null
          expires_at?: string | null
          granted_at?: string
          id?: string
          revoked_at?: string | null
          source_id?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          entitlement_key?: string
          exam_year?: number | null
          expires_at?: string | null
          granted_at?: string
          id?: string
          revoked_at?: string | null
          source_id?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      line_accounts: {
        Row: {
          created_at: string
          display_name: string | null
          friend_added_at: string | null
          is_friend: boolean | null
          line_user_id: string
          picture_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          friend_added_at?: string | null
          is_friend?: boolean | null
          line_user_id: string
          picture_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          friend_added_at?: string | null
          is_friend?: boolean | null
          line_user_id?: string
          picture_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "line_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          daily_reminder: boolean
          marketing: boolean
          reminder_time: string | null
          review_due_alert: boolean
          streak_alert: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_reminder?: boolean
          marketing?: boolean
          reminder_time?: string | null
          review_due_alert?: boolean
          streak_alert?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_reminder?: boolean
          marketing?: boolean
          reminder_time?: string | null
          review_due_alert?: boolean
          streak_alert?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_catalog: {
        Row: {
          billing_type: string
          created_at: string
          granted_entitlements: string[]
          id: string
          interval_months: number | null
          is_active: boolean
          name: string
          price_jpy: number
        }
        Insert: {
          billing_type: string
          created_at?: string
          granted_entitlements: string[]
          id: string
          interval_months?: number | null
          is_active?: boolean
          name: string
          price_jpy: number
        }
        Update: {
          billing_type?: string
          created_at?: string
          granted_entitlements?: string[]
          id?: string
          interval_months?: number | null
          is_active?: boolean
          name?: string
          price_jpy?: number
        }
        Relationships: []
      }
      purchase_events: {
        Row: {
          amount_jpy: number | null
          contract_id: string | null
          created_at: string
          currency: string | null
          event_type: string
          id: string
          occurred_at: string | null
          payment_platform: string
          processed_at: string | null
          processing_error: string | null
          processing_state: string
          provider_event_id: string
          provider_payload: Json | null
          received_at: string
          user_id: string | null
        }
        Insert: {
          amount_jpy?: number | null
          contract_id?: string | null
          created_at?: string
          currency?: string | null
          event_type: string
          id?: string
          occurred_at?: string | null
          payment_platform: string
          processed_at?: string | null
          processing_error?: string | null
          processing_state?: string
          provider_event_id: string
          provider_payload?: Json | null
          received_at?: string
          user_id?: string | null
        }
        Update: {
          amount_jpy?: number | null
          contract_id?: string | null
          created_at?: string
          currency?: string | null
          event_type?: string
          id?: string
          occurred_at?: string | null
          payment_platform?: string
          processed_at?: string | null
          processing_error?: string | null
          processing_state?: string
          provider_event_id?: string
          provider_payload?: Json | null
          received_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_events_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "subscription_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      questions_catalog: {
        Row: {
          created_at: string
          exam_round: number | null
          id: string
          is_active: boolean
          seq: number | null
          source_type: string
        }
        Insert: {
          created_at?: string
          exam_round?: number | null
          id: string
          is_active?: boolean
          seq?: number | null
          source_type?: string
        }
        Update: {
          created_at?: string
          exam_round?: number | null
          id?: string
          is_active?: boolean
          seq?: number | null
          source_type?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          cards_count: number
          created_at: string
          ended_at: string | null
          id: string
          platform: string | null
          questions_count: number
          session_type: string
          started_at: string
          user_id: string
        }
        Insert: {
          cards_count?: number
          created_at?: string
          ended_at?: string | null
          id?: string
          platform?: string | null
          questions_count?: number
          session_type: string
          started_at: string
          user_id: string
        }
        Update: {
          cards_count?: number
          created_at?: string
          ended_at?: string | null
          id?: string
          platform?: string | null
          questions_count?: number
          session_type?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_contracts: {
        Row: {
          app_account_token: string | null
          auto_renew_status: boolean
          cancel_at: string | null
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          environment: string
          exam_year: number | null
          grace_period_end: string | null
          id: string
          payment_platform: string
          product_id: string
          provider_subscription_id: string | null
          refund_at: string | null
          refund_reason: string | null
          revoked_at: string | null
          status: string
          store_product_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_account_token?: string | null
          auto_renew_status?: boolean
          cancel_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start: string
          environment?: string
          exam_year?: number | null
          grace_period_end?: string | null
          id?: string
          payment_platform: string
          product_id: string
          provider_subscription_id?: string | null
          refund_at?: string | null
          refund_reason?: string | null
          revoked_at?: string | null
          status?: string
          store_product_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_account_token?: string | null
          auto_renew_status?: boolean
          cancel_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          environment?: string
          exam_year?: number | null
          grace_period_end?: string | null
          id?: string
          payment_platform?: string
          product_id?: string
          provider_subscription_id?: string | null
          refund_at?: string | null
          refund_reason?: string | null
          revoked_at?: string | null
          status?: string
          store_product_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_contracts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_contracts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          last_active_at: string | null
          onboarding_completed_at: string | null
          study_start_date: string | null
          target_exam_year: number | null
          target_score: number | null
          university: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          last_active_at?: string | null
          onboarding_completed_at?: string | null
          study_start_date?: string | null
          target_exam_year?: number | null
          target_score?: number | null
          university?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          last_active_at?: string | null
          onboarding_completed_at?: string | null
          study_start_date?: string | null
          target_exam_year?: number | null
          target_score?: number | null
          university?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          deletion_requested_at: string | null
          id: string
          purged_at: string | null
          role: string
          scheduled_purge_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deletion_requested_at?: string | null
          id: string
          purged_at?: string | null
          role?: string
          scheduled_purge_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deletion_requested_at?: string | null
          id?: string
          purged_at?: string | null
          role?: string
          scheduled_purge_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_purchase: {
        Args: { p_exam_year?: number; p_product_id: string }
        Returns: Json
      }
      check_entitlement: {
        Args: { p_exam_year?: number; p_key: string; p_user_id: string }
        Returns: boolean
      }
      check_my_entitlement: {
        Args: { p_exam_year?: number; p_key: string }
        Returns: boolean
      }
      merge_card_progress: {
        Args: { p_events: Json; p_template_id: string; p_user_id: string }
        Returns: {
          client_updated_at: string | null
          correct_streak: number
          created_at: string
          ease_factor: number
          id: string
          interval_days: number
          last_reviewed_at: string | null
          next_review_at: string
          review_count: number
          sync_version: number
          template_id: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "card_progress"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_account_deletion: { Args: never; Returns: undefined }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

