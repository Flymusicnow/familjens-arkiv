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
  { name: 'FlyMusic',                        emoji: '🎵', category: 'Musik / Evenemang',         monthly_goal: 20000, color: '#5C4A7A' },
  { name: 'Trading XAUUSD / NQ1!',           emoji: '📈', category: 'Trading',                   monthly_goal: 30000, color: '#8B6914' },
  { name: 'Salonas Massage / Vildblomman',   emoji: '💆', category: 'Hälsa & Välmående',          monthly_goal: 15000, color: '#2D5A27' },
  { name: 'Kommunen',                        emoji: '🏛', category: 'Anställning (avslutas 31 mars)', monthly_goal: 28000, color: '#60A5FA' },
]

const LOGO_BG: Record<string, string> = {
  '#5C4A7A': '#D8D0EC',
  '#8B6914': '#EAD9AA',
  '#2D5A27': '#D4E8CC',
}

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
  const [form, setForm] = useState({ name: '', emoji: '💼', category: '', monthly_goal: '', color: '#6450B4' })
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
    setForm({ name: '', emoji: '💼', category: '', monthly_goal: '', color: '#6450B4' })
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
    color: v.color || '#6450B4',
    category: v.category || '',
    income: incomeMap[v.id] || 0,
    goal: v.monthly_goal,
  }))

  return (
    <PageWrapper>

      <div className="relative z-10 max-w-xl mx-auto space-y-6">
        <PageHeader
          eyebrow="Dina ventures"
          title="Projekt"
          action={
            <button onClick={() => setShowAdd(s => !s)}
              className="px-5 font-bold text-sm text-white rounded-2xl"
              style={{ background: '#6450B4', height: 48 }}>
              + Nytt
            </button>
          }
        />

        {/* ── Orbital Timeline ─────────────────────────────────── */}
        {orbitalNodes.length > 0 && (
          <div className="rounded-3xl p-6"
            style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
            <RadialOrbitalTimeline satellites={orbitalNodes} />
          </div>
        )}


        {/* Add form */}
        {showAdd && (
          <div className="rounded-2xl p-5 space-y-3"
            style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)' }}>
            <h3 className="font-bold" style={{ color: '#1A2018' }}>Nytt projekt</h3>
            <div className="flex gap-3">
              <div className="w-16">
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#5A6858' }}>Emoji</label>
                <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                  className="w-full px-2 py-2.5 rounded-xl text-xl text-center outline-none"
                  style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.10)', color: '#1A2018' }} />
              </div>
              <div className="flex-1">
                <ProjField label="Namn" placeholder="T.ex. FlyMusic" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              </div>
            </div>
            <ProjField label="Roll / kategori" placeholder="T.ex. Grundare" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} />
            <ProjField label="Månadsintäktsmål (kr)" placeholder="20000" value={form.monthly_goal} onChange={v => setForm(f => ({ ...f, monthly_goal: v }))} type="number" />
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: '#5A6858' }}>Färg</label>
              <div className="flex gap-2 flex-wrap">
                {['#6450B4','#5A9A50','#C46040','#60A5FA','#9A7830','#F472B6','#A78BFA'].map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    className="w-8 h-8 rounded-full transition-all"
                    style={{ background: c, outline: form.color === c ? '3px solid white' : 'none', outlineOffset: 2 }} />
                ))}
              </div>
            </div>
            <button onClick={addVenture} disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: saving ? '#8A9888' : '#6450B4', minHeight: 48 }}>
              {saving ? 'Sparar...' : 'Spara projekt'}
            </button>
          </div>
        )}

        {/* Stats row — always visible */}
        <div className="grid grid-cols-3 gap-[10px]">
          {[
            { label: 'Total/mån', value: ventures.length > 0 ? formatAmt(totalIncome) : '–', bg: '#D4E8CC', color: '#2D5A27', small: totalIncome >= 10000 },
            { label: 'Aktiva',    value: String(ventures.length),  bg: '#D8D0EC', color: '#5C4A7A', small: false },
            { label: 'Mål',       value: totalGoal > 0 ? `${Math.min(100, Math.round((totalIncome/totalGoal)*100))}%` : '–', bg: '#EAD9AA', color: '#8B6914', small: false },
          ].map(s => (
            <div key={s.label} className="rounded-2xl py-4 px-[10px] text-center"
              style={{ background: s.bg, border: '1px solid rgba(0,0,0,0.07)' }}>
              <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: '#8A9888' }}>{s.label}</p>
              <p className={`${s.small ? 'text-[18px]' : 'text-[26px]'} font-black leading-tight`} style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {ventures.length === 0 && !showAdd && (
          <div className="rounded-2xl py-12 px-6 text-center"
            style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="text-[48px] mb-4">🚀</div>
            <div className="text-[20px] font-bold mb-2" style={{ color: '#1A2018' }}>Inga projekt än</div>
            <div className="text-[14px] mb-6 leading-relaxed" style={{ color: '#8A9888' }}>Lägg till dina ventures eller använd standardprojekten</div>
            <button onClick={seedDefaults} disabled={saving}
              className="w-full min-h-[52px] rounded-2xl font-bold text-[15px] text-white"
              style={{ background: '#6450B4' }}>
              {saving ? 'Skapar...' : '⚡ Starta med standardprojekten'}
            </button>
          </div>
        )}

        {/* Venture cards */}
        <div className="space-y-[14px]">
          {ventures.map(venture => {
            const income = incomeMap[venture.id] || 0
            const goal = venture.monthly_goal || 1
            const pct = Math.min(100, (income / goal) * 100)
            const barColor = pct >= 80 ? '#5A9A50' : pct >= 50 ? '#9A7830' : '#C46040'

            return (
              <div key={venture.id} className="rounded-2xl p-5 space-y-4"
                style={{ background: '#FFFFFF', border: `1px solid ${venture.color || '#6450B4'}25` }}>
                <div className="flex items-start gap-4">
                  <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: LOGO_BG[venture.color || ''] || `${venture.color || '#5C4A7A'}18`, border: `1px solid ${venture.color || '#5C4A7A'}30` }}>
                    {venture.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[15px] truncate" style={{ color: '#1A2018' }}>{venture.name}</div>
                    {venture.category && (
                      <div className="inline-block text-[10px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded-full mt-1"
                        style={{ background: `${venture.color || '#6450B4'}18`, color: venture.color || '#6450B4' }}>
                        {venture.category}
                      </div>
                    )}
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="font-black text-[22px]" style={{ color: '#2D5A27', letterSpacing: '-0.5px' }}>+{formatAmt(income)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-[14px]">
                  <div className="flex justify-between mb-2">
                    <span className="text-[12px]" style={{ color: '#8A9888' }}>Mål {formatAmt(goal)}/mån</span>
                    <strong className="text-[12px] font-bold" style={{ color: '#9090B0' }}>{pct.toFixed(0)}%</strong>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #2D5A27, #7AAB6E)' }} />
                  </div>
                </div>

                {showIncomeForm === venture.id ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-2">
                      <input type="number" placeholder="Belopp (kr)"
                        value={incomeForm.amount}
                        onChange={e => setIncomeForm(f => ({ ...f, amount: e.target.value }))}
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.10)', color: '#1A2018', minHeight: 44 }} />
                      <input type="text" placeholder="Beskrivning (valfri)"
                        value={incomeForm.description}
                        onChange={e => setIncomeForm(f => ({ ...f, description: e.target.value }))}
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.10)', color: '#1A2018', minHeight: 44 }} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowIncomeForm(null)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: 'rgba(0,0,0,0.06)', color: '#5A6858', minHeight: 44 }}>
                        Avbryt
                      </button>
                      <button onClick={() => addIncome(venture.id)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: venture.color || '#6450B4', minHeight: 44 }}>
                        + Spara inkomst
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowIncomeForm(venture.id)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold"
                    style={{
                      background: `${venture.color || '#6450B4'}12`,
                      color: venture.color || '#6450B4',
                      border: `1px solid ${venture.color || '#6450B4'}25`,
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
      <label className="text-xs font-semibold mb-1 block" style={{ color: '#5A6858' }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.10)', color: '#1A2018', minHeight: 44 }} />
    </div>
  )
}
