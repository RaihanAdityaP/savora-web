'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Camera, Edit, Save, User, Settings, Shield, Crown, Users,
  ChefHat, UserPlus, UserMinus, Loader2, ArrowLeft, Verified
} from 'lucide-react'
import UnifiedNavigation from '@/components/ui/unified-navigation'
import RecipeCard from '@/components/ui/recipe-card'

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  role: string
  is_premium: boolean
  cooking_level: string
  total_followers: number
  total_following: number
  total_recipes: number
  total_bookmarks: number
  created_at: string
}

interface Recipe {
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

interface Follow {
  follower_id?: string
  following_id?: string
  profiles: {
    id?: string
    username: string | null
    avatar_url: string | null
    full_name: string | null
    is_banned: boolean
    banned_reason: string | null
  }
}

interface ProfileClientProps {
  profile: Profile
  recipes: Recipe[]
  initialRatings: Record<string, number>
  currentUser: {
    id: string
    role: string
    avatarUrl: string | null
  } | null
  initialIsFollowing: boolean
}

export default function ProfileClient({
  profile: initialProfile,
  recipes: initialRecipes,
  initialRatings,
  currentUser,
  initialIsFollowing
}: ProfileClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile>(initialProfile)
  const [isOwnProfile] = useState(currentUser?.id === initialProfile.id)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isFollowLoading, setIsFollowLoading] = useState(false)

