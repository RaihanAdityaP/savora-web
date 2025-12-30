'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { toast } from 'sonner'
import { 
  Clock, Star, User, Flame, Share2, Bookmark, 
  BookmarkCheck, Edit, Trash2, ChefHat, Tag, Play, X
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

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string | null
  recipe_id: string | null
  profiles: {
    username: string | null
    avatar_url: string | null
  } | null
}

interface RecipeClientProps {
  recipe: Recipe
  initialRating: {
    average: number | null
    count: number
  }
  initialComments: Comment[]
  currentUser: {
    id: string
    role: string
  } | null
}

export default function RecipeClient({
  recipe,
  initialRating,
  initialComments,
  currentUser,
}: RecipeClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [userRating, setUserRating] = useState<number | null>(null)
  const [averageRating, setAverageRating] = useState(initialRating.average)
  const [ratingCount, setRatingCount] = useState(initialRating.count)
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [commentText, setCommentText] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [userCollections, setUserCollections] = useState<any[]>([])
  const [showCollectionsModal, setShowCollectionsModal] = useState(false)
  const [savedCollections, setSavedCollections] = useState<string[]>([])

  // ✅ Load user-specific data on mount - FIXED: Using useEffect instead of useState
  useEffect(() => {
    if (currentUser) {
      loadUserRating()
      loadUserCollections()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser])

  const loadUserRating = async () => {
    if (!currentUser) return

    try {
      const { data } = await supabase
        .from('recipe_ratings')
        .select('rating')
        .eq('recipe_id', recipe.id)
        .eq('user_id', currentUser.id)
        .maybeSingle()

      setUserRating(data?.rating || null)
    } catch (err) {
      console.error('Error loading user rating:', err)
    }
  }

  const loadUserCollections = async () => {
    if (!currentUser) return

    try {
      const { data: collections } = await supabase
        .from('recipe_boards')
        .select('id, name')
        .eq('user_id', currentUser.id)
        .order('name')

      setUserCollections(collections || [])

      const { data: existing } = await supabase
        .from('board_recipes')
        .select('board_id')
        .eq('recipe_id', recipe.id)

      if (existing) {
        setSavedCollections(existing.map(item => item.board_id))
      }
    } catch (err) {
      console.error('Error loading collections:', err)
    }
  }

  const handleToggleCollection = async (collectionId: string) => {
    if (!currentUser) {
      toast.error('Silakan login untuk menyimpan resep')
      router.push('/login')
      return
    }

    try {
      const isAlreadySaved = savedCollections.includes(collectionId)

      if (isAlreadySaved) {
        await supabase
          .from('board_recipes')
          .delete()
          .eq('board_id', collectionId)
          .eq('recipe_id', recipe.id)

        setSavedCollections(prev => prev.filter(id => id !== collectionId))
        toast.success('Resep dihapus dari koleksi')
      } else {
        await supabase
          .from('board_recipes')
          .insert({
            board_id: collectionId,
            recipe_id: recipe.id
          })

        setSavedCollections(prev => [...prev, collectionId])
        toast.success('Resep ditambahkan ke koleksi!')
      }
    } catch (err) {
      console.error('Error toggling collection:', err)
      toast.error('Gagal menyimpan resep')
    }
  }

  const handleCreateNewCollection = async () => {
    if (!currentUser) {
      toast.error('Silakan login')
      router.push('/login')
      return
    }

    const name = prompt('Nama koleksi baru:')
    if (!name?.trim()) return

    try {
      const { data: newCollection } = await supabase
        .from('recipe_boards')
        .insert({
          user_id: currentUser.id,
          name: name.trim()
        })
        .select('id, name')
        .single()

      if (newCollection) {
        setUserCollections(prev => [...prev, newCollection])
        toast.success('Koleksi berhasil dibuat!')
      }
    } catch (err) {
      console.error('Error creating collection:', err)
      toast.error('Gagal membuat koleksi')
    }
  }

  const handleRating = async (rating: number) => {
    if (!currentUser) {
      toast.error('Silakan login untuk memberi rating')
      router.push('/login')
      return
    }

    try {
      const { data: existing } = await supabase
        .from('recipe_ratings')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('recipe_id', recipe.id)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('recipe_ratings')
          .update({ rating })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('recipe_ratings')
          .insert({ recipe_id: recipe.id, user_id: currentUser.id, rating })
      }

      setUserRating(rating)
      
      // Reload rating data
      const { data: ratings } = await supabase
        .from('recipe_ratings')
        .select('rating')
        .eq('recipe_id', recipe.id)

      if (ratings && ratings.length > 0) {
        const total = ratings.reduce((sum, r) => sum + (r.rating || 0), 0)
        setAverageRating(total / ratings.length)
        setRatingCount(ratings.length)
      }

      toast.success('Rating berhasil dikirim!')
    } catch (err) {
      console.error('Error submitting rating:', err)
      toast.error('Gagal mengirim rating')
    }
  }

  const handleComment = async () => {
    if (!commentText.trim()) return

    if (!currentUser) {
      toast.error('Silakan login untuk berkomentar')
      router.push('/login')
      return
    }

    try {
      const { data: newComment } = await supabase
        .from('comments')
        .insert({
          recipe_id: recipe.id,
          user_id: currentUser.id,
          content: commentText.trim()
        })
        .select('*, profiles:user_id(username, avatar_url)')
        .single()

      if (newComment) {
        setComments(prev => [newComment, ...prev])
      }

      setCommentText('')
      toast.success('Komentar berhasil dikirim!')
    } catch (err) {
      console.error('Error posting comment:', err)
      toast.error('Gagal mengirim komentar')
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editingCommentText.trim()) return

    try {
      await supabase
        .from('comments')
        .update({ content: editingCommentText.trim() })
        .eq('id', commentId)

      setComments(prev =>
        prev.map(c =>
          c.id === commentId ? { ...c, content: editingCommentText.trim() } : c
        )
      )

      setEditingCommentId(null)
      setEditingCommentText('')
      toast.success('Komentar berhasil diperbarui!')
    } catch (err) {
      console.error('Error updating comment:', err)
      toast.error('Gagal memperbarui komentar')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus komentar ini?')) return

    try {
      await supabase.from('comments').delete().eq('id', commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
      toast.success('Komentar berhasil dihapus!')
    } catch (err) {
      console.error('Error deleting comment:', err)
      toast.error('Gagal menghapus komentar')
    }
  }

  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditingCommentText(comment.content)
  }

  const cancelEditComment = () => {
    setEditingCommentId(null)
    setEditingCommentText('')
  }

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus resep ini?')) return

    try {
      await supabase.from('recipes').delete().eq('id', recipe.id)
      toast.success('Resep berhasil dihapus!')
      router.push('/home')
    } catch (err) {
      console.error('Error deleting recipe:', err)
      toast.error('Gagal menghapus resep')
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/recipe/${recipe.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.description || 'Lihat resep ini di Savora!',
          url
        })
        return
      } catch (err) {
        console.log('Share cancelled or failed:', err)
      }
    }
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
        toast.success('Link berhasil disalin!')
      } else {
        const tempInput = document.createElement('input')
        tempInput.value = url
        tempInput.style.position = 'fixed'
        tempInput.style.opacity = '0'
        document.body.appendChild(tempInput)
        tempInput.select()
        document.execCommand('copy')
        document.body.removeChild(tempInput)
        toast.success('Link berhasil disalin!')
      }
    } catch (err) {
      console.error('Error copying to clipboard:', err)
      toast.error('Gagal menyalin link')
    }
  }

  const isOwner = currentUser?.id === recipe.user_id
  const canEdit = isOwner || currentUser?.role === 'admin'

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20">
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 mb-6">
          {/* Hero Image */}
          <div className="relative w-full h-[300px] md:h-[400px] bg-gray-200 rounded-2xl overflow-hidden mb-6">
            {recipe.image_url ? (
              <Image
                src={recipe.image_url}
                alt={recipe.title}
                fill
                className="object-cover object-center"
                priority
                sizes="(max-width: 768px) 100vw, 896px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E76F51] to-[#F4A261]">
                <ChefHat className="w-24 h-24 text-white" />
              </div>
            )}
            
            {/* Overlay Actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition"
              >
                <Share2 className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowCollectionsModal(true)}
                className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition"
              >
                {savedCollections.length > 0 ? (
                  <BookmarkCheck className="w-5 h-5 text-[#E76F51]" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

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
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#E76F51] to-[#F4A261] flex items-center justify-center">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
                Video Tutorial
              </h2>
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
                <video
                  src={recipe.video_url}
                  controls
                  controlsList="nodownload"
                  className="w-full h-full object-contain"
                  preload="metadata"
                >
                  Browser Anda tidak mendukung video.
                </video>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {canEdit && (
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => router.push(`/recipe/${recipe.id}/edit`)}
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
            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              recipe.ingredients.map((ingredient, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#E76F51] to-[#F4A261] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-gray-700 leading-relaxed flex-1">{ingredient}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Tidak ada bahan yang tercatat</p>
            )}
          </div>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Langkah-langkah</h2>
          <div className="space-y-4">
            {recipe.steps && recipe.steps.length > 0 ? (
              recipe.steps.map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#E76F51] to-[#F4A261] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-gray-700 leading-relaxed flex-1 pt-1">{step}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Tidak ada langkah yang tercatat</p>
            )}
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
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Belum ada komentar</p>
            ) : (
              comments.map(comment => {
                const canEditComment = currentUser?.id === comment.user_id
                const canDeleteComment = canEditComment || currentUser?.role === 'admin'
                const isEditing = editingCommentId === comment.id

                return (
                  <div key={comment.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <p className="font-semibold text-sm text-gray-900">
                              {comment.profiles?.username || 'Anonymous'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                          {(canEditComment || canDeleteComment) && !isEditing && (
                            <div className="flex gap-1">
                              {canEditComment && (
                                <button
                                  onClick={() => startEditComment(comment)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {canDeleteComment && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingCommentText}
                              onChange={e => setEditingCommentText(e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#E76F51] focus:outline-none resize-none text-sm"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditComment(comment.id)}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                              >
                                Simpan
                              </button>
                              <button
                                onClick={cancelEditComment}
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-700 text-sm leading-relaxed break-words">
                            {comment.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Collections Modal */}
      {showCollectionsModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCollectionsModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold">Simpan ke Koleksi</h3>
                <button
                  onClick={() => setShowCollectionsModal(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-white/90 text-sm">Pilih koleksi untuk menyimpan resep ini</p>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              {userCollections.length === 0 ? (
                <div className="text-center py-8">
                  <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Belum ada koleksi</p>
                  <button
                    onClick={handleCreateNewCollection}
                    className="px-6 py-2 bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white rounded-xl font-semibold hover:opacity-90 transition"
                  >
                    Buat Koleksi Pertama
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {userCollections.map(collection => {
                    const isSaved = savedCollections.includes(collection.id)
                    return (
                      <button
                        key={collection.id}
                        onClick={() => handleToggleCollection(collection.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition ${
                          isSaved
                            ? 'border-[#E76F51] bg-[#E76F51]/10'
                            : 'border-gray-200 hover:border-[#E76F51]/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSaved ? 'bg-[#E76F51] text-white' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <Bookmark className="w-5 h-5" />
                          </div>
                          <span className={`font-semibold ${isSaved ? 'text-[#E76F51]' : 'text-gray-700'}`}>
                            {collection.name}
                          </span>
                        </div>
                        {isSaved && (
                          <BookmarkCheck className="w-6 h-6 text-[#E76F51]" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {userCollections.length > 0 && (
                <button
                  onClick={handleCreateNewCollection}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#E76F51] hover:bg-[#E76F51]/5 transition group"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-[#E76F51]/10 flex items-center justify-center transition">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-[#E76F51]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-600 group-hover:text-[#E76F51]">
                    Buat Koleksi Baru
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}