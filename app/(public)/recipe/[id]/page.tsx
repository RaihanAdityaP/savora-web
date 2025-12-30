import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import RecipeClient from './recipe-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { id: recipeId } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  let currentUser = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    currentUser = {
      id: user.id,
      role: profile?.role || 'user'
    }
  }

  // Fetch recipe with all related data
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select(`
      *,
      profiles:user_id(username, avatar_url, role, is_premium),
      categories(name),
      recipe_tags(tags(id, name))
    `)
    .eq('id', recipeId)
    .single()

  if (error || !recipe) {
    notFound()
  }

  // Increment views (fire and forget)
  supabase
    .from('recipes')
    .update({ views_count: (recipe.views_count || 0) + 1 })
    .eq('id', recipeId)
    .then()

  // Fetch ratings
  const { data: ratings } = await supabase
    .from('recipe_ratings')
    .select('rating')
    .eq('recipe_id', recipeId)

  let initialRating = {
    average: null as number | null,
    count: 0
  }

  if (ratings && ratings.length > 0) {
    const total = ratings.reduce((sum, r) => sum + (r.rating || 0), 0)
    initialRating = {
      average: total / ratings.length,
      count: ratings.length
    }
  }

  // Fetch comments
  const { data: comments } = await supabase
    .from('comments')
    .select('*, profiles:user_id(username, avatar_url)')
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: false })

  return (
    <RecipeClient
      recipe={recipe}
      initialRating={initialRating}
      initialComments={comments || []}
      currentUser={currentUser}
    />
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { id: recipeId } = await params
  const supabase = await createClient()

  const { data: recipe } = await supabase
    .from('recipes')
    .select('title, description, image_url')
    .eq('id', recipeId)
    .single()

  if (!recipe) {
    return {
      title: 'Resep tidak ditemukan | Savora'
    }
  }

  return {
    title: `${recipe.title} | Savora`,
    description: recipe.description || `Resep ${recipe.title} - Lihat bahan dan cara membuatnya di Savora`,
    openGraph: {
      title: recipe.title,
      description: recipe.description || undefined,
      images: recipe.image_url ? [recipe.image_url] : undefined,
      type: 'article'
    },
    twitter: {
      card: 'summary_large_image',
      title: recipe.title,
      description: recipe.description || undefined,
      images: recipe.image_url ? [recipe.image_url] : undefined
    }
  }
}