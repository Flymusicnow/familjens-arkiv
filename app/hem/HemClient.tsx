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
  if (h < 10) return `God morgon, ${name}`
  if (h < 13) return `Hej, ${name}`
  if (h < 17) return `God eftermiddag, ${name}`
  if (h < 21) return `God kväll, ${name}`
  return `God natt snart, ${name}`
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
    { href: '/rakningar',   name: 'Räkningar',   emoji: '💳', color: '#C46040', bg: 'rgba(196,96,64,0.08)',   status: akutCount > 0 ? `${akutCount} akuta` : snartCount > 0 ? `${snartCount} snart` : 'Allt klart ✅' },
    { href: '/ekonomi',     name: 'Ekonomi',     emoji: '💰', color: '#5A9A50', bg: 'rgba(90,154,80,0.08)',   status: '61 667 kr väntar' },
    { href: '/mail',        name: 'Mail',        emoji: '📬', color: '#4A8CB4', bg: 'rgba(74,140,180,0.08)',  status: 'Koppla Gmail' },
    { href: '/projekt',     name: 'Projekt',     emoji: '📈', color: '#6450B4', bg: 'rgba(100,80,180,0.08)', status: '4 aktiva' },
    { href: '/kalender',    name: 'Kalender',    emoji: '📅', color: '#B45070', bg: 'rgba(180,80,112,0.08)', status: 'Veckovy' },
    { href: '/mat',         name: 'Mat & Hälsa', emoji: '🥦', color: '#6AA860', bg: 'rgba(106,168,96,0.08)', status: 'Veckoschema' },
    { href: '/uppgifter',   name: 'Uppgifter',   emoji: '✅', color: '#9A7830', bg: 'rgba(154,120,48,0.08)', status: todoCount > 0 ? `${todoCount} att göra` : 'Inga idag 🎉' },
    { href: '/arkiv',       name: 'Arkiv',       emoji: '📁', color: '#907060', bg: 'rgba(144,112,96,0.08)', status: 'Dina dokument' },
    { href: '/aktiviteter', name: 'Aktiviteter', emoji: '🏃', color: '#6AA860', bg: 'rgba(106,168,96,0.08)', status: 'Träning & rörelse' },
    { href: '/studera',     name: 'Studera',     emoji: '📚', color: '#4A8CB4', bg: 'rgba(74,140,180,0.08)', status: 'CSN & kurser' },
    { href: '/paddan',      name: 'Paddan',      emoji: '🐸', color: '#3A8878', bg: 'rgba(58,136,120,0.08)', status: 'Välmående' },
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
    <div className="min-h-screen px-4 pt-6 pb-28 md:px-8 md:pb-8">

      {/* Sky hero card */}
      <div className="rounded-3xl overflow-hidden mb-6 relative"
        style={{
          background: 'linear-gradient(160deg, #87CEEB 0%, #4A8CB4 45%, #2D6A9F 100%)',
          minHeight: 180,
        }}>
        {/* Clouds */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute rounded-full opacity-70"
            style={{ background: 'white', width: 80, height: 32, top: 28, left: 24, filter: 'blur(2px)' }} />
          <div className="absolute rounded-full opacity-50"
            style={{ background: 'white', width: 48, height: 20, top: 24, left: 72, filter: 'blur(2px)' }} />
          <div className="absolute rounded-full opacity-60"
            style={{ background: 'white', width: 64, height: 26, top: 44, right: 48, filter: 'blur(2px)' }} />
          <div className="absolute rounded-full opacity-40"
            style={{ background: 'white', width: 40, height: 16, top: 56, right: 80, filter: 'blur(2px)' }} />
          {/* Ground */}
          <div className="absolute bottom-0 left-0 right-0 h-14 rounded-t-[50%] opacity-30"
            style={{ background: '#2D6A40', transform: 'scaleX(1.2)' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 pt-8">
          <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {getDayLabel()}
          </p>
          <h1 className="text-[28px] font-bold tracking-tight leading-tight" style={{ color: 'white' }}>
            {getGreeting(member.name)} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {member.family_workspace?.name || 'Familjens Arkiv'}
          </p>
        </div>
      </div>

      {/* Urgent bills banner */}
      {bills.filter(b => b.status === 'akut' && !paidBills.has(b.id)).length > 0 && (
        <div className="rounded-2xl p-5 mb-5"
          style={{ background: 'rgba(196,96,64,0.08)', border: '1px solid rgba(196,96,64,0.2)' }}>
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase mb-4"
            style={{ color: '#C46040' }}>🚨 Akuta räkningar</p>
          {bills.filter(b => b.status === 'akut' && !paidBills.has(b.id)).map(bill => (
            <div key={bill.id} className="flex items-center justify-between mb-3 last:mb-0">
              <div>
                <p className="font-semibold text-sm" style={{ color: '#1A2018' }}>{bill.title}</p>
                {(bill.sender || bill.amount) && (
                  <p className="text-xs mt-0.5" style={{ color: '#8A9888' }}>
                    {bill.sender && `${bill.sender} · `}
                    {bill.amount && `${bill.amount.toLocaleString('sv-SE')} kr`}
                  </p>
                )}
              </div>
              <button onClick={() => markPaid(bill)}
                className="px-4 h-10 rounded-xl text-sm font-bold text-white flex-shrink-0"
                style={{ background: '#C46040' }}>
                Betala
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Module grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {modules.map((mod, i) => (
          <Link key={mod.href} href={mod.href}
            className="flex flex-col items-center justify-center rounded-2xl p-5 text-center transition-transform duration-150 active:scale-[0.96]"
            style={{
              background: '#FFFFFF',
              border: `1px solid ${mod.color}20`,
              minHeight: 132,
            }}>
            <span className="text-3xl mb-2">{mod.emoji}</span>
            <span className="text-[14px] font-bold tracking-tight mb-1.5" style={{ color: '#1A2018' }}>
              {mod.name}
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: mod.bg, color: mod.color }}>
              {mod.status}
            </span>
          </Link>
        ))}
      </div>

      {/* Today's tasks */}
      {tasks.filter(t => t.status === 'todo').length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase px-5 pt-4 pb-3"
            style={{ color: '#8A9888' }}>Idag</p>
          {tasks.filter(t => t.status === 'todo').slice(0, 3).map((task, i, arr) => (
            <button key={task.id} onClick={() => toggleTask(task)}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
              style={{
                borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                minHeight: 52,
              }}>
              <div className="w-5 h-5 rounded-full flex-shrink-0"
                style={{ border: '2px solid rgba(0,0,0,0.15)' }} />
              <span className="text-sm font-medium" style={{ color: '#1A2018' }}>
                {task.emoji} {task.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
