import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // Redirect to login with return URL
    redirect('/login?redirect=/home')
  }
  
  // Check if user is banned
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned, banned_reason')
    .eq('id', user.id)
    .single()
  
  if (profile?.is_banned) {
    await supabase.auth.signOut()
    redirect(`/login?error=account_banned&reason=${encodeURIComponent(profile.banned_reason || 'Tidak disebutkan')}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}