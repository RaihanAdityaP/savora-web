import { createClient } from '@/lib/supabase/server'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://savora-web.vercel.app'
  const supabase = await createClient()

  // Static routes - SEMUA route public yang bisa diakses
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/home`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Dynamic recipe routes
  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, updated_at')
    .eq('status', 'approved')
    .order('updated_at', { ascending: false })
    .limit(5000) // Increased limit untuk lebih banyak resep

  const recipeRoutes: MetadataRoute.Sitemap = (recipes || []).map((recipe) => ({
    url: `${baseUrl}/recipe/${recipe.id}`,
    lastModified: new Date(recipe.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Dynamic profile routes (hanya yang punya resep approved)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, updated_at')
    .gt('total_recipes', 0)
    .limit(1000)

  const profileRoutes: MetadataRoute.Sitemap = (profiles || []).map((profile) => ({
    url: `${baseUrl}/profile/${profile.id}`,
    lastModified: new Date(profile.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...recipeRoutes, ...profileRoutes]
}