  const [editUsername, setEditUsername] = useState(initialProfile.username || '')
  const [editFullName, setEditFullName] = useState(initialProfile.full_name || '')
  const [editBio, setEditBio] = useState(initialProfile.bio || '')

  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes)
  const [recipeRatings, setRecipeRatings] = useState<Record<string, number>>(initialRatings)

  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [followers, setFollowers] = useState<Follow[]>([])
  const [following, setFollowing] = useState<Follow[]>([])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (err) {
      console.error('Error loading profile:', err)
    }
  }

  const loadRecipes = async () => {
    try {
      const { data } = await supabase
        .from('recipes')
        .select(`
          *,
          profiles:user_id(username, avatar_url, role),
          categories(id, name)
        `)
        .eq('user_id', profile.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (data) {
        setRecipes(data as Recipe[])

        for (const recipe of data) {
          const { data: ratings } = await supabase
            .from('recipe_ratings')
            .select('rating')
            .eq('recipe_id', recipe.id)

          if (ratings && ratings.length > 0) {
            const total = ratings.reduce((sum, r) => sum + (r.rating || 0), 0)
            setRecipeRatings(prev => ({
              ...prev,
              [recipe.id]: total / ratings.length
            }))
          }
        }
      }
    } catch (err) {
      console.error('Error loading recipes:', err)
    }
  }

  const handleToggleFollow = async () => {
    if (!currentUser || isOwnProfile) return

    setIsFollowLoading(true)
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id)

        toast.success('Berhenti mengikuti')
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: profile.id
          })

        toast.success('Berhasil mengikuti!')
      }

      setIsFollowing(!isFollowing)
      await loadProfile()
    } catch (err) {
      console.error('Error toggling follow:', err)
      toast.error('Gagal memperbarui status follow')
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB')
      return
    }

    setIsUploadingAvatar(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.id)

      toast.success('Foto profil berhasil diperbarui!')
      await loadProfile()
    } catch (err) {
      console.error('Error uploading avatar:', err)
      toast.error('Gagal mengunggah foto')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!editUsername.trim() || !currentUser) {
      toast.error('Username tidak boleh kosong')
      return
    }

    setIsSaving(true)
    try {
      await supabase
        .from('profiles')
        .update({
          username: editUsername.trim(),
          full_name: editFullName.trim() || null,
          bio: editBio.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id)

      toast.success('Profil berhasil diperbarui!')
      setIsEditing(false)
      await loadProfile()
    } catch (err) {
      console.error('Error saving profile:', err)
      toast.error('Gagal menyimpan profil')
    } finally {
      setIsSaving(false)
    }
  }

  const loadFollowers = async () => {
    try {
      const { data } = await supabase
        .from('follows')
        .select('follower_id, profiles!follows_follower_id_fkey(id, username, avatar_url, full_name, is_banned, banned_reason)')
        .eq('following_id', profile.id)

      setFollowers((data || []) as Follow[])
      setShowFollowersModal(true)
    } catch (err) {
      console.error('Error loading followers:', err)
      toast.error('Gagal memuat followers')
    }
  }

  const loadFollowing = async () => {
    try {
      const { data } = await supabase
        .from('follows')
        .select('following_id, profiles!follows_following_id_fkey(id, username, avatar_url, full_name, is_banned, banned_reason)')
        .eq('follower_id', profile.id)

      setFollowing((data || []) as Follow[])
      setShowFollowingModal(true)
    } catch (err) {
      console.error('Error loading following:', err)
      toast.error('Gagal memuat following')
    }
  }

  const getRoleGradient = (role: string) => {
    switch (role) {
      case 'admin':
        return 'from-yellow-400 via-orange-400 to-yellow-500'
      case 'premium':
        return 'from-purple-500 via-pink-500 to-purple-600'
      default:
        return 'from-[#264653] via-[#2A9D8F] to-[#E9C46A]'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'premium':
        return 'Premium Chef'
      default:
        return 'Home Cook'
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-24 md:pb-8">
      <UnifiedNavigation avatarUrl={currentUser?.avatarUrl || null} />

      <div className={`bg-gradient-to-br ${getRoleGradient(profile.role)} relative overflow-hidden mt-16`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-8">
          {!isOwnProfile && (
            <button
              onClick={() => router.back()}
              className="mb-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          )}

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${getRoleGradient(profile.role)} p-1 shadow-2xl`}>
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.username || 'User'}
                    width={128}
                    height={128}
                    className="w-full h-full rounded-full object-cover border-4 border-white"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>

              {isOwnProfile && (
                <label className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                  {isUploadingAvatar ? (
                    <Loader2 className="w-5 h-5 text-[#E76F51] animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-[#E76F51]" />
                  )}
                </label>
              )}

              {profile.role === 'admin' && (
                <div className="absolute top-0 right-0 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg border-2 border-white">
                  <Verified className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {profile.username || 'Unknown'}
              </h1>
              {profile.full_name && (
                <p className="text-white/90 text-lg mb-3">{profile.full_name}</p>
              )}

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white/40 mb-4">
                {profile.role === 'admin' ? (
                  <Shield className="w-4 h-4 text-white" />
                ) : profile.is_premium ? (
                  <Crown className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
                <span className="text-white text-sm font-bold">
                  {getRoleLabel(profile.role)}
                </span>
              </div>

              {profile.bio && (
                <p className="text-white/90 text-base max-w-2xl mb-4 leading-relaxed">
                  {profile.bio}
                </p>
              )}

              <div className="flex gap-6 justify-center md:justify-start">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{profile.total_recipes}</div>
                  <div className="text-white/80 text-sm">Resep</div>
                </div>
                <button onClick={loadFollowers} className="text-center hover:opacity-80 transition">
                  <div className="text-2xl font-bold text-white">{profile.total_followers}</div>
                  <div className="text-white/80 text-sm">Pengikut</div>
                </button>
                <button onClick={loadFollowing} className="text-center hover:opacity-80 transition">
                  <div className="text-2xl font-bold text-white">{profile.total_following}</div>
                  <div className="text-white/80 text-sm">Mengikuti</div>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {isOwnProfile ? (
                <>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-[#E76F51] rounded-xl font-semibold hover:bg-white/90 transition shadow-lg"
                  >
                    {isEditing ? (
                      <>
                        <ArrowLeft className="w-5 h-5" />
                        Batal
                      </>
                    ) : (
                      <>
                        <Edit className="w-5 h-5" />
                        Edit Profil
                      </>
                    )}
                  </button>
                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => router.push('/admin')}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-semibold hover:opacity-90 transition shadow-lg"
                    >
                      <Settings className="w-5 h-5" />
                      Dashboard Admin
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={handleToggleFollow}
                  disabled={isFollowLoading}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition shadow-lg disabled:opacity-50 ${
                    isFollowing
                      ? 'bg-white/20 text-white border-2 border-white/40'
                      : 'bg-white text-[#E76F51]'
                  }`}
                >
                  {isFollowLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserMinus className="w-5 h-5" />
                      Berhenti Mengikuti
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Ikuti
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {isEditing && isOwnProfile ? (
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profil</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E76F51] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E76F51] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#E76F51] focus:outline-none resize-none"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-7 bg-gradient-to-b from-[#E76F51] to-[#F4A261] rounded-full" />
              <h2 className="text-2xl font-bold text-gray-900">
                {isOwnProfile ? 'Resep Saya' : 'Resep'}
              </h2>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-[#E76F51]/10 to-[#F4A261]/10 rounded-full border-2 border-[#E76F51]/30">
              <span className="text-[#E76F51] font-bold">{recipes.length}</span>
            </div>
          </div>

          {recipes.length === 0 ? (
            <div className="text-center py-16">
              <ChefHat className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {isOwnProfile ? 'Belum ada resep' : 'Pengguna ini belum memiliki resep'}
              </h3>
              <p className="text-gray-600">
                {isOwnProfile
                  ? 'Mulai berbagi resep favorit Anda!'
                  : 'Tunggu hingga mereka membagikan kreasi kuliner'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  rating={recipeRatings[recipe.id]}
                  onTap={() => loadRecipes()}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showFollowersModal && (
        <FollowModal
          title="Pengikut"
          users={followers.map(f => ({ ...f.profiles, userId: f.follower_id }))}
          onClose={() => setShowFollowersModal(false)}
          currentUserId={currentUser?.id}
          router={router}
        />
      )}

      {showFollowingModal && (
        <FollowModal
          title="Mengikuti"
          users={following.map(f => ({ ...f.profiles, userId: f.following_id }))}
          onClose={() => setShowFollowingModal(false)}
          currentUserId={currentUser?.id}
          router={router}
        />
      )}
    </div>
  )
}

function FollowModal({ title, users, onClose, currentUserId, router }: any) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[#E76F51] to-[#F4A261] text-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                {title === 'Pengikut' ? 'Belum ada pengikut' : 'Belum mengikuti siapa pun'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user: any, idx: number) => {
                const isBanned = user.is_banned

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
                      isBanned ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 hover:border-[#E76F51] cursor-pointer'
                    } transition`}
                    onClick={() => {
                      if (!isBanned && user.userId !== currentUserId) {
                        onClose()
                        router.push(`/profile/${user.userId}`)
                      }
                    }}
                  >
                    <div className={`w-12 h-12 rounded-full ${isBanned ? 'bg-red-400' : 'bg-gradient-to-br from-[#E76F51] to-[#F4A261]'} p-0.5`}>
                      {user.avatar_url && !isBanned ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.username || 'User'}
                          width={48}
                          height={48}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${isBanned ? 'text-red-700' : 'text-gray-900'}`}>
                        {user.username || 'Unknown'}
                      </p>
                      {user.full_name && (
                        <p className="text-sm text-gray-600">{user.full_name}</p>
                      )}
                      {isBanned && (
                        <p className="text-xs text-red-600 mt-1">
                          Dibanned: {user.banned_reason || 'Tidak disebutkan'}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}