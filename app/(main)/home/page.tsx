'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'

interface Recipe {
  id: string
  title: string
  description: string | null
  image_url: string | null
  cooking_time: number | null
  difficulty: string | null
  views_count: number
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

interface ProfileData {
  username: string | null
  avatar_url: string | null
  total_recipes: number
  total_bookmarks: number
  total_followers: number
}

interface RatingData {
  rating: number
}

interface UserStats {
  total_recipes: number
  total_bookmarks: number
  total_followers: number
}

const DAILY_QUOTES = [
  { quote: 'Masakan terbaik dibuat dengan cinta ❤', author: 'Chef Julia Child' },
  { quote: 'Memasak adalah seni yang bisa dinikmati semua orang 🎨', author: 'Gordon Ramsay' },
  { quote: 'Resep adalah cerita yang berakhir dengan makanan lezat 📖', author: 'Pat Conroy' },
  { quote: 'Kebahagiaan dimulai dari dapur 🍳', author: 'Traditional Wisdom' },
  { quote: 'Setiap chef adalah seniman dengan palet rasa 🎭', author: 'Anonymous' },
  { quote: 'Masak dengan hati, sajikan dengan senyuman 😊', author: 'Savora Community' },
]

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [username, setUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [userStats, setUserStats] = useState<UserStats>({
    total_recipes: 0,
    total_bookmarks: 0,
    total_followers: 0,
  })
  const [recipeRatings, setRecipeRatings] = useState<Record<string, number>>({})

  useEffect(() => {
    loadUserData()
    loadUserStats()
    loadPopularRecipes()
    const cleanup = setupBannedListener()
    return cleanup
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setupBannedListener = () => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return

      const channel = supabase
        .channel(`profile_changes_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            if (payload.new.is_banned) {
              handleBannedUser()
            }
          }
        )
        .subscribe()

      return () => {
        channel.unsubscribe()
      }
    })

    return () => {}
  }

  const handleBannedUser = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
      toast.error('Akun Anda telah dinonaktifkan oleh administrator.')
    } catch (err) {
      console.error('Error handling banned user:', err)
    }
  }

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single<Pick<ProfileData, 'username' | 'avatar_url'>>()

        if (error) throw error
        
        if (data) {
          setUsername(data.username)
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err)
    }
  }

  const loadUserStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('total_recipes, total_bookmarks, total_followers')
          .eq('id', user.id)
          .single<UserStats>()

        if (error) throw error

        if (data) {
          setUserStats(data)
        }
      }
    } catch (err) {
      console.error('Error loading user stats:', err)
    }
  }

  const loadPopularRecipes = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          profiles!recipes_user_id_fkey(username, avatar_url, role),
          categories(id, name),
          recipe_tags(tags(id, name))
        `)
        .eq('status', 'approved')
        .order('views_count', { ascending: false })
        .limit(20)

      if (error) throw error

      const typedRecipes = (data || []) as Recipe[]
      setRecipes(typedRecipes)

      // Load ratings for each recipe
      const ratings: Record<string, number> = {}
      for (const recipe of typedRecipes) {
        const { data: ratingData } = await supabase
          .from('recipe_ratings')
          .select('rating')
          .eq('recipe_id', recipe.id)

        if (ratingData && ratingData.length > 0) {
          const typedRatings = ratingData as RatingData[]
          const total = typedRatings.reduce((sum: number, r: RatingData) => sum + r.rating, 0)
          ratings[recipe.id] = total / typedRatings.length
        }
      }
      setRecipeRatings(ratings)
    } catch (err) {
      console.error('Error loading recipes:', err)
      toast.error('Gagal memuat resep')
    } finally {
      setIsLoading(false)
    }
  }

  const getDailyQuote = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const diff = now.getTime() - start.getTime()
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
    const index = dayOfYear % DAILY_QUOTES.length
    return DAILY_QUOTES[index]
  }

  const dailyQuote = getDailyQuote()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#E76F51] to-[#F4A261] flex items-center justify-center shadow-xl">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Memuat resep lezat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="max-w-7xl mx-auto pb-24 md:pb-8">
        {/* Welcome Card */}
        <div className="p-4 md:p-6 lg:p-8 animate-fade-in">
          <div className="bg-gradient-to-br from-[#264653] via-[#2A9D8F] to-[#E76F51] rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 md:p-8">
              {/* Greeting */}
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 tracking-tight">
                  Halo, {username || 'Foodie'}! 👋
                </h1>
                <p className="text-white/90 text-sm md:text-base">
                  Selamat datang kembali di Savora
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
                <StatCard
                  icon="🍳"
                  value={userStats.total_recipes}
                  label="Resep Saya"
                />
                <StatCard
                  icon="📑"
                  value={userStats.total_bookmarks}
                  label="Tersimpan"
                />
                <StatCard
                  icon="👥"
                  value={userStats.total_followers}
                  label="Pengikut"
                />
              </div>

