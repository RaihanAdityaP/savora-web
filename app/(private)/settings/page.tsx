'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/theme-context'
import UnifiedNavigation from '@/components/ui/unified-navigation'
import { 
  ArrowLeft, 
  Sun, 
  Moon, 
  Monitor, 
  Check,
  Palette,
  Bell,
  Lock,
  User,
  Globe,
  HelpCircle
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme, actualTheme } = useTheme()
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single()

        if (data) {
          setAvatarUrl(data.avatar_url)
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err)
    } finally {
      setLoading(false)
    }
  }

  const themeOptions = [
    {
      value: 'light' as const,
      label: 'Terang',
      icon: Sun,
      description: 'Tampilan terang untuk siang hari'
    },
    {
      value: 'dark' as const,
      label: 'Gelap',
      icon: Moon,
      description: 'Tampilan gelap untuk malam hari'
    },
    {
      value: 'system' as const,
      label: 'Sesuai Sistem',
      icon: Monitor,
      description: 'Mengikuti pengaturan perangkat'
    }
  ]

  const settingSections = [
    {
      title: 'Akun',
      icon: User,
      items: [
        { label: 'Edit Profil', path: null, comingSoon: true },
        { label: 'Ubah Password', path: null, comingSoon: true },
      ]
    },
    {
      title: 'Notifikasi',
      icon: Bell,
      items: [
        { label: 'Pengaturan Notifikasi', path: null, comingSoon: true },
      ]
    },
    {
      title: 'Privasi & Keamanan',
      icon: Lock,
      items: [
        { label: 'Privasi Akun', path: null, comingSoon: true },
        { label: 'Blokir Pengguna', path: null, comingSoon: true },
      ]
    },
    {
      title: 'Bahasa & Wilayah',
      icon: Globe,
      items: [
        { label: 'Bahasa', path: null, comingSoon: true },
        { label: 'Zona Waktu', path: null, comingSoon: true },
      ]
    },
    {
      title: 'Bantuan',
      icon: HelpCircle,
      items: [
        { label: 'Pusat Bantuan', path: null, comingSoon: true },
        { label: 'Laporkan Masalah', path: null, comingSoon: true },
        { label: 'Tentang Savora', path: null, comingSoon: true },
      ]
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E76F51]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-gray-900 transition-colors">
      <UnifiedNavigation avatarUrl={avatarUrl} />

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Kembali</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E76F51] to-[#F4A261] flex items-center justify-center shadow-lg">
              <Palette className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pengaturan</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Kelola preferensi akun Anda
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
        {/* Theme Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-[#E76F51]" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tema Tampilan</h2>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            {themeOptions.map((option, index) => {
              const Icon = option.icon
              const isSelected = theme === option.value
              const isLast = index === themeOptions.length - 1

              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    !isLast ? 'border-b border-gray-200 dark:border-gray-700' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected 
                        ? 'bg-gradient-to-br from-[#E76F51] to-[#F4A261] text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className={`font-semibold ${
                        isSelected 
                          ? 'text-[#E76F51]' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {option.label}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E76F51] to-[#F4A261] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Current Theme Preview */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
              <p className="text-sm font-medium">
                Tema aktif: <span className="font-bold capitalize">{actualTheme}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Other Settings Sections */}
        <div className="space-y-6">
          {settingSections.map((section) => {
            const SectionIcon = section.icon
            
            return (
              <div key={section.title}>
                <div className="flex items-center gap-3 mb-3">
                  <SectionIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {section.title}
                  </h2>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                  {section.items.map((item, index) => {
                    const isLast = index === section.items.length - 1

                    return (
                      <button
                        key={item.label}
                        onClick={() => item.path && router.push(item.path)}
                        disabled={item.comingSoon}
                        className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          !isLast ? 'border-b border-gray-200 dark:border-gray-700' : ''
                        }`}
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.label}
                        </span>
                        {item.comingSoon && (
                          <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-full">
                            Segera
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* App Version */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Savora v1.0.0
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            © 2026 Savora. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}