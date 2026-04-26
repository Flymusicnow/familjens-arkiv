'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { bloom } from '@/components/Bloom'
import type { FamilyMember, Bill, Task } from '@/lib/types'

const HERO_PHOTO = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=85&auto=format'

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
  bg?: string
  badge?: string
  wide?: boolean
  cardType: 'stat' | 'status' | 'quick'
}

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
      bg: urgentBills.length > 0 ? '#FFF8F6' : undefined,
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
    <div>
      {/* Hero banner */}
      <div
        className="mx-4 mt-4 md:mx-6 md:mt-6 rounded-xl overflow-hidden relative flex-shrink-0"
        style={{ height: 'clamp(160px, 20vw, 200px)' }}
      >
        <Image
          src={HERO_PHOTO}
          alt="Naturlandskap"
          fill
          priority
          style={{ objectFit: 'cover', objectPosition: 'center 55%' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.45) 0%, transparent 60%)',
        }} />
        <div style={{ position: 'absolute', top: 20, left: 22, right: 22 }}>
          <p style={{
            fontSize: 12, color: 'rgba(255,255,255,0.82)', fontWeight: 500,
            marginBottom: 6, textShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}>
            {getGreeting()}, {familyName}
          </p>
          <p style={{
            fontSize: 28, color: 'white', fontWeight: 600,
            fontFamily: 'var(--serif)', lineHeight: 1.15,
            textShadow: '0 1px 8px rgba(0,0,0,0.35)',
          }}>
            {capitalize(getDayLabel())}
          </p>
        </div>
        <div style={{
          position: 'absolute', bottom: 14, right: 14,
          background: urgentBills.length === 0 ? 'rgba(76,175,80,0.88)' : 'rgba(255,112,67,0.88)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: 999,
          padding: '4px 12px',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{ fontSize: 11, color: 'white', fontWeight: 700 }}>
            {urgentBills.length === 0 ? '✓ Allt ser bra ut' : `${urgentBills.length} räkningar att betala`}
          </span>
        </div>
      </div>

      {/* Urgent bills banner */}
      {urgentBills.length > 0 && (
        <div className="mx-4 mt-3 md:mx-6">
          <Link href="/rakningar" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#EDD5C4',
              border: '1px solid rgba(160,82,45,0.2)',
              borderRadius: 14,
              padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>💳</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#A0522D', flex: 1 }}>
                Räkningar att betala
              </span>
              {urgentTotal > 0 && (
                <span style={{ fontSize: 14, fontWeight: 700, color: '#A0522D' }}>
                  {urgentTotal.toLocaleString('sv-SE')} kr
                </span>
              )}
            </div>
          </Link>
        </div>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 p-4 md:p-6 pb-28 md:pb-10">
        {cards.map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="card-lift"
            style={{
              gridColumn: card.wide ? '1 / -1' : undefined,
              display: 'flex',
              flexDirection: 'column',
              background: card.bg ?? 'var(--bg-card)',
              borderRadius: 14,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
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
                color: 'var(--text-heading)', background: 'var(--nav-active-bg)',
                borderRadius: 999, padding: '2px 7px',
              }}>
                {card.badge}
              </span>
            )}
            <span style={{ fontSize: 22, lineHeight: 1, marginBottom: 8 }}>{card.emoji}</span>
            <span style={{
              fontSize: 15, fontWeight: 700, color: 'var(--text-primary)',
              marginBottom: 3, lineHeight: 1.2,
            }}>
              {card.title}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {card.subtitle}
            </span>
            {card.progress !== undefined && (
              <div style={{
                marginTop: 12, width: '100%', height: 5,
                background: 'var(--border)', borderRadius: 3, overflow: 'hidden',
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
                  fontSize: 28, fontWeight: 700, color: 'var(--text-heading)', lineHeight: 1,
                }}>
                  {card.metric}
                </span>
                {card.trend && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {card.trend}
                  </span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
