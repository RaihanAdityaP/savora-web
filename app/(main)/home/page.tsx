'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import UnifiedNavigation from '@/components/ui/unified-navigation'
import RecipeCard from '@/components/ui/recipe-card'
import { Flame, ChefHat, Bookmark, Users, Sparkles, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'

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

interface UserStats {
  total_recipes: number
  total_bookmarks: number
  total_followers: number
}

const DAILY_QUOTES = [
  { quote: 'Masakan terbaik dibuat dengan cinta', author: 'Chef Julia Child' },
  { quote: 'Memasak adalah seni yang bisa dinikmati semua orang', author: 'Gordon Ramsay' },
  { quote: 'Resep adalah cerita yang berakhir dengan makanan lezat', author: 'Pat Conroy' },
  { quote: 'Kebahagiaan dimulai dari dapur', author: 'Traditional Wisdom' },
  { quote: 'Setiap chef adalah seniman dengan palet rasa', author: 'Anonymous' },
  { quote: 'Masak dengan hati, sajikan dengan senyuman', author: 'Savora Community' },
]

const ITEMS_PER_PAGE = 12

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [username, setUsername] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecipes, setTotalRecipes] = useState(0)
  const [userStats, setUserStats] = useState<UserStats>({
    total_recipes: 0,
    total_bookmarks: 0,
    total_followers: 0,
  })
  const [recipeRatings, setRecipeRatings] = useState<Record<string, number>>({})

  useEffect(() => {
    loadUserData()
    loadUserStats()
    const cleanup = setupBannedListener()
    return cleanup
  }, [])

  useEffect(() => {
    loadPopularRecipes(currentPage)
  }, [currentPage])

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
          .single<{ username: string | null; avatar_url: string | null }>()

        if (error) throw error
        
        if (data) {
          setUsername(data.username)
          setAvatarUrl(data.avatar_url)
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

  const loadPopularRecipes = async (page: number) => {
    setIsLoading(true)
    try {
      // Get total count first
      const { count } = await supabase
        .from('recipes')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved')

      setTotalRecipes(count || 0)

      // Get paginated data
      const from = (page - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

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
        .range(from, to)

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
          .returns<{ rating: number | null }[]>()

        if (ratingData && ratingData.length > 0) {
          const total = ratingData.reduce((sum, r) => sum + (r.rating || 0), 0)
          ratings[recipe.id] = total / ratingData.length
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

  const totalPages = Math.ceil(totalRecipes / ITEMS_PER_PAGE)

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        pages.push(currentPage - 1)
        pages.push(currentPage)
        pages.push(currentPage + 1)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const dailyQuote = getDailyQuote()

  if (isLoading && currentPage === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#E76F51] to-[#F4A261] flex items-center justify-center shadow-xl animate-pulse">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Memuat resep lezat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <UnifiedNavigation avatarUrl={avatarUrl} />
      
      <div className="max-w-7xl mx-auto pb-24 md:pb-8">
        {/* Welcome Section */}
        <div className="p-4 md:p-6 lg:p-8 animate-fade-in">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
              Halo, {username || 'Foodie'}!
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Selamat datang kembali di Savora
            </p>
          </div>
        </div>

        {/* Full Width Scrollable Events Carousel */}
        <div className="overflow-x-auto pb-6 scrollbar-hide">
          <div className="flex gap-4 px-4 md:px-6 lg:px-8">
            {/* Stats Card */}
            <div className="bg-gradient-to-br from-[#264653] via-[#2A9D8F] to-[#E76F51] rounded-3xl shadow-2xl p-6 min-w-[85vw] md:min-w-[450px] flex-shrink-0">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-white" />
                <h3 className="text-white font-bold text-lg">Statistik Anda</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  icon={ChefHat}
                  value={userStats.total_recipes}
                  label="Resep"
                />
                <StatCard
                  icon={Bookmark}
                  value={userStats.total_bookmarks}
                  label="Tersimpan"
                />
                <StatCard
                  icon={Users}
                  value={userStats.total_followers}
                  label="Pengikut"
                />
              </div>
            </div>

            {/* Daily Quote Card */}
            <div className="bg-gradient-to-br from-[#E76F51] via-[#F4A261] to-[#E9C46A] rounded-3xl shadow-2xl p-6 min-w-[85vw] md:min-w-[450px] flex-shrink-0">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-white" />
                <h3 className="text-white font-bold text-lg">Inspirasi Hari Ini</h3>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/30">
                <p className="text-white text-sm md:text-base italic leading-relaxed mb-3">
                  "{dailyQuote.quote}"
                </p>
                <p className="text-white/90 text-xs md:text-sm font-medium">
                  — {dailyQuote.author}
                </p>
              </div>
            </div>

            {/* Placeholder for Future Events */}
            <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-3xl shadow-2xl p-6 min-w-[85vw] md:min-w-[450px] flex-shrink-0">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-white" />
                <h3 className="text-white font-bold text-lg">Event Mendatang</h3>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/30 text-center h-24 flex items-center justify-center">
                <p className="text-white text-sm">
                  Segera hadir...
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
                <Flame className="w-4 h-4 md:w-5 md:h-5 text-[#E76F51]" />
                <span className="text-[#E76F51] text-sm md:text-base font-bold">
                  {totalRecipes}
                </span>
              </div>
            </div>
          </div>

          {recipes.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {totalPages > 1 && (
                <div className="mb-4">
                  <p className="text-gray-600 text-sm">
                    Halaman {currentPage} dari {totalPages}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {recipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    rating={recipeRatings[recipe.id]}
                    onTap={() => {
                      loadUserStats()
                      loadPopularRecipes(currentPage)
                    }}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border-2 border-gray-200 hover:border-[#E76F51] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {getPageNumbers().map((page, idx) => (
                    page === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-3 py-2 text-gray-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page as number)}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white shadow-lg'
                            : 'border-2 border-gray-200 hover:border-[#E76F51] text-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border-2 border-gray-200 hover:border-[#E76F51] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

function StatCard({ 
  icon: Icon, 
  value, 
  label 
}: { 
  icon: React.ComponentType<{ className?: string }>
  value: number
  label: string 
}) {
  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border-2 border-white/30 text-center hover:bg-white/25 transition-all">
      <Icon className="w-6 h-6 text-white mx-auto mb-2" />
      <div className="text-xl font-bold text-white leading-none mb-1">
        {value}
      </div>
      <div className="text-white/90 text-xs font-medium leading-tight">
        {label}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16 md:py-24 px-8">
      <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#E76F51]/20 to-[#F4A261]/20 flex items-center justify-center shadow-xl">
        <ChefHat className="w-16 h-16 md:w-20 md:h-20 text-[#E76F51]" />
      </div>
      <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
        Belum Ada Resep
      </h3>
      <p className="text-gray-600 text-base md:text-lg mb-10 max-w-md mx-auto leading-relaxed">
        Jadilah yang pertama membagikan resep lezat dan inspirasi kuliner!
      </p>
      <a
        href="/create"
        className="inline-flex items-center gap-3 px-8 md:px-10 py-4 md:py-5 bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
      >
        <ChefHat className="w-6 h-6" />
        <span className="text-base md:text-lg">Buat Resep Pertama</span>
      </a>
    </div>
  )
}