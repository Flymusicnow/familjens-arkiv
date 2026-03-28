'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { bloom } from '@/components/Bloom'
import type { Meal, VitaminLog, FamilyMember, MealType } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_TYPES: { key: MealType; label: string; emoji: string }[] = [
  { key: 'frukost', label: 'Frukost', emoji: '🌅' },
  { key: 'lunch',   label: 'Lunch',   emoji: '☀️' },
  { key: 'middag',  label: 'Middag',  emoji: '🌙' },
]

const WEEK_DAYS = ['Mån','Tis','Ons','Tor','Fre','Lör','Sön']

const DEFAULT_VITAMINS = ['D-vitamin', 'Omega-3', 'Magnesium', 'C-vitamin', 'Järn']

// AI-style nutrition tips keyed on what's missing from today's meals
const NUTRITION_TIPS: Record<string, string> = {
  protein:   'Protein saknas idag — lägg till ägg, kyckling eller linser',
  grönt:     'Grönsaker saknas — lägg till spenat, broccoli eller sallad',
  frukt:     'Frukt saknas — lägg till bär, äpple eller apelsin',
  fisk:      'D-vitamin kan vara lågt — lägg till lax, makrill eller ägg',
  fullkorn:  'Fullkorn saknas — byt till havre, råg eller quinoa',
}

const PROTEIN_WORDS  = ['kyckling','kyckl','lax','ägg','bönor','linser','tofu','köttfärs','nötkött','tonfisk','quorn']
const GREEN_WORDS    = ['spenat','broccoli','sallad','kål','zucchini','gurka','ärtor','böna','grön']
const FRUIT_WORDS    = ['bär','äpple','banan','apelsin','melon','mango','vindruv','frukt','smoothie']
const FISH_WORDS     = ['lax','fisk','sill','makrill','tonfisk','räkor']
const GRAIN_WORDS    = ['havre','råg','quinoa','fullkorn','knäcke','bulgur','dinkel']

function detectNutrition(meals: Meal[]): { label: string; ok: boolean }[] {
  const all = meals.map(m => m.name.toLowerCase()).join(' ')
  return [
    { label: 'Protein', ok: PROTEIN_WORDS.some(w => all.includes(w)) },
    { label: 'Grönt',   ok: GREEN_WORDS.some(w => all.includes(w)) },
    { label: 'Frukt',   ok: FRUIT_WORDS.some(w => all.includes(w)) },
    { label: 'Fisk',    ok: FISH_WORDS.some(w => all.includes(w)) },
    { label: 'Fullkorn',ok: GRAIN_WORDS.some(w => all.includes(w)) },
  ]
}

