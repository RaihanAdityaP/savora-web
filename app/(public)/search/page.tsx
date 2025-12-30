import { createClient } from '@/lib/supabase/server'
import SearchClient from './search-client'

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    tag?: string
    sort?: 'popular' | 'newest' | 'rating'
    page?: string
  }>
}

const ITEMS_PER_PAGE = 12

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Parse search params
  const query = params.q || ''
  const categoryId = params.category ? parseInt(params.category) : null
  const tagId = params.tag ? parseInt(params.tag) : null
  const sortBy = (params.sort || 'popular') as 'popular' | 'newest' | 'rating'
  const page = params.page ? parseInt(params.page) : 1

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  let currentUser = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()
    
    currentUser = {
      id: user.id,
      avatarUrl: profile?.avatar_url || null
    }
  }

  // Load categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name')

  // Load popular tags
  const { data: popularTags } = await supabase
    .from('tags')
    .select('id, name, usage_count')
    .eq('is_approved', true)
    .order('usage_count', { ascending: false })
    .limit(20)

  // Get total count for pagination
  let countQuery = supabase
    .from('recipes')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved')

  if (query.trim()) {
    countQuery = countQuery.ilike('title', `%${query.trim()}%`)
  }

  if (categoryId) {
    countQuery = countQuery.eq('category_id', categoryId)
  }

  const { count } = await countQuery
  const totalRecipes = count || 0

  // Search recipes with pagination
  let recipesQuery = supabase
    .from('recipes')
    .select(`
      *,
      profiles:user_id(username, avatar_url, role),
      categories(id, name),
      recipe_tags(tags(id, name))
    `)
    .eq('status', 'approved')

  if (query.trim()) {
    recipesQuery = recipesQuery.ilike('title', `%${query.trim()}%`)
  }

  if (categoryId) {
    recipesQuery = recipesQuery.eq('category_id', categoryId)
  }

  // Apply sorting
  switch (sortBy) {
    case 'newest':
      recipesQuery = recipesQuery.order('created_at', { ascending: false })
      break
    case 'rating':
      recipesQuery = recipesQuery.order('created_at', { ascending: false })
      break
    case 'popular':
    default:
      recipesQuery = recipesQuery.order('views_count', { ascending: false })
      break
  }

  // Pagination
  const from = (page - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1
  recipesQuery = recipesQuery.range(from, to)

  const { data: recipes } = await recipesQuery

  let filteredRecipes = recipes || []

  // Filter by tag (client-side because of join structure)
  if (tagId) {
    filteredRecipes = filteredRecipes.filter(recipe => {
      return recipe.recipe_tags?.some((rt: any) => rt.tags?.id === tagId)
    })
  }

  // Load ratings for initial recipes
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

  return (
    <SearchClient
      initialRecipes={filteredRecipes}
      initialTotal={totalRecipes}
      initialRatings={ratings}
      categories={categories || []}
      popularTags={popularTags || []}
      currentUser={currentUser}
      initialFilters={{
        query,
        categoryId,
        tagId,
        sortBy,
        page
      }}
    />
  )
}

// Generate metadata for SEO
export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ''
  
  if (query) {
    return {
      title: `Hasil Pencarian: ${query} | Savora`,
      description: `Temukan resep ${query} dan ribuan resep lezat lainnya di Savora`,
      openGraph: {
        title: `Hasil Pencarian: ${query} | Savora`,
        description: `Temukan resep ${query} dan ribuan resep lezat lainnya di Savora`,
      }
    }
  }

  return {
    title: 'Cari Resep | Savora',
    description: 'Temukan ribuan resep lezat dengan mudah. Cari berdasarkan nama, kategori, atau tag favorit Anda.',
    openGraph: {
      title: 'Cari Resep | Savora',
      description: 'Temukan ribuan resep lezat dengan mudah. Cari berdasarkan nama, kategori, atau tag favorit Anda.',
    }
  }
}