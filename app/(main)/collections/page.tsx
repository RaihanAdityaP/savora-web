'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Bookmark, Plus, Edit, Trash2, ChefHat, ArrowLeft,
  MoreVertical, X, FolderOpen
} from 'lucide-react'

interface Collection {
  id: string
  name: string
  description: string | null
  recipe_count?: number
}

interface RecipeInCollection {
  id: string
  recipe_id: string
  recipes: {
    id: string
    title: string
    image_url: string | null
    cooking_time: number | null
    servings: number | null
    difficulty: string | null
    profiles: {
      username: string | null
      avatar_url: string | null
    } | null
  }
}

export default function CollectionsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [collectionRecipes, setCollectionRecipes] = useState<RecipeInCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })

  const collectionIcons = ['🍳', '❤️', '🔥', '🍰', '☕', '🍱', '🍔', '🥞']
  const collectionColors = [
    'from-[#E76F51] to-[#F4A261]',
    'from-[#2A9D8F] to-[#3DB9A9]',
    'from-[#F4A261] to-[#E9C46A]',
    'from-[#E76F51] to-[#E9C46A]',
    'from-[#264653] to-[#2A9D8F]',
  ]

  useEffect(() => {
    loadCollections()
  }, [])

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
        // Get recipe count for each collection
        const collectionsWithCount = await Promise.all(
          data.map(async (collection) => {
            const { count } = await supabase
              .from('board_recipes')
              .select('id', { count: 'exact', head: true })
              .eq('board_id', collection.id)

            return { ...collection, recipe_count: count || 0 }
          })
        )

        setCollections(collectionsWithCount)
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
            id, title, image_url, cooking_time, servings, difficulty,
            profiles:user_id(username, avatar_url)
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
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E76F51]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            {selectedCollection ? (
              <button
                onClick={() => setSelectedCollection(null)}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => router.back()}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            {!selectedCollection && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white text-[#E76F51] rounded-xl font-semibold hover:bg-white/90 transition shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Koleksi Baru
              </button>
            )}
          </div>

          {selectedCollection ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold">{selectedCollection.name}</h1>
                <button
                  onClick={() => openEditModal(selectedCollection)}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              <p className="text-white/90">{collectionRecipes.length} resep</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Bookmark className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Koleksi Resep</h1>
                  <p className="text-white/90">Kumpulan resep favorit Anda</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl">
                <FolderOpen className="w-5 h-5" />
                <span className="font-semibold">{collections.length} Koleksi</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {selectedCollection ? (
          // Recipe List View
          <div>
            {collectionRecipes.length === 0 ? (
              <div className="text-center py-16">
                <ChefHat className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Belum ada resep</h3>
                <p className="text-gray-600 mb-6">Tambahkan resep ke koleksi ini</p>
                <button
                  onClick={() => router.push('/home')}
                  className="px-6 py-3 bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white rounded-xl font-semibold hover:opacity-90 transition"
                >
                  Jelajahi Resep
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collectionRecipes.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl shadow-lg overflow-hidden group relative">
                    <div
                      className="cursor-pointer"
                      onClick={() => router.push(`/recipe/${item.recipes.id}`)}
                    >
                      <div className="relative h-48 bg-gray-200">
                        {item.recipes.image_url ? (
                          <Image
                            src={item.recipes.image_url}
                            alt={item.recipes.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E76F51] to-[#F4A261]">
                            <ChefHat className="w-16 h-16 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                          {item.recipes.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                          {item.recipes.cooking_time && (
                            <span className="flex items-center gap-1">
                              🕐 {item.recipes.cooking_time}m
                            </span>
                          )}
                          {item.recipes.servings && (
                            <span className="flex items-center gap-1">
                              👥 {item.recipes.servings} porsi
                            </span>
                          )}
                          {item.recipes.difficulty && (
                            <span className="capitalize">
                              🔥 {item.recipes.difficulty}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveRecipe(item.id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Collections Grid View
          <div>
            {collections.length === 0 ? (
              <div className="text-center py-16">
                <Bookmark className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Koleksi</h3>
                <p className="text-gray-600 mb-6">
                  Mulai kumpulkan resep favoritmu!<br />
                  Buat koleksi untuk mengorganisir resep.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white rounded-xl font-semibold hover:opacity-90 transition"
                >
                  Buat Koleksi Pertama
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((collection, index) => {
                  const gradient = collectionColors[index % collectionColors.length]
                  const icon = collectionIcons[index % collectionIcons.length]

                  return (
                    <div
                      key={collection.id}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition group"
                      onClick={() => {
                        setSelectedCollection(collection)
                        loadCollectionRecipes(collection.id)
                      }}
                    >
                      <div className={`h-32 bg-gradient-to-r ${gradient} flex items-center justify-center relative`}>
                        <span className="text-6xl">{icon}</span>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(collection)
                          }}
                          className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="w-4 h-4 text-white" />
                        </button>
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {collection.name}
                        </h3>
                        {collection.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {collection.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[#E76F51]">
                          <Bookmark className="w-4 h-4" />
                          <span className="font-semibold">{collection.recipe_count} Resep</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Koleksi Baru</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Koleksi *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Sarapan Sehat"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E76F51] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tambahkan deskripsi..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E76F51] focus:outline-none resize-none"
                />
              </div>

              <button
                onClick={handleCreateCollection}
                disabled={!formData.name.trim()}
                className="w-full py-3 bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Edit Koleksi</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Koleksi *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E76F51] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E76F51] focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpdateCollection}
                disabled={!formData.name.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                Simpan
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  handleDeleteCollection(editingCollection)
                }}
                className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}