function getAiTip(meals: Meal[]): string | null {
  const all = meals.map(m => m.name.toLowerCase()).join(' ')
  if (!PROTEIN_WORDS.some(w => all.includes(w))) return NUTRITION_TIPS.protein
  if (!GREEN_WORDS.some(w => all.includes(w)))   return NUTRITION_TIPS.grönt
  if (!FRUIT_WORDS.some(w => all.includes(w)))   return NUTRITION_TIPS.frukt
  if (!FISH_WORDS.some(w => all.includes(w)))    return NUTRITION_TIPS.fisk
  if (!GRAIN_WORDS.some(w => all.includes(w)))   return NUTRITION_TIPS.fullkorn
  return null
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  meals: Meal[]
  vitaminLogs: VitaminLog[]
  members: Pick<FamilyMember, 'id' | 'name' | 'avatar_color' | 'role'>[]
  workspaceId: string
  currentMemberId: string
  today: string
  weekStart: string
  weekEnd: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MatClient({
  meals: initialMeals,
  vitaminLogs: initialLogs,
  members,
  workspaceId,
  currentMemberId,
  today,
  weekStart,
}: Props) {
  const supabase = createClient()
  const [meals, setMeals] = useState<Meal[]>(initialMeals)
  const [vitaminLogs, setVitaminLogs] = useState<VitaminLog[]>(initialLogs)
  const [activeTab, setActiveTab] = useState<'veckan' | 'vitaminer' | 'naring'>('veckan')
  const [showAdd, setShowAdd] = useState<{ date: string; meal_type: MealType } | null>(null)
  const [form, setForm] = useState({ name: '', recipe_url: '', notes: '' })
  const [saving, setSaving] = useState(false)

  // Build week dates array Mon–Sun
  const weekDates: string[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const todayMeals = meals.filter(m => m.date === today)
  const nutrition = detectNutrition(todayMeals)
  const aiTip = getAiTip(todayMeals)

  // ── Meal actions ─────────────────────────────────────────────────────────────

  async function addMeal() {
    if (!form.name.trim() || !showAdd) return
    setSaving(true)
    const { data, error } = await supabase.from('meals').insert({
      workspace_id: workspaceId,
      date: showAdd.date,
      meal_type: showAdd.meal_type,
      name: form.name.trim(),
      recipe_url: form.recipe_url.trim() || null,
      notes: form.notes.trim() || null,
    }).select().single()
    setSaving(false)
    if (error || !data) { bloom('Fel ❌', error?.message || ''); return }
    setMeals(prev => [...prev, data])
    setForm({ name: '', recipe_url: '', notes: '' })
    setShowAdd(null)
    bloom('Måltid tillagd! 🥗', form.name)
  }

  async function deleteMeal(id: string) {
    setMeals(prev => prev.filter(m => m.id !== id))
    await supabase.from('meals').delete().eq('id', id)
    bloom('Måltid borttagen', '')
  }

  // ── Vitamin actions ───────────────────────────────────────────────────────────

  async function toggleVitamin(memberId: string, vitamin: string) {
    const existing = vitaminLogs.find(
      v => v.member_id === memberId && v.vitamin === vitamin && v.date === today
    )
    if (existing) {
      const newTaken = !existing.taken
      setVitaminLogs(prev =>
        prev.map(v => v.id === existing.id ? { ...v, taken: newTaken } : v)
      )
      await supabase.from('vitamin_log')
        .update({ taken: newTaken })
        .eq('id', existing.id)
      if (newTaken) bloom(`💊 ${vitamin}`, 'Markerat som taget!')
    } else {
      const { data, error } = await supabase.from('vitamin_log').insert({
        workspace_id: workspaceId,
        member_id: memberId,
        date: today,
        vitamin,
        taken: true,
      }).select().single()
      if (!error && data) {
        setVitaminLogs(prev => [...prev, data])
        bloom(`💊 ${vitamin}`, 'Markerat som taget!')
      }
    }
  }

  function isTaken(memberId: string, vitamin: string): boolean {
    return vitaminLogs.some(
      v => v.member_id === memberId && v.vitamin === vitamin && v.taken
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="page-in max-w-xl mx-auto px-4 pt-14 pb-4">
      {/* Green background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-80px] right-[-60px] w-80 h-80 rounded-full opacity-10"
          style={{ background: '#00C896', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[100px] left-[-60px] w-64 h-64 rounded-full opacity-6"
          style={{ background: '#4CAF50', filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: '#555570' }}>
              Familjen
            </div>
            <h1 className="text-3xl font-extrabold" style={{ color: '#F2F2FF', letterSpacing: '-0.8px' }}>
              Mat &amp; Hälsa
            </h1>
          </div>
          <div className="text-3xl">🥦</div>
        </div>

        {/* Smoothie reminder card */}
        <SmoothieCard />

        {/* Tabs */}
        <div className="flex gap-2">
          {([
            { key: 'veckan',    label: 'Veckan',    emoji: '📅' },
            { key: 'vitaminer', label: 'Vitaminer', emoji: '💊' },
            { key: 'naring',    label: 'Näring',    emoji: '📊' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: activeTab === tab.key ? 'rgba(0,200,150,0.2)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.key ? '#00C896' : '#9898B8',
                border: activeTab === tab.key ? '1px solid rgba(0,200,150,0.4)' : '1px solid rgba(255,255,255,0.06)',
              }}>
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Veckan ── */}
        {activeTab === 'veckan' && (
          <div className="space-y-4">
            {weekDates.map((date, idx) => {
              const isToday = date === today
              const dayMeals = meals.filter(m => m.date === date)
              return (
                <div key={date}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: isToday ? 'rgba(0,200,150,0.07)' : '#1A1A2E',
                    border: isToday ? '1px solid rgba(0,200,150,0.3)' : '1px solid rgba(255,255,255,0.07)',
                  }}>
                  {/* Day header */}
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: isToday ? '#00C896' : '#F2F2FF' }}>
                        {WEEK_DAYS[idx]}
                      </span>
                      <span className="text-xs" style={{ color: '#555570' }}>
                        {formatDate(date)}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(0,200,150,0.2)', color: '#00C896' }}>
                          Idag
                        </span>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: '#555570' }}>{dayMeals.length} måltider</span>
                  </div>

                  {/* Meal slots */}
                  <div className="px-4 py-3 space-y-2">
                    {MEAL_TYPES.map(({ key, label, emoji }) => {
                      const slot = dayMeals.filter(m => m.meal_type === key)
                      return (
                        <div key={key}>
                          <div className="text-[10px] font-bold tracking-wider uppercase mb-1.5"
                            style={{ color: '#333355' }}>
                            {emoji} {label}
                          </div>
                          <div className="space-y-1">
                            {slot.map(meal => (
                              <div key={meal.id}
                                className="flex items-center justify-between px-3 py-2 rounded-xl"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-semibold" style={{ color: '#F2F2FF' }}>
                                    {meal.name}
                                  </span>
                                  {meal.recipe_url && (
                                    <span className="ml-2 text-[10px]" style={{ color: '#00C896' }}>🔗 recept</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => deleteMeal(meal.id)}
                                  className="ml-2 text-xs px-2 py-1 rounded-lg transition-all"
                                  style={{ color: '#555570' }}>
                                  ✕
                                </button>
                              </div>
                            ))}
                            {slot.length === 0 && (
                              <button
                                onClick={() => { setShowAdd({ date, meal_type: key }); setForm({ name: '', recipe_url: '', notes: '' }) }}
                                className="w-full py-2 rounded-xl text-xs font-semibold text-left px-3 transition-all"
                                style={{
                                  background: 'transparent',
                                  border: '1px dashed rgba(255,255,255,0.1)',
                                  color: '#555570',
                                }}>
                                + Lägg till {label.toLowerCase()}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Tab: Vitaminer ── */}
        {activeTab === 'vitaminer' && (
          <div className="space-y-4">
            <div className="rounded-2xl px-5 py-4"
              style={{ background: 'linear-gradient(135deg,#0A1A14,#051A0F)', border: '1px solid rgba(0,200,150,0.2)' }}>
              <div className="text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: 'rgba(0,200,150,0.7)' }}>
                Vitaminer idag
              </div>
              <div className="text-sm" style={{ color: '#9898B8' }}>
                Kryssa av vad varje familjemedlem tagit
              </div>
            </div>

            {members.map(member => {
              const takenCount = DEFAULT_VITAMINS.filter(v => isTaken(member.id, v)).length
              return (
                <div key={member.id} className="rounded-2xl overflow-hidden"
                  style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: member.avatar_color }}>
                        {member.name[0]}
                      </div>
                      <span className="font-bold text-sm" style={{ color: '#F2F2FF' }}>{member.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: '#00C896' }}>
                        {takenCount}/{DEFAULT_VITAMINS.length}
                      </span>
                      {takenCount === DEFAULT_VITAMINS.length && (
                        <span className="text-lg">🏆</span>
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-3 flex flex-wrap gap-2">
                    {DEFAULT_VITAMINS.map(vitamin => {
                      const taken = isTaken(member.id, vitamin)
                      return (
                        <button
                          key={vitamin}
                          onClick={() => toggleVitamin(member.id, vitamin)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                          style={{
                            background: taken ? 'rgba(0,200,150,0.15)' : 'rgba(255,255,255,0.05)',
                            border: taken ? '1px solid rgba(0,200,150,0.4)' : '1px solid rgba(255,255,255,0.07)',
                            color: taken ? '#00C896' : '#9898B8',
                          }}>
                          <span>{taken ? '✅' : '⬜'}</span>
                          {vitamin}
                        </button>
                      )
                    })}
                  </div>
                  {/* Streak indicator */}
                  <div className="px-4 pb-3">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ background: '#00C896', width: `${(takenCount / DEFAULT_VITAMINS.length) * 100}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Tab: Näring ── */}
        {activeTab === 'naring' && (
          <div className="space-y-4">
            {/* Today's nutrition status */}
            <div className="rounded-2xl px-5 py-4 space-y-3"
              style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-xs font-bold tracking-widest uppercase" style={{ color: '#555570' }}>
                Näringsstatus idag
              </div>
              <div className="grid grid-cols-1 gap-2">
                {nutrition.map(({ label, ok }) => (
                  <div key={label} className="flex items-center justify-between px-3 py-2 rounded-xl"
                    style={{
                      background: ok ? 'rgba(0,200,150,0.06)' : 'rgba(255,75,110,0.06)',
                      border: ok ? '1px solid rgba(0,200,150,0.15)' : '1px solid rgba(255,75,110,0.15)',
                    }}>
                    <span className="text-sm font-semibold" style={{ color: '#F2F2FF' }}>{label}</span>
                    <span>{ok ? '✅' : '⚠️'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI tip */}
            {aiTip ? (
              <div className="rounded-2xl px-5 py-4"
                style={{ background: 'linear-gradient(135deg,#111830,#0D1A12)', border: '1px solid rgba(123,110,255,0.25)' }}>
                <div className="text-xs font-bold tracking-wider uppercase mb-2" style={{ color: 'rgba(123,110,255,0.8)' }}>
                  🤖 AI-förslag
                </div>
                <div className="text-sm" style={{ color: '#C8C8E8' }}>
                  {aiTip}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl px-5 py-4 text-center"
                style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.2)' }}>
                <div className="text-2xl mb-1">🌟</div>
                <div className="font-bold text-sm" style={{ color: '#00C896' }}>Superbra idag!</div>
                <div className="text-xs mt-1" style={{ color: '#9898B8' }}>Ni har täckt alla viktiga näringskategorier</div>
              </div>
            )}

            {/* Kvällssmoothie recipe */}
            <div className="rounded-2xl px-5 py-4"
              style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-xs font-bold tracking-wider uppercase mb-2" style={{ color: '#555570' }}>
                🥤 Kvällssmoothie — recept
              </div>
              <div className="space-y-1.5">
                {['🍌 Banan', '🌿 Spenat', '🫚 Ingefära', '🥛 Havremjölk', '🫐 Blåbär'].map(item => (
                  <div key={item} className="text-sm" style={{ color: '#9898B8' }}>{item}</div>
                ))}
              </div>
              <div className="mt-3 text-xs font-semibold px-3 py-2 rounded-xl text-center"
                style={{ background: 'rgba(0,200,150,0.1)', color: '#00C896', border: '1px solid rgba(0,200,150,0.2)' }}>
                Mixa i 30 sek — klart!
              </div>
            </div>

            {/* Week summary */}
            <div className="rounded-2xl px-5 py-4"
              style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: '#555570' }}>
                Veckans matsedel — sammanfattning
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: '#9898B8' }}>Totalt planerade måltider</span>
                <span className="font-bold text-lg" style={{ color: '#F2F2FF' }}>{meals.length}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm" style={{ color: '#9898B8' }}>Antal måltidsdagar</span>
                <span className="font-bold text-lg" style={{ color: '#F2F2FF' }}>
                  {new Set(meals.map(m => m.date)).size}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Add meal modal ── */}
      {showAdd && (
        <>
          <div className="fixed inset-0 z-[60]"
            onClick={() => setShowAdd(null)}
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div className="fixed bottom-0 left-0 right-0 z-[70] md:left-auto md:right-4 md:bottom-4 md:w-96"
            style={{
              background: 'rgba(26,26,46,0.98)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px 20px 0 0',
              padding: '24px 20px',
            }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-4 md:hidden" style={{ background: 'rgba(255,255,255,0.15)' }} />
            <h3 className="font-bold text-base mb-4" style={{ color: '#F2F2FF' }}>
              {MEAL_TYPES.find(t => t.key === showAdd.meal_type)?.emoji}{' '}
              {MEAL_TYPES.find(t => t.key === showAdd.meal_type)?.label} — {formatDate(showAdd.date)}
            </h3>
            <div className="space-y-3">
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addMeal()}
                placeholder="Vad ska ni äta?"
                autoFocus
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#F2F2FF' }}
              />
              <input
                value={form.recipe_url}
                onChange={e => setForm(f => ({ ...f, recipe_url: e.target.value }))}
                placeholder="Receptlänk (valfritt)"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#F2F2FF' }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAdd(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm"
                  style={{ background: 'rgba(255,255,255,0.07)', color: '#9898B8' }}>
                  Avbryt
                </button>
                <button
                  onClick={addMeal}
                  disabled={saving || !form.name.trim()}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white"
                  style={{ background: saving || !form.name.trim() ? '#1A4035' : '#00C896' }}>
                  {saving ? 'Sparar...' : 'Spara'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SmoothieCard() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div className="rounded-2xl px-5 py-4 flex items-start justify-between gap-3"
      style={{ background: 'linear-gradient(135deg,#0A1A14,#081210)', border: '1px solid rgba(0,200,150,0.25)' }}>
      <div className="flex-1">
        <div className="text-xs font-bold tracking-wider uppercase mb-1" style={{ color: 'rgba(0,200,150,0.7)' }}>
          🥤 Smoothie-påminnelse
        </div>
        <div className="text-sm" style={{ color: '#C8C8E8' }}>
          Dags för kvällssmoothie! Recept: banan, spenat, ingefära
        </div>
      </div>
      <button onClick={() => setDismissed(true)}
        className="text-lg leading-none mt-0.5 flex-shrink-0"
        style={{ color: '#555570' }}>
        ✕
      </button>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}
