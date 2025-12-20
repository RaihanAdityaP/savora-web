'use client'

import { Home, Search, Plus, Bookmark, User } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  avatarUrl?: string | null
}

export default function CustomBottomNav({ avatarUrl }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  const navItems = [
    { label: 'Home', icon: Home, path: '/home' },
    { label: 'Search', icon: Search, path: '/search' },
    { label: 'Create', icon: Plus, path: '/create', isCenter: true },
    { label: 'Saved', icon: Bookmark, path: '/collections' },
    {
      label: 'Profile',
      icon: User,
      path: userId ? `/profile/${userId}` : null,
      isProfile: true,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
      <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = item.path ? pathname === item.path : false
          const Icon = item.icon

          if (item.isCenter) {
            return (
              <button
                key={item.label}
                onClick={() => router.push(item.path!)}
                className="relative -mt-10 active:scale-90"
              >
                <div className="w-14 h-14 bg-[#264653] rounded-full shadow-xl flex items-center justify-center text-white ring-4 ring-white">
                  <Plus className="w-8 h-8" />
                </div>
              </button>
            )
          }

          return (
            <button
              key={item.label}
              disabled={!item.path}
              onClick={() => item.path && router.push(item.path)}
              className="flex flex-col items-center gap-1 min-w-[60px] py-1 active:scale-95 disabled:opacity-50"
            >
              {item.isProfile ? (
                <div
                  className={`w-7 h-7 rounded-full border-2 overflow-hidden ${
                    isActive ? 'border-[#264653]' : 'border-gray-200'
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
              ) : (
                <Icon
                  className={`w-6 h-6 ${
                    isActive ? 'text-[#264653]' : 'text-gray-400'
                  }`}
                />
              )}

              <div
                className={`h-[3px] w-5 rounded-full ${
                  isActive ? 'bg-[#264653]' : 'bg-transparent'
                }`}
              />
              <span
                className={`text-[10px] font-bold ${
                  isActive ? 'text-[#264653]' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}