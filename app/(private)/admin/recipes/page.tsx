'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ChefHat, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users as UsersIcon, 
  Eye,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface Recipe {
  id: string
  title: string
  description: string | null
  image_url: string | null
  cooking_time: number | null
  servings: number | null
  difficulty: string | null
  status: string
  ingredients: string[] | null
  steps: string[] | null
  created_at: string
  profiles: {
    username: string | null
    avatar_url: string | null
  } | null
  categories: {
    name: string
  } | null
  recipe_tags: Array<{
    tags: {
      name: string
    } | null
  }>
}

export default function AdminRecipesPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  useEffect(() => {
    checkAdminAccess()
    loadRecipes()
  }, [filterStatus])

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      toast.error('Access denied')
      router.push('/home')
    }
  }

  const loadRecipes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          profiles:user_id(username, avatar_url),
          categories(name),
          recipe_tags(tags(name))
        `)
        .eq('status', filterStatus)
        .order('created_at', { ascending: false })

      if (error) throw error

      setRecipes(data || [])
    } catch (error) {
      console.error('Error loading recipes:', error)
      toast.error('Failed to load recipes')
    } finally {
      setLoading(false)
    }
  }

  const moderateRecipe = async (recipeId: string, status: 'approved' | 'rejected') => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('recipes')
        .update({
          status,
          moderated_by: user?.id,
          moderated_at: new Date().toISOString()
        })
        .eq('id', recipeId)

      if (error) throw error

      toast.success(status === 'approved' ? 'Recipe Approved!' : 'Recipe Rejected')
      setSelectedRecipe(null)
      loadRecipes()
    } catch (error) {
      console.error('Error moderating recipe:', error)
      toast.error('Failed to moderate recipe')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F0F] via-[#1A1A1A] to-[#0F0F0F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#FF9800] to-[#FFB74D] flex items-center justify-center animate-pulse">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <p className="text-white font-semibold">Loading recipes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F0F] via-[#1A1A1A] to-[#0F0F0F]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1A1A1A] via-[#2D2D2D] to-[#1A1A1A] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 mb-4 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF9800] to-[#FFB74D] flex items-center justify-center shadow-lg shadow-[#FF9800]/40">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wider">RECIPE MODERATION</h1>
              <p className="text-[#FF9800] text-sm tracking-wide mt-1">Review & Approve</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="bg-[#1A1A1A] rounded-2xl p-1 mb-6 inline-flex">
          {(['pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all capitalize ${
                filterStatus === status
                  ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Recipes List */}
        {recipes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-[#1A1A1A] rounded-full flex items-center justify-center border-2 border-white/10">
              <ChefHat className="w-10 h-10 text-gray-700" />
            </div>
            <h3 className="text-xl font-bold text-gray-400 mb-2">No Recipes Found</h3>
            <p className="text-gray-600">No {filterStatus} recipes at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onView={() => setSelectedRecipe(recipe)}
                onApprove={filterStatus === 'pending' ? () => moderateRecipe(recipe.id, 'approved') : undefined}
                onReject={filterStatus === 'pending' ? () => moderateRecipe(recipe.id, 'rejected') : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recipe Preview Modal */}
      {selectedRecipe && (
        <RecipePreviewModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onApprove={() => moderateRecipe(selectedRecipe.id, 'approved')}
          onReject={() => moderateRecipe(selectedRecipe.id, 'rejected')}
          showActions={filterStatus === 'pending'}
        />
      )}
    </div>
  )
}

function RecipeCard({ 
  recipe, 
  onView, 
  onApprove, 
  onReject 
}: { 
  recipe: Recipe
  onView: () => void
  onApprove?: () => void
  onReject?: () => void
}) {
  return (
    <div className="bg-[#1E1E1E] rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all group">
      <div className="relative h-48 bg-gray-800">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A] flex items-center justify-center">
            <ChefHat className="w-12 h-12 text-gray-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {recipe.categories && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-lg text-black text-xs font-bold shadow-lg">
            {recipe.categories.name}
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-white mb-3 line-clamp-2">{recipe.title}</h3>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex-shrink-0 ring-2 ring-gray-600">
            {recipe.profiles?.avatar_url ? (
              <Image
                src={recipe.profiles.avatar_url}
                alt={recipe.profiles.username || 'User'}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UsersIcon className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
          <span className="text-sm text-gray-300 font-medium">{recipe.profiles?.username || 'Unknown'}</span>
        </div>

        {onApprove && onReject ? (
          <div className="space-y-2">
            <button
              onClick={onView}
              className="w-full py-2.5 bg-[#252525] hover:bg-[#2D2D2D] text-gray-300 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-white/10"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
            <div className="flex gap-2">
              <button
                onClick={onApprove}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={onReject}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onView}
            className="w-full py-2.5 bg-[#252525] hover:bg-[#2D2D2D] text-gray-300 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-white/10"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
        )}
      </div>
    </div>
  )
}

function RecipePreviewModal({ 
  recipe, 
  onClose, 
  onApprove, 
  onReject,
  showActions 
}: { 
  recipe: Recipe
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  showActions: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Recipe Details</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
          <h3 className="text-2xl font-bold text-white mb-4">{recipe.title}</h3>

          {recipe.image_url && (
            <div className="relative h-64 rounded-2xl overflow-hidden mb-6">
              <Image
                src={recipe.image_url}
                alt={recipe.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="flex gap-2 mb-6">
            {recipe.cooking_time && (
              <div className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-sm font-semibold flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {recipe.cooking_time} min
              </div>
            )}
            {recipe.servings && (
              <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-semibold flex items-center gap-1">
                <UsersIcon className="w-4 h-4" />
                {recipe.servings} srv
              </div>
            )}
            {recipe.difficulty && (
              <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-semibold capitalize">
                {recipe.difficulty}
              </div>
            )}
          </div>

          {recipe.description && (
            <div className="mb-6">
              <h4 className="text-[#FFD700] font-bold mb-2">Description</h4>
              <div className="bg-[#252525] rounded-xl p-4 text-gray-300 text-sm">
                {recipe.description}
              </div>
            </div>
          )}

          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div className="mb-6">
              <h4 className="text-[#FFD700] font-bold mb-2">Ingredients</h4>
              <div className="bg-[#252525] rounded-xl p-4 text-gray-300 text-sm">
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#FFD700]">•</span>
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {recipe.steps && recipe.steps.length > 0 && (
            <div className="mb-6">
              <h4 className="text-[#FFD700] font-bold mb-2">Instructions</h4>
              <div className="bg-[#252525] rounded-xl p-4 text-gray-300 text-sm">
                <ol className="space-y-3">
                  {recipe.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="font-bold text-[#FFD700] flex-shrink-0">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>

        {showActions && (
          <div className="p-6 border-t border-white/10 flex gap-3">
            <button
              onClick={onReject}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              REJECT
            </button>
            <button
              onClick={onApprove}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              APPROVE
            </button>
          </div>
        )}
      </div>
    </div>
  )
}