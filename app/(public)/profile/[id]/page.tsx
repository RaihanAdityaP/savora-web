import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProfileClient from './profile-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProfilePage({ params }: PageProps) {
  const { id: profileId } = await params
  const supabase = await createClient()

  // Get current user (OPTIONAL - tidak redirect jika tidak ada)
  const { data: { user } } = await supabase.auth.getUser()
  
  let currentUser = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, avatar_url')
      .eq('id', user.id)
      .single()
    
    currentUser = {
      id: user.id,
      role: profile?.role || 'user',
      avatarUrl: profile?.avatar_url || null
    }
  }

  // Load profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  if (error || !profile) {
    notFound()
  }

  // Check if current user is following this profile
  let isFollowing = false
  if (user && user.id !== profileId) {
    const { data: followData } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profileId)
      .maybeSingle()

    isFollowing = !!followData
  }

  // Load recipes
  const { data: recipes } = await supabase
    .from('recipes')
    .select(`
      *,
      profiles:user_id(username, avatar_url, role),
      categories(id, name)
    `)
    .eq('user_id', profileId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  // Load ratings for recipes
  const ratings: Record<string, number> = {}
  if (recipes) {
    for (const recipe of recipes) {
      const { data: ratingData } = await supabase
        .from('recipe_ratings')
        .select('rating')
        .eq('recipe_id', recipe.id)

      if (ratingData && ratingData.length > 0) {
        const total = ratingData.reduce((sum, r) => sum + (r.rating || 0), 0)
        ratings[recipe.id] = total / ratingData.length
      }
    }
  }

  return (
    <ProfileClient
      profile={profile}
      recipes={recipes || []}
      initialRatings={ratings}
      currentUser={currentUser}
      initialIsFollowing={isFollowing}
    />
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { id: profileId } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, bio, avatar_url')
    .eq('id', profileId)
    .single()

  if (!profile) {
    return {
      title: 'Profil tidak ditemukan | Savora'
    }
  }

  const displayName = profile.username || profile.full_name || 'Pengguna'

  return {
    title: `${displayName} | Savora`,
    description: profile.bio || `Lihat profil ${displayName} dan resep-resepnya di Savora`,
    openGraph: {
      title: `${displayName} | Savora`,
      description: profile.bio || `Lihat profil ${displayName} dan resep-resepnya di Savora`,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
      type: 'profile'
    },
    twitter: {
      card: 'summary',
      title: `${displayName} | Savora`,
      description: profile.bio || `Lihat profil ${displayName} dan resep-resepnya di Savora`,
      images: profile.avatar_url ? [profile.avatar_url] : undefined
    }
  }
}