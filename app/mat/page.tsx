export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import MatClient from './MatClient'

export default async function MatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/onboarding')

  const { data: member } = await supabase
    .from('family_members')
    .select('workspace_id, id')
    .eq('user_id', user.id)
    .single()
  if (!member) redirect('/onboarding')

  const today = new Date().toISOString().split('T')[0]
  // Fetch meals for current week (Mon–Sun)
  const monday = getMondayOfWeek(today)
  const sunday = getSundayOfWeek(today)

  const [{ data: meals }, { data: vitaminLogs }, { data: members }] = await Promise.all([
    supabase
      .from('meals')
      .select('*')
      .eq('workspace_id', member.workspace_id)
      .gte('date', monday)
      .lte('date', sunday)
      .order('date', { ascending: true }),
    supabase
      .from('vitamin_log')
      .select('*')
      .eq('workspace_id', member.workspace_id)
      .eq('date', today),
    supabase
      .from('family_members')
      .select('id, name, avatar_color, role')
      .eq('workspace_id', member.workspace_id),
  ])

  return (
    <MatClient
      meals={meals || []}
      vitaminLogs={vitaminLogs || []}
      members={members || []}
      workspaceId={member.workspace_id}
      currentMemberId={member.id}
      today={today}
      weekStart={monday}
      weekEnd={sunday}
    />
  )
}

function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function getSundayOfWeek(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = (day === 0 ? 0 : 7 - day)
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}
