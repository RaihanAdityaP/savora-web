'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Bell, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function CustomAppBar() {
  const supabase = createClient()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadUnreadCount()
    const cleanup = setupRealtimeListener()
    return cleanup
  }, [])

  const loadUnreadCount = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_read', false)

    setUnreadCount(data?.length ?? 0)
  }

  const setupRealtimeListener = () => {
    let channel: any

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return

      channel = supabase
        .channel(`notifications_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          loadUnreadCount
        )
        .subscribe()
    })

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }

  const handleLogout = async () => {
    if (!confirm('Keluar dari akun Savora?')) return
    await supabase.auth.signOut()
    toast.success('Berhasil keluar')
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#264653] via-[#2A9D8F] to-[#E76F51] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* LOGO SAVORA */}
          <Link
            href="/home"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[#2B6CB0] to-[#FF6B35] p-1 shadow-xl">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                <Image
                  src="/images/logo.png"
                  alt="Savora"
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
            </div>
            <span className="text-white text-xl md:text-2xl font-bold tracking-tight">
              Savora
            </span>
          </Link>

          {/* ACTIONS */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* NOTIFICATION */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <Bell className="w-5 h-5 md:w-6 md:h-6 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px]
                  flex items-center justify-center bg-red-500 text-white
                  text-[10px] font-bold rounded-full px-1 border-2 border-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <LogOut className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>
          </div>

        </div>
      </div>
    </header>
  )
}