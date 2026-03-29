'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import { bloom } from '@/components/Bloom'
import { HeroShapes } from '@/components/ui/shape-landing-hero'
import type { FamilyMember, Bill, Task } from '@/lib/types'

interface Props {
  member: FamilyMember & { family_workspace: { name: string; invite_code: string } }
  bills: Bill[]
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

export default function HemClient({ member, bills, tasks: initialTasks, today }: Props) {
  const supabase = createClient()
  const [tasks, setTasks] = useState(initialTasks)
  const [paidBills, setPaidBills] = useState<Set<string>>(new Set())

  const greeting = getGreeting(member.name)
  const akutCount = bills.filter(b => b.status === 'akut' && !paidBills.has(b.id)).length
  const snartCount = bills.filter(b => b.status === 'snart' && !paidBills.has(b.id)).length
  const todoCount = tasks.filter(t => t.status === 'todo').length

  const modules = [
    { href: '/rakningar', name: 'Räkningar',   emoji: '💳', color: '#FF4B6E', status: akutCount > 0 ? `🚨 ${akutCount} akuta` : snartCount > 0 ? `⏰ ${snartCount} snart` : '✅ Allt klart' },
    { href: '/projekt',   name: 'Projekt',      emoji: '📈', color: '#7B6EFF', status: 'Dina ventures' },
    { href: '/mail',      name: 'Mail',         emoji: '📬', color: '#38B6FF', status: 'Vidarebefordra post' },
    { href: '/arkiv',     name: 'Arkiv',        emoji: '🗂️', color: '#F5A623', status: 'Dina dokument' },
    { href: '/uppgifter', name: 'Uppgifter',    emoji: '✅', color: '#9D93FF', status: todoCount > 0 ? `${todoCount} att göra` : '🎉 Allt klart' },
    { href: '/ekonomi',   name: 'Ekonomi',      emoji: '💰', color: '#00C896', status: 'Din ekonomi' },
    { href: '/kalender',  name: 'Kalender',     emoji: '📅', color: '#C67BFF', status: 'Din kalender' },
    { href: '/mat',       name: 'Mat & Hälsa',  emoji: '🥦', color: '#00C896', status: 'Veckomatsedel' },
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
    <div className="relative min-h-screen" style={{ background: '#0D0D1A', overflowX: 'clip' }}>
      <HeroShapes />

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute w-[500px] h-[500px] rounded-full"
          style={{ top: '-100px', right: '-100px', background: 'radial-gradient(circle, rgba(123,110,255,0.14) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full"
          style={{ bottom: '5%', left: '-80px', background: 'radial-gradient(circle, rgba(255,75,110,0.1) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 px-6 pt-10 pb-8 max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8 md:mb-10"
        >
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase mb-1"
              style={{ color: 'rgba(255,255,255,0.25)' }}>
              {member.family_workspace.name}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight"
              style={{ color: '#F2F2FF', letterSpacing: '-0.6px' }}>
              {greeting.text} {greeting.emoji}
            </h1>
          </div>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${member.avatar_color}, ${member.avatar_color}99)` }}>
            {member.name.charAt(0).toUpperCase()}
          </div>
        </motion.div>

        {/* Module grid — 2 col mobile, 3 col desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-8">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.href}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <motion.div whileTap={{ scale: 0.96 }} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                <Link
                  href={mod.href}
                  className="relative flex flex-col items-center justify-center gap-3 rounded-3xl overflow-hidden"
                  style={{
                    padding: '28px 16px',
                    minHeight: 160,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: `0 0 40px ${mod.color}18, 0 4px 20px rgba(0,0,0,0.4)`,
                    textDecoration: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}>
                  {/* Color glow blob */}
                  <div className="absolute inset-0 opacity-[0.09] pointer-events-none"
                    style={{ background: `radial-gradient(circle at 50% 40%, ${mod.color}, transparent 68%)`, borderRadius: 'inherit' }} />

                  <span className="relative z-10 text-5xl leading-none"
                    style={{ filter: `drop-shadow(0 4px 12px ${mod.color}60)` }}>
                    {mod.emoji}
                  </span>

                  <div className="relative z-10 text-center">
                    <div className="text-[16px] font-bold tracking-tight leading-snug" style={{ color: '#F2F2FF' }}>
                      {mod.name}
                    </div>
                    <div className="mt-2 inline-block text-[11px] font-semibold px-3 py-1 rounded-full"
                      style={{
                        background: `${mod.color}20`,
                        color: mod.color,
                        border: `1px solid ${mod.color}40`,
                      }}>
                      {mod.status}
                    </div>
                  </div>
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Akut bills alert */}
        {bills.filter(b => b.status === 'akut' && !paidBills.has(b.id)).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl p-5 mb-4 max-w-xl"
            style={{ background: 'linear-gradient(135deg, rgba(255,75,110,0.12), rgba(255,75,110,0.04))', border: '1px solid rgba(255,75,110,0.25)' }}>
            <div className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: '#FF4B6E' }}>
              🚨 Akuta räkningar
            </div>
            {bills.filter(b => b.status === 'akut' && !paidBills.has(b.id)).map(bill => (
              <div key={bill.id} className="flex items-center justify-between mb-3 last:mb-0">
                <div>
                  <div className="font-semibold text-[14px]" style={{ color: '#F2F2FF' }}>{bill.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {bill.sender && `${bill.sender} · `}
                    {bill.amount && `${bill.amount.toLocaleString('sv-SE')} kr`}
                  </div>
                </div>
                <button onClick={() => markPaid(bill)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white flex-shrink-0"
                  style={{ background: '#FF4B6E', minHeight: 40 }}>
                  Betala
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {/* Today's tasks */}
        {tasks.filter(t => t.status === 'todo').length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="rounded-2xl px-5 py-4 max-w-xl"
            style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Idag
            </div>
            {tasks.filter(t => t.status === 'todo').slice(0, 3).map(task => (
              <button key={task.id} onClick={() => toggleTask(task)}
                className="w-full flex items-center gap-3 py-3 border-b last:border-0 text-left"
                style={{ borderColor: 'rgba(255,255,255,0.05)', minHeight: 48 }}>
                <div className="w-5 h-5 rounded-full flex-shrink-0"
                  style={{ border: '2px solid rgba(255,255,255,0.18)' }} />
                <span className="text-sm font-medium" style={{ color: '#F2F2FF' }}>
                  {task.emoji} {task.title}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Camera FAB */}
      <Link href="/arkiv?scan=1"
        className="fixed bottom-24 right-5 md:bottom-8 md:right-8 w-13 h-13 rounded-full flex items-center justify-center text-xl z-40"
        style={{
          width: 52, height: 52,
          background: 'linear-gradient(135deg, #7B6EFF, #9D93FF)',
          boxShadow: '0 4px 24px rgba(123,110,255,0.45)',
        }}>
        📷
      </Link>
    </div>
  )
}
