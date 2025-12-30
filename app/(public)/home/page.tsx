import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import HomeClient from './home-client'

// SEO Metadata - Open Graph & Twitter Cards
export const metadata: Metadata = {
  title: 'Savora - Petualangan Kuliner Dimulai Disini',
  description: 'Temukan ribuan resep masakan favorit, bagikan kreasi kuliner Anda, dan bergabung dengan komunitas pecinta masak di Savora. Dari masakan Indonesia hingga internasional!',
  keywords: ['resep masakan', 'kuliner indonesia', 'masak', 'cooking', 'recipe', 'indonesian food', 'makanan enak', 'belajar masak'],
  authors: [{ name: 'Rendyt' }],
  openGraph: {
    title: 'Savora - Jelajahi Ribuan Resep Lezat',
    description: 'Platform berbagi resep masakan terbaik di Indonesia. Temukan, bagikan, dan simpan resep favorit Anda!',
    url: 'https://savora-web.vercel.app',
    siteName: 'Savora',
    images: [
      {
        url: 'https://savora-web.vercel.app/images/logo.png',
        width: 1200,
        height: 630,
        alt: 'Savora - Recipe Sharing Platform',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Savora - Jelajahi Ribuan Resep Lezat',
    description: 'Platform berbagi resep masakan terbaik',
    images: ['https://savora-web.vercel.app/images/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

// Revalidate every 5 minutes
export const revalidate = 300

interface Recipe {
  id: string
  title: string
  description: string | null
  image_url: string | null
  cooking_time: number | null
  difficulty: string | null
  views_count: number
  servings: number | null
  profiles: {
    username: string | null
    avatar_url: string | null
    role: string
  } | null
  categories: {
    id: number
    name: string
  } | null
  recipe_tags: Array<{
    tags: {
      id: number
      name: string
    } | null
  }>
}

interface UserStats {
  total_recipes: number
  total_bookmarks: number
  total_followers: number
}

const ITEMS_PER_PAGE = 12

async function getInitialData(page: number = 1) {
  const supabase = await createClient()

  try {
    // ✅ Check if user is logged in (optional - tidak redirect)
    const { data: { user } } = await supabase.auth.getUser()
    
    let userStats: UserStats = {
      total_recipes: 0,
      total_bookmarks: 0,
      total_followers: 0,
    }
    let username: string | null = null
    let avatarUrl: string | null = null
    let isLoggedIn = false

    // Jika user login, ambil data mereka
    if (user) {
      isLoggedIn = true
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url, total_recipes, total_bookmarks, total_followers')
        .eq('id', user.id)
        .single()

      if (profile) {
        username = profile.username
        avatarUrl = profile.avatar_url
        userStats = {
          total_recipes: profile.total_recipes || 0,
          total_bookmarks: profile.total_bookmarks || 0,
          total_followers: profile.total_followers || 0,
        }
      }
    }

    // Get total recipe count (public - accessible by all)
    const { count } = await supabase
      .from('recipes')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved')

    const totalRecipes = count || 0

    // Get paginated recipes (public - accessible by all)
    const from = (page - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select(`
        *,
        profiles!recipes_user_id_fkey(username, avatar_url, role),
        categories(id, name),
        recipe_tags(tags(id, name))
      `)
      .eq('status', 'approved')
      .order('views_count', { ascending: false })
      .range(from, to)

    if (recipesError) {
      console.error('Error fetching recipes:', recipesError)
      return {
        isLoggedIn,
        username,
        avatarUrl,
        userStats,
        recipes: [],
        totalRecipes: 0,
        currentPage: page,
        recipeRatings: {},
      }
    }

    const typedRecipes = (recipes || []) as Recipe[]

    // Get ratings for recipes
    const recipeRatings: Record<string, number> = {}
    
    const ratingPromises = typedRecipes.map(async (recipe) => {
      const { data: ratingData } = await supabase
        .from('recipe_ratings')
        .select('rating')
        .eq('recipe_id', recipe.id)

      if (ratingData && ratingData.length > 0) {
        const total = ratingData.reduce((sum, r) => sum + (r.rating || 0), 0)
        return { id: recipe.id, rating: total / ratingData.length }
      }
      return null
    })

    const ratings = await Promise.all(ratingPromises)
    ratings.forEach((r) => {
      if (r) recipeRatings[r.id] = r.rating
    })

    return {
      isLoggedIn,
      username,
      avatarUrl,
      userStats,
      recipes: typedRecipes,
      totalRecipes,
      currentPage: page,
      recipeRatings,
    }
  } catch (error) {
    console.error('Error in getInitialData:', error)
    // Jangan redirect, kembalikan data kosong
    return {
      isLoggedIn: false,
      username: null,
      avatarUrl: null,
      userStats: {
        total_recipes: 0,
        total_bookmarks: 0,
        total_followers: 0,
      },
      recipes: [],
      totalRecipes: 0,
      currentPage: page,
      recipeRatings: {},
    }
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = Number(searchParams.page) || 1
  const data = await getInitialData(page)

  return <HomeClient initialData={data} />
}