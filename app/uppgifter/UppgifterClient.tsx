'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { bloom } from '@/components/Bloom'
import { PageWrapper } from '@/components/PageWrapper'
import { PageHeader } from '@/components/PageHeader'
import type { Task, FamilyMember } from '@/lib/types'

interface Props {
  tasks: Task[]
  members: Pick<FamilyMember, 'id' | 'name' | 'avatar_color' | 'role'>[]
  currentMemberId: string
  workspaceId: string
  today: string
}

export default function UppgifterClient({ tasks: initialTasks, members, currentMemberId, workspaceId, today }: Props) {
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', emoji: '✅', assigned_to: currentMemberId, recurring: 'none' as 'daily' | 'weekly' | 'none' })
  const [saving, setSaving] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string>('all')

  const totalPoints = tasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.points_value || 10), 0)

  async function toggleTask(task: Task) {
    const newStatus = task.status === 'todo' ? 'done' : 'todo'
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    await supabase.from('tasks').update({
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null
    }).eq('id', task.id)
    if (newStatus === 'done') bloom(`${task.emoji} Klar!`, `+${task.points_value} poäng`)
  }

  async function addTask() {
    if (!form.title.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('tasks').insert({
      workspace_id: workspaceId,
      assigned_to: form.assigned_to,
      title: form.title.trim(),
      emoji: form.emoji,
      status: 'todo',
      due_date: form.recurring === 'none' ? today : null,
      recurring: form.recurring,
      points_value: 10,
    }).select().single()
    setSaving(false)
    if (error || !data) { bloom('Fel ❌', error?.message || ''); return }
    setTasks(prev => [...prev, data])
    setForm({ title: '', emoji: '✅', assigned_to: currentMemberId, recurring: 'none' })
    setShowAdd(false)
    bloom('Uppgift tillagd! ✅', form.title)
  }

  const filtered = tasks.filter(t => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'done') return t.status === 'done'
    if (activeFilter === 'hem') return (t.emoji || '').includes('🏠') || (t.title || '').toLowerCase().includes('hem') || (t.title || '').toLowerCase().includes('städ') || (t.title || '').toLowerCase().includes('disk')
    if (activeFilter === 'barn') return (t.emoji || '').includes('👶') || (t.title || '').toLowerCase().includes('barn') || (t.title || '').toLowerCase().includes('skola') || (t.title || '').toLowerCase().includes('dagis')
    return t.assigned_to === activeFilter
  })
  const done = filtered.filter(t => t.status === 'done').length
  const total = filtered.length

  return (
    <PageWrapper>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-100px] right-[-80px] w-96 h-96 rounded-full opacity-5"
          style={{ background: '#5A9A50', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-xl mx-auto space-y-6">
        <PageHeader
          eyebrow="Familjen"
          title="Uppgifter"
          action={
            <button onClick={() => setShowAdd(s => !s)}
              className="px-5 font-bold text-sm text-white rounded-2xl"
              style={{ background: '#9A7830', height: 48 }}>
              + Ny
            </button>
          }
        />

        {/* Points banner */}
        <div className="rounded-2xl p-6 flex items-center justify-between"
          style={{ background: 'rgba(154,120,48,0.07)', border: '1px solid rgba(154,120,48,0.18)' }}>
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: 'rgba(154,120,48,0.7)' }}>
              Familjepoäng idag
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-[56px] font-black leading-none" style={{ color: '#9A7830', letterSpacing: '-2px' }}>{totalPoints}</span>
              <span className="text-[22px] font-semibold" style={{ color: 'rgba(154,120,48,0.4)' }}>poäng</span>
            </div>
          </div>
          <span className="text-[56px] leading-none">🏆</span>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="rounded-2xl p-5 space-y-3" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)' }}>
            <h3 className="font-bold" style={{ color: '#1A2018' }}>Ny uppgift</h3>
            <div className="flex gap-2">
              <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                className="w-14 px-2 py-2.5 rounded-xl text-center text-xl outline-none"
                style={{ background: '#FAF8F5', border: '1px solid rgba(0,0,0,0.10)', color: '#1A2018' }} />
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Uppgiftstitel..."
                className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: '#FAF8F5', border: '1px solid rgba(0,0,0,0.10)', color: '#1A2018' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#8A9888' }}>Vem</label>
                <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#FAF8F5', border: '1px solid rgba(0,0,0,0.10)', color: '#1A2018' }}>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#8A9888' }}>Återkommande</label>
                <select value={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.value as 'daily' | 'weekly' | 'none' }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#FAF8F5', border: '1px solid rgba(0,0,0,0.10)', color: '#1A2018' }}>
                  <option value="none">Engång</option>
                  <option value="daily">Dagligen</option>
                  <option value="weekly">Veckovis</option>
                </select>
              </div>
            </div>
            <button onClick={addTask} disabled={saving}
              className="w-full min-h-[52px] rounded-2xl font-bold text-[15px] text-white"
              style={{ background: saving ? '#8A9888' : '#9A7830' }}>
              {saving ? 'Sparar...' : 'Spara uppgift'}
            </button>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'all',  label: 'Alla' },
            { id: 'hem',  label: '🏠 Hem' },
            { id: 'barn', label: '👶 Barn' },
            { id: 'done', label: '✅ Klara' },
            ...members.map(m => ({ id: m.id, label: m.name })),
          ].map(tab => (
            <FilterTab key={tab.id} active={activeFilter === tab.id} onClick={() => setActiveFilter(tab.id)}>
              {tab.label}
            </FilterTab>
          ))}
        </div>

        {/* Progress */}
        {total > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1.5" style={{ color: '#8A9888' }}>
              <span>{done} av {total} klara</span>
              <span>{Math.round((done / total) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
              <div className="h-full rounded-full transition-all" style={{ background: '#5A9A50', width: `${(done / total) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Tasks */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl p-12 text-center"
            style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="text-[52px] mb-4">🎉</div>
            <div className="text-[20px] font-bold mb-2" style={{ color: '#1A2018' }}>Inga uppgifter!</div>
            <div className="text-[15px] leading-relaxed" style={{ color: '#8A9888' }}>Lägg till uppgifter och tjäna familjepoäng.</div>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(task => {
              const assignee = members.find(m => m.id === task.assigned_to)
              return (
                <button key={task.id} onClick={() => toggleTask(task)}
                  className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all"
                  style={{
                    background: task.status === 'done' ? 'rgba(90,154,80,0.06)' : '#FFFFFF',
                    border: '1px solid ' + (task.status === 'done' ? 'rgba(90,154,80,0.2)' : 'rgba(0,0,0,0.07)'),
                    opacity: task.status === 'done' ? 0.6 : 1,
                  }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: task.status === 'done' ? '#5A9A50' : 'transparent',
                      border: task.status === 'done' ? 'none' : '2px solid rgba(0,0,0,0.18)',
                    }}>
                    {task.status === 'done' && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px]" style={{
                      color: '#1A2018',
                      textDecoration: task.status === 'done' ? 'line-through' : 'none'
                    }}>
                      {task.emoji} {task.title}
                    </div>
                    {assignee && (
                      <div className="text-xs mt-0.5" style={{ color: '#8A9888' }}>{assignee.name}</div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(154,120,48,0.10)', color: '#9A7830' }}>
                    +{task.points_value}p
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

function FilterTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="flex-shrink-0 h-[40px] px-4 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap"
      style={{
        background: active ? '#9A7830' : 'none',
        color: active ? 'white' : '#8A9888',
        border: active ? 'none' : '1px solid rgba(0,0,0,0.08)',
      }}>
      {children}
    </button>
  )
}
