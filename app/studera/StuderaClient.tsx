'use client'

import { useState } from 'react'
import { bloom } from '@/components/Bloom'
import { PageWrapper } from '@/components/PageWrapper'
import { PageHeader } from '@/components/PageHeader'

const SKY = '#4A8CB4'

const GLASS = 'rgba(10,15,25,0.45)'
const GLASS_BLUR = { backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)' }
const GLASS_BORDER = '1px solid rgba(255,255,255,0.12)'

const courses = [
  { id: 'matematik', label: 'Matematik A', emoji: '📐', credits: 100, progress: 72 },
  { id: 'svenska',   label: 'Svenska 1',   emoji: '📖', credits: 100, progress: 45 },
  { id: 'engelska',  label: 'Engelska 5',  emoji: '🌍', credits: 100, progress: 90 },
  { id: 'historia',  label: 'Historia 1a', emoji: '🏛', credits: 50,  progress: 30 },
]

const studyGoals = [
  { id: 'pomodoro', label: '4 pomodoros idag', emoji: '🍅', done: false },
  { id: 'kapitel',  label: 'Läs kapitel 3',    emoji: '📚', done: false },
  { id: 'flashcard',label: '20 flashcards',     emoji: '🗂', done: false },
]

export default function StuderaClient() {
  const [goals, setGoals] = useState(studyGoals)
  const [activeTimer, setActiveTimer] = useState(false)
  const [seconds, setSeconds] = useState(25 * 60)
  const [timerRef, setTimerRef] = useState<ReturnType<typeof setInterval> | null>(null)

  function toggleGoal(id: string) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, done: !g.done } : g))
    const goal = goals.find(g => g.id === id)
    if (goal && !goal.done) bloom(`✅ ${goal.label}`, 'Mål klart!')
  }

  function toggleTimer() {
    if (activeTimer) {
      if (timerRef) clearInterval(timerRef)
      setTimerRef(null)
      setActiveTimer(false)
    } else {
      setActiveTimer(true)
      const ref = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(ref)
            setActiveTimer(false)
            bloom('🍅 Pomodoro klar!', 'Ta en 5 min paus')
            return 25 * 60
          }
          return s - 1
        })
      }, 1000)
      setTimerRef(ref)
    }
  }

  function resetTimer() {
    if (timerRef) clearInterval(timerRef)
    setTimerRef(null)
    setActiveTimer(false)
    setSeconds(25 * 60)
  }

  const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')
  const doneCount = goals.filter(g => g.done).length
  const totalCredits = courses.reduce((s, c) => s + c.credits, 0)
  const earnedCredits = courses.reduce((s, c) => s + Math.round(c.credits * c.progress / 100), 0)

  return (
    <PageWrapper>
      <div className="max-w-xl mx-auto space-y-6">
        <PageHeader eyebrow="Lärande & Studier" title="Studera" />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 text-center" style={{ background: GLASS, ...GLASS_BLUR, border: GLASS_BORDER }}>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>Poäng intjänade</p>
            <p className="text-[28px] font-bold leading-tight" style={{ color: SKY }}>{earnedCredits}</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>av {totalCredits} hp</p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: GLASS, ...GLASS_BLUR, border: GLASS_BORDER }}>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>Mål idag</p>
            <p className="text-[28px] font-bold leading-tight" style={{ color: SKY }}>{doneCount}/{goals.length}</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>slutförda</p>
          </div>
        </div>

        {/* Pomodoro timer */}
        <div className="rounded-2xl p-6 text-center space-y-4" style={{ background: GLASS, ...GLASS_BLUR, border: GLASS_BORDER }}>
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: 'rgba(255,255,255,0.55)' }}>🍅 Pomodoro-timer</p>
          <div className="text-[56px] font-black tabular-nums leading-none" style={{ color: SKY }}>
            {mins}:{secs}
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ background: SKY, width: `${(seconds / (25 * 60)) * 100}%` }} />
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={toggleTimer}
              className="px-8 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: activeTimer ? '#C46040' : SKY }}>
              {activeTimer ? '⏸ Pausa' : '▶ Starta'}
            </button>
            <button onClick={resetTimer}
              className="px-5 py-3 rounded-xl font-semibold text-sm"
              style={{ background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.70)' }}>
              Återställ
            </button>
          </div>
        </div>

        {/* Daily goals */}
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Dagens mål
          </p>
          <div className="space-y-2">
            {goals.map(goal => (
              <button key={goal.id} onClick={() => toggleGoal(goal.id)}
                className="w-full flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all active:scale-[0.99]"
                style={{
                  background: goal.done ? 'rgba(74,140,180,0.22)' : GLASS,
                  ...GLASS_BLUR,
                  border: `1px solid ${goal.done ? 'rgba(74,140,180,0.40)' : 'rgba(255,255,255,0.12)'}`,
                }}>
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2"
                  style={{ borderColor: goal.done ? SKY : 'rgba(255,255,255,0.30)', background: goal.done ? SKY : 'transparent' }}>
                  {goal.done && <span className="text-white text-xs">✓</span>}
                </div>
                <span className="text-xl">{goal.emoji}</span>
                <span className="flex-1 font-semibold text-[15px]"
                  style={{ color: goal.done ? 'rgba(255,255,255,0.40)' : '#FFFFFF', textDecoration: goal.done ? 'line-through' : 'none' }}>
                  {goal.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Courses */}
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Kurser
          </p>
          <div className="space-y-3">
            {courses.map(course => (
              <div key={course.id} className="rounded-2xl p-5"
                style={{ background: GLASS, ...GLASS_BLUR, border: GLASS_BORDER }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{course.emoji}</span>
                  <div className="flex-1">
                    <div className="font-bold text-[15px]" style={{ color: '#FFFFFF' }}>{course.label}</div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{course.credits} hp</div>
                  </div>
                  <span className="font-bold text-sm" style={{ color: SKY }}>{course.progress}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ background: SKY, width: `${course.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CSN info */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(74,140,180,0.20)', ...GLASS_BLUR, border: `1px solid rgba(74,140,180,0.35)` }}>
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color: SKY }}>📋 CSN</p>
          <div className="space-y-2">
            {[
              { label: 'Nästa utbetalning', value: '25 april' },
              { label: 'Studiemedel/mån', value: '11 460 kr' },
              { label: 'Studietakt', value: '100%' },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span style={{ color: 'rgba(255,255,255,0.70)' }}>{row.label}</span>
                <span className="font-bold" style={{ color: '#FFFFFF' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
