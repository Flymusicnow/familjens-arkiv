'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { bloom } from '@/components/Bloom'
import { PageWrapper } from '@/components/PageWrapper'
import { PageHeader } from '@/components/PageHeader'
import type { Meal, VitaminLog, FamilyMember, MealType } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_TYPES: { key: MealType; label: string; emoji: string }[] = [
  { key: 'frukost', label: 'Frukost', emoji: '🌅' },
  { key: 'lunch',   label: 'Lunch',   emoji: '☀️' },
  { key: 'middag',  label: 'Middag',  emoji: '🌙' },
]

const WEEK_DAYS = ['Mån','Tis','Ons','Tor','Fre','Lör','Sön']

const DEFAULT_VITAMINS = ['D-vitamin', 'Omega-3', 'Magnesium', 'C-vitamin', 'Järn']

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

const GLASS = 'rgba(10,15,25,0.45)'
const GB = { backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)' }
const GLASS_BORDER = '1px solid rgba(255,255,255,0.12)'

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
    <PageWrapper>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-80px] right-[-60px] w-80 h-80 rounded-full opacity-[0.12]"
          style={{ background: '#6AA860', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-xl mx-auto space-y-6">
        <PageHeader
          eyebrow="Familjen"
          title="Mat & Hälsa"
          action={<div className="text-4xl">🥦</div>}
        />

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
              className="flex-1 h-[48px] rounded-xl text-sm font-bold transition-all"
              style={{
                background: activeTab === tab.key ? '#2D5A27' : 'rgba(255,255,255,0.08)',
                color: activeTab === tab.key ? 'white' : 'rgba(255,255,255,0.55)',
                border: activeTab === tab.key ? 'none' : GLASS_BORDER,
              }}>
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Veckan ── */}
        {activeTab === 'veckan' && (
          <div className="space-y-4">
            {/* AI-matförslag box */}
            <div className="rounded-2xl p-5"
              style={{ background: 'rgba(45,90,39,0.22)', ...GB, border: '1px solid rgba(45,90,39,0.40)' }}>
              <h4 className="font-bold text-sm flex items-center gap-2 mb-2" style={{ color: '#6AA860' }}>
                ✨ AI-matförslag
              </h4>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: 'rgba(255,255,255,0.70)' }}>
                Beskriv vad ni vill äta så skapar AI ett komplett veckoschema med recept.
              </p>
              <div className="flex gap-2">
                <button className="flex-1 h-[48px] rounded-xl font-bold text-[13px] text-white"
                  style={{ background: '#6AA860' }}>
                  🥗 Skapa vegetariskt
                </button>
                <button className="h-[48px] px-[18px] rounded-xl font-semibold text-[13px]"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}>
                  ✏️ Manuellt
                </button>
              </div>
            </div>

            {weekDates.map((date, idx) => {
              const isToday = date === today
              const dayMeals = meals.filter(m => m.date === date)
              return (
                <div key={date}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: isToday ? 'rgba(106,168,96,0.15)' : GLASS,
                    ...GB,
                    border: isToday ? '1px solid rgba(106,168,96,0.35)' : GLASS_BORDER,
                  }}>
                  {/* Day header */}
                  <div className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold" style={{ color: isToday ? '#6AA860' : '#FFFFFF' }}>
                          {WEEK_DAYS[idx]}
                        </span>
                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                          {formatDate(date)}
                        </span>
                        {isToday && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(106,168,96,0.25)', color: '#6AA860' }}>
                            Idag
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {dayMeals.length} måltider
                    </span>
                  </div>

                  {/* Meal slots */}
                  {MEAL_TYPES.map(({ key, label, emoji }, mIdx) => {
                    const slot = dayMeals.filter(m => m.meal_type === key)
                    return (
                      <div key={key} className="flex items-center justify-between px-5 py-4"
                        style={{ borderBottom: mIdx < MEAL_TYPES.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl leading-none">{emoji}</span>
                          <div>
                            <p className="text-[10px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
                            {slot.length > 0 ? (
                              slot.map(meal => (
                                <div key={meal.id} className="flex items-center gap-2">
                                  <p className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>{meal.name}</p>
                                  <button onClick={() => deleteMeal(meal.id)} className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>✕</button>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.40)' }}>Lägg till...</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => { setShowAdd({ date, meal_type: key }); setForm({ name: '', recipe_url: '', notes: '' }) }}
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-light flex-shrink-0"
                          style={{ background: 'rgba(255,255,255,0.08)', border: '1px dashed rgba(106,168,96,0.45)', color: 'rgba(255,255,255,0.55)' }}>
                          +
                        </button>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Tab: Vitaminer ── */}
        {activeTab === 'vitaminer' && (
          <div className="space-y-4">
            <div className="rounded-2xl px-5 py-4"
              style={{ background: 'rgba(106,168,96,0.18)', ...GB, border: '1px solid rgba(106,168,96,0.35)' }}>
              <div className="text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: '#6AA860' }}>
                Vitaminer idag
              </div>
              <div className="text-sm" style={{ color: 'rgba(255,255,255,0.70)' }}>
                Kryssa av vad varje familjemedlem tagit
              </div>
            </div>

            {members.map(member => {
              const takenCount = DEFAULT_VITAMINS.filter(v => isTaken(member.id, v)).length
              return (
                <div key={member.id} className="rounded-2xl overflow-hidden"
                  style={{ background: GLASS, ...GB, border: GLASS_BORDER }}>
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: member.avatar_color }}>
                        {member.name[0]}
                      </div>
                      <span className="font-bold text-sm" style={{ color: '#FFFFFF' }}>{member.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: '#6AA860' }}>
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
                            background: taken ? 'rgba(106,168,96,0.25)' : 'rgba(255,255,255,0.08)',
                            border: taken ? '1px solid rgba(106,168,96,0.45)' : GLASS_BORDER,
                            color: taken ? '#6AA860' : 'rgba(255,255,255,0.60)',
                          }}>
                          <span>{taken ? '✅' : '⬜'}</span>
                          {vitamin}
                        </button>
                      )
                    })}
                  </div>
                  {/* Streak indicator */}
                  <div className="px-4 pb-3">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ background: '#6AA860', width: `${(takenCount / DEFAULT_VITAMINS.length) * 100}%` }} />
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
              style={{ background: GLASS, ...GB, border: GLASS_BORDER }}>
              <div className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Näringsstatus idag
              </div>
              <div className="grid grid-cols-1 gap-2">
                {nutrition.map(({ label, ok }) => (
                  <div key={label} className="flex items-center justify-between px-3 py-2 rounded-xl"
                    style={{
                      background: ok ? 'rgba(90,154,80,0.20)' : 'rgba(196,96,64,0.20)',
                      border: ok ? '1px solid rgba(90,154,80,0.35)' : '1px solid rgba(196,96,64,0.35)',
                    }}>
                    <span className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>{label}</span>
                    <span>{ok ? '✅' : '⚠️'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI tip */}
            {aiTip ? (
              <div className="rounded-2xl px-5 py-4"
                style={{ background: 'rgba(100,80,180,0.22)', ...GB, border: '1px solid rgba(100,80,180,0.40)' }}>
                <div className="text-xs font-bold tracking-wider uppercase mb-2" style={{ color: '#A78BFA' }}>
                  🤖 AI-förslag
                </div>
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {aiTip}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl px-5 py-4 text-center"
                style={{ background: 'rgba(90,154,80,0.22)', ...GB, border: '1px solid rgba(90,154,80,0.35)' }}>
                <div className="text-2xl mb-1">🌟</div>
                <div className="font-bold text-sm" style={{ color: '#5A9A50' }}>Superbra idag!</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Ni har täckt alla viktiga näringskategorier</div>
              </div>
            )}

            {/* Kvällssmoothie recipe */}
            <div className="rounded-2xl px-5 py-4"
              style={{ background: GLASS, ...GB, border: GLASS_BORDER }}>
              <div className="text-xs font-bold tracking-wider uppercase mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
                🥤 Kvällssmoothie — recept
              </div>
              <div className="space-y-1.5">
                {['🍌 Banan', '🌿 Spenat', '🫚 Ingefära', '🥛 Havremjölk', '🫐 Blåbär'].map(item => (
                  <div key={item} className="text-sm" style={{ color: 'rgba(255,255,255,0.70)' }}>{item}</div>
                ))}
              </div>
              <div className="mt-3 text-xs font-semibold px-3 py-2 rounded-xl text-center"
                style={{ background: 'rgba(90,154,80,0.20)', color: '#5A9A50', border: '1px solid rgba(90,154,80,0.30)' }}>
                Mixa i 30 sek — klart!
              </div>
            </div>

            <div className="rounded-2xl px-5 py-4"
              style={{ background: GLASS, ...GB, border: GLASS_BORDER }}>
              <div className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Veckans matsedel — sammanfattning
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.70)' }}>Totalt planerade måltider</span>
                <span className="font-bold text-lg" style={{ color: '#FFFFFF' }}>{meals.length}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.70)' }}>Antal måltidsdagar</span>
                <span className="font-bold text-lg" style={{ color: '#FFFFFF' }}>
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
            style={{ background: 'rgba(0,5,15,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} />
          <div className="fixed bottom-0 left-0 right-0 z-[70] md:left-auto md:right-4 md:bottom-4 md:w-96"
            style={{
              background: 'rgba(15,20,35,0.92)',
              backdropFilter: 'saturate(180%) blur(28px)',
              WebkitBackdropFilter: 'saturate(180%) blur(28px)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '20px 20px 0 0',
              padding: '24px 20px',
            }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-4 md:hidden" style={{ background: 'rgba(255,255,255,0.20)' }} />
            <h3 className="font-bold text-base mb-4" style={{ color: '#FFFFFF' }}>
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
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#FFFFFF' }}
              />
              <input
                value={form.recipe_url}
                onChange={e => setForm(f => ({ ...f, recipe_url: e.target.value }))}
                placeholder="Receptlänk (valfritt)"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#FFFFFF' }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAdd(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.70)' }}>
                  Avbryt
                </button>
                <button
                  onClick={addMeal}
                  disabled={saving || !form.name.trim()}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white"
                  style={{ background: saving || !form.name.trim() ? 'rgba(255,255,255,0.20)' : '#6AA860' }}>
                  {saving ? 'Sparar...' : 'Spara'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </PageWrapper>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SmoothieCard() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div className="rounded-2xl px-5 py-4 flex items-start justify-between gap-3"
      style={{ background: 'rgba(45,90,39,0.35)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', border: '1px solid rgba(45,90,39,0.55)' }}>
      <div className="flex-1">
        <div className="text-xs font-bold tracking-wider uppercase mb-1" style={{ color: '#6AA860' }}>
          🥤 Smoothie-påminnelse
        </div>
        <div className="text-sm" style={{ color: 'rgba(255,255,255,0.80)' }}>
          Dags för kvällssmoothie! Recept: banan, spenat, ingefära
        </div>
      </div>
      <button onClick={() => setDismissed(true)}
        className="text-lg leading-none mt-0.5 flex-shrink-0"
        style={{ color: 'rgba(255,255,255,0.45)' }}>
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
