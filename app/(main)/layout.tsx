import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
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