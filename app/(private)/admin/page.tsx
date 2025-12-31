'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Users, 
  ChefHat, 
  History, 
  TrendingUp, 
  UserX, 
  Clock, 
  ArrowRight,
  Shield,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'

interface AdminStats {
  total_users: number
  banned_users: number
  pending_recipes: number
  total_recipes: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [stats, setStats] = useState<AdminStats>({
    total_users: 0,
    banned_users: 0,
    pending_recipes: 0,
    total_recipes: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminAccess()
    loadStatistics()
  }, [])

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please login first')
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      toast.error('Access denied. Admin only.')
      router.push('/home')
    }
  }

  const loadStatistics = async () => {
    try {
      const [usersRes, bannedRes, pendingRes, totalRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_banned', true),
        supabase.from('recipes').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('recipes').select('id', { count: 'exact', head: true })
      ])

      setStats({
        total_users: usersRes.count || 0,
        banned_users: bannedRes.count || 0,
        pending_recipes: pendingRes.count || 0,
        total_recipes: totalRes.count || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      toast.error('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F0F] via-[#1A1A1A] to-[#0F0F0F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] flex items-center justify-center animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <p className="text-white font-semibold text-lg">Loading Admin Panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F0F] via-[#1A1A1A] to-[#0F0F0F]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1A1A1A] via-[#2D2D2D] to-[#3D3D3D] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center shadow-lg shadow-[#FFD700]/40">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-wider">ADMIN PANEL</h1>
                <p className="text-[#FFD700] text-sm tracking-wide mt-1">Savora Management System</p>
              </div>
            </div>
            <Link
              href="/home"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Platform Overview Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-7 bg-gradient-to-b from-[#FFD700] to-[#FFA500] rounded-full" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent tracking-wider">
              PLATFORM OVERVIEW
            </h2>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Users"
              value={stats.total_users}
              icon={Users}
              gradient="from-[#4CAF50] to-[#66BB6A]"
              shadowColor="shadow-[#4CAF50]/20"
            />
            <StatCard
              title="Banned Users"
              value={stats.banned_users}
              icon={UserX}
              gradient="from-[#F44336] to-[#E57373]"
              shadowColor="shadow-[#F44336]/20"
            />
            <StatCard
              title="Pending Recipes"
              value={stats.pending_recipes}
              icon={Clock}
              gradient="from-[#FF9800] to-[#FFB74D]"
              shadowColor="shadow-[#FF9800]/20"
            />
            <StatCard
              title="Total Recipes"
              value={stats.total_recipes}
              icon={ChefHat}
              gradient="from-[#9C27B0] to-[#BA68C8]"
              shadowColor="shadow-[#9C27B0]/20"
            />
          </div>
        </div>

        {/* Management Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-7 bg-gradient-to-b from-[#FFD700] to-[#FFA500] rounded-full" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent tracking-wider">
              MANAGEMENT
            </h2>
          </div>

          <div className="space-y-4">
            <MenuCard
              title="User Management"
              subtitle={`${stats.total_users} registered users`}
              icon={Users}
              gradient="from-[#4CAF50] to-[#66BB6A]"
              href="/admin/users"
            />
            <MenuCard
              title="Recipe Moderation"
              subtitle={`${stats.pending_recipes} awaiting approval`}
              icon={ChefHat}
              gradient="from-[#FF9800] to-[#FFB74D]"
              href="/admin/recipes"
            />
            <MenuCard
              title="Activity Logs"
              subtitle="Monitor all activities"
              icon={History}
              gradient="from-[#2196F3] to-[#64B5F6]"
              href="/admin/logs"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  gradient, 
  shadowColor 
}: { 
  title: string
  value: number
  icon: React.ElementType
  gradient: string
  shadowColor: string
}) {
  return (
    <div className={`bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A] rounded-2xl p-6 border border-white/10 shadow-lg ${shadowColor}`}>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-2`}>
        {value.toLocaleString()}
      </div>
      <div className="text-sm text-gray-400 font-semibold tracking-wide">
        {title}
      </div>
    </div>
  )
}

function MenuCard({ 
  title, 
  subtitle, 
  icon: Icon, 
  gradient, 
  href 
}: { 
  title: string
  subtitle: string
  icon: React.ElementType
  gradient: string
  href: string
}) {
  return (
    <Link href={href}>
      <div className="bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A] rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all group shadow-lg hover:shadow-xl">
        <div className="flex items-center gap-5">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1 tracking-wide">{title}</h3>
            <p className="text-sm text-gray-400">{subtitle}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-[#FFA500]/10 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-[#FFD700]/30 group-hover:to-[#FFA500]/20 transition-all">
            <ArrowRight className="w-5 h-5 text-[#FFD700]" />
          </div>
        </div>
      </div>
    </Link>
  )
}