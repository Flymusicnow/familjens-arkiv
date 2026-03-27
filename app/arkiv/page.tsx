export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import ArkivClient from './ArkivClient'

export default async function ArkivPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <ArkivClient initialDocs={[]} workspaceId={null} memberId={null} />
  }

  const { data: member } = await supabase
    .from('family_members')
    .select('workspace_id, id')
    .eq('user_id', user.id)
    .single()

  const sessionId = null // authenticated users use workspace_id

  const { data: docs } = member
    ? await supabase
        .from('documents')
        .select('*')
        .eq('workspace_id', member.workspace_id)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <ArkivClient
      initialDocs={docs || []}
      workspaceId={member?.workspace_id || null}
      memberId={member?.id || null}
    />
  )
}
