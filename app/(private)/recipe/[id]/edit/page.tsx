'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { toast } from 'sonner'
import { X, Plus, Upload, Loader2 } from 'lucide-react'

interface Category {
  id: number
  name: string
}

export default function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params Promise
  const { id: recipeId } = use(params)
  
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [difficulty, setDifficulty] = useState('mudah')
  const [cookingTime, setCookingTime] = useState('')
  const [servings, setServings] = useState('')
  const [calories, setCalories] = useState('')
  
  const [ingredients, setIngredients] = useState<string[]>([])
  const [steps, setSteps] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  
  const [currentIngredient, setCurrentIngredient] = useState('')
  const [currentStep, setCurrentStep] = useState('')
  const [currentTag, setCurrentTag] = useState('')
  
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    loadCategories()
    loadRecipe()
  }, [recipeId])

  const loadCategories = async () => {
    try {
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .order('name')
      
      setCategories(data || [])
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const loadRecipe = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_tags(tags(name))
        `)
        .eq('id', recipeId)
        .single()

      if (error) throw error

      const recipeData = data as any

      setTitle(recipeData.title)
      setDescription(recipeData.description || '')
      setCategoryId(recipeData.category_id)
      setDifficulty(recipeData.difficulty || 'mudah')
      setCookingTime(recipeData.cooking_time?.toString() || '')
      setServings(recipeData.servings?.toString() || '')
      setCalories(recipeData.calories?.toString() || '')
      setIngredients(recipeData.ingredients || [])
      setSteps(recipeData.steps || [])
      setImageUrl(recipeData.image_url)
      setImagePreview(recipeData.image_url)
      setVideoUrl(recipeData.video_url)
      
      const tagNames = recipeData.recipe_tags?.map((rt: any) => rt.tags.name) || []
      setTags(tagNames)
    } catch (err) {
      console.error('Error loading recipe:', err)
      toast.error('Gagal memuat resep')
      router.push('/home')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran gambar maksimal 5MB')
        return
      }
      setNewImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Ukuran video maksimal 50MB')
        return
      }
      setNewVideoFile(file)
      toast.success('Video dipilih: ' + file.name)
    }
  }

  const addIngredient = () => {
    if (!currentIngredient.trim()) return
    setIngredients([...ingredients, currentIngredient.trim()])
    setCurrentIngredient('')
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const addStep = () => {
    if (!currentStep.trim()) return
    setSteps([...steps, currentStep.trim()])
    setCurrentStep('')
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const addTag = () => {
    if (!currentTag.trim()) return
    if (tags.includes(currentTag.trim())) {
      toast.error('Tag sudah ada')
      return
    }
    if (tags.length >= 10) {
      toast.error('Maksimal 10 tag')
      return
    }
    setTags([...tags, currentTag.trim()])
    setCurrentTag('')
  }

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!newImageFile) return imageUrl

    try {
      const fileExt = newImageFile.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `recipes/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, newImageFile, {
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (err) {
      console.error('Error uploading image:', err)
      throw err
    }
  }

  const uploadVideo = async (): Promise<string | null> => {
    if (!newVideoFile) return videoUrl

    try {
      const fileExt = newVideoFile.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `recipe_videos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, newVideoFile, {
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (err) {
      console.error('Error uploading video:', err)
      throw err
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Judul resep harus diisi')
      return
    }

    if (!categoryId) {
      toast.error('Pilih kategori')
      return
    }

    if (ingredients.length === 0) {
      toast.error('Tambahkan minimal 1 bahan')
      return
    }

    if (steps.length === 0) {
      toast.error('Tambahkan minimal 1 langkah')
      return
    }

    setSaving(true)

    try {
      const finalImageUrl = await uploadImage()
      const finalVideoUrl = await uploadVideo()

      const updateData = {
        title: title.trim(),
        description: description.trim() || null,
        category_id: categoryId,
        difficulty,
        cooking_time: cookingTime ? parseInt(cookingTime) : null,
        servings: servings ? parseInt(servings) : null,
        calories: calories ? parseInt(calories) : null,
        ingredients,
        steps,
        image_url: finalImageUrl,
        video_url: finalVideoUrl,
        updated_at: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('recipes')
        .update(updateData)
        .eq('id', recipeId)

      if (updateError) throw updateError

      // Update tags
      await supabase
        .from('recipe_tags')
        .delete()
        .eq('recipe_id', recipeId)

      for (const tagName of tags) {
        await (supabase.rpc as any)('add_tag_to_recipe', {
          p_recipe_id: recipeId,
          p_tag_name: tagName
        })
      }

      toast.success('Resep berhasil diperbarui!')
      router.push(`/recipe/${recipeId}`)
    } catch (err) {
      console.error('Error updating recipe:', err)
      toast.error('Gagal memperbarui resep')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E76F51]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-[#E76F51] hover:underline mb-2"
          >
            ← Kembali
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Resep</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Gambar Resep</h2>
            
            <div className="relative w-full h-64 bg-gray-100 rounded-xl overflow-hidden mb-4">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Upload className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>

            <label className="block">
              <span className="sr-only">Pilih gambar</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#E76F51] file:text-white hover:file:bg-[#F4A261] cursor-pointer"
              />
            </label>
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informasi Dasar</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Judul Resep *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E76F51] focus:outline-none"
                  placeholder="Nama resep yang menarik"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E76F51] focus:outline-none resize-none"
                  rows={3}
                  placeholder="Ceritakan tentang resep ini..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kategori *
                  </label>
                  <select
                    value={categoryId || ''}
                    onChange={e => setCategoryId(Number(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E76F51] focus:outline-none"
                    required
                  >
                    <option value="">Pilih kategori</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tingkat Kesulitan
                  </label>
                  <select
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E76F51] focus:outline-none"
                  >
                    <option value="mudah">Mudah</option>
                    <option value="sedang">Sedang</option>
                    <option value="sulit">Sulit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Waktu Memasak (menit)
                  </label>
                  <input
                    type="number"
                    value={cookingTime}
                    onChange={e => setCookingTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E76F51] focus:outline-none"
                    placeholder="30"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Porsi
                  </label>
                  <input
                    type="number"
                    value={servings}
                    onChange={e => setServings(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E76F51] focus:outline-none"
                    placeholder="4"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kalori (kcal)
                  </label>
                  <input
                    type="number"
                    value={calories}
                    onChange={e => setCalories(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E76F51] focus:outline-none"
                    placeholder="250"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Bahan-bahan *</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={currentIngredient}
                onChange={e => setCurrentIngredient(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E76F51] focus:outline-none"
                placeholder="Contoh: 2 siung bawang putih, cincang"
              />
              <button
                type="button"
                onClick={addIngredient}
                className="px-6 py-3 bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white rounded-xl font-semibold hover:opacity-90 transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ingredient, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-gray-700">{ingredient}</span>
                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Langkah-langkah *</h2>
            
            <div className="flex gap-2 mb-4">
              <textarea
                value={currentStep}
                onChange={e => setCurrentStep(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && e.ctrlKey && (e.preventDefault(), addStep())}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E76F51] focus:outline-none resize-none"
                rows={2}
                placeholder="Jelaskan langkah memasak..."
              />
              <button
                type="button"
                onClick={addStep}
                className="px-6 py-3 bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white rounded-xl font-semibold hover:opacity-90 transition self-start"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <p className="flex-1 text-gray-700">{step}</p>
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    className="text-red-500 hover:text-red-700 self-start"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Video Upload */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Video Tutorial (Opsional)</h2>
            
            {videoUrl && !newVideoFile && (
              <div className="mb-4 p-3 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm text-green-800">✓ Video sudah ada</p>
              </div>
            )}

            {newVideoFile && (
              <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-800">✓ Video baru: {newVideoFile.name}</p>
              </div>
            )}

            <label className="block">
              <span className="sr-only">Pilih video</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">Maksimal 50MB, durasi 5 menit</p>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tags</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={currentTag}
                onChange={e => setCurrentTag(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E76F51] focus:outline-none"
                placeholder="Tambah tag (maksimal 10)"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-6 py-3 bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white rounded-xl font-semibold hover:opacity-90 transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white rounded-full text-sm font-semibold"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(idx)}
                    className="hover:text-red-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white rounded-xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}