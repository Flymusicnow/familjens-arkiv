'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { bloom } from '@/components/Bloom'
import type { FamilyMember, Bill, CalendarEvent, Task } from '@/lib/types'

interface Props {
  member: FamilyMember & { family_workspace: { name: string; invite_code: string } }
  bills: Bill[]
  events: CalendarEvent[]
  tasks: Task[]
  today: string
}

function getGreeting(name: string) {
  const h = new Date().getHours()
  if (h < 5)  return { text: `God natt, ${name}`, emoji: '🌙' }
  if (h < 10) return { text: `God morgon, ${name}`, emoji: '☀️' }
  if (h < 13) return { text: `Hej, ${name}`, emoji: '👋' }
  if (h < 17) return { text: `God eftermiddag, ${name}`, emoji: '🌤️' }
  if (h < 21) return { text: `God kväll, ${name}`, emoji: '🌆' }
  return { text: `God natt snart, ${name}`, emoji: '🌙' }
}

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

function getBillUrgencyStyle(bill: Bill) {
  if (bill.status === 'akut') return { color: '#FF4B6E', bg: 'rgba(255,75,110,0.1)', label: 'AKUT' }
  return { color: '#F5A623', bg: 'rgba(245,166,35,0.1)', label: 'SNART' }
}

export default function HemClient({ member, bills, events, tasks: initialTasks, today }: Props) {
  const supabase = createClient()
  const [tasks, setTasks] = useState(initialTasks)
  const [paidBills, setPaidBills] = useState<Set<string>>(new Set())

  const greeting = getGreeting(member.name)
  const akutBills = bills.filter(b => b.status === 'akut' && !paidBills.has(b.id))
  const snartBills = bills.filter(b => b.status === 'snart' && !paidBills.has(b.id))

  async function markPaid(bill: Bill) {
    setPaidBills(prev => new Set([...prev, bill.id]))
    await supabase.from('bills').update({ status: 'betald', paid_at: new Date().toISOString() }).eq('id', bill.id)
    bloom('Betald! ✅', `${bill.title} är markerad som betald`)
  }

  async function toggleTask(task: Task) {
    const newStatus = task.status === 'todo' ? 'done' : 'todo'
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    await supabase.from('tasks').update({
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null
    }).eq('id', task.id)
    if (newStatus === 'done') bloom(`${task.emoji} Klar!`, `+${task.points_value} poäng`)
  }

  const doneTasks = tasks.filter(t => t.status === 'done').length
  const totalTasks = tasks.length

  return (
    <div className="page-in max-w-xl mx-auto px-4 pt-14 pb-4">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-100px] right-[-80px] w-96 h-96 rounded-full opacity-10"
          style={{ background: '#7B6EFF', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[20%] left-[-80px] w-72 h-72 rounded-full opacity-[0.08]"
          style={{ background: '#C67BFF', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: '#555570' }}>
              {member.family_workspace.name}
            </div>
            <h1 className="text-2xl font-extrabold leading-tight" style={{ color: '#F2F2FF', letterSpacing: '-0.5px' }}>
              {greeting.text} {greeting.emoji}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#9898B8' }}>{formatDate(today)}</p>
          </div>
          <Avatar name={member.name} color={member.avatar_color} />
        </div>

        {/* AKUT bills hero */}
        {akutBills.length > 0 && (
          <div className="rounded-2xl p-5"
            style={{ background: 'linear-gradient(135deg, #2a0d14, #1a0a0f)', border: '1px solid rgba(255,75,110,0.3)' }}>
            <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#FF4B6E' }}>
              🚨 {akutBills.length} akut{akutBills.length > 1 ? 'a' : ''} räkning{akutBills.length > 1 ? 'ar' : ''}
            </div>
            {akutBills.map(bill => (
              <div key={bill.id} className="flex items-center justify-between mb-3 last:mb-0">
                <div>
                  <div className="font-bold text-[15px]" style={{ color: '#F2F2FF' }}>{bill.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#9898B8' }}>
                    {bill.sender && `${bill.sender} · `}
                    {bill.amount && `${bill.amount.toLocaleString('sv-SE')} kr`}
                  </div>
                </div>
                <button onClick={() => markPaid(bill)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ background: '#FF4B6E' }}>
                  Betala
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Snart bills */}
        {snartBills.length > 0 && (
          <Section title="Snart förfaller" emoji="⏰">
            {snartBills.slice(0, 3).map(bill => {
              const s = getBillUrgencyStyle(bill)
              return (
                <div key={bill.id} className="flex items-center justify-between py-3 border-b last:border-0"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: '#F2F2FF' }}>{bill.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#9898B8' }}>
                      {bill.due_date && `Förfaller ${bill.due_date}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {bill.amount && <span className="text-sm font-bold" style={{ color: s.color }}>{bill.amount.toLocaleString('sv-SE')} kr</span>}
                    <button onClick={() => markPaid(bill)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                      style={{ background: s.bg, color: s.color }}>
                      Betald
                    </button>
                  </div>
                </div>
              )
            })}
          </Section>
        )}

        {/* No bills all clear */}
        {akutBills.length === 0 && snartBills.length === 0 && (
          <div className="rounded-2xl px-5 py-4 flex items-center gap-3"
            style={{ background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)' }}>
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-bold text-sm" style={{ color: '#00C896' }}>Inga brådskande räkningar!</div>
              <div className="text-xs" style={{ color: '#9898B8' }}>Bra jobbat — allt är under kontroll</div>
            </div>
          </div>
        )}

        {/* Today's events */}
        {events.length > 0 && (
          <Section title="Idag" emoji="📅">
            {events.map(ev => (
              <div key={ev.id} className="flex items-start gap-3 py-3 border-b last:border-0"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="px-2.5 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(56,182,255,0.12)', color: '#38B6FF', minWidth: 52, textAlign: 'center' }}>
                  {ev.start_time ? formatTime(ev.start_time) : '–'}
                </div>
                <div className="font-semibold text-sm pt-0.5" style={{ color: '#F2F2FF' }}>{ev.title}</div>
              </div>
            ))}
          </Section>
        )}

        {/* Tasks */}
        {tasks.length > 0 && (
          <Section title={`Dina uppgifter ${doneTasks > 0 ? `· ${doneTasks} av ${totalTasks} klara` : ''}`} emoji="✅">
            {tasks.map(task => (
              <button key={task.id} onClick={() => toggleTask(task)}
                className="w-full flex items-center gap-3 py-3 border-b last:border-0 text-left transition-opacity"
                style={{ borderColor: 'rgba(255,255,255,0.06)', opacity: task.status === 'done' ? 0.5 : 1 }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: task.status === 'done' ? '#00C896' : 'transparent',
                    border: task.status === 'done' ? 'none' : '2px solid rgba(255,255,255,0.2)',
                  }}>
                  {task.status === 'done' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <span className="text-sm font-medium" style={{ color: '#F2F2FF', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                  {task.emoji} {task.title}
                </span>
              </button>
            ))}
          </Section>
        )}

        {/* Quick actions */}
        <Section title="Snabbåtgärder" emoji="⚡">
          <div className="grid grid-cols-2 gap-3 pt-1">
            <QuickAction href="/arkiv?scan=1" emoji="📷" label="Skanna" color="#7B6EFF" />
            <QuickAction href="/ekonomi" emoji="💳" label="Räkningar" color="#F5A623" />
            <QuickAction href="/kalender" emoji="📅" label="Kalender" color="#38B6FF" />
            <QuickAction href="/uppgifter" emoji="✅" label="Uppgifter" color="#00C896" />
          </div>
        </Section>

        {/* Invite code */}
        <div className="text-center pb-2">
          <p className="text-xs" style={{ color: '#555570' }}>
            Familjekod: <span className="font-mono font-bold" style={{ color: '#9898B8' }}>{member.family_workspace.invite_code}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-white text-base"
      style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function Section({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl px-5 py-4" style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.07)' }}>
      <h2 className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: '#555570' }}>
        {emoji} {title}
      </h2>
      {children}
    </div>
  )
}

function QuickAction({ href, emoji, label, color }: { href: string; emoji: string; label: string; color: string }) {
  return (
    <Link href={href}
      className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl transition-all"
      style={{ background: `${color}14`, border: `1px solid ${color}30` }}>
      <span className="text-2xl">{emoji}</span>
      <span className="text-xs font-bold" style={{ color }}>{label}</span>
    </Link>
  )
}
