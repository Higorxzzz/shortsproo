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
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      drive_folders: {
        Row: {
          created_at: string
          drive_folder_id: string
          folder_name: string
          folder_type: string
          id: string
          parent_folder_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          drive_folder_id: string
          folder_name: string
          folder_type?: string
          id?: string
          parent_folder_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          drive_folder_id?: string
          folder_name?: string
          folder_type?: string
          id?: string
          parent_folder_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          shorts_per_day: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price?: number
          shorts_per_day?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          shorts_per_day?: number
        }
        Relationships: []
      }
      production_logs: {
        Row: {
          action: string
          created_at: string
          editor_id: string | null
          id: string
          notes: string | null
          task_id: string
          user_id: string
          video_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          editor_id?: string | null
          id?: string
          notes?: string | null
          task_id: string
          user_id: string
          video_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          editor_id?: string | null
          id?: string
          notes?: string | null
          task_id?: string
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_logs_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          email: string | null
          id: string
          language: string | null
          name: string | null
          plan_id: string | null
          suspended: boolean | null
          updated_at: string
          youtube_channel: string | null
          youtube_channel_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          email?: string | null
          id: string
          language?: string | null
          name?: string | null
          plan_id?: string | null
          suspended?: boolean | null
          updated_at?: string
          youtube_channel?: string | null
          youtube_channel_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          language?: string | null
          name?: string | null
          plan_id?: string | null
          suspended?: boolean | null
          updated_at?: string
          youtube_channel?: string | null
          youtube_channel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_videos: {
        Row: {
          created_at: string
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: string
          notes: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          notes?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          notes?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_chats: {
        Row: {
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "support_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          notes: string | null
          status: string
          task_date: string
          task_number: number
          user_id: string
          video_id: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          task_date?: string
          task_number: number
          user_id: string
          video_id?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          task_date?: string
          task_number?: number
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_logs: {
        Row: {
          created_at: string
          error_message: string | null
          file_name: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_name: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_name?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
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
      videos: {
        Row: {
          drive_file_id: string | null
          drive_link: string
          file_name: string | null
          file_size: number | null
          folder_id: string | null
          id: string
          status: string
          title: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          drive_file_id?: string | null
          drive_link: string
          file_name?: string | null
          file_size?: number | null
          folder_id?: string | null
          id?: string
          status?: string
          title: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          drive_file_id?: string | null
          drive_link?: string
          file_name?: string | null
          file_size?: number | null
          folder_id?: string | null
          id?: string
          status?: string
          title?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      youtube_cache_metadata: {
        Row: {
          channel_id: string
          id: string
          last_fetched_at: string
          video_count: number
        }
        Insert: {
          channel_id: string
          id?: string
          last_fetched_at?: string
          video_count?: number
        }
        Update: {
          channel_id?: string
          id?: string
          last_fetched_at?: string
          video_count?: number
        }
        Relationships: []
      }
      youtube_quota_log: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          request_type: string
          units_used: number
          user_id: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          request_type?: string
          units_used?: number
          user_id?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          request_type?: string
          units_used?: number
          user_id?: string | null
        }
        Relationships: []
      }
      youtube_videos_cache: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          published_at: string | null
          thumbnail_url: string | null
          video_description: string | null
          video_id: string
          video_title: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          published_at?: string | null
          thumbnail_url?: string | null
          video_description?: string | null
          video_id: string
          video_title: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          published_at?: string | null
          thumbnail_url?: string | null
          video_description?: string | null
          video_id?: string
          video_title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_daily_tasks: { Args: { target_date?: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_team_member: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "manager" | "editor"
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
      app_role: ["admin", "user", "manager", "editor"],
    },
  },
} as const
