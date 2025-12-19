'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || !fullName || !email || !password) {
      toast.error('Semua field harus diisi!')
      return
    }

    if (password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            username: username.trim(),
            full_name: fullName.trim(),
          },
        },
      })

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          toast.error('Email sudah terdaftar. Silakan login atau kirim ulang verifikasi.')
        } else if (authError.message.includes('Password')) {
          toast.error('Password minimal 6 karakter')
        } else {
          toast.error(`Error: ${authError.message}`)
        }
        return
      }

      if (data.user) {
        // Show success dialog
        toast.success('Akun berhasil dibuat! Silakan cek email Anda untuk verifikasi.', {
          duration: 10000,
        })
        
        // Wait a bit then redirect to login
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } catch (err) {
      console.error('Register error:', err)
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-scale-in">
      {/* Back Button */}
      <Link
        href="/login"
        className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-xl border-2 border-white/40 hover:bg-white/30 transition-all mb-6"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Kembali
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block px-6 py-3 bg-white/20 backdrop-blur-md rounded-full border-2 border-white/40 shadow-lg mb-4">
          <span className="text-white text-sm font-bold tracking-wider">
            BERGABUNG
          </span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tight">
          Buat Akun
        </h1>
        
        <p className="text-white/90 text-base font-medium">
          Mulai Petualangan Kuliner Anda
        </p>
      </div>

      {/* Register Form */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
        <form onSubmit={handleRegister} className="space-y-5">
          {/* Username Input */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-[#E76F51]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-[#E76F51] focus:bg-white focus:ring-2 focus:ring-[#E76F51]/20 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Full Name Input */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-[#2A9D8F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama Lengkap"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-[#2A9D8F] focus:bg-white focus:ring-2 focus:ring-[#2A9D8F]/20 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-[#E9C46A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-[#E9C46A] focus:bg-white focus:ring-2 focus:ring-[#E9C46A]/20 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-[#F4A261]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min. 6 karakter)"
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-[#F4A261] focus:bg-white focus:ring-2 focus:ring-[#F4A261]/20 outline-none transition-all"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-accent-gradient text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Mendaftar...
              </span>
            ) : (
              'DAFTAR SEKARANG'
            )}
          </button>

          {/* Terms Notice */}
          <p className="text-center text-xs text-gray-500 mt-4">
            Dengan mendaftar, Anda menyetujui{' '}
            <a href="#" className="text-[#E76F51] hover:underline">Syarat & Ketentuan</a>
            {' '}dan{' '}
            <a href="#" className="text-[#E76F51] hover:underline">Kebijakan Privasi</a>
          </p>
        </form>
      </div>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <div className="inline-block px-6 py-4 bg-white/20 backdrop-blur-md rounded-2xl border-2 border-white/40">
          <span className="text-white/90 text-base mr-3">Sudah Punya Akun?</span>
          <Link
            href="/login"
            className="inline-block px-5 py-2 bg-white text-[#E76F51] rounded-xl font-bold hover:bg-white/90 transition-all hover:scale-105"
          >
            Masuk →
          </Link>
        </div>
      </div>
    </div>
  )
}