              {/* Daily Quote */}
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 md:p-5 border-2 border-white/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-white text-xl">💭</span>
                  <span className="text-white/90 text-xs md:text-sm font-semibold tracking-wide">
                    INSPIRASI HARI INI
                  </span>
                </div>
                <p className="text-white text-sm md:text-base italic leading-relaxed mb-2">
                  {dailyQuote.quote}
                </p>
                <p className="text-white/85 text-xs md:text-sm">
                  — {dailyQuote.author}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Recipes Section */}
        <div className="px-4 md:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-1 h-7 bg-gradient-to-b from-[#E76F51] to-[#F4A261] rounded-full" />
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                Resep Terpopuler
              </h2>
            </div>
            <div className="px-3 md:px-4 py-2 bg-gradient-to-r from-[#E76F51]/10 to-[#F4A261]/10 rounded-full border-2 border-[#E76F51]/30">
              <div className="flex items-center gap-1.5">
                <span className="text-[#E76F51] text-base md:text-lg">🔥</span>
                <span className="text-[#E76F51] text-sm md:text-base font-bold">
                  {recipes.length}
                </span>
              </div>
            </div>
          </div>

          {recipes.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  rating={recipeRatings[recipe.id]}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 border-2 border-white/30 text-center hover:bg-white/25 transition-all">
      <div className="text-2xl md:text-3xl mb-1.5">{icon}</div>
      <div className="text-lg md:text-xl lg:text-2xl font-bold text-white leading-none mb-1.5">
        {value}
      </div>
      <div className="text-white/90 text-[10px] md:text-xs font-medium leading-tight">
        {label}
      </div>
    </div>
  )
}

function RecipeCard({ recipe, rating }: { recipe: Recipe; rating?: number }) {
  return (
    <Link href={`/recipe/${recipe.id}`}>
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:scale-[1.02] group">
        <div className="relative h-48 md:h-56 lg:h-64 overflow-hidden">
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt={recipe.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#E76F51]/20 to-[#F4A261]/20 flex items-center justify-center">
              <span className="text-6xl md:text-7xl">🍳</span>
            </div>
          )}
          {recipe.difficulty && (
            <div className="absolute top-3 right-3 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs md:text-sm font-bold text-gray-800 shadow-lg border-2 border-white/50">
              {recipe.difficulty}
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="p-4 md:p-5">
          <h3 className="font-bold text-base md:text-lg lg:text-xl text-gray-900 mb-2 line-clamp-2 group-hover:text-[#E76F51] transition-colors">
            {recipe.title}
          </h3>
          
          {recipe.description && (
            <p className="text-gray-600 text-sm md:text-base mb-4 line-clamp-2 leading-relaxed">
              {recipe.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {recipe.profiles?.avatar_url ? (
                <Image
                  src={recipe.profiles.avatar_url}
                  alt={recipe.profiles.username || 'User'}
                  width={32}
                  height={32}
                  className="rounded-full object-cover ring-2 ring-white shadow-sm"
                />
              ) : (
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#E76F51] to-[#F4A261] ring-2 ring-white shadow-sm" />
              )}
              <span className="text-xs md:text-sm text-gray-700 font-semibold">
                {recipe.profiles?.username || 'Anonymous'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs md:text-sm text-gray-600">
              {rating && (
                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                  <span className="text-yellow-500 text-sm">⭐</span>
                  <span className="font-bold text-gray-900">{rating.toFixed(1)}</span>
                </div>
              )}
              {recipe.cooking_time && (
                <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                  <span className="text-sm">⏱️</span>
                  <span className="font-semibold text-gray-900">{recipe.cooking_time}m</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16 md:py-24 px-8">
      <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#E76F51]/20 to-[#F4A261]/20 flex items-center justify-center shadow-xl animate-bounce">
        <span className="text-6xl md:text-7xl">🍳</span>
      </div>
      <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
        Belum Ada Resep
      </h3>
      <p className="text-gray-600 text-base md:text-lg mb-10 max-w-md mx-auto leading-relaxed">
        Jadilah yang pertama membagikan resep lezat dan inspirasi kuliner!
      </p>
      <Link
        href="/create"
        className="inline-flex items-center gap-3 px-8 md:px-10 py-4 md:py-5 bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
      >
        <span className="text-xl md:text-2xl">➕</span>
        <span className="text-base md:text-lg">Buat Resep Pertama</span>
      </Link>
    </div>
  )
}