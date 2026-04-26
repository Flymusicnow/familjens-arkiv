'use client'

import { useState } from 'react'
import { bloom } from '@/components/Bloom'
import { PageWrapper } from '@/components/PageWrapper'
import { PageHeader } from '@/components/PageHeader'

const TEAL = '#3A8878'

const wellnessChecks = [
  { id: 'sömn',      label: 'Sovit bra',          emoji: '😴' },
  { id: 'mat',       label: 'Ätit ordentligt',     emoji: '🥗' },
  { id: 'rörelse',   label: 'Rört på mig',         emoji: '🚶' },
  { id: 'andning',   label: 'Andningsövning',       emoji: '🌬' },
  { id: 'kontakt',   label: 'Pratat med någon',     emoji: '💬' },
]

const moodOptions = [
  { value: 5, emoji: '😄', label: 'Toppen' },
  { value: 4, emoji: '🙂', label: 'Bra' },
  { value: 3, emoji: '😐', label: 'Ok' },
  { value: 2, emoji: '😕', label: 'Tungt' },
  { value: 1, emoji: '😞', label: 'Svårt' },
]

const routines = [
  { id: 'morgon', label: 'Morgonrutin',   emoji: '☀️', time: '07:00', done: false },
  { id: 'middag', label: 'Middagsrutin',  emoji: '🌤', time: '12:00', done: false },
  { id: 'kväll',  label: 'Kvällsrutin',  emoji: '🌙', time: '21:00', done: false },
]

export default function PaddanClient() {
  const [checks, setChecks] = useState<string[]>([])
  const [mood, setMood] = useState<number | null>(null)
  const [routinesDone, setRoutinesDone] = useState<string[]>([])
  const [note, setNote] = useState('')

  function toggleCheck(id: string) {
    const willAdd = !checks.includes(id)
    setChecks(prev => willAdd ? [...prev, id] : prev.filter(c => c !== id))
    if (willAdd) {
      const item = wellnessChecks.find(w => w.id === id)
      if (item) bloom(`${item.emoji} ${item.label}`, 'Bra jobbat!')
    }
  }

  function toggleRoutine(id: string) {
    setRoutinesDone(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  }

  function saveNote() {
    if (!note.trim()) return
    bloom('📝 Anteckning sparad', note.slice(0, 40))
    setNote('')
  }

  const wellnessScore = Math.round((checks.length / wellnessChecks.length) * 100)
  const moodSelected = moodOptions.find(m => m.value === mood)

  return (
    <PageWrapper>
      <div className="max-w-xl mx-auto space-y-6">
        <PageHeader eyebrow="Välmående & Stöd" title="Paddan" />

        {/* Mood */}
        <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-4" style={{ color: '#8A9888' }}>
            Hur mår du idag?
          </p>
          <div className="flex justify-between">
            {moodOptions.map(opt => (
              <button key={opt.value} onClick={() => setMood(opt.value)}
                className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-all"
                style={{
                  background: mood === opt.value ? `rgba(58,136,120,0.12)` : 'transparent',
                  border: mood === opt.value ? `1.5px solid rgba(58,136,120,0.35)` : '1.5px solid transparent',
                }}>
                <span className="text-[28px]">{opt.emoji}</span>
                <span className="text-[10px] font-semibold" style={{ color: mood === opt.value ? TEAL : '#8A9888' }}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
          {moodSelected && (
            <p className="text-center text-sm mt-3 font-semibold" style={{ color: TEAL }}>
              Du mår: {moodSelected.label} {moodSelected.emoji}
            </p>
          )}
        </div>

        {/* Wellness score */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 text-center" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: '#8A9888' }}>Välmående</p>
            <p className="text-[28px] font-bold leading-tight" style={{ color: TEAL }}>{wellnessScore}%</p>
            <p className="text-xs mt-1" style={{ color: '#8A9888' }}>{checks.length} av {wellnessChecks.length}</p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: '#8A9888' }}>Rutiner idag</p>
            <p className="text-[28px] font-bold leading-tight" style={{ color: TEAL }}>{routinesDone.length}/{routines.length}</p>
            <p className="text-xs mt-1" style={{ color: '#8A9888' }}>genomförda</p>
          </div>
        </div>

        {/* Wellness checklist */}
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color: '#8A9888' }}>
            Daglig checklista
          </p>
          <div className="space-y-2">
            {wellnessChecks.map(item => {
              const done = checks.includes(item.id)
              return (
                <button key={item.id} onClick={() => toggleCheck(item.id)}
                  className="w-full flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all active:scale-[0.99]"
                  style={{
                    background: done ? `rgba(58,136,120,0.08)` : '#FFFFFF',
                    border: `1px solid ${done ? 'rgba(58,136,120,0.25)' : 'rgba(0,0,0,0.07)'}`,
                  }}>
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2"
                    style={{ borderColor: done ? TEAL : '#C8D4C8', background: done ? TEAL : 'transparent' }}>
                    {done && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className="text-xl">{item.emoji}</span>
                  <span className="flex-1 font-semibold text-[15px]"
                    style={{ color: done ? '#8A9888' : '#1A2018', textDecoration: done ? 'line-through' : 'none' }}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Daily routines */}
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color: '#8A9888' }}>
            Rutiner
          </p>
          <div className="space-y-2">
            {routines.map(r => {
              const done = routinesDone.includes(r.id)
              return (
                <button key={r.id} onClick={() => toggleRoutine(r.id)}
                  className="w-full flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all"
                  style={{
                    background: done ? `rgba(58,136,120,0.08)` : '#FFFFFF',
                    border: `1px solid ${done ? 'rgba(58,136,120,0.25)' : 'rgba(0,0,0,0.07)'}`,
                  }}>
                  <span className="text-2xl">{r.emoji}</span>
                  <div className="flex-1">
                    <div className="font-bold text-[15px]"
                      style={{ color: done ? '#8A9888' : '#1A2018', textDecoration: done ? 'line-through' : 'none' }}>
                      {r.label}
                    </div>
                    <div className="text-xs" style={{ color: '#8A9888' }}>{r.time}</div>
                  </div>
                  {done && <span className="font-bold text-sm" style={{ color: TEAL }}>✓ Klar</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Daily note */}
        <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color: '#8A9888' }}>
            📝 Dagboksanteckning
          </p>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Hur var din dag? Vad är du tacksam för?"
            rows={3}
            className="w-full px-3 py-3 rounded-xl text-sm outline-none resize-none"
            style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.09)', color: '#1A2018' }} />
          <button onClick={saveNote} disabled={!note.trim()}
            className="w-full py-3 rounded-xl font-bold text-sm text-white mt-3"
            style={{ background: note.trim() ? TEAL : '#8A9888' }}>
            Spara anteckning
          </button>
        </div>
      </div>
    </PageWrapper>
  )
}
