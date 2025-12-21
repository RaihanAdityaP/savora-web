'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { toast } from 'sonner'
import { 
  Clock, Star, User, Flame, Share2, Bookmark, 
  BookmarkCheck, Edit, Trash2, ChefHat, Play, Tag
} from 'lucide-react'

interface Recipe {
  id: string
  title: string
  description: string | null
  image_url: string | null
  video_url: string | null
  cooking_time: number | null
  servings: number | null
  difficulty: string | null
  calories: number | null
  ingredients: string[]
  steps: string[]
  views_count: number
  user_id: string
  profiles: {
    username: string | null
    avatar_url: string | null
    role: string
    is_premium: boolean
  } | null
  categories: {
    name: string
  } | null
  recipe_tags: Array<{
    tags: {
      id: number
      name: string
    } | null
  }>
}

// Fixed: ubah user_id jadi nullable
interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string | null  // ← Changed from string to string | null
  recipe_id: string | null  // Added for consistency
  profiles: {
    username: string | null
    avatar_url: string | null
  } | null
}

export default function RecipeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string>('user')
  const [isFavorite, setIsFavorite] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [ratingCount, setRatingCount] = useState(0)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')

  useEffect(() => {
    loadRecipe()
    checkFavorite()
    loadRating()
    loadComments()
    incrementViews()
  }, [params.id])

  const loadRecipe = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setCurrentUserRole(profile?.role || 'user')
      }

      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          profiles!recipes_user_id_fkey(username, avatar_url, role, is_premium),
          categories(name),
          recipe_tags(tags(id, name))
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error
      setRecipe(data as Recipe)
    } catch (err) {
      console.error('Error loading recipe:', err)
      toast.error('Gagal memuat resep')
    } finally {
      setLoading(false)
    }
  }

  const incrementViews = async () => {
    try {
      const { data: current } = await supabase
        .from('recipes')
        .select('views_count')
        .eq('id', params.id)
        .single()

      if (current) {
        await supabase
          .from('recipes')
          .update({ views_count: (current.views_count || 0) + 1 })
          .eq('id', params.id)
      }
    } catch (err) {
      console.error('Error incrementing views:', err)
    }
  }

  const checkFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('board_recipes')
        .select('id, recipe_boards!inner(user_id)')
        .eq('recipe_id', params.id)
        .eq('recipe_boards.user_id', user.id)
        .maybeSingle()

      setIsFavorite(!!data)
    } catch (err) {
      console.error('Error checking favorite:', err)
    }
  }

  const loadRating = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: ratings } = await supabase
        .from('recipe_ratings')
        .select('rating, user_id')
        .eq('recipe_id', params.id)

      if (ratings && ratings.length > 0) {
        const total = ratings.reduce((sum, r) => sum + (r.rating || 0), 0)
        setAverageRating(total / ratings.length)
        setRatingCount(ratings.length)

        if (user) {
          const userRatingData = ratings.find(r => r.user_id === user.id)
          setUserRating(userRatingData?.rating || null)
        }
      }
    } catch (err) {
      console.error('Error loading rating:', err)
    }
  }

  const loadComments = async () => {
    try {
      const { data } = await supabase
        .from('comments')
        .select('*, profiles!comments_user_id_fkey(username, avatar_url)')
        .eq('recipe_id', params.id)
        .order('created_at', { ascending: false })

      // Now types match perfectly!
      setComments(data || [])
    } catch (err) {
      console.error('Error loading comments:', err)
    }
  }

  const handleRating = async (rating: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Silakan login untuk memberi rating')
        return
      }

      const { data: existing } = await supabase
        .from('recipe_ratings')
        .select('id')
        .eq('user_id', user.id)
        .eq('recipe_id', params.id)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('recipe_ratings')
          .update({ rating })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('recipe_ratings')
          .insert({ recipe_id: params.id, user_id: user.id, rating })
      }

      setUserRating(rating)
      await loadRating()
      toast.success('Rating berhasil dikirim!')
    } catch (err) {
      console.error('Error submitting rating:', err)
      toast.error('Gagal mengirim rating')
    }
  }

  const handleComment = async () => {
    if (!commentText.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Silakan login untuk berkomentar')
        return
      }

      await supabase
        .from('comments')
        .insert({
          recipe_id: params.id,
          user_id: user.id,
          content: commentText.trim()
        })

      setCommentText('')
      await loadComments()
      toast.success('Komentar berhasil dikirim!')
    } catch (err) {
      console.error('Error posting comment:', err)
      toast.error('Gagal mengirim komentar')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus resep ini?')) return

    try {
      await supabase.from('recipes').delete().eq('id', params.id)
      toast.success('Resep berhasil dihapus!')
      router.push('/home')
    } catch (err) {
      console.error('Error deleting recipe:', err)
      toast.error('Gagal menghapus resep')
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/recipe/${params.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe?.title || 'Resep Savora',
          text: recipe?.description || 'Lihat resep ini di Savora!',
          url
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link berhasil disalin!')
    }
  }

  const isOwner = currentUserId === recipe?.user_id
  const canEdit = isOwner || currentUserRole === 'admin'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E76F51]" />
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Resep tidak ditemukan</h2>
          <button
            onClick={() => router.push('/home')}
            className="text-[#E76F51] hover:underline"
          >
            Kembali ke beranda
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20">
      {/* Hero Image */}
      <div className="relative w-full h-[400px] bg-gray-200">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E76F51] to-[#F4A261]">
            <ChefHat className="w-24 h-24 text-white" />
          </div>
        )}
        
        {/* Overlay Actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50"
            >
              <Share2 className="w-5 h-5" />
            </button>
            
            {isFavorite ? (
              <BookmarkCheck className="w-10 h-10 p-2 rounded-full bg-[#E76F51] text-white shadow-lg" />
            ) : (
              <Bookmark className="w-10 h-10 p-2 rounded-full bg-white shadow-lg" />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 mb-6">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {recipe.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-3 mb-6">
            {recipe.cooking_time && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">{recipe.cooking_time} min</span>
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full">
                <User className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-900">{recipe.servings} porsi</span>
              </div>
            )}
            {recipe.difficulty && (
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full">
                <Flame className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-900 capitalize">{recipe.difficulty}</span>
              </div>
            )}
            {recipe.calories && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full">
                <Flame className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-900">{recipe.calories} kcal</span>
              </div>
            )}
          </div>

          {/* Author */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#E76F51]/10 to-[#F4A261]/10 rounded-2xl mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
              {recipe.profiles?.avatar_url ? (
                <Image
                  src={recipe.profiles.avatar_url}
                  alt={recipe.profiles.username || 'User'}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {recipe.profiles?.username || 'Anonymous'}
              </p>
              <p className="text-sm text-gray-600">
                {recipe.profiles?.role === 'admin' ? 'Admin' : recipe.profiles?.is_premium ? 'Premium Chef' : 'Home Cook'}
              </p>
            </div>
          </div>

          {/* Description */}
          {recipe.description && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Deskripsi</h2>
              <p className="text-gray-700 leading-relaxed">{recipe.description}</p>
            </div>
          )}

          {/* Tags */}
          {recipe.recipe_tags && recipe.recipe_tags.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {recipe.recipe_tags.map((rt, idx) => (
                  rt.tags && (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white text-sm font-semibold rounded-full"
                    >
                      <Tag className="w-3 h-3" />
                      {rt.tags.name}
                    </span>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Video */}
          {recipe.video_url && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Video Tutorial</h2>
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
                <video
                  src={recipe.video_url}
                  controls
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {canEdit && (
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => router.push(`/recipe/${params.id}/edit`)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                <Edit className="w-5 h-5" />
                Edit Resep
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
              >
                <Trash2 className="w-5 h-5" />
                Hapus
              </button>
            </div>
          )}
        </div>

        {/* Ingredients */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Bahan-bahan</h2>
          <div className="space-y-3">
            {recipe.ingredients.map((ingredient, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#E76F51] to-[#F4A261] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-gray-700 leading-relaxed flex-1">{ingredient}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Langkah-langkah</h2>
          <div className="space-y-4">
            {recipe.steps.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#E76F51] to-[#F4A261] flex items-center justify-center text-white font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <p className="text-gray-700 leading-relaxed flex-1 pt-1">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rating & Comments */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Rating & Ulasan</h2>
          
          {/* Average Rating */}
          {averageRating !== null && (
            <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-2xl mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-600">{averageRating.toFixed(1)}</div>
                <div className="text-sm text-gray-600">{ratingCount} rating</div>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${star <= averageRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* User Rating */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-2">Beri Rating Anda</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${userRating && star <= userRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment Input */}
          <div className="mb-6">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Tulis ulasan Anda..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E76F51] focus:outline-none resize-none"
              rows={3}
            />
            <button
              onClick={handleComment}
              disabled={!commentText.trim()}
              className="mt-2 px-6 py-2 bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Kirim Ulasan
            </button>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                    {comment.profiles?.avatar_url ? (
                      <Image
                        src={comment.profiles.avatar_url}
                        alt={comment.profiles.username || 'User'}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      {comment.profiles?.username || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}