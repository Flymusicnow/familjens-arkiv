'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { bloom } from '@/components/Bloom'
import { PageWrapper } from '@/components/PageWrapper'
import { PageHeader } from '@/components/PageHeader'
import RadialOrbitalTimeline from '@/components/RadialOrbitalTimeline'
import type { OrbitalNode } from '@/components/RadialOrbitalTimeline'
import type { Venture } from '@/lib/types'

interface Props {
  ventures: Venture[]
  incomeMap: Record<string, number>
  workspaceId: string
  memberId: string
}

const DEFAULT_VENTURES = [
  { name: 'FlyMusic',                        emoji: '🎵', category: 'Musik / Evenemang',         monthly_goal: 20000, color: '#818CF8' },
  { name: 'Trading XAUUSD / NQ1!',           emoji: '📈', category: 'Trading',                   monthly_goal: 30000, color: '#34D399' },
  { name: 'Salonas Massage / Vildblomman',   emoji: '💆', category: 'Hälsa & Välmående',          monthly_goal: 15000, color: '#F87171' },
  { name: 'Kommunen',                        emoji: '🏛', category: 'Anställning (avslutas 31 mars)', monthly_goal: 28000, color: '#60A5FA' },
]

function formatAmt(n: number) {
  return n.toLocaleString('sv-SE') + ' kr'
}

