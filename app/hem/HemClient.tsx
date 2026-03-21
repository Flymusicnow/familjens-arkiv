'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { bloom } from '@/components/Bloom'
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
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([])
  const bgBlobsRef = useRef<(HTMLDivElement | null)[]>([])
  const [pressedIdx, setPressedIdx] = useState<number | null>(null)

  const greeting = getGreeting(member.name)
  const akutCount = bills.filter(b => b.status === 'akut' && !paidBills.has(b.id)).length
  const snartCount = bills.filter(b => b.status === 'snart' && !paidBills.has(b.id)).length
  const todoCount = tasks.filter(t => t.status === 'todo').length

  // 5 main screen cards
  const cards = [
    {
      href: '/rakningar',
      label: 'Räkningar',
      emoji: '💳',
      color: '#FF4B6E',
      glow: 'rgba(255,75,110,0.35)',
      status: akutCount > 0 ? `🚨 ${akutCount} akuta` : snartCount > 0 ? `⏰ ${snartCount} snart` : '✅ Allt klart',
      depth: 20,
      baseY: 18,
      borderRadius: '52px 36px 52px 36px',
    },
    {
      href: '/projekt',
      label: 'Projekt',
      emoji: '📈',
      color: '#00C896',
      glow: 'rgba(0,200,150,0.35)',
      status: 'Dina ventures',
      depth: 14,
      baseY: -10,
      borderRadius: '36px 56px 36px 56px',
    },
    {
      href: '/mail',
      label: 'Mail',
      emoji: '📬',
      color: '#38B6FF',
      glow: 'rgba(56,182,255,0.35)',
      status: 'Vidarebefordra post',
      depth: 18,
      baseY: 6,
      borderRadius: '48px 32px 48px 32px',
    },
    {
      href: '/arkiv',
      label: 'Arkiv',
      emoji: '🗂️',
      color: '#F5A623',
      glow: 'rgba(245,166,35,0.35)',
      status: 'Dina dokument',
      depth: 12,
      baseY: -18,
      borderRadius: '32px 52px 32px 52px',
    },
    {
      href: '/uppgifter',
      label: 'Uppgifter',
      emoji: '✅',
      color: '#7B6EFF',
      glow: 'rgba(123,110,255,0.35)',
      status: todoCount > 0 ? `${todoCount} att göra` : '🎉 Allt klart',
      depth: 16,
      baseY: 12,
      borderRadius: '44px 44px 44px 44px',
    },
  ]

  // Parallax effect
  const animFrame = useRef<number | null>(null)
  const targetParallax = useRef({ x: 0, y: 0 })
  const currentParallax = useRef({ x: 0, y: 0 })

  const applyParallax = useCallback(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    currentParallax.current.x = lerp(currentParallax.current.x, targetParallax.current.x, 0.08)
    currentParallax.current.y = lerp(currentParallax.current.y, targetParallax.current.y, 0.08)
    const { x, y } = currentParallax.current

    cardsRef.current.forEach((el, i) => {
      if (!el || pressedIdx === i) return
      const d = cards[i].depth
      const baseY = cards[i].baseY
      el.style.transform = `translate(${x * d}px, ${baseY + y * d}px)`
    })
    bgBlobsRef.current.forEach((el, i) => {
      if (!el) return
      const d = (i + 1) * 3
      el.style.transform = `translate(${-x * d}px, ${-y * d}px)`
    })
    animFrame.current = requestAnimationFrame(applyParallax)
  }, [pressedIdx])

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      targetParallax.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      targetParallax.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    const handleOrientation = (e: DeviceOrientationEvent) => {
      targetParallax.current.x = Math.max(-1, Math.min(1, (e.gamma ?? 0) / 20))
      targetParallax.current.y = Math.max(-1, Math.min(1, ((e.beta ?? 0) - 30) / 20))
    }
    window.addEventListener('mousemove', handleMouse)
    window.addEventListener('deviceorientation', handleOrientation)
    animFrame.current = requestAnimationFrame(applyParallax)
    return () => {
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('deviceorientation', handleOrientation)
      if (animFrame.current) cancelAnimationFrame(animFrame.current)
    }
  }, [applyParallax])

  // Apply initial baseY transforms
  useEffect(() => {
    cardsRef.current.forEach((el, i) => {
      if (!el) return
      el.style.transform = `translate(0px, ${cards[i].baseY}px)`
    })
  }, [])

  function handlePointerDown(idx: number) {
    setPressedIdx(idx)
    const el = cardsRef.current[idx]
    if (!el) return
    const baseY = cards[idx].baseY
    el.style.transition = 'transform 0.12s ease'
    el.style.transform = `translate(0px, ${baseY}px) scale(0.94)`
  }

  function handlePointerUp(idx: number) {
    setPressedIdx(null)
    const el = cardsRef.current[idx]
    if (!el) return
    const baseY = cards[idx].baseY
    el.style.transition = 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)'
    el.style.transform = `translate(0px, ${baseY}px) scale(1)`
    setTimeout(() => {
      if (el) el.style.transition = ''
    }, 600)
  }

  function handleMouseEnter(idx: number) {
    if (pressedIdx !== null) return
    const el = cardsRef.current[idx]
    if (!el) return
    el.style.transition = 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease'
    const baseY = cards[idx].baseY
    const d = cards[idx].depth
    const { x, y } = currentParallax.current
    el.style.transform = `translate(${x * d}px, ${baseY + y * d - 8}px) rotate(1.5deg)`
  }

  function handleMouseLeave(idx: number) {
    if (pressedIdx !== null) return
    const el = cardsRef.current[idx]
    if (!el) return
    el.style.transition = 'transform 0.3s ease'
    const baseY = cards[idx].baseY
    const d = cards[idx].depth
    const { x, y } = currentParallax.current
    el.style.transform = `translate(${x * d}px, ${baseY + y * d}px)`
    setTimeout(() => { if (el) el.style.transition = '' }, 350)
  }

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
    <div className="page-in min-h-screen px-4 pt-12 pb-28 md:pb-8 overflow-x-hidden" style={{ background: '#0D0D1A' }}>

      {/* Animated background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        <div ref={el => { bgBlobsRef.current[0] = el }}
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{ top: '-150px', right: '-150px', background: 'radial-gradient(circle, rgba(123,110,255,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div ref={el => { bgBlobsRef.current[1] = el }}
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{ bottom: '10%', left: '-120px', background: 'radial-gradient(circle, rgba(255,75,110,0.14) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div ref={el => { bgBlobsRef.current[2] = el }}
          className="absolute w-[350px] h-[350px] rounded-full"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle, rgba(0,200,150,0.1) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: '#555570' }}>
              {member.family_workspace.name}
            </div>
            <h1 className="text-2xl font-extrabold leading-tight" style={{ color: '#F2F2FF', letterSpacing: '-0.5px' }}>
              {greeting.text} {greeting.emoji}
            </h1>
          </div>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-white text-base flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${member.avatar_color}, ${member.avatar_color}88)` }}>
            {member.name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Bubble grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {cards.map((card, i) => (
            <Link
              key={card.href}
              href={card.href}
              ref={el => { cardsRef.current[i] = el }}
              onPointerDown={() => handlePointerDown(i)}
              onPointerUp={() => handlePointerUp(i)}
              onPointerCancel={() => handlePointerUp(i)}
              onMouseEnter={() => handleMouseEnter(i)}
              onMouseLeave={() => handleMouseLeave(i)}
              className={i === 4 ? 'col-span-2' : ''}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: i === 4 ? '28px 20px' : '32px 16px',
                borderRadius: card.borderRadius,
                background: `rgba(255,255,255,0.04)`,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid rgba(255,255,255,0.1)`,
                boxShadow: `0 8px 32px ${card.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
                willChange: 'transform',
                textDecoration: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                position: 'relative',
                overflow: 'hidden',
              }}>
              {/* Card glow overlay */}
              <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at top left, ${card.color}40 0%, transparent 60%)`,
                  borderRadius: 'inherit',
                }} />

              <span style={{ fontSize: i === 4 ? 44 : 40, lineHeight: 1 }}>{card.emoji}</span>
              <div style={{ textAlign: 'center' }}>
                <div className="font-extrabold" style={{ color: '#F2F2FF', fontSize: 16, letterSpacing: '-0.3px' }}>
                  {card.label}
                </div>
                <div className="mt-1.5">
                  <span style={{
                    display: 'inline-block',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: `${card.color}20`,
                    color: card.color,
                    border: `1px solid ${card.color}40`,
                    whiteSpace: 'nowrap',
                  }}>
                    {card.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Akut bills if any */}
        {bills.filter(b => b.status === 'akut' && !paidBills.has(b.id)).length > 0 && (
          <div className="rounded-2xl p-5 mb-4"
            style={{ background: 'linear-gradient(135deg, #2a0d14, #1a0a0f)', border: '1px solid rgba(255,75,110,0.3)' }}>
            <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#FF4B6E' }}>
              🚨 Akuta räkningar
            </div>
            {bills.filter(b => b.status === 'akut' && !paidBills.has(b.id)).map(bill => (
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
                  style={{ background: '#FF4B6E', minHeight: 44 }}>
                  Betala
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Today's tasks */}
        {tasks.filter(t => t.status === 'todo').length > 0 && (
          <div className="rounded-2xl px-5 py-4"
            style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: '#555570' }}>
              ✅ Idag
            </h2>
            {tasks.filter(t => t.status === 'todo').slice(0, 3).map(task => (
              <button key={task.id} onClick={() => toggleTask(task)}
                className="w-full flex items-center gap-3 py-3 border-b last:border-0 text-left"
                style={{ borderColor: 'rgba(255,255,255,0.06)', minHeight: 48 }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ border: '2px solid rgba(255,255,255,0.2)', background: 'transparent' }} />
                <span className="text-sm font-medium" style={{ color: '#F2F2FF' }}>
                  {task.emoji} {task.title}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Camera FAB */}
        <Link href="/arkiv?scan=1"
          className="fixed bottom-24 right-5 md:bottom-8 w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg z-40"
          style={{
            background: 'linear-gradient(135deg, #7B6EFF, #9D93FF)',
            boxShadow: '0 4px 24px rgba(123,110,255,0.5)',
          }}>
          📷
        </Link>
      </div>
    </div>
  )
}
