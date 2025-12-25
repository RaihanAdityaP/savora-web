'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Bell,
  LogOut,
  Home,
  Search,
  Plus,
  Bookmark,
  User,
  ChevronDown,
  X
} from 'lucide-react'

interface UnifiedNavigationProps {
  avatarUrl?: string | null
}

export default function UnifiedNavigation({ avatarUrl }: UnifiedNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showMobileProfileMenu, setShowMobileProfileMenu] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const mobileProfileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadUserData()
    loadUnreadCount()
    const cleanup = setupRealtimeListener()
    return cleanup
  }, [])

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
      if (mobileProfileMenuRef.current && !mobileProfileMenuRef.current.contains(event.target as Node)) {
        setShowMobileProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      
      setUsername(data?.username || null)
    }
  }

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
  
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Sign out error:', error)
      // Tetap lanjutkan logout meskipun ada error
    }
    
    toast.success('Berhasil keluar')
    router.push('/login')
    router.refresh()
  } catch (err) {
    console.error('Unexpected logout error:', err)
    // Force logout by clearing local data
    toast.success('Berhasil keluar')
    router.push('/login')
    router.refresh()
  }
}

  const profileMenuItems = [
    { label: 'Home', icon: Home, path: '/home' },
    { label: 'Search', icon: Search, path: '/search' },
    { label: 'Koleksi', icon: Bookmark, path: '/collections' },
    { label: 'Buat Resep', icon: Plus, path: '/create' },
    { label: 'Notifikasi', icon: Bell, path: '/notifications', badge: unreadCount },
    { label: 'Profile', icon: User, path: userId ? `/profile/${userId}` : null },
    { label: 'Keluar', icon: LogOut, action: handleLogout, isDanger: true },
  ]

  const navItems = [
    { label: 'Home', icon: Home, path: '/home' },
    { label: 'Search', icon: Search, path: '/search' },
    { label: 'Create', icon: Plus, path: '/create', isCenter: true },
    { label: 'Saved', icon: Bookmark, path: '/collections' },
  ]

  return (
    <>
      {/* TOP NAVIGATION - Always visible */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* LOGO */}
            <Link
              href="/home"
              className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[#2B6CB0] to-[#FF6B35] p-1 shadow-lg">
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
              <span className="text-gray-900 text-xl md:text-2xl font-bold tracking-tight">
                Savora
              </span>
            </Link>

            {/* RIGHT ACTIONS */}
            <div className="flex items-center gap-3">
              {/* NOTIFICATION */}
              <Link
                href="/notifications"
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-6 h-6 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 border-2 border-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* PROFILE DROPDOWN */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-300">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="Profile"
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-600 transition-transform hidden md:block ${
                      showProfileMenu ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* User Info */}
                    <Link
                      href={userId ? `/profile/${userId}` : '#'}
                      onClick={() => setShowProfileMenu(false)}
                      className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors block"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt="Profile"
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate">
                            {username || 'User'}
                          </p>
                          <p className="text-xs text-gray-500">Lihat profile</p>
                        </div>
                      </div>
                    </Link>

                    {/* Menu Items */}
                    {profileMenuItems.map((item, idx) => {
                      const Icon = item.icon
                      const isActive = item.path ? pathname === item.path : false

                      if (item.action) {
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              item.action()
                              setShowProfileMenu(false)
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                              item.isDanger ? 'text-red-600' : 'text-gray-700'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                          </button>
                        )
                      }

                      return (
                        <Link
                          key={idx}
                          href={item.path || '#'}
                          onClick={() => setShowProfileMenu(false)}
                          className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                            isActive ? 'bg-gray-50 text-[#E76F51]' : 'text-gray-700'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium flex-1">{item.label}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
                              {item.badge > 99 ? '99+' : item.badge}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* BOTTOM NAVIGATION - Mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.path
            const Icon = item.icon

            if (item.isCenter) {
              return (
                <button
                  key={item.label}
                  onClick={() => router.push(item.path)}
                  className="relative -mt-10 active:scale-90 transition-transform"
                >
                  <div className="w-14 h-14 bg-gradient-to-r from-[#E76F51] to-[#F4A261] rounded-full shadow-xl flex items-center justify-center text-white ring-4 ring-white">
                    <Plus className="w-8 h-8" />
                  </div>
                </button>
              )
            }

            return (
              <button
                key={item.label}
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center gap-1 min-w-[60px] py-1 active:scale-95 transition-transform"
              >
                <Icon
                  className={`w-6 h-6 ${
                    isActive ? 'text-[#E76F51]' : 'text-gray-400'
                  }`}
                />
                <div
                  className={`h-[3px] w-5 rounded-full ${
                    isActive ? 'bg-[#E76F51]' : 'bg-transparent'
                  }`}
                />
                <span
                  className={`text-[10px] font-bold ${
                    isActive ? 'text-[#E76F51]' : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            )
          })}

          {/* PROFILE BUTTON WITH DROPDOWN - Mobile */}
          <div className="relative" ref={mobileProfileMenuRef}>
            <button
              onClick={() => setShowMobileProfileMenu(!showMobileProfileMenu)}
              disabled={!userId}
              className="flex flex-col items-center gap-1 min-w-[60px] py-1 active:scale-95 transition-transform disabled:opacity-50"
            >
              <div
                className={`w-7 h-7 rounded-full border-2 overflow-hidden ${
                  pathname.startsWith('/profile') || showMobileProfileMenu ? 'border-[#E76F51]' : 'border-gray-200'
                }`}
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    width={28}
                    height={28}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
              <div
                className={`h-[3px] w-5 rounded-full ${
                  pathname.startsWith('/profile') || showMobileProfileMenu ? 'bg-[#E76F51]' : 'bg-transparent'
                }`}
              />
              <span
                className={`text-[10px] font-bold ${
                  pathname.startsWith('/profile') || showMobileProfileMenu ? 'text-[#E76F51]' : 'text-gray-400'
                }`}
              >
                Profile
              </span>
            </button>

            {/* Mobile Dropdown Menu */}
            {showMobileProfileMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* User Info */}
                <Link
                  href={userId ? `/profile/${userId}` : '#'}
                  onClick={() => setShowMobileProfileMenu(false)}
                  className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors block"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt="Profile"
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">
                        {username || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">Lihat profile</p>
                    </div>
                  </div>
                </Link>

                {/* Menu Items */}
                {profileMenuItems.map((item, idx) => {
                  const Icon = item.icon
                  const isActive = item.path ? pathname === item.path : false

                  if (item.action) {
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          item.action()
                          setShowMobileProfileMenu(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                          item.isDanger ? 'text-red-600' : 'text-gray-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    )
                  }

                  return (
                    <Link
                      key={idx}
                      href={item.path || '#'}
                      onClick={() => setShowMobileProfileMenu(false)}
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                        isActive ? 'bg-gray-50 text-[#E76F51]' : 'text-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium flex-1">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}