export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import EkonomiClient from './EkonomiClient'

export default async function EkonomiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <EkonomiClient workspaceId="guest" memberId="guest" initialEntries={[]} />
  }

  const { data: member } = await supabase
    .from('family_members')
    .select('workspace_id, id')
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return <EkonomiClient workspaceId="guest" memberId="guest" initialEntries={[]} />
  }

  const { data: entries } = await supabase
    .from('economy_entries')
    .select('*')
    .eq('workspace_id', member.workspace_id)
    .order('created_at', { ascending: true })

  return (
    <EkonomiClient
      workspaceId={member.workspace_id}
      memberId={member.id}
      initialEntries={entries || []}
    />
  )
}
