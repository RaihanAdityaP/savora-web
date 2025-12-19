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
          social_links: Record<string, unknown>
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
          social_links?: Record<string, unknown>
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
          social_links?: Record<string, unknown>
          cooking_level?: string
          total_followers?: number
          total_following?: number
          total_recipes?: number
          total_bookmarks?: number
          created_at?: string
          updated_at?: string
        }
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
          ingredients: Record<string, unknown> | null
          steps: Record<string, unknown> | null
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
          ingredients?: Record<string, unknown> | null
          steps?: Record<string, unknown> | null
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
          ingredients?: Record<string, unknown> | null
          steps?: Record<string, unknown> | null
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
      }
      transactions: {
        Row: {
          id: string
          user_id: string | null
          order_id: string
          amount: number
          status: string
          payment_type: string | null
          midtrans_response: Record<string, unknown> | null
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
          midtrans_response?: Record<string, unknown> | null
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
          midtrans_response?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
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
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          details: Record<string, unknown> | null
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
          details?: Record<string, unknown> | null
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
          details?: Record<string, unknown> | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
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
  }
}

// Type helpers
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Recipe = Database['public']['Tables']['recipes']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type RecipeBoard = Database['public']['Tables']['recipe_boards']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Follow = Database['public']['Tables']['follows']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']