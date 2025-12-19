'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import type { Database } from '@/lib/types/database'

// Type untuk profile check
type ProfileCheck = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'is_banned' | 'banned_reason' | 'banned_at'
>

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Check for errors from callback
    const error = searchParams.get('error')
    const reason = searchParams.get('reason')

    if (error === 'auth_failed') {
      toast.error('Gagal masuk dengan Google. Silakan coba lagi.')
    } else if (error === 'account_banned') {
      toast.error(`Akun Anda telah dinonaktifkan. Alasan: ${reason || 'Tidak disebutkan'}`)
    } else if (error === 'unexpected') {
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Email dan password harus diisi!')
      return
    }

    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          toast.error('Email atau password salah')
        } else if (authError.message.includes('Email not confirmed')) {
          toast.error('Silakan verifikasi email Anda terlebih dahulu')
        } else {
          toast.error(`Error: ${authError.message}`)
        }
        return
      }

      if (data.user) {
        // Check if banned with explicit typing
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_banned, banned_reason, banned_at')
          .eq('id', data.user.id)
          .single<ProfileCheck>()

        if (profileError) {
          console.error('Profile check error:', profileError)
        }

        if (profile?.is_banned) {
          await supabase.auth.signOut()
          toast.error(`Akun Anda telah dinonaktifkan. Alasan: ${profile.banned_reason || 'Tidak disebutkan'}`)
          return
        }

        toast.success('Berhasil masuk!')
        router.push('/home')
        router.refresh()
      }
    } catch (err) {
      console.error('Login error:', err)
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (authError) {
        toast.error('Gagal masuk dengan Google')
        setGoogleLoading(false)
      }
    } catch (err) {
      console.error('Google sign in error:', err)
      toast.error('Terjadi kesalahan')
      setGoogleLoading(false)
    }
  }

  const handleResendVerification = async () => {
    const emailToResend = prompt('Masukkan email Anda untuk mengirim ulang verifikasi:')
    
    if (!emailToResend) return

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: emailToResend.trim(),
      })

      if (resendError) {
        toast.error('Gagal mengirim email verifikasi')
      } else {
        toast.success(`Email verifikasi telah dikirim ke ${emailToResend}`)
      }
    } catch (err) {
      console.error('Resend error:', err)
      toast.error('Terjadi kesalahan')
    }
  }

  return (
    <div className="animate-scale-in">
      {/* Welcome Badge */}
      <div className="text-center mb-8">
        <div className="inline-block px-6 py-3 bg-white/20 backdrop-blur-md rounded-full border-2 border-white/40 shadow-lg mb-4">
          <span className="text-white text-sm font-bold tracking-wider">
            SELAMAT DATANG
          </span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tight">
          Savora
        </h1>
        
        <p className="text-white/90 text-base font-medium">
          Petualangan Kuliner Dimulai Disini
        </p>
      </div>

      {/* Login Form */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Input */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-[#E76F51]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-[#E76F51] focus:bg-white focus:ring-2 focus:ring-[#E76F51]/20 outline-none transition-all"
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
                placeholder="Password"
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-[#F4A261] focus:bg-white focus:ring-2 focus:ring-[#F4A261]/20 outline-none transition-all"
                required
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

          {/* Login Button */}
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
                Memproses...
              </span>
            ) : (
              'MASUK'
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-bold">ATAU</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-4 bg-white border-2 border-gray-300 rounded-2xl font-semibold text-gray-700 hover:bg-gray-50 transition-all hover:scale-[1.02] shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Menghubungkan...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-3">
                <Image src="/images/googlelogo.png" alt="Google" width={24} height={24} />
                Lanjutkan dengan Google
              </span>
            )}
          </button>
        </form>

        {/* Resend Verification */}
        <div className="mt-6 text-center">
          <button
            onClick={handleResendVerification}
            className="text-sm text-[#E76F51] hover:text-[#F4A261] font-semibold underline"
          >
            Belum verifikasi email?
          </button>
        </div>
      </div>

      {/* Register Link */}
      <div className="mt-6 text-center">
        <div className="inline-block px-6 py-4 bg-white/20 backdrop-blur-md rounded-2xl border-2 border-white/40">
          <span className="text-white/90 text-base mr-3">Belum punya akun?</span>
          <Link
            href="/register"
            className="inline-block px-5 py-2 bg-white text-[#E76F51] rounded-xl font-bold hover:bg-white/90 transition-all hover:scale-105"
          >
            Daftar →
          </Link>
        </div>
      </div>
    </div>
  )
}