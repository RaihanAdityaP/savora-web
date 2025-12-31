'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  History, 
  ArrowLeft, 
  User, 
  Clock, 
  Ban, 
  CheckCircle, 
  FileText, 
  Trash2,
  MessageSquare,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils/format'

interface ActivityLog {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  details: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
  profiles: {
    username: string | null
  } | null
}

export default function AdminActivityLogsPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState('all')

  useEffect(() => {
    checkAdminAccess()
    loadLogs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filterAction, logs])

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

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*, profiles:user_id(username)')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      setLogs(data || [])
    } catch (error) {
      console.error('Error loading logs:', error)
      toast.error('Failed to load activity logs')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    if (filterAction === 'all') {
      setFilteredLogs(logs)
    } else {
      setFilteredLogs(logs.filter(log => log.action === filterAction))
    }
  }

  const getActionDisplay = (action: string) => {
    const displays: Record<string, string> = {
      'ban_user': 'Ban User',
      'unban_user': 'Unban User',
      'moderate_recipe': 'Moderate Recipe',
      'delete_recipe': 'Delete Recipe',
      'delete_comment': 'Delete Comment'
    }
    return displays[action] || action.replace(/_/g, ' ').toUpperCase()
  }

  const getActionIcon = (action: string) => {
    const icons: Record<string, React.ElementType> = {
      'ban_user': Ban,
      'unban_user': CheckCircle,
      'moderate_recipe': FileText,
      'delete_recipe': Trash2,
      'delete_comment': MessageSquare
    }
    return icons[action] || History
  }

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'ban_user': 'from-red-500 to-red-600',
      'unban_user': 'from-green-500 to-green-600',
      'moderate_recipe': 'from-orange-500 to-orange-600',
      'delete_recipe': 'from-red-500 to-red-600',
      'delete_comment': 'from-red-500 to-red-600'
    }
    return colors[action] || 'from-blue-500 to-blue-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F0F] via-[#1A1A1A] to-[#0F0F0F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#2196F3] to-[#64B5F6] flex items-center justify-center animate-pulse">
            <History className="w-8 h-8 text-white" />
          </div>
          <p className="text-white font-semibold">Loading logs...</p>
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2196F3] to-[#64B5F6] flex items-center justify-center shadow-lg shadow-[#2196F3]/40">
              <History className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wider">ACTIVITY LOGS</h1>
              <p className="text-[#2196F3] text-sm tracking-wide mt-1">Monitor All Activities</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { label: 'All', value: 'all' },
            { label: 'Ban', value: 'ban_user' },
            { label: 'Unban', value: 'unban_user' },
            { label: 'Moderate', value: 'moderate_recipe' },
            { label: 'Delete', value: 'delete_recipe' }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterAction(filter.value)}
              className={`px-5 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                filterAction === filter.value
                  ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black border-2 border-[#FFD700]'
                  : 'bg-[#1A1A1A] text-gray-400 border border-white/10 hover:border-white/20'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Logs List */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-[#1A1A1A] rounded-full flex items-center justify-center border-2 border-white/10">
              <History className="w-10 h-10 text-gray-700" />
            </div>
            <h3 className="text-xl font-bold text-gray-400 mb-2">No Activities Found</h3>
            <p className="text-gray-600">Activity logs will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log) => {
              const Icon = getActionIcon(log.action)
              const colorGradient = getActionColor(log.action)

              return (
                <div
                  key={log.id}
                  className="bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A] rounded-2xl p-6 border border-white/10 shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorGradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white mb-2 tracking-wide">
                        {getActionDisplay(log.action)}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-400 font-medium">
                          {log.profiles?.username || 'Unknown User'}
                        </span>
                      </div>

                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/10 mb-3">
                          <div className="space-y-2">
                            {log.details.recipe_title && (
                              <DetailRow label="Recipe" value={log.details.recipe_title} />
                            )}
                            {log.details.username && (
                              <DetailRow label="Target" value={log.details.username} />
                            )}
                            {log.details.status && (
                              <DetailRow label="Status" value={log.details.status.toString().toUpperCase()} />
                            )}
                            {log.details.action && (
                              <DetailRow label="Action" value={log.details.action} />
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-600" />
                        <span className="text-xs text-gray-600 font-medium">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-gray-500 font-semibold w-20 flex-shrink-0">{label}:</span>
      <span className="text-gray-300 font-medium flex-1">{value}</span>
    </div>
  )
}