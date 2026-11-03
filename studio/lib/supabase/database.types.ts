// Generated from the wql-studio Supabase project (Supabase MCP generate_typescript_types).
// Regenerate after every migration; see studio/README.md.

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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      api_usage: {
        Row: {
          api: string
          called_at: string
          cost_usd: number | null
          endpoint: string
          http_status: number | null
          id: number
          input_tokens: number | null
          job: string | null
          ok: boolean
          output_tokens: number | null
          quota_day: string
          units: number
        }
        Insert: {
          api: string
          called_at?: string
          cost_usd?: number | null
          endpoint: string
          http_status?: number | null
          id?: never
          input_tokens?: number | null
          job?: string | null
          ok?: boolean
          output_tokens?: number | null
          quota_day?: string
          units?: number
        }
        Update: {
          api?: string
          called_at?: string
          cost_usd?: number | null
          endpoint?: string
          http_status?: number | null
          id?: never
          input_tokens?: number | null
          job?: string | null
          ok?: boolean
          output_tokens?: number | null
          quota_day?: string
          units?: number
        }
        Relationships: []
      }
      app_owner: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      channel_baselines: {
        Row: {
          channel_id: string
          computed_at: string
          format: Database["public"]["Enums"]["video_format"]
          id: number
          median_views: number
          min_age_days: number
          sample_size: number
        }
        Insert: {
          channel_id: string
          computed_at?: string
          format: Database["public"]["Enums"]["video_format"]
          id?: never
          median_views: number
          min_age_days: number
          sample_size: number
        }
        Update: {
          channel_id?: string
          computed_at?: string
          format?: Database["public"]["Enums"]["video_format"]
          id?: never
          median_views?: number
          min_age_days?: number
          sample_size?: number
        }
        Relationships: [
          {
            foreignKeyName: "channel_baselines_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channel_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_baselines_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          active: boolean
          added_at: string
          backfilled_at: string | null
          handle: string | null
          id: string
          last_synced_at: string | null
          stats_updated_at: string | null
          subs: number | null
          subs_hidden: boolean
          thumbnail_url: string | null
          tier: Database["public"]["Enums"]["channel_tier"]
          title: string
          uploads_playlist_id: string | null
          video_count: number | null
          view_count: number | null
          why: string | null
        }
        Insert: {
          active?: boolean
          added_at?: string
          backfilled_at?: string | null
          handle?: string | null
          id: string
          last_synced_at?: string | null
          stats_updated_at?: string | null
          subs?: number | null
          subs_hidden?: boolean
          thumbnail_url?: string | null
          tier: Database["public"]["Enums"]["channel_tier"]
          title: string
          uploads_playlist_id?: string | null
          video_count?: number | null
          view_count?: number | null
          why?: string | null
        }
        Update: {
          active?: boolean
          added_at?: string
          backfilled_at?: string | null
          handle?: string | null
          id?: string
          last_synced_at?: string | null
          stats_updated_at?: string | null
          subs?: number | null
          subs_hidden?: boolean
          thumbnail_url?: string | null
          tier?: Database["public"]["Enums"]["channel_tier"]
          title?: string
          uploads_playlist_id?: string | null
          video_count?: number | null
          view_count?: number | null
          why?: string | null
        }
        Relationships: []
      }
      cron_runs: {
        Row: {
          error: string | null
          finished_at: string | null
          id: number
          job: string
          started_at: string
          status: string
          summary: Json | null
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: never
          job: string
          started_at?: string
          status?: string
          summary?: Json | null
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: never
          job?: string
          started_at?: string
          status?: string
          summary?: Json | null
        }
        Relationships: []
      }
      outliers: {
        Row: {
          baseline_median: number
          channel_id: string
          detected_at: string
          format: Database["public"]["Enums"]["video_format"]
          multiple_vs_channel_median: number
          status: Database["public"]["Enums"]["outlier_status"]
          updated_at: string
          video_id: string
          views: number
          views_per_day: number
        }
        Insert: {
          baseline_median: number
          channel_id: string
          detected_at?: string
          format: Database["public"]["Enums"]["video_format"]
          multiple_vs_channel_median: number
          status?: Database["public"]["Enums"]["outlier_status"]
          updated_at?: string
          video_id: string
          views: number
          views_per_day: number
        }
        Update: {
          baseline_median?: number
          channel_id?: string
          detected_at?: string
          format?: Database["public"]["Enums"]["video_format"]
          multiple_vs_channel_median?: number
          status?: Database["public"]["Enums"]["outlier_status"]
          updated_at?: string
          video_id?: string
          views?: number
          views_per_day?: number
        }
        Relationships: [
          {
            foreignKeyName: "outliers_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channel_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outliers_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outliers_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: true
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_snapshots: {
        Row: {
          captured_at: string
          captured_on: string
          comments: number | null
          likes: number | null
          video_id: string
          views: number | null
        }
        Insert: {
          captured_at?: string
          captured_on: string
          comments?: number | null
          likes?: number | null
          video_id: string
          views?: number | null
        }
        Update: {
          captured_at?: string
          captured_on?: string
          comments?: number | null
          likes?: number | null
          video_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_snapshots_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          channel_id: string
          comments: number | null
          description_snippet: string | null
          duration_s: number | null
          first_seen_at: string
          format: Database["public"]["Enums"]["video_format"] | null
          format_source: Database["public"]["Enums"]["format_source"] | null
          id: string
          is_short: boolean | null
          likes: number | null
          live_status: string
          published_at: string
          stats_updated_at: string | null
          thumbnail_url: string | null
          title: string
          views: number | null
        }
        Insert: {
          channel_id: string
          comments?: number | null
          description_snippet?: string | null
          duration_s?: number | null
          first_seen_at?: string
          format?: Database["public"]["Enums"]["video_format"] | null
          format_source?: Database["public"]["Enums"]["format_source"] | null
          id: string
          is_short?: never
          likes?: number | null
          live_status?: string
          published_at: string
          stats_updated_at?: string | null
          thumbnail_url?: string | null
          title: string
          views?: number | null
        }
        Update: {
          channel_id?: string
          comments?: number | null
          description_snippet?: string | null
          duration_s?: number | null
          first_seen_at?: string
          format?: Database["public"]["Enums"]["video_format"] | null
          format_source?: Database["public"]["Enums"]["format_source"] | null
          id?: string
          is_short?: never
          likes?: number | null
          live_status?: string
          published_at?: string
          stats_updated_at?: string | null
          thumbnail_url?: string | null
          title?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channel_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      api_usage_daily: {
        Row: {
          api: string | null
          calls: number | null
          cost_usd: number | null
          endpoint: string | null
          failures: number | null
          input_tokens: number | null
          output_tokens: number | null
          quota_day: string | null
          units: number | null
        }
        Relationships: []
      }
      channel_overview: {
        Row: {
          active: boolean | null
          added_at: string | null
          backfilled_at: string | null
          handle: string | null
          id: string | null
          last_synced_at: string | null
          long_median: number | null
          outlier_count: number | null
          short_median: number | null
          stats_updated_at: string | null
          subs: number | null
          subs_hidden: boolean | null
          thumbnail_url: string | null
          tier: Database["public"]["Enums"]["channel_tier"] | null
          title: string | null
          tracked_videos: number | null
          uploads_playlist_id: string | null
          video_count: number | null
          view_count: number | null
          why: string | null
        }
        Relationships: []
      }
      outlier_feed: {
        Row: {
          baseline_median: number | null
          channel_handle: string | null
          channel_id: string | null
          channel_title: string | null
          detected_at: string | null
          duration_s: number | null
          format: Database["public"]["Enums"]["video_format"] | null
          multiple_vs_channel_median: number | null
          published_at: string | null
          status: Database["public"]["Enums"]["outlier_status"] | null
          thumbnail_url: string | null
          tier: Database["public"]["Enums"]["channel_tier"] | null
          title: string | null
          updated_at: string | null
          video_id: string | null
          views: number | null
          views_per_day: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      channel_tier: "mine" | "direct" | "rising" | "format" | "benchmark"
      format_source: "duration" | "hashtag" | "manual"
      outlier_status: "new" | "saved" | "dismissed"
      video_format: "short" | "long"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])> =
  (PublicSchema["Tables"] & PublicSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T] extends { Update: infer U } ? U : never

export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]

export const Constants = {
  public: {
    Enums: {
      channel_tier: ["mine", "direct", "rising", "format", "benchmark"],
      format_source: ["duration", "hashtag", "manual"],
      outlier_status: ["new", "saved", "dismissed"],
      video_format: ["short", "long"],
    },
  },
} as const
