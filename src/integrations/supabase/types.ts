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
      images: {
        Row: {
          batch_id: string | null
          code: string | null
          company_name: string | null
          created_at: string
          extracted_text: string | null
          file_name: string
          id: string
          phone_number: string | null
          preview_url: string | null
          price: string | null
          province: string | null
          sender_name: string | null
          status: string | null
          storage_path: string | null
          submitted: boolean | null
          user_id: string
        }
        Insert: {
          batch_id?: string | null
          code?: string | null
          company_name?: string | null
          created_at?: string
          extracted_text?: string | null
          file_name: string
          id?: string
          phone_number?: string | null
          preview_url?: string | null
          price?: string | null
          province?: string | null
          sender_name?: string | null
          status?: string | null
          storage_path?: string | null
          submitted?: boolean | null
          user_id: string
        }
        Update: {
          batch_id?: string | null
          code?: string | null
          company_name?: string | null
          created_at?: string
          extracted_text?: string | null
          file_name?: string
          id?: string
          phone_number?: string | null
          preview_url?: string | null
          price?: string | null
          province?: string | null
          sender_name?: string | null
          status?: string | null
          storage_path?: string | null
          submitted?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      password_reset_requests: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_used: boolean | null
          reset_token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          reset_token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          reset_token?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_admin: boolean | null
          is_approved: boolean | null
          subscription_end_date: string | null
          subscription_plan: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          account_status?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          is_approved?: boolean | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          account_status?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_approved?: boolean | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_basic_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          created_at: string
          updated_at: string
          last_sign_in_at: string
          raw_user_meta_data: Json
          raw_app_meta_data: Json
        }[]
      }
      admin_get_basic_users_list: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          full_name: string
          is_approved: boolean
          account_status: string
          subscription_plan: string
          created_at: string
        }[]
      }
      admin_get_complete_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          created_at: string
          full_name: string
          avatar_url: string
          is_approved: boolean
          is_admin: boolean
          subscription_plan: string
          account_status: string
          subscription_end_date: string
          username: string
          last_login_at: string
          phone_number: string
          address: string
          notes: string
          updated_at: string
        }[]
      }
      admin_get_user_by_id: {
        Args: {
          user_id: string
        }
        Returns: {
          id: string
          email: string
          created_at: string
          full_name: string
          avatar_url: string
          is_approved: boolean
          is_admin: boolean
          subscription_plan: string
          account_status: string
          subscription_end_date: string
          username: string
          last_login_at: string
          phone_number: string
          address: string
          notes: string
          updated_at: string
        }[]
      }
      admin_get_users_with_email: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          created_at: string
        }[]
      }
      admin_reset_password_by_string_id: {
        Args: {
          user_id_str: string
          new_password: string
        }
        Returns: boolean
      }
      admin_reset_password_direct_api: {
        Args: {
          user_id_str: string
          new_password: string
        }
        Returns: boolean
      }
      admin_update_user_email: {
        Args: {
          user_id: string
          new_email: string
        }
        Returns: boolean
      }
      admin_update_user_password: {
        Args: {
          user_id: string
          new_password: string
        }
        Returns: boolean
      }
      admin_update_user_password_by_email: {
        Args: {
          user_email: string
          new_password: string
        }
        Returns: boolean
      }
      ensure_user_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_user_email_by_id: {
        Args: {
          user_id: string
        }
        Returns: string
      }
      get_users_emails: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          created_at: string
        }[]
      }
      is_admin_user: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
