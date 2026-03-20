export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import EkonomiClient from './EkonomiClient'

export default async function EkonomiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/onboarding')

  const { data: member } = await supabase
    .from('family_members')
    .select('workspace_id, id')
    .eq('user_id', user.id)
    .single()
  if (!member) redirect('/onboarding')

  const { data: bills } = await supabase
    .from('bills')
    .select('*')
    .eq('workspace_id', member.workspace_id)
    .neq('status', 'betald')
    .order('due_date', { ascending: true })

  const { data: paid } = await supabase
    .from('bills')
    .select('*')
    .eq('workspace_id', member.workspace_id)
    .eq('status', 'betald')
    .order('paid_at', { ascending: false })
    .limit(10)

  return (
    <EkonomiClient
      workspaceId={member.workspace_id}
      memberId={member.id}
      initialBills={bills || []}
      initialPaid={paid || []}
    />
  )
}
