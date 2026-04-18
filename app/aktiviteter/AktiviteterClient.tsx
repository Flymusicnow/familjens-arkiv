'use client'

import { useState } from 'react'
import { bloom } from '@/components/Bloom'
import { PageWrapper } from '@/components/PageWrapper'
import { PageHeader } from '@/components/PageHeader'

const MOSS = '#6AA860'

const activities = [
  { id: 'löpning',   label: 'Löpning',    emoji: '🏃', minutes: 30, kcal: 300 },
  { id: 'cykling',   label: 'Cykling',    emoji: '🚴', minutes: 45, kcal: 400 },
  { id: 'yoga',      label: 'Yoga',       emoji: '🧘', minutes: 60, kcal: 180 },
  { id: 'styrka',    label: 'Styrketräning', emoji: '🏋️', minutes: 45, kcal: 350 },
  { id: 'promenad',  label: 'Promenad',   emoji: '🚶', minutes: 40, kcal: 160 },
  { id: 'simning',   label: 'Simning',    emoji: '🏊', minutes: 40, kcal: 380 },
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

  const totalKcal = activities
    .filter(a => logged.includes(a.id))
    .reduce((s, a) => s + a.kcal, 0)

  const totalMin = activities
    .filter(a => logged.includes(a.id))
    .reduce((s, a) => s + a.minutes, 0)

  return (
    <PageWrapper>
      <div className="max-w-xl mx-auto space-y-6">
        <PageHeader eyebrow="Rörelse & Hälsa" title="Aktiviteter" />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-5 text-center" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: '#8A9888' }}>Kalorier idag</p>
            <p className="text-[32px] font-black leading-tight" style={{ color: MOSS }}>{totalKcal}</p>
            <p className="text-xs mt-1" style={{ color: '#8A9888' }}>kcal förbrukade</p>
          </div>
          <div className="rounded-2xl p-5 text-center" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: '#8A9888' }}>Aktiv tid</p>
            <p className="text-[32px] font-black leading-tight" style={{ color: MOSS }}>{totalMin}</p>
            <p className="text-xs mt-1" style={{ color: '#8A9888' }}>minuter</p>
          </div>
        </div>

        {/* Activity grid */}
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color: '#8A9888' }}>
            Logga aktivitet
          </p>
          <div className="grid grid-cols-2 gap-3">
            {activities.map(act => {
              const done = logged.includes(act.id)
              return (
                <button key={act.id} onClick={() => logActivity(act.id, act.label)}
                  className="rounded-2xl p-5 text-left transition-all active:scale-95"
                  style={{
                    background: done ? `rgba(106,168,96,0.10)` : '#FFFFFF',
                    border: `1px solid ${done ? 'rgba(106,168,96,0.3)' : 'rgba(0,0,0,0.07)'}`,
                  }}>
                  <div className="text-3xl mb-3">{act.emoji}</div>
                  <div className="font-bold text-[15px]" style={{ color: '#1A2018' }}>{act.label}</div>
                  <div className="text-xs mt-1" style={{ color: '#8A9888' }}>{act.minutes} min · {act.kcal} kcal</div>
                  {done && (
                    <div className="mt-2 text-xs font-bold" style={{ color: MOSS }}>✓ Loggad</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Weekly goal */}
        <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-4" style={{ color: '#8A9888' }}>Veckans mål</p>
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: '#5A6858' }}>{logged.length} av 5 dagar aktiva</span>
            <span style={{ color: MOSS }}>{Math.round((logged.length / 5) * 100)}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ background: MOSS, width: `${Math.min(100, (logged.length / 5) * 100)}%` }} />
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
