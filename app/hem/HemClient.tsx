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

type Module = {
  href: string
  icon: string
  name: string
  value: string
  accent: string
  accentL: string
  wide?: boolean
  badge?: string
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

  const modules: Module[] = [
    {
      href: '/ekonomi', icon: '💰', name: 'Ekonomi',
      value: 'Översikt & budget',
      accent: '#2D5A27', accentL: '#D4E8CC', wide: true,
    },
    {
      href: '/mat', icon: '🥦', name: 'Mat & Hälsa',
      value: 'Veckoschema',
      accent: '#7AAB6E', accentL: '#D4E8CC',
    },
    {
      href: '/kalender', icon: '📅', name: 'Kalender',
      value: 'Veckovy',
      accent: '#3A6B8A', accentL: '#C8DDE8',
    },
    {
      href: '/uppgifter', icon: '✅', name: 'Uppgifter',
      value: todoCount > 0 ? `${todoCount} att göra` : 'Inga idag 🎉',
      accent: '#8B6914', accentL: '#EAD9AA',
    },
    {
      href: '/arkiv', icon: '📁', name: 'Arkiv',
      value: 'Dina dokument',
      accent: '#556B2F', accentL: '#D0DDB8',
    },
    {
      href: '/projekt', icon: '📈', name: 'Projekt',
      value: '4 aktiva',
      accent: '#5C4A7A', accentL: '#D8D0EC',
    },
    {
      href: '/mail', icon: '📬', name: 'Mail',
      value: 'Koppla Gmail',
      accent: '#3A6B8A', accentL: '#C8DDE8',
    },
    {
      href: '/aktiviteter', icon: '🏃', name: 'Aktiviteter',
      value: 'Träning & rörelse',
      accent: '#8B3A52', accentL: '#EDD0D8', badge: 'NY',
    },
    {
      href: '/studera', icon: '📚', name: 'Studera',
      value: 'CSN & kurser',
      accent: '#5C4A7A', accentL: '#D8D0EC', badge: 'NY',
    },
    {
      href: '/paddan', icon: '🐸', name: 'Paddan & Abilia',
      value: 'Välmående & stöd',
      accent: '#556B2F', accentL: '#D0DDB8', wide: true, badge: 'NY',
    },
  ]

  return (
    <div>
      {/* ── Sky hero ─────────────────────────────────────────────────────── */}
      <div style={{
        height: 200,
        borderRadius: '0 0 32px 32px',
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(180deg, #A8C8DC 0%, #C0D8C8 45%, #6A9A50 72%, #2D5A27 100%)',
        flexShrink: 0,
      }}>
        {/* Clouds */}
        <div style={{ position:'absolute', top:22, left:20, width:72, height:22, borderRadius:60, background:'white', opacity:0.7, filter:'blur(1.5px)' }} />
        <div style={{ position:'absolute', top:18, left:64, width:44, height:16, borderRadius:60, background:'white', opacity:0.5, filter:'blur(1.5px)' }} />
        <div style={{ position:'absolute', top:38, right:52, width:60, height:20, borderRadius:60, background:'white', opacity:0.65, filter:'blur(1.5px)' }} />
        <div style={{ position:'absolute', top:50, right:88, width:36, height:14, borderRadius:60, background:'white', opacity:0.4, filter:'blur(1.5px)' }} />
        <div style={{ position:'absolute', top:28, left:'45%', width:52, height:18, borderRadius:60, background:'white', opacity:0.55, filter:'blur(1.5px)' }} />

        {/* Tree silhouette */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, height:70,
          background:'linear-gradient(to top, #1A3A14 0%, transparent 100%)',
        }} />

        {/* Text overlay */}
        <div style={{ position:'absolute', top:20, left:20, right:20 }}>
          <p style={{ fontSize:12, color:'rgba(20,40,20,0.65)', fontWeight:500, marginBottom:4 }}>
            {getGreeting()}, {familyName}
          </p>
          <p style={{ fontSize:26, color:'#182A16', fontWeight:600, fontFamily:'var(--serif)', lineHeight:1.1 }}>
            {capitalize(getDayLabel())}
          </p>
        </div>

        {/* Status badge bottom-right */}
        <div style={{
          position:'absolute', bottom:16, right:16,
          background:'rgba(255,255,255,0.82)',
          backdropFilter:'blur(8px)',
          WebkitBackdropFilter:'blur(8px)',
          borderRadius:999,
          padding:'5px 12px',
          display:'flex', alignItems:'center', gap:5,
        }}>
          <span style={{ fontSize:10, color:'#2D5A27', fontWeight:700 }}>
            {urgentBills.length === 0 ? '✓ Allt ser bra ut' : `${urgentBills.length} räkningar att betala`}
          </span>
        </div>
      </div>

      {/* ── Content below hero ───────────────────────────────────────────── */}
      <div style={{ padding:'14px 16px 100px' }}>

        {/* Urgent banner */}
        {urgentBills.length > 0 && (
          <Link href="/rakningar">
            <div style={{
              background:'#EDD5C4',
              border:'1px solid rgba(160,82,45,0.2)',
              borderRadius:20,
              padding:'14px 16px',
              display:'flex', alignItems:'center', gap:10,
              marginBottom:12,
            }}>
              <span style={{ fontSize:22 }}>💳</span>
              <span style={{ fontSize:14, fontWeight:600, color:'#A0522D', flex:1 }}>
                Räkningar att betala
              </span>
              {urgentTotal > 0 && (
                <span style={{ fontSize:14, fontWeight:700, color:'#A0522D' }}>
                  {urgentTotal.toLocaleString('sv-SE')} kr
                </span>
              )}
            </div>
          </Link>
        )}

        {/* Module grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {modules.map(mod => (
            <Link key={mod.href} href={mod.href}
              style={{
                gridColumn: mod.wide ? '1 / -1' : undefined,
                display:'flex', flexDirection:'column',
                background:'var(--card)',
                border:`1px solid ${mod.accentL}`,
                borderRadius:20,
                boxShadow:'var(--shadow)',
                minHeight:120,
                padding:'18px 14px',
                position:'relative',
                textDecoration:'none',
              }}>
              {mod.badge && (
                <span style={{
                  position:'absolute', top:10, right:10,
                  fontSize:9, fontWeight:800, letterSpacing:'0.08em',
                  color:mod.accent, background:mod.accentL,
                  borderRadius:999, padding:'2px 7px',
                }}>
                  {mod.badge}
                </span>
              )}
              <span style={{ fontSize:28, lineHeight:1, marginBottom:10 }}>{mod.icon}</span>
              <span style={{ fontSize:14, fontWeight:700, color:'var(--ink)', marginBottom:4, lineHeight:1.2 }}>
                {mod.name}
              </span>
              <span style={{ fontSize:12, color:mod.accent, fontWeight:500 }}>
                {mod.value}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
