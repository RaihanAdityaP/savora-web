'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Users, 
  ArrowLeft, 
  Search, 
  Ban, 
  CheckCircle, 
  Crown, 
  Shield,
  User,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils/format'

interface UserProfile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  role: string
  is_banned: boolean
  is_premium: boolean
  banned_reason: string | null
  banned_at: string | null
  banned_by: string | null
  created_at: string
  banned_by_admin_username?: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned'>('all')
  const [showBanModal, setShowBanModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [banReason, setBanReason] = useState('')
  const [selectedReasonType, setSelectedReasonType] = useState('spam')

  useEffect(() => {
    checkAdminAccess()
    loadUsers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchQuery, filterStatus, users])

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

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Load admin usernames for banned_by
      const usersWithAdminInfo = await Promise.all(
        (data || []).map(async (user) => {
          if (user.banned_by) {
            const { data: adminData } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', user.banned_by)
              .single()
            
            return { ...user, banned_by_admin_username: adminData?.username || 'Unknown Admin' }
          }
          return user
        })
      )

      setUsers(usersWithAdminInfo)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = users

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(query) ||
        user.full_name?.toLowerCase().includes(query)
      )
    }

    if (filterStatus === 'banned') {
      filtered = filtered.filter(user => user.is_banned)
    } else if (filterStatus === 'active') {
      filtered = filtered.filter(user => !user.is_banned)
    }

    setFilteredUsers(filtered)
  }

  const getReasonText = (reason: string) => {
    const reasons: Record<string, string> = {
      'spam': 'Spam',
      'inappropriate_content': 'Inappropriate Content',
      'harassment': 'Harassment',
      'fake_account': 'Fake Account',
      'other': 'Other'
    }
    return reasons[reason] || reason
  }

  const handleBanUser = async () => {
    if (!selectedUser) return

    const finalReason = selectedReasonType === 'other' && banReason.trim()
      ? banReason.trim()
      : getReasonText(selectedReasonType)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      await supabase
        .from('profiles')
        .update({
          is_banned: true,
          banned_at: new Date().toISOString(),
          banned_reason: finalReason,
          banned_by: user?.id
        })
        .eq('id', selectedUser.id)

      toast.success('User banned successfully')
      setShowBanModal(false)
      setSelectedUser(null)
      setBanReason('')
      setSelectedReasonType('spam')
      loadUsers()
    } catch (error) {
      console.error('Error banning user:', error)
      toast.error('Failed to ban user')
    }
  }

  const handleUnbanUser = async (user: UserProfile) => {
    if (!confirm(`Are you sure you want to unban ${user.username}?`)) return

    try {
      await supabase
        .from('profiles')
        .update({
          is_banned: false,
          banned_at: null,
          banned_reason: null,
          banned_by: null
        })
        .eq('id', user.id)

      toast.success('User unbanned successfully')
      loadUsers()
    } catch (error) {
      console.error('Error unbanning user:', error)
      toast.error('Failed to unban user')
    }
  }

  const togglePremium = async (user: UserProfile) => {
    try {
      await supabase
        .from('profiles')
        .update({
          is_premium: !user.is_premium
        })
        .eq('id', user.id)

      toast.success(user.is_premium ? 'Premium removed' : 'Premium granted')
      loadUsers()
    } catch (error) {
      console.error('Error toggling premium:', error)
      toast.error('Failed to update premium status')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F0F] via-[#1A1A1A] to-[#0F0F0F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] flex items-center justify-center animate-pulse">
            <Users className="w-8 h-8 text-white" />
          </div>
          <p className="text-white font-semibold">Loading users...</p>
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4CAF50] to-[#66BB6A] flex items-center justify-center shadow-lg shadow-[#4CAF50]/40">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wider">USER MANAGEMENT</h1>
              <p className="text-[#4CAF50] text-sm tracking-wide mt-1">Manage Platform Users</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="bg-gradient-to-r from-[#2D2D2D] to-[#1A1A1A] rounded-2xl p-1 border border-white/10">
            <div className="flex items-center gap-3 px-4 py-3">
              <Search className="w-5 h-5 text-[#FFD700]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-[#1A1A1A] rounded-2xl p-1 inline-flex">
            {(['all', 'active', 'banned'] as const).map((status) => (
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
        </div>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-[#1A1A1A] rounded-full flex items-center justify-center border-2 border-white/10">
              <Users className="w-10 h-10 text-gray-700" />
            </div>
            <h3 className="text-xl font-bold text-gray-400 mb-2">No Users Found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onBan={() => {
                  setSelectedUser(user)
                  setShowBanModal(true)
                }}
                onUnban={() => handleUnbanUser(user)}
                onTogglePremium={() => togglePremium(user)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] rounded-3xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                  <Ban className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Ban {selectedUser.username}</h3>
              </div>
              <button
                onClick={() => {
                  setShowBanModal(false)
                  setSelectedUser(null)
                  setBanReason('')
                  setSelectedReasonType('spam')
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-300 font-semibold mb-4">Select ban reason:</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {['spam', 'inappropriate_content', 'harassment', 'fake_account', 'other'].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setSelectedReasonType(reason)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      selectedReasonType === reason
                        ? 'bg-[#FFD700] text-black'
                        : 'bg-[#2D2D2D] text-white hover:bg-[#3D3D3D]'
                    }`}
                  >
                    {getReasonText(reason)}
                  </button>
                ))}
              </div>

              {selectedReasonType === 'other' && (
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter reason..."
                  rows={3}
                  className="w-full bg-[#2D2D2D] text-white rounded-xl p-4 border border-white/10 outline-none resize-none mb-4"
                />
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBanModal(false)
                    setSelectedUser(null)
                    setBanReason('')
                    setSelectedReasonType('spam')
                  }}
                  className="flex-1 py-3 bg-[#2D2D2D] hover:bg-[#3D3D3D] text-gray-400 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanUser}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold transition-all"
                >
                  Ban User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function UserCard({ 
  user, 
  onBan, 
  onUnban, 
  onTogglePremium 
}: { 
  user: UserProfile
  onBan: () => void
  onUnban: () => void
  onTogglePremium: () => void
}) {
  const isAdmin = user.role === 'admin'
  const isBanned = user.is_banned
  const isPremium = user.is_premium

  return (
    <div className={`bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A] rounded-2xl p-6 border ${
      isBanned ? 'border-red-500/30' : isAdmin ? 'border-[#FFD700]/30' : 'border-white/10'
    } shadow-lg`}>
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className={`relative w-16 h-16 rounded-full flex-shrink-0 ${
          isAdmin ? 'ring-3 ring-[#FFD700]' : isPremium ? 'ring-3 ring-[#9C27B0]' : 'ring-2 ring-gray-700'
        }`}>
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.username || 'User'}
              width={64}
              height={64}
              className="rounded-full object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-[#2D2D2D] flex items-center justify-center border-2 border-gray-700">
              <span className="text-white text-2xl font-bold">
                {(user.username || 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-white truncate">{user.username || 'Unknown'}</h3>
            {isAdmin && (
              <div className="px-3 py-1 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-lg text-black text-xs font-bold tracking-wider">
                ADMIN
              </div>
            )}
            {isPremium && <Crown className="w-5 h-5 text-[#9C27B0]" />}
            {isBanned && (
              <div className="px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-lg text-red-500 text-xs font-bold tracking-wider">
                BANNED
              </div>
            )}
          </div>
          
          {user.full_name && (
            <p className="text-sm text-gray-400 mb-3">{user.full_name}</p>
          )}

          {isBanned && user.banned_reason && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-3">
              <div className="flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-500">{user.banned_reason}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          {!isAdmin && (
            <div className="flex gap-3 mt-3">
              <button
                onClick={isBanned ? onUnban : onBan}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  isBanned
                    ? 'bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] hover:from-[#66BB6A] hover:to-[#4CAF50] text-white shadow-lg'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg'
                }`}
              >
                {isBanned ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    UNBAN
                  </>
                ) : (
                  <>
                    <Ban className="w-5 h-5" />
                    BAN
                  </>
                )}
              </button>
              <button
                onClick={onTogglePremium}
                className="flex-1 py-3 bg-gradient-to-r from-[#9C27B0] to-[#BA68C8] hover:from-[#BA68C8] hover:to-[#9C27B0] text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {isPremium ? (
                  <>
                    <Crown className="w-5 h-5" />
                    REMOVE
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5" />
                    UPGRADE
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}