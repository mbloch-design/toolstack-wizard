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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          description?: string | null
          id: string
          name: string
          slug: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          ai_usage_level: string | null
          created_at: string
          current_tools: string | null
          email: string
          first_name: string | null
          id: number
          job_role: string | null
          main_goal: string | null
          marketing_opt_in: boolean
          project_phase: string | null
          source: string
          tech_maturity: string | null
          tjm: number | null
          user_type: string | null
        }
        Insert: {
          ai_usage_level?: string | null
          created_at?: string
          current_tools?: string | null
          email: string
          first_name?: string | null
          id?: never
          job_role?: string | null
          main_goal?: string | null
          marketing_opt_in?: boolean
          project_phase?: string | null
          source?: string
          tech_maturity?: string | null
          tjm?: number | null
          user_type?: string | null
        }
        Update: {
          ai_usage_level?: string | null
          created_at?: string
          current_tools?: string | null
          email?: string
          first_name?: string | null
          id?: never
          job_role?: string | null
          main_goal?: string | null
          marketing_opt_in?: boolean
          project_phase?: string | null
          source?: string
          tech_maturity?: string | null
          tjm?: number | null
          user_type?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          category: string | null
          content: string | null
          date: string | null
          excerpt: string | null
          id: number
          lang: string
          read_time: string | null
          seo: Json | null
          slug: string
          tags: Json | null
          title: string
          tool_id: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          date?: string | null
          excerpt?: string | null
          id?: never
          lang?: string
          read_time?: string | null
          seo?: Json | null
          slug: string
          tags?: Json | null
          title: string
          tool_id?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          date?: string | null
          excerpt?: string | null
          id?: never
          lang?: string
          read_time?: string | null
          seo?: Json | null
          slug?: string
          tags?: Json | null
          title?: string
          tool_id?: string | null
        }
        Relationships: []
      }
      selector_results: {
        Row: {
          created_at: string
          estimated_savings_monthly: number | null
          id: string
          lead_id: number | null
          persona: string
          recommended_tools: Json | null
          roi_analysis: Json | null
          share_token: string | null
          stack_health_score: number | null
          tools_to_cancel: Json | null
          user_stack: Json | null
          verticals_composite: Json | null
        }
        Insert: {
          created_at?: string
          estimated_savings_monthly?: number | null
          id?: string
          lead_id?: number | null
          persona: string
          recommended_tools?: Json | null
          roi_analysis?: Json | null
          share_token?: string | null
          stack_health_score?: number | null
          tools_to_cancel?: Json | null
          user_stack?: Json | null
          verticals_composite?: Json | null
        }
        Update: {
          created_at?: string
          estimated_savings_monthly?: number | null
          id?: string
          lead_id?: number | null
          persona?: string
          recommended_tools?: Json | null
          roi_analysis?: Json | null
          share_token?: string | null
          stack_health_score?: number | null
          tools_to_cancel?: Json | null
          user_stack?: Json | null
          verticals_composite?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "selector_results_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          affiliate_link: string | null
          alternatives: Json | null
          articles: Json | null
          better_alternative: Json | null
          bundle_parent: string | null
          category: string | null
          cons: Json | null
          cons_en: Json | null
          covers: Json | null
          decision_policy_v3: Json | null
          default_monthly_price: number | null
          downgrade_plan: Json | null
          free_alternative: string | null
          functional_needs: Json | null
          host_app: string | null
          ia_use_case: Json | null
          id: string
          logo: string | null
          long_description: string | null
          long_description_en: string | null
          migration_guide: Json | null
          name: string
          personas: Json | null
          prescription_block_reasons: Json | null
          prescription_context_questions: Json | null
          prescription_output: Json | null
          prescription_quality: string | null
          pricing: Json | null
          pricing_en: Json | null
          pricing_v5: Json | null
          pros: Json | null
          pros_en: Json | null
          relevant_for: Json | null
          seo: Json | null
          short_description: string | null
          short_description_en: string | null
          slug: string
          solo_relevance: string | null
          substitutable: boolean | null
          substitution_cluster_v2: string | null
          team_relevance: string | null
          time_gained_hours_per_month: number | null
          tool_type: string | null
          use_cases: Json | null
          use_cases_en: Json | null
          verdict: Json | null
          verdict_en: Json | null
          verticals: Json | null
          website_url: string | null
        }
        Insert: {
          affiliate_link?: string | null
          alternatives?: Json | null
          articles?: Json | null
          better_alternative?: Json | null
          bundle_parent?: string | null
          category?: string | null
          cons?: Json | null
          cons_en?: Json | null
          covers?: Json | null
          decision_policy_v3?: Json | null
          default_monthly_price?: number | null
          downgrade_plan?: Json | null
          free_alternative?: string | null
          functional_needs?: Json | null
          host_app?: string | null
          ia_use_case?: Json | null
          id: string
          logo?: string | null
          long_description?: string | null
          long_description_en?: string | null
          migration_guide?: Json | null
          name: string
          personas?: Json | null
          prescription_block_reasons?: Json | null
          prescription_context_questions?: Json | null
          prescription_output?: Json | null
          prescription_quality?: string | null
          pricing?: Json | null
          pricing_en?: Json | null
          pricing_v5?: Json | null
          pros?: Json | null
          pros_en?: Json | null
          relevant_for?: Json | null
          seo?: Json | null
          short_description?: string | null
          short_description_en?: string | null
          slug: string
          solo_relevance?: string | null
          substitutable?: boolean | null
          substitution_cluster_v2?: string | null
          team_relevance?: string | null
          time_gained_hours_per_month?: number | null
          tool_type?: string | null
          use_cases?: Json | null
          use_cases_en?: Json | null
          verdict?: Json | null
          verdict_en?: Json | null
          verticals?: Json | null
          website_url?: string | null
        }
        Update: {
          affiliate_link?: string | null
          alternatives?: Json | null
          articles?: Json | null
          better_alternative?: Json | null
          bundle_parent?: string | null
          category?: string | null
          cons?: Json | null
          cons_en?: Json | null
          covers?: Json | null
          decision_policy_v3?: Json | null
          default_monthly_price?: number | null
          downgrade_plan?: Json | null
          free_alternative?: string | null
          functional_needs?: Json | null
          host_app?: string | null
          ia_use_case?: Json | null
          id?: string
          logo?: string | null
          long_description?: string | null
          long_description_en?: string | null
          migration_guide?: Json | null
          name?: string
          personas?: Json | null
          prescription_block_reasons?: Json | null
          prescription_context_questions?: Json | null
          prescription_output?: Json | null
          prescription_quality?: string | null
          pricing?: Json | null
          pricing_en?: Json | null
          pricing_v5?: Json | null
          pros?: Json | null
          pros_en?: Json | null
          relevant_for?: Json | null
          seo?: Json | null
          short_description?: string | null
          short_description_en?: string | null
          slug?: string
          solo_relevance?: string | null
          substitutable?: boolean | null
          substitution_cluster_v2?: string | null
          team_relevance?: string | null
          time_gained_hours_per_month?: number | null
          tool_type?: string | null
          use_cases?: Json | null
          use_cases_en?: Json | null
          verdict?: Json | null
          verdict_en?: Json | null
          verticals?: Json | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tools_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      verticals: {
        Row: {
          family: string
          functional_needs: Json
          id: string
          label: string
        }
        Insert: {
          family: string
          functional_needs?: Json
          id: string
          label: string
        }
        Update: {
          family?: string
          functional_needs?: Json
          id?: string
          label?: string
        }
        Relationships: []
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
