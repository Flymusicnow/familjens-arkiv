export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import HemClient from './HemClient'

const GUEST_MEMBER = {
  id: 'guest',
  user_id: 'guest',
  workspace_id: 'guest',
  name: 'Gäst',
  email: '',
  avatar_color: '#7B6EFF',
  role: 'adult',
  family_workspace: { name: 'Familjens Arkiv', invite_code: '' },
}

export default async function HemPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  if (!user) {
    return <HemClient member={GUEST_MEMBER as any} bills={[]} events={[]} tasks={[]} today={today} />
  }

  const { data: member } = await supabase
    .from('family_members')
    .select('*, family_workspace(name, invite_code)')
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return <HemClient member={GUEST_MEMBER as any} bills={[]} events={[]} tasks={[]} today={today} />
  }

  // Fetch urgent + soon bills
  const { data: bills } = await supabase
    .from('bills')
    .select('*')
    .eq('workspace_id', member.workspace_id)
    .in('status', ['akut', 'snart'])
    .order('due_date', { ascending: true })
    .limit(5)

  // Fetch today's events
  const { data: events } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('workspace_id', member.workspace_id)
    .gte('start_time', today + 'T00:00:00')
    .lt('start_time', tomorrow + 'T00:00:00')
    .order('start_time', { ascending: true })
    .limit(3)

  // Fetch today's tasks for this member
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, family_members(name, avatar_color)')
    .eq('workspace_id', member.workspace_id)
    .eq('assigned_to', member.id)
    .or(`due_date.eq.${today},recurring.eq.daily`)
    .order('status', { ascending: true })
    .limit(5)

  return (
    <HemClient
      member={member}
      bills={bills || []}
      events={events || []}
      tasks={tasks || []}
      today={today}
    />
  )
}
