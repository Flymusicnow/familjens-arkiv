'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { bloom } from '@/components/Bloom'
import type { FamilyMember, Bill, Task } from '@/lib/types'

interface Props {
  member: FamilyMember & { family_workspace: { name: string; invite_code: string } }
  bills: Bill[]
  tasks: Task[]
  today: string
}

function getGreeting(name: string): string {
  const h = new Date().getHours()
  if (h < 5)  return `God natt, ${name}`
  if (h < 10) return `God morgon, ${name} ☀️`
  if (h < 13) return `Hej, ${name} 👋`
  if (h < 17) return `God eftermiddag, ${name}`
  if (h < 21) return `God kväll, ${name} 🌆`
  return `God natt snart, ${name} 🌙`
}

function getDayLabel(): string {
  return new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function HemClient({ member, bills, tasks: initialTasks, today }: Props) {
  const supabase = createClient()
  const [tasks, setTasks] = useState(initialTasks)
  const [paidBills, setPaidBills] = useState<Set<string>>(new Set())

  const akutCount = bills.filter(b => b.status === 'akut' && !paidBills.has(b.id)).length
  const snartCount = bills.filter(b => b.status === 'snart' && !paidBills.has(b.id)).length
  const todoCount = tasks.filter(t => t.status === 'todo').length

  const modules = [
    { href: '/rakningar', name: 'Räkningar',   emoji: '💳', color: '#F87171', status: akutCount > 0 ? `${akutCount} akuta` : snartCount > 0 ? `${snartCount} snart` : 'Allt klart ✅' },
    { href: '/ekonomi',   name: 'Ekonomi',     emoji: '💰', color: '#34D399', status: '61 667 kr väntar' },
    { href: '/mail',      name: 'Mail',        emoji: '📬', color: '#60A5FA', status: 'Koppla Gmail' },
    { href: '/projekt',   name: 'Projekt',     emoji: '📈', color: '#818CF8', status: '4 aktiva' },
    { href: '/kalender',  name: 'Kalender',    emoji: '📅', color: '#A78BFA', status: 'Veckovy' },
    { href: '/mat',       name: 'Mat & Hälsa', emoji: '🥦', color: '#34D399', status: 'Veckoschema' },
    { href: '/uppgifter', name: 'Uppgifter',   emoji: '✅', color: '#FBBF24', status: todoCount > 0 ? `${todoCount} att göra` : 'Inga idag 🎉' },
    { href: '/arkiv',     name: 'Arkiv',       emoji: '📁', color: '#9CA3AF', status: 'Dina dokument' },
  ]

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

  return (
    <div className="min-h-screen px-4 pt-8 pb-28 md:px-6">

      {/* Greeting */}
      <div className="mb-8">
        <p className="text-sm font-medium mb-1" style={{ color: '#6B6B7B' }}>
          {getDayLabel()}
        </p>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'white' }}>
          {getGreeting(member.name)}
        </h1>
      </div>

      {/* Module grid — 2 col, fills screen width */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {modules.map((mod, i) => (
          <Link key={mod.href} href={mod.href}
            className="relative flex flex-col items-center justify-center rounded-3xl p-5 text-center overflow-hidden transition-transform duration-150 active:scale-[0.96]"
            style={{
              background: '#1A1A1A',
              border: `1px solid ${mod.color}25`,
              boxShadow: `0 0 32px ${mod.color}12`,
              minHeight: i === 0 ? 140 : 148,
              gridColumn: i === 0 ? 'span 2' : undefined,
            }}>
            {/* Color glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(circle at 50% 35%, ${mod.color}18, transparent 65%)` }} />

            <span className="text-4xl mb-3 relative z-10">{mod.emoji}</span>
            <span className="text-base font-bold relative z-10 tracking-tight"
              style={{ color: 'white' }}>
              {mod.name}
            </span>
            <span className="mt-2 text-[11px] font-semibold px-3 py-1 rounded-full relative z-10"
              style={{ background: `${mod.color}20`, color: mod.color }}>
              {mod.status}
            </span>
          </Link>
        ))}
      </div>

      {/* Urgent bills alert */}
      {bills.filter(b => b.status === 'akut' && !paidBills.has(b.id)).length > 0 && (
        <div className="rounded-2xl p-5 mb-4"
          style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase mb-4"
            style={{ color: '#F87171' }}>🚨 Akuta räkningar</p>
          {bills.filter(b => b.status === 'akut' && !paidBills.has(b.id)).map(bill => (
            <div key={bill.id} className="flex items-center justify-between mb-3 last:mb-0">
              <div>
                <p className="font-semibold text-sm" style={{ color: 'white' }}>{bill.title}</p>
                {(bill.sender || bill.amount) && (
                  <p className="text-xs mt-0.5" style={{ color: '#6B6B7B' }}>
                    {bill.sender && `${bill.sender} · `}
                    {bill.amount && `${bill.amount.toLocaleString('sv-SE')} kr`}
                  </p>
                )}
              </div>
              <button onClick={() => markPaid(bill)}
                className="px-4 h-10 rounded-xl text-sm font-bold text-white flex-shrink-0"
                style={{ background: '#F87171' }}>
                Betala
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Today's tasks */}
      {tasks.filter(t => t.status === 'todo').length > 0 && (
        <div className="rounded-2xl px-5 py-4"
          style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase mb-4"
            style={{ color: '#6B6B7B' }}>Idag</p>
          {tasks.filter(t => t.status === 'todo').slice(0, 3).map((task, i, arr) => (
            <button key={task.id} onClick={() => toggleTask(task)}
              className="w-full flex items-center gap-3 py-3.5 text-left"
              style={{
                borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                minHeight: 52,
              }}>
              <div className="w-5 h-5 rounded-full flex-shrink-0"
                style={{ border: '2px solid rgba(255,255,255,0.15)' }} />
              <span className="text-sm font-medium" style={{ color: 'white' }}>
                {task.emoji} {task.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
