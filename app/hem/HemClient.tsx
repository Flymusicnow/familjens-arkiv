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

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 5)  return 'God natt'
  if (h < 10) return 'God morgon'
  if (h < 13) return 'Hej'
  if (h < 17) return 'God eftermiddag'
  if (h < 21) return 'God kväll'
  return 'God natt'
}

function getDayLabel(): string {
  return new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function progressColor(pct: number): string {
  if (pct > 70) return 'var(--accent-green)'
  if (pct > 40) return 'var(--accent-yellow)'
  return 'var(--accent-red)'
}

type DashCard = {
  href: string
  emoji: string
  title: string
  subtitle: string
  progress?: number
  metric?: string
  trend?: string
  urgent?: boolean
  badge?: string
  wide?: boolean
  cardType: 'stat' | 'status' | 'quick'
}

const GLASS = {
  background: 'rgba(10, 15, 25, 0.45)',
  backdropFilter: 'saturate(180%) blur(20px)',
  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
  border: '1px solid rgba(255,255,255,0.12)',
} as const

export default function HemClient({ member, bills, tasks: initialTasks, today }: Props) {
  const supabase = createClient()
  const [tasks, setTasks] = useState(initialTasks)
  const [paidBills, setPaidBills] = useState<Set<string>>(new Set())

  const akutBills = bills.filter(b => b.status === 'akut' && !paidBills.has(b.id))
  const snartBills = bills.filter(b => b.status === 'snart' && !paidBills.has(b.id))
  const urgentBills = [...akutBills, ...snartBills]
  const urgentTotal = urgentBills.reduce((s, b) => s + (b.amount ?? 0), 0)

  const todoCount = tasks.filter(t => t.status === 'todo').length
  const familyName = member.family_workspace?.name || member.name

  const ekonomiProgress = urgentBills.length === 0 ? 82 : Math.max(15, 82 - urgentBills.length * 18)

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
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    }).eq('id', task.id)
    if (newStatus === 'done') bloom(`${task.emoji} Klar!`, `+${task.points_value} poäng`)
  }

  const cards: DashCard[] = [
    {
      href: '/ekonomi', emoji: '💰', title: 'Ekonomi', subtitle: 'Översikt & budget',
      progress: ekonomiProgress, metric: '35.5k',
      trend: urgentBills.length > 0 ? `${urgentBills.length} räkn.` : '✓ OK',
      cardType: 'stat',
    },
    {
      href: '/mat', emoji: '🥗', title: 'Mat & Hälsa', subtitle: 'Veckoschema',
      progress: 62, metric: '8.2k',
      cardType: 'stat',
    },
    {
      href: '/kalender', emoji: '📅', title: 'Kalender', subtitle: 'Veckovy',
      progress: 75, metric: '+17k', trend: '/ 301k',
      cardType: 'stat',
    },
    {
      href: '/uppgifter', emoji: '✅', title: 'Uppgifter',
      subtitle: todoCount > 0 ? `${todoCount} att göra` : 'Inga idag 😎',
      cardType: 'status',
    },
    {
      href: '/arkiv', emoji: '📁', title: 'Arkiv', subtitle: 'Dina dokument',
      cardType: 'status',
    },
    {
      href: '/projekt', emoji: '📊', title: 'Projekt', subtitle: '4 aktiva',
      cardType: 'status',
    },
    {
      href: '/rakningar', emoji: '🧾', title: 'Räkningar',
      subtitle: urgentBills.length > 0 ? `${urgentBills.length} att betala` : 'Allt klart',
      urgent: urgentBills.length > 0,
      cardType: 'quick',
    },
    {
      href: '/studera', emoji: '📚', title: 'Studera', subtitle: 'CSN & kurser',
      badge: 'NY', cardType: 'quick',
    },
    {
      href: '/aktiviteter', emoji: '🎯', title: 'Aktiviteter', subtitle: 'Träning & rörelse',
      badge: 'NY', cardType: 'quick',
    },
    {
      href: '/paddan', emoji: '🐸', title: 'Paddan & Abilia', subtitle: 'Välmående & stöd',
      badge: 'NY', wide: true, cardType: 'quick',
    },
    {
      href: '/mail', emoji: '✉️', title: 'Mail', subtitle: 'Koppla Gmail',
      cardType: 'quick',
    },
  ]

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-28 md:px-8 md:pt-10 md:pb-10 lg:px-10 xl:px-12 xl:pt-10">
        {/* Greeting header */}
        <div className="pb-2">
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 500, marginBottom: 6 }}>
            {getGreeting()}, {familyName}
          </p>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 40px)', color: '#FFFFFF', fontWeight: 700,
            fontFamily: 'var(--serif)', lineHeight: 1.1,
          }}>
            {capitalize(getDayLabel())}
          </h1>
        </div>

        {/* Urgent bills banner */}
        {urgentBills.length > 0 && (
          <div className="mt-4">
            <Link href="/rakningar" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(160,82,45,0.35)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(160,82,45,0.50)',
                borderRadius: 14,
                padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 20 }}>💳</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#FFCBA8', flex: 1 }}>
                  Räkningar att betala
                </span>
                {urgentTotal > 0 && (
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#FFCBA8' }}>
                    {urgentTotal.toLocaleString('sv-SE')} kr
                  </span>
                )}
              </div>
            </Link>
          </div>
        )}

        {/* Card grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 xl:gap-6 pt-4 md:pt-6">
        {cards.map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="card-lift"
            style={{
              gridColumn: card.wide ? '1 / -1' : undefined,
              display: 'flex',
              flexDirection: 'column',
              ...(card.urgent
                ? {
                    background: 'rgba(255,112,67,0.20)',
                    backdropFilter: 'saturate(180%) blur(20px)',
                    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                    border: '1px solid rgba(255,112,67,0.40)',
                  }
                : GLASS),
              borderRadius: 14,
              boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
              minHeight: 140,
              padding: 16,
              position: 'relative',
              textDecoration: 'none',
            }}
          >
            {card.badge && (
              <span style={{
                position: 'absolute', top: 8, right: 8,
                fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                color: '#FFFFFF', background: 'rgba(255,255,255,0.18)',
                borderRadius: 999, padding: '2px 7px',
              }}>
                {card.badge}
              </span>
            )}
            <span style={{ fontSize: 22, lineHeight: 1, marginBottom: 8 }}>{card.emoji}</span>
            <span style={{
              fontSize: 15, fontWeight: 700, color: '#FFFFFF',
              marginBottom: 3, lineHeight: 1.2,
            }}>
              {card.title}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.60)' }}>
              {card.subtitle}
            </span>
            {card.progress !== undefined && (
              <div style={{
                marginTop: 12, width: '100%', height: 5,
                background: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${card.progress}%`,
                  background: progressColor(card.progress),
                  borderRadius: 3,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            )}
            {card.metric && (
              <div style={{
                marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 4,
              }}>
                <span style={{
                  fontSize: 28, fontWeight: 700, color: '#FFFFFF', lineHeight: 1,
                }}>
                  {card.metric}
                </span>
                {card.trend && (
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.60)' }}>
                    {card.trend}
                  </span>
                )}
              </div>
            )}
          </Link>
        ))}
        </div>
      </div>
    </div>
  )
}
