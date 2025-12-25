'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import UnifiedNavigation from '@/components/ui/unified-navigation'
import RecipeCard from '@/components/ui/recipe-card'
import {
  Search, X, SlidersHorizontal, TrendingUp, Clock, Star,
  Tag, Grid3x3, Users, Sparkles, ChefHat, ChevronLeft, ChevronRight
} from 'lucide-react'

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

interface Category {
  id: number
  name: string
  slug: string
}

interface PopularTag {
  id: number
  name: string
  usage_count: number
}

const ITEMS_PER_PAGE = 12

export default function SearchPage() {
  const router = useRouter()
  const supabase = createClient()

  // Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecipes, setTotalRecipes] = useState(0)

  // Filter State
  const [categories, setCategories] = useState<Category[]>([])
  const [popularTags, setPopularTags] = useState<PopularTag[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating'>('popular')
  const [followedUsersOnly, setFollowedUsersOnly] = useState(false)

  // UI State
  const [showFilters, setShowFilters] = useState(false)
  const [recipeRatings, setRecipeRatings] = useState<Record<string, number>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    loadCurrentUser()
    loadCategories()
    loadPopularTags()
  }, [])

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      setCurrentPage(1) // Reset to page 1 when search criteria changes
      searchRecipes(1)
    }, 300)

    return () => clearTimeout(delaySearch)
  }, [searchQuery, selectedCategoryId, selectedTagId, sortBy, followedUsersOnly])

  useEffect(() => {
    if (currentPage > 1) {
      searchRecipes(currentPage)
    }
  }, [currentPage])

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setAvatarUrl(data.avatar_url)
        }
      }
    } catch (err) {
      console.error('Error loading user:', err)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const loadPopularTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('id, name, usage_count')
        .eq('is_approved', true)
        .order('usage_count', { ascending: false })
        .limit(20)

      if (error) throw error
      setPopularTags(data || [])
    } catch (err) {
      console.error('Error loading tags:', err)
    }
  }

  const searchRecipes = async (page: number) => {
    setLoading(true)
    try {
      // First, get total count
      let countQuery = supabase
        .from('recipes')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved')

      if (searchQuery.trim()) {
        countQuery = countQuery.ilike('title', `%${searchQuery.trim()}%`)
      }

      if (selectedCategoryId) {
        countQuery = countQuery.eq('category_id', selectedCategoryId)
      }

      if (followedUsersOnly && currentUserId) {
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUserId)

        const followingIds = follows?.map(f => f.following_id) || []
        if (followingIds.length > 0) {
          countQuery = countQuery.in('user_id', followingIds)
        } else {
          setRecipes([])
          setTotalRecipes(0)
          setLoading(false)
          return
        }
      }

      const { count } = await countQuery
      setTotalRecipes(count || 0)

      // Then get paginated data
      let query = supabase
        .from('recipes')
        .select(`
          *,
          profiles:user_id(username, avatar_url, role),
          categories(id, name),
          recipe_tags(tags(id, name))
        `)
        .eq('status', 'approved')

      if (searchQuery.trim()) {
        query = query.ilike('title', `%${searchQuery.trim()}%`)
      }

      if (selectedCategoryId) {
        query = query.eq('category_id', selectedCategoryId)
      }

      if (followedUsersOnly && currentUserId) {
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUserId)

        const followingIds = follows?.map(f => f.following_id) || []
        if (followingIds.length > 0) {
          query = query.in('user_id', followingIds)
        }
      }

      // Sort
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'rating':
          query = query.order('created_at', { ascending: false })
          break
        case 'popular':
        default:
          query = query.order('views_count', { ascending: false })
          break
      }

      // Pagination
      const from = (page - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      query = query.range(from, to)

      const { data, error } = await query

      if (error) throw error

      let filteredRecipes = (data || []) as Recipe[]

      // Filter by tag (client-side because of join structure)
      if (selectedTagId) {
        filteredRecipes = filteredRecipes.filter(recipe => {
          return recipe.recipe_tags?.some(rt => rt.tags?.id === selectedTagId)
        })
      }

      // Load ratings
      const ratings: Record<string, number> = {}
      for (const recipe of filteredRecipes) {
        const { data: ratingData } = await supabase
          .from('recipe_ratings')
          .select('rating')
          .eq('recipe_id', recipe.id)

        if (ratingData && ratingData.length > 0) {
          const total = ratingData.reduce((sum, r) => sum + (r.rating || 0), 0)
          ratings[recipe.id] = total / ratingData.length
        }
      }

      // Sort by rating if needed
      if (sortBy === 'rating') {
        filteredRecipes.sort((a, b) => {
          const ratingA = ratings[a.id] || 0
          const ratingB = ratings[b.id] || 0
          return ratingB - ratingA
        })
      }

      setRecipes(filteredRecipes)
      setRecipeRatings(ratings)
    } catch (err) {
      console.error('Error searching recipes:', err)
      toast.error('Gagal mencari resep')
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSelectedCategoryId(null)
    setSelectedTagId(null)
    setSortBy('popular')
    setFollowedUsersOnly(false)
    setCurrentPage(1)
  }

  const activeFiltersCount = [
    selectedCategoryId !== null,
    selectedTagId !== null,
    sortBy !== 'popular',
    followedUsersOnly
  ].filter(Boolean).length

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

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <UnifiedNavigation avatarUrl={avatarUrl} />
      
      <div className="max-w-7xl mx-auto pb-24 md:pb-8">
        {/* Search Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari resep lezat..."
                    className="w-full pl-12 pr-12 py-4 border-2 border-[#E76F51]/30 rounded-2xl focus:border-[#E76F51] focus:outline-none text-base"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="relative px-6 py-4 bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white rounded-2xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span className="hidden sm:inline">Filter</span>
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedCategoryId && (
                  <ActiveFilterChip
                    label={categories.find(c => c.id === selectedCategoryId)?.name || ''}
                    icon={Grid3x3}
                    onRemove={() => setSelectedCategoryId(null)}
                  />
                )}
                {selectedTagId && (
                  <ActiveFilterChip
                    label={`#${popularTags.find(t => t.id === selectedTagId)?.name || ''}`}
                    icon={Tag}
                    onRemove={() => setSelectedTagId(null)}
                  />
                )}
                {followedUsersOnly && (
                  <ActiveFilterChip
                    label="Dari yang diikuti"
                    icon={Users}
                    onRemove={() => setFollowedUsersOnly(false)}
                  />
                )}
                {sortBy !== 'popular' && (
                  <ActiveFilterChip
                    label={sortBy === 'newest' ? 'Terbaru' : 'Rating Tertinggi'}
                    icon={sortBy === 'newest' ? Clock : Star}
                    onRemove={() => setSortBy('popular')}
                  />
                )}
                <button
                  onClick={clearFilters}
                  className="px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  Reset Semua
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white border-b border-gray-200 shadow-lg">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <div className="space-y-6">
                {/* Sort Options */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-[#2A9D8F]" />
                    <h3 className="font-bold text-gray-900">Urutkan Berdasarkan</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <SortChip
                      label="Terpopuler"
                      value="popular"
                      icon={TrendingUp}
                      active={sortBy === 'popular'}
                      onClick={() => setSortBy('popular')}
                    />
                    <SortChip
                      label="Terbaru"
                      value="newest"
                      icon={Clock}
                      active={sortBy === 'newest'}
                      onClick={() => setSortBy('newest')}
                    />
                    <SortChip
                      label="Rating Tertinggi"
                      value="rating"
                      icon={Star}
                      active={sortBy === 'rating'}
                      onClick={() => setSortBy('rating')}
                    />
                  </div>
                </div>

                {/* Followed Users Filter */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#F4A261]/10 to-[#E9C46A]/10 rounded-xl border-2 border-[#F4A261]/30">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-[#F4A261]" />
                    <div>
                      <p className="font-bold text-gray-900">Dari yang Diikuti</p>
                      <p className="text-sm text-gray-600">Hanya tampilkan resep dari pengguna yang Anda ikuti</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={followedUsersOnly}
                      onChange={(e) => setFollowedUsersOnly(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#F4A261]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F4A261]"></div>
                  </label>
                </div>

                {/* Categories */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Grid3x3 className="w-5 h-5 text-[#E76F51]" />
                    <h3 className="font-bold text-gray-900">Kategori</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <FilterChip
                        key={category.id}
                        label={category.name}
                        active={selectedCategoryId === category.id}
                        onClick={() => setSelectedCategoryId(
                          selectedCategoryId === category.id ? null : category.id
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-5 h-5 text-[#E9C46A]" />
                    <h3 className="font-bold text-gray-900">Tags Populer</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map(tag => (
                      <FilterChip
                        key={tag.id}
                        label={`#${tag.name}`}
                        count={tag.usage_count}
                        active={selectedTagId === tag.id}
                        onClick={() => setSelectedTagId(
                          selectedTagId === tag.id ? null : tag.id
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-[#E76F51] to-[#F4A261] rounded-2xl flex items-center justify-center animate-pulse">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-600 font-medium">Mencari resep...</p>
              </div>
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-[#E76F51]/20 to-[#F4A261]/20 rounded-full flex items-center justify-center">
                <ChefHat className="w-16 h-16 text-[#E76F51]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {searchQuery || activeFiltersCount > 0 ? 'Tidak Ditemukan Resep' : 'Mulai Pencarian'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || activeFiltersCount > 0
                  ? 'Coba kata kunci lain atau ubah filter pencarian'
                  : 'Temukan ribuan resep lezat dengan mudah dan cepat'}
              </p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white rounded-xl font-semibold hover:opacity-90 transition"
                >
                  <Sparkles className="w-5 h-5" />
                  Reset Semua Filter
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">
                  Ditemukan <span className="font-bold text-[#E76F51]">{totalRecipes}</span> resep
                  {totalPages > 1 && (
                    <span className="text-gray-400 ml-2">
                      (Halaman {currentPage} dari {totalPages})
                    </span>
                  )}
                </p>
              </div>
              
              <div className="space-y-4">
                {recipes.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    rating={recipeRatings[recipe.id]}
                    onTap={() => searchRecipes(currentPage)}
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
    </div>
  )
}

function SortChip({ label, value, icon: Icon, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
        active
          ? 'bg-gradient-to-r from-[#2A9D8F] to-[#264653] text-white shadow-lg'
          : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#2A9D8F]'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
    </button>
  )
}

function FilterChip({ label, count, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
        active
          ? 'bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white shadow-lg'
          : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#E76F51]'
      }`}
    >
      <span className="text-sm">{label}</span>
      {count !== undefined && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          active ? 'bg-white/30' : 'bg-[#E76F51]/10 text-[#E76F51]'
        }`}>
          {count}
        </span>
      )}
    </button>
  )
}

function ActiveFilterChip({ label, icon: Icon, onRemove }: any) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#E76F51]/10 to-[#F4A261]/10 border-2 border-[#E76F51]/30 rounded-xl">
      <Icon className="w-4 h-4 text-[#E76F51]" />
      <span className="text-sm font-semibold text-[#E76F51]">{label}</span>
      <button
        onClick={onRemove}
        className="w-5 h-5 bg-[#E76F51] text-white rounded-full flex items-center justify-center hover:bg-[#d65a3d] transition"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}