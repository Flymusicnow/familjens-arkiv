import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/onboarding')
  }

  // Check if user has a workspace
  const { data: member } = await supabase
    .from('family_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .single()

  if (!member?.workspace_id) {
    redirect('/onboarding')
  }

  redirect('/hem')
}
