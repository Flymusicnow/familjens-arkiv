'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { bloom } from '@/components/Bloom'
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

  const filtered = tasks.filter(t => activeFilter === 'all' || t.assigned_to === activeFilter)
  const done = filtered.filter(t => t.status === 'done').length
  const total = filtered.length

  return (
    <div className="page-in max-w-xl mx-auto px-4 pt-14 pb-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-100px] right-[-80px] w-96 h-96 rounded-full opacity-10"
          style={{ background: '#00C896', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: '#555570' }}>Familjen</div>
            <h1 className="text-2xl font-extrabold" style={{ color: '#F2F2FF', letterSpacing: '-0.5px' }}>Uppgifter</h1>
          </div>
          <button onClick={() => setShowAdd(s => !s)}
            className="px-4 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ background: '#7B6EFF' }}>
            + Ny
          </button>
        </div>

        {/* Points banner */}
        <div className="rounded-2xl px-5 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg,#0D2018,#051A0F)', border: '1px solid rgba(0,200,150,0.25)' }}>
          <div>
            <div className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'rgba(0,200,150,0.7)' }}>Familjepoäng idag</div>
            <div className="text-3xl font-extrabold mt-1" style={{ color: '#00C896' }}>{totalPoints} p</div>
          </div>
          <div className="text-4xl">🏆</div>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="rounded-2xl p-5 space-y-3" style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.09)' }}>
            <h3 className="font-bold" style={{ color: '#F2F2FF' }}>Ny uppgift</h3>
            <div className="flex gap-2">
              <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                className="w-14 px-2 py-2.5 rounded-xl text-center text-xl outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F2F2FF' }} />
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Uppgiftstitel..."
                className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F2F2FF' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#9898B8' }}>Vem</label>
                <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F2F2FF' }}>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#9898B8' }}>Återkommande</label>
                <select value={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.value as 'daily' | 'weekly' | 'none' }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F2F2FF' }}>
                  <option value="none">Engång</option>
                  <option value="daily">Dagligen</option>
                  <option value="weekly">Veckovis</option>
                </select>
              </div>
            </div>
            <button onClick={addTask} disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: saving ? '#4A4280' : '#7B6EFF' }}>
              {saving ? 'Sparar...' : 'Spara uppgift'}
            </button>
          </div>
        )}

        {/* Member filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterTab active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>Alla</FilterTab>
          {members.map(m => (
            <FilterTab key={m.id} active={activeFilter === m.id} onClick={() => setActiveFilter(m.id)}>
              {m.name}
            </FilterTab>
          ))}
        </div>

        {/* Progress */}
        {total > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1.5" style={{ color: '#9898B8' }}>
              <span>{done} av {total} klara</span>
              <span>{Math.round((done / total) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all" style={{ background: '#00C896', width: `${(done / total) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Tasks */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🎉</div>
            <div className="font-bold" style={{ color: '#F2F2FF' }}>Inga uppgifter idag!</div>
            <div className="text-sm mt-1" style={{ color: '#9898B8' }}>Lägg till uppgifter ovan</div>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(task => {
              const assignee = members.find(m => m.id === task.assigned_to)
              return (
                <button key={task.id} onClick={() => toggleTask(task)}
                  className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all"
                  style={{
                    background: task.status === 'done' ? 'rgba(0,200,150,0.06)' : '#1A1A2E',
                    border: '1px solid ' + (task.status === 'done' ? 'rgba(0,200,150,0.2)' : 'rgba(255,255,255,0.07)'),
                    opacity: task.status === 'done' ? 0.6 : 1,
                  }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: task.status === 'done' ? '#00C896' : 'transparent',
                      border: task.status === 'done' ? 'none' : '2px solid rgba(255,255,255,0.2)',
                    }}>
                    {task.status === 'done' && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{
                      color: '#F2F2FF',
                      textDecoration: task.status === 'done' ? 'line-through' : 'none'
                    }}>
                      {task.emoji} {task.title}
                    </div>
                    {assignee && (
                      <div className="text-xs mt-0.5" style={{ color: '#9898B8' }}>{assignee.name}</div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(123,110,255,0.1)', color: '#9D93FF' }}>
                    +{task.points_value}p
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function FilterTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="flex-shrink-0 px-3 py-2 rounded-xl text-sm font-bold transition-all"
      style={{
        background: active ? '#7B6EFF' : 'rgba(255,255,255,0.05)',
        color: active ? 'white' : '#9898B8',
      }}>
      {children}
    </button>
  )
}
