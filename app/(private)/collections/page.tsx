'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { toast } from 'sonner'
import UnifiedNavigation from '@/components/ui/unified-navigation'
import RecipeCard from '@/components/ui/recipe-card'
import {
  Bookmark, Plus, Edit, Trash2, ChefHat, ArrowLeft,
  X, FolderOpen, Sparkles, Clock, Users, MoreVertical
} from 'lucide-react'

interface Collection {
  id: string
  name: string
  description: string | null
  recipe_count?: number
  preview_images?: string[]
}

interface RecipeInCollection {
  id: string
  recipe_id: string
  recipes: {
    id: string
    title: string
    description: string | null
    image_url: string | null
    cooking_time: number | null
    servings: number | null
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
}

export default function CollectionsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [collectionRecipes, setCollectionRecipes] = useState<RecipeInCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })

  useEffect(() => {
    loadUserData()
    loadCollections()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
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
      console.error('Error loading user data:', err)
    }
  }

  const loadCollections = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('recipe_boards')
        .select('id, name, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        const collectionsWithData = await Promise.all(
          data.map(async (collection) => {
            const { count } = await supabase
              .from('board_recipes')
              .select('id', { count: 'exact', head: true })
              .eq('board_id', collection.id)

            // Get first 4 recipe images for preview
            const { data: previewData } = await supabase
              .from('board_recipes')
              .select('recipes!inner(image_url)')
              .eq('board_id', collection.id)
              .limit(4)

            const previewImages = previewData
              ?.map(item => item.recipes?.image_url)
              .filter(Boolean) as string[] || []

            return { 
              ...collection, 
              recipe_count: count || 0,
              preview_images: previewImages
            }
          })
        )

        setCollections(collectionsWithData)
      }
    } catch (err) {
      console.error('Error loading collections:', err)
      toast.error('Gagal memuat koleksi')
    } finally {
      setLoading(false)
    }
  }

  const loadCollectionRecipes = async (collectionId: string) => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('board_recipes')
        .select(`
          id,
          recipe_id,
          recipes!inner(
            id, title, description, image_url, cooking_time, servings, difficulty, views_count,
            profiles:user_id(username, avatar_url, role),
            categories:category_id(id, name)
          )
        `)
        .eq('board_id', collectionId)
        .order('added_at', { ascending: false })

      setCollectionRecipes(data as RecipeInCollection[] || [])
    } catch (err) {
      console.error('Error loading recipes:', err)
      toast.error('Gagal memuat resep')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCollection = async () => {
    if (!formData.name.trim()) {
      toast.error('Nama koleksi harus diisi')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('recipe_boards').insert({
        user_id: user.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null
      })

      toast.success('Koleksi berhasil dibuat!')
      setShowCreateModal(false)
      setFormData({ name: '', description: '' })
      loadCollections()
    } catch (err) {
      console.error('Error creating collection:', err)
      toast.error('Gagal membuat koleksi')
    }
  }

  const handleUpdateCollection = async () => {
    if (!editingCollection || !formData.name.trim()) return

    try {
      await supabase
        .from('recipe_boards')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCollection.id)

      toast.success('Koleksi berhasil diperbarui!')
      setShowEditModal(false)
      setEditingCollection(null)
      setFormData({ name: '', description: '' })
      
      if (selectedCollection?.id === editingCollection.id) {
        setSelectedCollection({ ...editingCollection, ...formData })
      }
      
      loadCollections()
    } catch (err) {
      console.error('Error updating collection:', err)
      toast.error('Gagal memperbarui koleksi')
    }
  }

  const handleDeleteCollection = async (collection: Collection) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus koleksi "${collection.name}"?`)) return

    try {
      await supabase.from('board_recipes').delete().eq('board_id', collection.id)
      await supabase.from('recipe_boards').delete().eq('id', collection.id)

      toast.success('Koleksi berhasil dihapus!')
      
      if (selectedCollection?.id === collection.id) {
        setSelectedCollection(null)
      }
      
      loadCollections()
    } catch (err) {
      console.error('Error deleting collection:', err)
      toast.error('Gagal menghapus koleksi')
    }
  }

  const handleRemoveRecipe = async (boardRecipeId: string) => {
    if (!confirm('Hapus resep ini dari koleksi?')) return

    try {
      await supabase.from('board_recipes').delete().eq('id', boardRecipeId)
      toast.success('Resep dihapus dari koleksi')
      
      if (selectedCollection) {
        loadCollectionRecipes(selectedCollection.id)
        loadCollections()
      }
    } catch (err) {
      console.error('Error removing recipe:', err)
      toast.error('Gagal menghapus resep')
    }
  }

  const openEditModal = (collection: Collection) => {
    setEditingCollection(collection)
    setFormData({
      name: collection.name,
      description: collection.description || ''
    })
    setShowEditModal(true)
  }

  if (loading && collections.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <UnifiedNavigation avatarUrl={avatarUrl} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#E76F51] to-[#F4A261] rounded-2xl animate-pulse" />
            </div>
            <p className="text-gray-600 font-medium">Memuat koleksi...</p>
          </div>
        </div>
      </div>
    )
  }

  // Collection Detail View
  if (selectedCollection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <UnifiedNavigation avatarUrl={avatarUrl} />

        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => setSelectedCollection(null)}
              className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Kembali ke Koleksi</span>
            </button>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {selectedCollection.name}
                </h1>
                {selectedCollection.description && (
                  <p className="text-gray-600 text-lg mb-4">
                    {selectedCollection.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Bookmark className="w-5 h-5" />
                  <span className="font-semibold">{collectionRecipes.length} resep</span>
                </div>
              </div>
              <button
                onClick={() => openEditModal(selectedCollection)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Recipes List using RecipeCard */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
          {collectionRecipes.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <ChefHat className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Belum ada resep</h3>
              <p className="text-gray-600 mb-6">Mulai tambahkan resep favorit ke koleksi ini</p>
              <button
                onClick={() => router.push('/home')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#E76F51] text-white rounded-xl font-semibold hover:bg-[#d65a3d] transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                Jelajahi Resep
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {collectionRecipes.map((item) => (
                <div key={item.id} className="relative">
                  <RecipeCard recipe={item.recipes} hideBookmark={true} />
                  <button
                    onClick={() => handleRemoveRecipe(item.id)}
                    className="absolute top-4 right-4 w-9 h-9 bg-white/95 backdrop-blur-sm text-gray-700 rounded-xl flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white transition-all z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Collections List View
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <UnifiedNavigation avatarUrl={avatarUrl} />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Koleksi Resep</h1>
              <p className="text-gray-600 text-lg">
                Kumpulan resep favorit yang Anda simpan
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#E76F51] text-white rounded-xl font-semibold hover:bg-[#d65a3d] transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Koleksi Baru</span>
            </button>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <FolderOpen className="w-5 h-5" />
            <span className="font-semibold">{collections.length} koleksi tersimpan</span>
          </div>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
        {collections.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-8 bg-gray-100 rounded-full flex items-center justify-center">
              <Bookmark className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Belum Ada Koleksi</h3>
            <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
              Mulai kumpulkan resep favoritmu dengan membuat koleksi pertamamu
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#E76F51] text-white rounded-xl font-bold hover:bg-[#d65a3d] transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus className="w-6 h-6" />
              Buat Koleksi Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => {
                  setSelectedCollection(collection)
                  loadCollectionRecipes(collection.id)
                }}
              >
                {/* Preview Grid */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  {collection.preview_images && collection.preview_images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1 h-full">
                      {[0, 1, 2, 3].map((index) => (
                        <div key={index} className="relative bg-gray-200 overflow-hidden">
                          {collection.preview_images![index] ? (
                            <Image
                              src={collection.preview_images![index]}
                              alt=""
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ChefHat className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <Bookmark className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>

                {/* Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-[#E76F51] transition-colors flex-1">
                      {collection.name}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditModal(collection)
                      }}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  
                  {collection.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {collection.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <Bookmark className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      {collection.recipe_count} resep
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[#E76F51] p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Koleksi Baru</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nama Koleksi
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Sarapan Sehat"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E76F51] focus:outline-none transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tambahkan deskripsi..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E76F51] focus:outline-none resize-none transition-colors"
                />
              </div>

              <button
                onClick={handleCreateCollection}
                disabled={!formData.name.trim()}
                className="w-full py-4 bg-[#E76F51] text-white rounded-xl font-bold hover:bg-[#d65a3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buat Koleksi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCollection && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gray-900 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Edit Koleksi</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nama Koleksi
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:outline-none resize-none transition-colors"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleUpdateCollection}
                  disabled={!formData.name.trim()}
                  className="flex-1 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Simpan
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    handleDeleteCollection(editingCollection)
                  }}
                  className="px-6 py-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}