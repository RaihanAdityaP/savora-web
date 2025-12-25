import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
      }

      // Check if user is banned
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_banned, banned_reason')
          .eq('id', user.id)
          .single()

        if (profile?.is_banned) {
          await supabase.auth.signOut()
          return NextResponse.redirect(
            `${origin}/login?error=account_banned&reason=${encodeURIComponent(profile.banned_reason || 'Tidak disebutkan')}`
          )
        }
      }

      // ✅ Langsung redirect ke home
      return NextResponse.redirect(`${origin}/home`)
      
    } catch (error) {
      console.error('Unexpected error:', error)
      return NextResponse.redirect(`${origin}/login?error=unexpected`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}