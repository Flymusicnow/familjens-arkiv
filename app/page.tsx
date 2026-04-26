export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

export default async function RootPage() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/hem')
    }

    const { data: member } = await supabase
      .from('family_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single()

    if (!member?.workspace_id) {
      redirect('/onboarding')
    }
  } catch {
    // Supabase unavailable (e.g. missing env vars in preview) — show guest dashboard
  }

  redirect('/hem')
}
