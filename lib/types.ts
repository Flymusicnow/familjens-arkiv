export type MemberRole = 'adult' | 'teen' | 'child'
export type BillStatus = 'akut' | 'snart' | 'klar' | 'betald'
export type BillSource = 'manual' | 'gmail' | 'drive' | 'scan'
export type TaskStatus = 'todo' | 'done'
export type DocumentCategory = 'räkning' | 'myndighet' | 'avtal' | 'skola' | 'kvitto' | 'övrigt'

export interface FamilyWorkspace {
  id: string
  name: string
  invite_code: string
  created_at: string
}

export interface FamilyMember {
  id: string
  workspace_id: string
  user_id: string | null
  name: string
  email: string | null
  avatar_color: string
  role: MemberRole
  google_connected: boolean
  created_at: string
}

export interface Bill {
  id: string
  workspace_id: string
  title: string
  sender: string | null
  amount: number | null
  due_date: string | null
  status: BillStatus
  paid_by: string | null
  paid_at: string | null
  source: BillSource
  document_url: string | null
  ocr_number: string | null
  snooze_until: string | null
  created_at: string
}

export interface CalendarEvent {
  id: string
  workspace_id: string
  title: string
  start_time: string | null
  end_time: string | null
  member_ids: string[]
  category: string
  color: string | null
  notes: string | null
  created_at: string
}

export interface Task {
  id: string
  workspace_id: string
  assigned_to: string | null
  title: string
  emoji: string
  status: TaskStatus
  due_date: string | null
  recurring: 'daily' | 'weekly' | 'none'
  points_value: number
  completed_at: string | null
  created_at: string
  family_members?: FamilyMember
}

export interface Document {
  id: string
  workspace_id: string | null
  session_id: string | null
  uploaded_by: string | null
  title: string | null
  category: string
  file_url: string | null
  amount: string | null
  due_date: string | null
  sender: string | null
  ocr_ref: string | null
  created_at: string
}

export interface Venture {
  id: string
  workspace_id: string
  owner_id: string | null
  name: string
  emoji: string
  category: string | null
  monthly_goal: number
  active: boolean
  color: string
  created_at: string
  family_members?: FamilyMember
}
