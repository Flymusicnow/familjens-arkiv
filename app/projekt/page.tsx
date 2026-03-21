export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import ProjektClient from './ProjektClient'
import type { Venture } from '@/lib/types'

export default async function ProjektPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <ProjektClient ventures={[]} incomeMap={{}} workspaceId="guest" memberId="guest" />
  }

  const { data: member } = await supabase
    .from('family_members')
    .select('id, workspace_id')
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return <ProjektClient ventures={[]} incomeMap={{}} workspaceId="guest" memberId="guest" />
  }

  const { data: ventures } = await supabase
    .from('ventures')
    .select('*')
    .eq('workspace_id', member.workspace_id)
    .eq('active', true)
    .order('created_at', { ascending: true })

  // Fetch this month's income per venture
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: incomeRows } = await supabase
    .from('venture_income')
    .select('venture_id, amount')
    .in('venture_id', (ventures || []).map((v: Venture) => v.id))
    .gte('income_date', monthStart.toISOString().split('T')[0])

  // Build incomeMap: venture_id -> total this month
  const incomeMap: Record<string, number> = {}
  for (const row of (incomeRows || [])) {
    incomeMap[row.venture_id] = (incomeMap[row.venture_id] || 0) + Number(row.amount)
  }

  return (
    <ProjektClient
      ventures={ventures || []}
      incomeMap={incomeMap}
      workspaceId={member.workspace_id}
      memberId={member.id}
    />
  )
}