export default function ProjektClient({ ventures: initialVentures, incomeMap: initialMap, workspaceId, memberId }: Props) {
  const supabase = createClient()
  const [ventures, setVentures] = useState<Venture[]>(initialVentures)
  const [incomeMap, setIncomeMap] = useState(initialMap)
  const [showAdd, setShowAdd] = useState(false)
  const [showIncomeForm, setShowIncomeForm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', emoji: '💼', category: '', monthly_goal: '', color: '#818CF8' })
  const [incomeForm, setIncomeForm] = useState({ amount: '', description: '' })

  async function seedDefaults() {
    if (workspaceId === 'guest') { bloom('Logga in', 'Du behöver vara inloggad'); return }
    setSaving(true)
    for (const v of DEFAULT_VENTURES) {
      await supabase.from('ventures').insert({
        workspace_id: workspaceId,
        owner_id: memberId,
        name: v.name, emoji: v.emoji, category: v.category,
        monthly_goal: v.monthly_goal, color: v.color, active: true,
      })
    }
    const { data } = await supabase.from('ventures').select('*').eq('workspace_id', workspaceId).eq('active', true)
    setVentures(data || [])
    setSaving(false)
    bloom('Ventures tillagda! 🚀', '4 projekt skapade')
  }

  async function addVenture() {
    if (!form.name.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('ventures').insert({
      workspace_id: workspaceId, owner_id: memberId,
      name: form.name.trim(), emoji: form.emoji,
      category: form.category.trim() || null,
      monthly_goal: form.monthly_goal ? parseFloat(form.monthly_goal) : 0,
      color: form.color, active: true,
    }).select().single()
    setSaving(false)
    if (error || !data) { bloom('Fel ❌', error?.message || 'Kunde inte spara'); return }
    setVentures(prev => [...prev, data])
    setForm({ name: '', emoji: '💼', category: '', monthly_goal: '', color: '#818CF8' })
    setShowAdd(false)
    bloom('Projekt tillagt! 🎉', form.name)
  }

  async function addIncome(ventureId: string) {
    if (!incomeForm.amount) return
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('venture_income').insert({
      venture_id: ventureId, amount: parseFloat(incomeForm.amount),
      description: incomeForm.description || null, income_date: today,
    })
    const added = parseFloat(incomeForm.amount)
    setIncomeMap(prev => ({ ...prev, [ventureId]: (prev[ventureId] || 0) + added }))
    setIncomeForm({ amount: '', description: '' })
    setShowIncomeForm(null)
    bloom('Inkomst tillagd! 💰', `+${formatAmt(added)}`)
  }

  const totalIncome = Object.values(incomeMap).reduce((s, v) => s + v, 0)
  const totalGoal = ventures.reduce((s, v) => s + v.monthly_goal, 0)

  // Map ventures to orbital nodes
  const orbitalNodes: OrbitalNode[] = ventures.map(v => ({
    id: v.id,
    name: v.name,
    emoji: v.emoji,
    color: v.color || '#818CF8',
    category: v.category || '',
    income: incomeMap[v.id] || 0,
    goal: v.monthly_goal,
  }))

  return (
    <PageWrapper>
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-100px] right-[-80px] w-96 h-96 rounded-full opacity-10"
          style={{ background: '#818CF8', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-72 h-72 rounded-full opacity-8"
          style={{ background: '#34D399', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-xl mx-auto space-y-6">
        <PageHeader
          eyebrow="Dina ventures"
          title="Projekt"
          action={
            <button onClick={() => setShowAdd(s => !s)}
              className="px-5 font-bold text-sm text-white rounded-2xl"
              style={{ background: '#818CF8', height: 48 }}>
              + Nytt
            </button>
          }
        />

        {/* ── Orbital Timeline ─────────────────────────────────── */}
        {orbitalNodes.length > 0 && (
          <div className="rounded-3xl p-6"
            style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}>
            <RadialOrbitalTimeline satellites={orbitalNodes} />
          </div>
        )}

        {/* Monthly total */}
        {ventures.length > 0 && (
          <div className="rounded-2xl p-5"
            style={{ background: 'linear-gradient(135deg,#0D0D1F,#080D15)', border: '1px solid rgba(129,140,248,0.25)' }}>
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: 'rgba(129,140,248,0.7)' }}>
              TOTALT DENNA MÅNAD
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black" style={{ color: 'white', letterSpacing: '-2px' }}>
                {formatAmt(totalIncome)}
              </span>
            </div>
            <p className="text-sm mt-1" style={{ color: '#6B6B7B' }}>Mål: {formatAmt(totalGoal)}</p>
            <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, totalGoal > 0 ? (totalIncome / totalGoal) * 100 : 0)}%`,
                  background: 'linear-gradient(90deg, #818CF8, #34D399)',
                }} />
            </div>
          </div>
        )}

        {/* Add form */}
        {showAdd && (
          <div className="rounded-2xl p-5 space-y-3"
            style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.09)' }}>
            <h3 className="font-bold" style={{ color: '#F0F0F5' }}>Nytt projekt</h3>
            <div className="flex gap-3">
              <div className="w-16">
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#A8A8B8' }}>Emoji</label>
                <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                  className="w-full px-2 py-2.5 rounded-xl text-xl text-center outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0F5' }} />
              </div>
              <div className="flex-1">
                <ProjField label="Namn" placeholder="T.ex. FlyMusic" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              </div>
            </div>
            <ProjField label="Roll / kategori" placeholder="T.ex. Grundare" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} />
            <ProjField label="Månadsintäktsmål (kr)" placeholder="20000" value={form.monthly_goal} onChange={v => setForm(f => ({ ...f, monthly_goal: v }))} type="number" />
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: '#A8A8B8' }}>Färg</label>
              <div className="flex gap-2 flex-wrap">
                {['#818CF8','#34D399','#F87171','#60A5FA','#FBBF24','#F472B6','#A78BFA'].map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    className="w-8 h-8 rounded-full transition-all"
                    style={{ background: c, outline: form.color === c ? '3px solid white' : 'none', outlineOffset: 2 }} />
                ))}
              </div>
            </div>
            <button onClick={addVenture} disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: saving ? '#4A4280' : '#818CF8', minHeight: 48 }}>
              {saving ? 'Sparar...' : 'Spara projekt'}
            </button>
          </div>
        )}

        {/* Empty state */}
        {ventures.length === 0 && !showAdd && (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-4xl mb-4">🚀</div>
            <div className="font-bold mb-2" style={{ color: '#F0F0F5' }}>Inga projekt än</div>
            <div className="text-sm mb-5" style={{ color: '#A8A8B8' }}>Lägg till dina ventures eller använd standardprojekten</div>
            <button onClick={seedDefaults} disabled={saving}
              className="px-6 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: '#818CF8', minHeight: 44 }}>
              {saving ? 'Skapar...' : '⚡ Starta med standardprojekten'}
            </button>
          </div>
        )}

        {/* Venture cards */}
        <div className="space-y-4">
          {ventures.map(venture => {
            const income = incomeMap[venture.id] || 0
            const goal = venture.monthly_goal || 1
            const pct = Math.min(100, (income / goal) * 100)
            const barColor = pct >= 80 ? '#34D399' : pct >= 50 ? '#FBBF24' : '#F87171'

            return (
              <div key={venture.id} className="rounded-2xl p-5 space-y-4"
                style={{ background: '#1A1A1A', border: `1px solid ${venture.color || '#818CF8'}25` }}>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ background: `${venture.color || '#818CF8'}18`, border: `1px solid ${venture.color || '#818CF8'}30` }}>
                    {venture.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate" style={{ color: '#F0F0F5' }}>{venture.name}</div>
                    {venture.category && (
                      <div className="text-xs mt-0.5 truncate" style={{ color: '#6B6B7B' }}>{venture.category}</div>
                    )}
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="font-black text-xl" style={{ color: venture.color || '#818CF8' }}>{formatAmt(income)}</span>
                      <span className="text-xs" style={{ color: '#3A3A4A' }}>/ {formatAmt(goal)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs" style={{ color: '#6B6B7B' }}>{pct.toFixed(0)}% av målet</span>
                    <span className="text-xs" style={{ color: barColor }}>
                      {pct >= 100 ? '🎉 Klart!' : `${formatAmt(goal - income)} kvar`}
                    </span>
                  </div>
                </div>

                {showIncomeForm === venture.id ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-2">
                      <input type="number" placeholder="Belopp (kr)"
                        value={incomeForm.amount}
                        onChange={e => setIncomeForm(f => ({ ...f, amount: e.target.value }))}
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0F5', minHeight: 44 }} />
                      <input type="text" placeholder="Beskrivning (valfri)"
                        value={incomeForm.description}
                        onChange={e => setIncomeForm(f => ({ ...f, description: e.target.value }))}
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0F5', minHeight: 44 }} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowIncomeForm(null)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: 'rgba(255,255,255,0.06)', color: '#A8A8B8', minHeight: 44 }}>
                        Avbryt
                      </button>
                      <button onClick={() => addIncome(venture.id)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: venture.color || '#818CF8', minHeight: 44 }}>
                        + Spara inkomst
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowIncomeForm(venture.id)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold"
                    style={{
                      background: `${venture.color || '#818CF8'}12`,
                      color: venture.color || '#818CF8',
                      border: `1px solid ${venture.color || '#818CF8'}25`,
                      minHeight: 44,
                    }}>
                    + Registrera inkomst
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </PageWrapper>
  )
}

function ProjField({ label, placeholder, value, onChange, type = 'text' }: {
  label: string; placeholder: string; value: string
  onChange: (v: string) => void; type?: string
}) {
  return (
    <div>
      <label className="text-xs font-semibold mb-1 block" style={{ color: '#A8A8B8' }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0F5', minHeight: 44 }} />
    </div>
  )
}
