export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      action_ledger: {
        Row: {
          actor: string;
          event_type: string;
          id: string;
          metadata: Json | null;
          occurred_at: string;
          resource_id: string | null;
          resource_type: string | null;
          result: string;
          session_key: string;
          summary: string;
          tool_name: string | null;
        };
        Insert: {
          actor: string;
          event_type: string;
          id?: string;
          metadata?: Json | null;
          occurred_at?: string;
          resource_id?: string | null;
          resource_type?: string | null;
          result: string;
          session_key: string;
          summary: string;
          tool_name?: string | null;
        };
        Update: {
          actor?: string;
          event_type?: string;
          id?: string;
          metadata?: Json | null;
          occurred_at?: string;
          resource_id?: string | null;
          resource_type?: string | null;
          result?: string;
          session_key?: string;
          summary?: string;
          tool_name?: string | null;
        };
        Relationships: [];
      };
      boxes: {
        Row: {
          code: string;
          created_at: string;
          delivery_stop: number;
          destination: string;
          fragile: boolean;
          height_cm: number;
          id: string;
          length_cm: number;
          loaded: boolean;
          pos_x: number | null;
          pos_y: number | null;
          pos_z: number | null;
          priority: string;
          session_key: string;
          truck_id: string;
          weight_kg: number;
          width_cm: number;
        };
        Insert: {
          code: string;
          created_at?: string;
          delivery_stop?: number;
          destination: string;
          fragile?: boolean;
          height_cm: number;
          id?: string;
          length_cm: number;
          loaded?: boolean;
          pos_x?: number | null;
          pos_y?: number | null;
          pos_z?: number | null;
          priority?: string;
          session_key: string;
          truck_id: string;
          weight_kg: number;
          width_cm: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          delivery_stop?: number;
          destination?: string;
          fragile?: boolean;
          height_cm?: number;
          id?: string;
          length_cm?: number;
          loaded?: boolean;
          pos_x?: number | null;
          pos_y?: number | null;
          pos_z?: number | null;
          priority?: string;
          session_key?: string;
          truck_id?: string;
          weight_kg?: number;
          width_cm?: number;
        };
        Relationships: [
          {
            foreignKeyName: "boxes_truck_id_fkey";
            columns: ["truck_id"];
            isOneToOne: false;
            referencedRelation: "trucks";
            referencedColumns: ["id"];
          },
        ];
      };
      load_plan_items: {
        Row: {
          box_code: string;
          box_id: string;
          id: string;
          plan_id: string;
          pos_x: number;
          pos_y: number;
          pos_z: number;
          sequence: number;
        };
        Insert: {
          box_code: string;
          box_id: string;
          id?: string;
          plan_id: string;
          pos_x: number;
          pos_y: number;
          pos_z: number;
          sequence: number;
        };
        Update: {
          box_code?: string;
          box_id?: string;
          id?: string;
          plan_id?: string;
          pos_x?: number;
          pos_y?: number;
          pos_z?: number;
          sequence?: number;
        };
        Relationships: [
          {
            foreignKeyName: "load_plan_items_box_id_fkey";
            columns: ["box_id"];
            isOneToOne: false;
            referencedRelation: "boxes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "load_plan_items_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "load_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      load_plans: {
        Row: {
          algorithm_version: string;
          approved_at: string | null;
          approved_hash: string | null;
          created_at: string;
          created_by: string;
          executed_at: string | null;
          executing_at: string | null;
          expires_at: string | null;
          failed_at: string | null;
          failure_reason: string | null;
          id: string;
          plan_code: string | null;
          plan_hash: string | null;
          rejected_at: string | null;
          session_key: string;
          source_state_revision: number | null;
          staged_at: string | null;
          status: string;
          target_box_ids: string[] | null;
          total_weight_kg: number | null;
          truck_id: string;
          utilization_pct: number | null;
          validation: Json | null;
        };
        Insert: {
          algorithm_version?: string;
          approved_at?: string | null;
          approved_hash?: string | null;
          created_at?: string;
          created_by?: string;
          executed_at?: string | null;
          executing_at?: string | null;
          expires_at?: string | null;
          failed_at?: string | null;
          failure_reason?: string | null;
          id?: string;
          plan_code?: string | null;
          plan_hash?: string | null;
          rejected_at?: string | null;
          session_key: string;
          source_state_revision?: number | null;
          staged_at?: string | null;
          status?: string;
          target_box_ids?: string[] | null;
          total_weight_kg?: number | null;
          truck_id: string;
          utilization_pct?: number | null;
          validation?: Json | null;
        };
        Update: {
          algorithm_version?: string;
          approved_at?: string | null;
          approved_hash?: string | null;
          created_at?: string;
          created_by?: string;
          executed_at?: string | null;
          executing_at?: string | null;
          expires_at?: string | null;
          failed_at?: string | null;
          failure_reason?: string | null;
          id?: string;
          plan_code?: string | null;
          plan_hash?: string | null;
          rejected_at?: string | null;
          session_key?: string;
          source_state_revision?: number | null;
          staged_at?: string | null;
          status?: string;
          target_box_ids?: string[] | null;
          total_weight_kg?: number | null;
          truck_id?: string;
          utilization_pct?: number | null;
          validation?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "load_plans_truck_id_fkey";
            columns: ["truck_id"];
            isOneToOne: false;
            referencedRelation: "trucks";
            referencedColumns: ["id"];
          },
        ];
      };
      trucks: {
        Row: {
          code: string;
          created_at: string;
          height_cm: number;
          id: string;
          length_cm: number;
          max_weight_kg: number;
          session_key: string;
          state_revision: number;
          width_cm: number;
        };
        Insert: {
          code: string;
          created_at?: string;
          height_cm: number;
          id?: string;
          length_cm: number;
          max_weight_kg: number;
          session_key: string;
          state_revision?: number;
          width_cm: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          height_cm?: number;
          id?: string;
          length_cm?: number;
          max_weight_kg?: number;
          session_key?: string;
          state_revision?: number;
          width_cm?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      approve_load_plan: {
        Args: { p_plan_id: string; p_session_key: string };
        Returns: Json;
      };
      canonical_plan_hash: { Args: { p_plan_id: string }; Returns: string };
      plan_has_complete_target_coverage: { Args: { p_plan_id: string }; Returns: boolean };
      commit_load_plan: {
        Args: { p_plan_id: string; p_session_key: string };
        Returns: Json;
      };
      reject_load_plan: {
        Args: { p_plan_id: string; p_session_key: string };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
