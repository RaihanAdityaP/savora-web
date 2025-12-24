'use client'

import Image from 'next/image'
import { Clock, Star, User, Bookmark, BookmarkCheck } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface RecipeCardProps {
  recipe: {
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
  }
  rating?: number
  onTap?: () => void
  hideBookmark?: boolean
}

export default function RecipeCard({ recipe, rating, onTap, hideBookmark = false }: RecipeCardProps) {
  const supabase = createClient()
  const [imageError, setImageError] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showCollections, setShowCollections] = useState(false)
  const [collections, setCollections] = useState<any[]>([])
  const [savedCollections, setSavedCollections] = useState<string[]>([])
  const [loadingCollections, setLoadingCollections] = useState(false)

  // Check if recipe is saved on mount
  useEffect(() => {
    checkIfSaved()
  }, [])

  const checkIfSaved = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: existing } = await supabase
        .from('board_recipes')
        .select('board_id')
        .eq('recipe_id', recipe.id)

      if (existing && existing.length > 0) {
        setIsSaved(true)
        setSavedCollections(existing.map(item => item.board_id))
      }
    } catch (err) {
      console.error('Error checking saved status:', err)
    }
  }

  const handleCardClick = () => {
    if (onTap) {
      onTap()
    }
    window.location.href = `/recipe/${recipe.id}`
  }

  const getRoleGradient = (role: string) => {
    switch (role) {
      case 'admin':
        return 'from-yellow-400 to-orange-400'
      case 'premium':
        return 'from-purple-400 to-purple-600'
      default:
        return 'from-gray-400 to-gray-500'
    }
  }

  const loadCollections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Silakan login untuk menyimpan resep')
        return
      }

      setLoadingCollections(true)

      // Load user's collections
      const { data: userCollections } = await supabase
        .from('recipe_boards')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name')

      setCollections(userCollections || [])

      // Check which collections already have this recipe
      const { data: existing } = await supabase
        .from('board_recipes')
        .select('board_id')
        .eq('recipe_id', recipe.id)

      if (existing) {
        setSavedCollections(existing.map(item => item.board_id))
        setIsSaved(existing.length > 0)
      }
    } catch (err) {
      console.error('Error loading collections:', err)
      toast.error('Gagal memuat koleksi')
    } finally {
      setLoadingCollections(false)
    }
  }

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    await loadCollections()
    setShowCollections(true)
  }

  const handleToggleCollection = async (collectionId: string) => {
    try {
      const isAlreadySaved = savedCollections.includes(collectionId)

      if (isAlreadySaved) {
        await supabase
          .from('board_recipes')
          .delete()
          .eq('board_id', collectionId)
          .eq('recipe_id', recipe.id)

        const newSavedCollections = savedCollections.filter(id => id !== collectionId)
        setSavedCollections(newSavedCollections)
        setIsSaved(newSavedCollections.length > 0)
        toast.success('Resep dihapus dari koleksi')
      } else {
        await supabase
          .from('board_recipes')
          .insert({
            board_id: collectionId,
            recipe_id: recipe.id
          })

        const newSavedCollections = [...savedCollections, collectionId]
        setSavedCollections(newSavedCollections)
        setIsSaved(true)
        toast.success('Resep ditambahkan ke koleksi!')
      }
    } catch (err) {
      console.error('Error toggling collection:', err)
      toast.error('Gagal menyimpan resep')
    }
  }

  const handleCreateNewCollection = async () => {
    const name = prompt('Nama koleksi baru:')
    if (!name?.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: newCollection } = await supabase
        .from('recipe_boards')
        .insert({
          user_id: user.id,
          name: name.trim()
        })
        .select('id, name')
        .single()

      if (newCollection) {
        setCollections(prev => [...prev, newCollection])
        toast.success('Koleksi berhasil dibuat!')
      }
    } catch (err) {
      console.error('Error creating collection:', err)
      toast.error('Gagal membuat koleksi')
    }
  }

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="group bg-white rounded-2xl shadow-md hover:shadow-xl border border-[#E76F51]/10 overflow-hidden transition-all duration-300 hover:scale-[1.01] cursor-pointer mb-3"
      >
        <div className="flex min-h-[140px] md:min-h-[160px]">
          {/* Image Section - Fixed width */}
          <div className="relative w-[140px] md:w-[180px] flex-shrink-0">
            {recipe.image_url && !imageError ? (
              <Image
                src={recipe.image_url}
                alt={recipe.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#E76F51]/20 to-[#F4A261]/20 flex items-center justify-center">
                <span className="text-5xl md:text-6xl">🍳</span>
              </div>
            )}

            {/* Difficulty Badge */}
            {recipe.difficulty && (
              <div className="absolute top-2 left-2 px-2 md:px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] md:text-xs font-bold text-gray-800 shadow-lg border border-white/50 capitalize">
                {recipe.difficulty}
              </div>
            )}

            {/* Rating Badge */}
            {rating && rating > 0 && (
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg shadow-lg flex items-center gap-1">
                <Star className="w-3 h-3 text-white fill-white" />
                <span className="text-xs font-bold text-white">
                  {rating.toFixed(1)}
                </span>
              </div>
            )}

            {/* Smart Save Button - Only show if not hidden */}
            {!hideBookmark && (
              <button
                onClick={handleSaveClick}
                className={`absolute z-10 top-2 right-2 w-8 h-8 md:w-9 md:h-9 backdrop-blur-sm rounded-lg shadow-lg flex items-center justify-center transition-all hover:scale-110 ${
                  isSaved 
                    ? 'bg-[#E76F51] opacity-100' 
                    : 'bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100'
                }`}
              >
                {isSaved ? (
                  <BookmarkCheck className="w-4 h-4 md:w-5 md:h-5 text-white fill-white" />
                ) : (
                  <Bookmark className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
                )}
              </button>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Content Section - Flexible height */}
          <div className="flex-1 p-3 md:p-4 flex flex-col min-w-0">
            {/* Category Badge */}
            {recipe.categories && (
              <div className="mb-1.5 flex-shrink-0">
                <span className="inline-block px-2 md:px-3 py-1 bg-gradient-to-r from-[#264653] to-[#2A9D8F] text-white text-[9px] md:text-[10px] font-bold rounded-full">
                  {recipe.categories.name}
                </span>
              </div>
            )}

            {/* Title - Max 2 lines */}
            <h3
              className="text-sm md:text-base font-bold text-gray-900 group-hover:text-[#E76F51] transition-colors leading-tight mb-2 line-clamp-2 flex-shrink-0"
              title={recipe.title}
            >
              {recipe.title}
            </h3>

            {/* Description - Show on mobile with line-clamp-2, on desktop line-clamp-3 */}
            {recipe.description && (
              <p
                className="text-gray-600 text-xs leading-relaxed mb-3 line-clamp-2 md:line-clamp-3 flex-shrink-0"
                title={recipe.description}
              >
                {recipe.description}
              </p>
            )}

            {/* Spacer - Takes remaining space */}
            <div className="flex-1 min-h-0" />

            {/* Footer - Always at bottom */}
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100 flex-shrink-0">
              {/* Author */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full bg-gradient-to-br ${getRoleGradient(recipe.profiles?.role || 'user')} p-0.5 shadow-sm flex-shrink-0`}>
                  {recipe.profiles?.avatar_url ? (
                    <Image
                      src={recipe.profiles.avatar_url}
                      alt={recipe.profiles.username || 'User'}
                      width={28}
                      height={28}
                      className="rounded-full w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                    </div>
                  )}
                </div>
                <span
                  className="text-[10px] md:text-xs font-semibold text-gray-700 truncate"
                  title={recipe.profiles?.username || 'Anonymous'}
                >
                  {recipe.profiles?.username || 'Anonymous'}
                </span>
              </div>

              {/* Cooking Time */}
              {recipe.cooking_time && (
                <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                  <Clock className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                  <span className="text-[10px] md:text-xs font-semibold text-blue-900">
                    {recipe.cooking_time}m
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collections Modal */}
      {showCollections && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowCollections(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#E76F51] to-[#F4A261] p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold text-white">Simpan ke Koleksi</h3>
                <button
                  onClick={() => setShowCollections(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-white/90 text-sm">Pilih koleksi untuk menyimpan resep ini</p>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              {loadingCollections ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-[#E76F51] border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : collections.length === 0 ? (
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
                  {collections.map(collection => {
                    const isInCollection = savedCollections.includes(collection.id)
                    return (
                      <button
                        key={collection.id}
                        onClick={() => handleToggleCollection(collection.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition ${
                          isInCollection
                            ? 'border-[#E76F51] bg-[#E76F51]/10'
                            : 'border-gray-200 hover:border-[#E76F51]/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isInCollection ? 'bg-[#E76F51] text-white' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <Bookmark className="w-5 h-5" />
                          </div>
                          <span className={`font-semibold ${isInCollection ? 'text-[#E76F51]' : 'text-gray-700'}`}>
                            {collection.name}
                          </span>
                        </div>
                        {isInCollection && (
                          <BookmarkCheck className="w-6 h-6 text-[#E76F51]" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {collections.length > 0 && (
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
    </>
  )
}