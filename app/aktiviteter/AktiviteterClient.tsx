'use client'

import { useState } from 'react'
import { bloom } from '@/components/Bloom'
import { PageWrapper } from '@/components/PageWrapper'
import { PageHeader } from '@/components/PageHeader'

const MOSS = '#6AA860'
const GLASS = 'rgba(10,15,25,0.45)'
const GB = { backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)' }
const GLASS_BORDER = '1px solid rgba(255,255,255,0.12)'

const activities = [
  { id: 'löpning',   label: 'Löpning',       emoji: '🏃', minutes: 30, kcal: 300 },
  { id: 'cykling',   label: 'Cykling',       emoji: '🚴', minutes: 45, kcal: 400 },
  { id: 'yoga',      label: 'Yoga',          emoji: '🧘', minutes: 60, kcal: 180 },
  { id: 'styrka',    label: 'Styrketräning', emoji: '🏋️', minutes: 45, kcal: 350 },
  { id: 'promenad',  label: 'Promenad',      emoji: '🚶', minutes: 40, kcal: 160 },
  { id: 'simning',   label: 'Simning',       emoji: '🏊', minutes: 40, kcal: 380 },
]

export default function AktiviteterClient() {
  const [logged, setLogged] = useState<string[]>([])

  function logActivity(id: string, label: string) {
    if (logged.includes(id)) {
      setLogged(prev => prev.filter(l => l !== id))
    } else {
      setLogged(prev => [...prev, id])
      bloom(`✅ ${label}`, 'Aktivitet loggad!')
    }
  }

  const totalKcal = activities.filter(a => logged.includes(a.id)).reduce((s, a) => s + a.kcal, 0)
  const totalMin = activities.filter(a => logged.includes(a.id)).reduce((s, a) => s + a.minutes, 0)

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader eyebrow="Rörelse & Hälsa" title="Aktiviteter" />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 text-center" style={{ background: GLASS, ...GB, border: GLASS_BORDER }}>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>Kalorier idag</p>
            <p className="text-[28px] font-bold leading-tight" style={{ color: MOSS }}>{totalKcal}</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>kcal förbrukade</p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: GLASS, ...GB, border: GLASS_BORDER }}>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>Aktiv tid</p>
            <p className="text-[28px] font-bold leading-tight" style={{ color: MOSS }}>{totalMin}</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>minuter</p>
          </div>
        </div>

        {/* Activity grid */}
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Logga aktivitet
          </p>
          <div className="grid grid-cols-2 gap-3">
            {activities.map(act => {
              const done = logged.includes(act.id)
              return (
                <button key={act.id} onClick={() => logActivity(act.id, act.label)}
                  className="rounded-2xl p-5 text-left transition-all active:scale-95"
                  style={{
                    background: done ? 'rgba(106,168,96,0.25)' : GLASS,
                    ...GB,
                    border: `1px solid ${done ? 'rgba(106,168,96,0.40)' : 'rgba(255,255,255,0.12)'}`,
                  }}>
                  <div className="text-3xl mb-3">{act.emoji}</div>
                  <div className="font-bold text-[15px]" style={{ color: '#FFFFFF' }}>{act.label}</div>
                  <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{act.minutes} min · {act.kcal} kcal</div>
                  {done && (
                    <div className="mt-2 text-xs font-bold" style={{ color: MOSS }}>✓ Loggad</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Weekly goal */}
        <div className="rounded-2xl p-5" style={{ background: GLASS, ...GB, border: GLASS_BORDER }}>
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>Veckans mål</p>
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: 'rgba(255,255,255,0.70)' }}>{logged.length} av 5 dagar aktiva</span>
            <span style={{ color: MOSS }}>{Math.round((logged.length / 5) * 100)}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ background: MOSS, width: `${Math.min(100, (logged.length / 5) * 100)}%` }} />
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
