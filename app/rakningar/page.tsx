export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import RakningarClient from './RakningarClient'

const GUEST_WORKSPACE = 'guest'
const GUEST_MEMBER = 'guest'

export default async function RakningarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <RakningarClient workspaceId={GUEST_WORKSPACE} memberId={GUEST_MEMBER} akutBills={[]} snartBills={[]} klarBills={[]} />
  }

  const { data: member } = await supabase
    .from('family_members')
    .select('id, workspace_id')
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return <RakningarClient workspaceId={GUEST_WORKSPACE} memberId={GUEST_MEMBER} akutBills={[]} snartBills={[]} klarBills={[]} />
  }

  const today = new Date().toISOString().split('T')[0]
  const week = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  const { data: allBills } = await supabase
    .from('bills')
    .select('*')
    .eq('workspace_id', member.workspace_id)
    .order('due_date', { ascending: true })

  const bills = allBills || []

  const akutBills = bills.filter(b => b.status === 'akut' || (b.status !== 'betald' && b.due_date && b.due_date <= today))
  const snartBills = bills.filter(b => b.status === 'snart' || (b.status !== 'betald' && b.status !== 'akut' && b.due_date && b.due_date > today && b.due_date <= week))
  const klarBills  = bills.filter(b => b.status === 'betald' || b.status === 'klar')

  return (
    <RakningarClient
      workspaceId={member.workspace_id}
      memberId={member.id}
      akutBills={akutBills}
      snartBills={snartBills}
      klarBills={klarBills}
    />
  )
}
