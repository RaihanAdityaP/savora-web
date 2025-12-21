export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          role: string
          is_premium: boolean
          premium_until: string | null
          is_banned: boolean
          banned_reason: string | null
          banned_at: string | null
          banned_by: string | null
          referral_code: string | null
          referred_by: string | null
          total_referrals: number
          referral_points: number
          social_links: Json | null
          cooking_level: string
          total_followers: number
          total_following: number
          total_recipes: number
          total_bookmarks: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: string
          is_premium?: boolean
          premium_until?: string | null
          is_banned?: boolean
          banned_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          referral_code?: string | null
          referred_by?: string | null
          total_referrals?: number
          referral_points?: number
          social_links?: Json | null
          cooking_level?: string
          total_followers?: number
          total_following?: number
          total_recipes?: number
          total_bookmarks?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: string
          is_premium?: boolean
          premium_until?: string | null
          is_banned?: boolean
          banned_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          referral_code?: string | null
          referred_by?: string | null
          total_referrals?: number
          referral_points?: number
          social_links?: Json | null
          cooking_level?: string
          total_followers?: number
          total_following?: number
          total_recipes?: number
          total_bookmarks?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          id: string
          user_id: string | null
          title: string
          description: string | null
          category_id: number | null
          cooking_time: number | null
          servings: number | null
          difficulty: string | null
          calories: number | null
          ingredients: string[] | null
          steps: string[] | null
          image_url: string | null
          additional_images: string[] | null
          video_url: string | null
          status: string
          rejection_reason: string | null
          moderated_by: string | null
          moderated_at: string | null
          views_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          description?: string | null
          category_id?: number | null
          cooking_time?: number | null
          servings?: number | null
          difficulty?: string | null
          calories?: number | null
          ingredients?: string[] | null
          steps?: string[] | null
          image_url?: string | null
          additional_images?: string[] | null
          video_url?: string | null
          status?: string
          rejection_reason?: string | null
          moderated_by?: string | null
          moderated_at?: string | null
          views_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          description?: string | null
          category_id?: number | null
          cooking_time?: number | null
          servings?: number | null
          difficulty?: string | null
          calories?: number | null
          ingredients?: string[] | null
          steps?: string[] | null
          image_url?: string | null
          additional_images?: string[] | null
          video_url?: string | null
          status?: string
          rejection_reason?: string | null
          moderated_by?: string | null
          moderated_at?: string | null
          views_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          id: number
          name: string
          slug: string
          icon_url: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          icon_url?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          icon_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      recipe_boards: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_boards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      board_recipes: {
        Row: {
          id: string
          board_id: string
          recipe_id: string
          added_at: string
        }
        Insert: {
          id?: string
          board_id: string
          recipe_id: string
          added_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          recipe_id?: string
          added_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_recipes_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "recipe_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          recipe_id: string | null
          user_id: string | null
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          recipe_id?: string | null
          user_id?: string | null
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string | null
          user_id?: string | null
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      menu_plans: {
        Row: {
          id: string
          user_id: string | null
          recipe_id: string | null
          planned_date: string
          meal_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          recipe_id?: string | null
          planned_date: string
          meal_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          recipe_id?: string | null
          planned_date?: string
          meal_type?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_plans_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          }
        ]
      }
      tags: {
        Row: {
          id: number
          name: string
          slug: string
          usage_count: number
          is_featured: boolean
          is_approved: boolean
          created_by: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          usage_count?: number
          is_featured?: boolean
          is_approved?: boolean
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          usage_count?: number
          is_featured?: boolean
          is_approved?: boolean
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      recipe_tags: {
        Row: {
          id: number
          recipe_id: string | null
          tag_id: number | null
          created_at: string
        }
        Insert: {
          id?: number
          recipe_id?: string | null
          tag_id?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          recipe_id?: string | null
          tag_id?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_tags_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          }
        ]
      }
      recipe_ratings: {
        Row: {
          id: number
          recipe_id: string | null
          user_id: string | null
          rating: number | null
          created_at: string
        }
        Insert: {
          id?: number
          recipe_id?: string | null
          user_id?: string | null
          rating?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          recipe_id?: string | null
          user_id?: string | null
          rating?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ratings_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          user_id: string | null
          order_id: string
          amount: number
          status: string
          payment_type: string | null
          midtrans_response: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          order_id: string
          amount: number
          status?: string
          payment_type?: string | null
          midtrans_response?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          order_id?: string
          amount?: number
          status?: string
          payment_type?: string | null
          midtrans_response?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          related_entity_type: string | null
          related_entity_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: string
          related_entity_type?: string | null
          related_entity_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          related_entity_type?: string | null
          related_entity_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      collections: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      collection_recipes: {
        Row: {
          id: number
          collection_id: string | null
          recipe_id: string | null
          created_at: string
        }
        Insert: {
          id?: number
          collection_id?: string | null
          recipe_id?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          collection_id?: string | null
          recipe_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_recipes_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          referral_code: string
          status: string
          points_earned: number
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_id: string
          referral_code: string
          status?: string
          points_earned?: number
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_id?: string
          referral_code?: string
          status?: string
          points_earned?: number
          completed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      referral_rewards: {
        Row: {
          id: string
          user_id: string
          referral_id: string | null
          reward_type: string
          reward_value: number
          description: string | null
          claimed: boolean
          claimed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          referral_id?: string | null
          reward_type: string
          reward_value: number
          description?: string | null
          claimed?: boolean
          claimed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          referral_id?: string | null
          reward_type?: string
          reward_value?: number
          description?: string | null
          claimed?: boolean
          claimed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          }
        ]
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type: string
          achievement_name: string
          description: string | null
          icon: string | null
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_type: string
          achievement_name: string
          description?: string | null
          icon?: string | null
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_type?: string
          achievement_name?: string
          description?: string | null
          icon?: string | null
          earned_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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

// Type helpers
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

// Simplified type helpers
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Recipe = Database['public']['Tables']['recipes']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type RecipeBoard = Database['public']['Tables']['recipe_boards']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Follow = Database['public']['Tables']['follows']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Collection = Database['public']['Tables']['collections']['Row']
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
export type Referral = Database['public']['Tables']['referrals']['Row']
export type ReferralReward = Database['public']['Tables']['referral_rewards']['Row']
export type UserAchievement = Database['public']['Tables']['user_achievements']['Row']