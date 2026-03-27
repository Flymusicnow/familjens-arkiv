export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import UppgifterClient from './UppgifterClient'

export default async function UppgifterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date().toISOString().split('T')[0]

  if (!user) {
    return <UppgifterClient tasks={[]} members={[]} currentMemberId="guest" workspaceId="guest" today={today} />
  }

  const { data: member } = await supabase
    .from('family_members')
    .select('workspace_id, id')
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return <UppgifterClient tasks={[]} members={[]} currentMemberId="guest" workspaceId="guest" today={today} />
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, family_members(name, avatar_color)')
    .eq('workspace_id', member.workspace_id)
    .or(`due_date.eq.${today},recurring.in.(daily,weekly)`)
    .order('status', { ascending: true })
    .order('created_at', { ascending: true })

  const { data: members } = await supabase
    .from('family_members')
    .select('id, name, avatar_color, role')
    .eq('workspace_id', member.workspace_id)

  return (
    <UppgifterClient
      tasks={tasks || []}
      members={members || []}
      currentMemberId={member.id}
      workspaceId={member.workspace_id}
      today={today}
    />
  )
}
