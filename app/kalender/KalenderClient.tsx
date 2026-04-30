'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { bloom } from '@/components/Bloom'

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

function startOfDay(d: Date) {
  const c = new Date(d); c.setHours(0, 0, 0, 0); return c
}

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

function getWeekDates(base: Date): Date[] {
  const day = base.getDay()
  const monday = new Date(base)
  monday.setDate(base.getDate() - ((day + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function formatTime(iso: string | null) {
  if (!iso) return ''
  if (iso.includes('T')) return iso.split('T')[1].slice(0, 5)
  return iso.slice(0, 5)
}

type Person = 'Franck' | 'Salona' | 'Familjen' | 'Båda'

const PERSON_COLOR: Record<Person, string> = {
  Franck:  '#5C4A7A',
  Salona:  '#8B3A52',
  Familjen: '#2D5A27',
  Båda:    '#3A6B8A',
}

interface CalEvent {
  id: string
  workspace_id: string
  title: string
  start_time: string | null
  end_time: string | null
  member_ids: string[]
  category: string
  color: string | null
  notes: string | null
  created_at: string
}

const GLASS = 'rgba(10,15,25,0.45)'
const GLASS_BORDER = '1px solid rgba(255,255,255,0.12)'
const GB_STYLE = 'saturate(180%) blur(20px)'

// ── Component ─────────────────────────────────────────────────────────────────

export default function KalenderClient() {
  const supabase = createClient()

  const todayBase = startOfDay(new Date())
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [weekBase, setWeekBase]         = useState(todayBase)
  const [selectedDate, setSelectedDate] = useState(todayBase)
  const [events, setEvents]             = useState<CalEvent[]>([])
  const [loading, setLoading]           = useState(true)
  const [showModal, setShowModal]       = useState(false)
  const [saving, setSaving]             = useState(false)
  const [form, setForm] = useState({
    title: '', date: toDateStr(todayBase),
    start: '', end: '', person: 'Familjen' as Person,
  })

  const weekDates = getWeekDates(weekBase)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: member } = await supabase
        .from('family_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single()
      if (member) setWorkspaceId(member.workspace_id)
      else setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!workspaceId) return
    loadEvents()
  }, [workspaceId, weekBase])

  async function loadEvents() {
    setLoading(true)
    const from = toDateStr(weekDates[0])
    const to   = toDateStr(weekDates[6])
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('start_time', from)
      .lte('start_time', to + 'T23:59:59')
      .order('start_time', { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }

  async function saveEvent() {
    if (!form.title.trim() || !workspaceId) return
    setSaving(true)
    const startISO = form.date + (form.start ? `T${form.start}:00` : 'T00:00:00')
    const endISO   = form.date + (form.end   ? `T${form.end}:00`   : 'T00:00:00')
    await supabase.from('calendar_events').insert({
      workspace_id: workspaceId,
      title: form.title.trim(),
      start_time: startISO,
      end_time: endISO,
      member_ids: [],
      category: form.person,
      color: PERSON_COLOR[form.person],
      notes: null,
    })
    setSaving(false)
    setShowModal(false)
    setForm({ title: '', date: toDateStr(selectedDate), start: '', end: '', person: 'Familjen' })
    bloom('Tillagd ✅', form.title)
    loadEvents()
  }

  function prevWeek() {
    const d = new Date(weekBase)
    d.setDate(d.getDate() - 7)
    setWeekBase(d)
    const newMonday = new Date(d)
    newMonday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    newMonday.setHours(0, 0, 0, 0)
    setSelectedDate(newMonday)
  }
  function nextWeek() {
    const d = new Date(weekBase)
    d.setDate(d.getDate() + 7)
    setWeekBase(d)
    const newMonday = new Date(d)
    newMonday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    newMonday.setHours(0, 0, 0, 0)
    setSelectedDate(newMonday)
  }

  const selectedStr = toDateStr(selectedDate)
  const todayStr    = toDateStr(todayBase)
  const dayEvents   = events.filter(e => e.start_time?.startsWith(selectedStr))

  function barColor(e: CalEvent) {
    if (e.color) return e.color
    return PERSON_COLOR[(e.category as Person)] ?? '#2D5A27'
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', paddingBottom: 100 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ padding: '32px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>Schema</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px', fontFamily: 'var(--sans)' }}>Kalender</h1>
        </div>
        <button
          onClick={() => { setShowModal(true); setForm(f => ({ ...f, date: selectedStr })) }}
          style={{ width: 44, height: 44, borderRadius: 14, background: '#2D5A27', color: 'white', fontSize: 24, fontWeight: 300, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
          +
        </button>
      </div>

      {/* Month/year label */}
      <div style={{ padding: '16px 24px 2px' }}>
        <p style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--serif)', textTransform: 'capitalize' }}>
          {weekDates[0].toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Week nav */}
      <div style={{ padding: '8px 24px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={prevWeek}
          style={{ padding: '5px 14px', borderRadius: 10, border: GLASS_BORDER, background: GLASS, backdropFilter: GB_STYLE, WebkitBackdropFilter: GB_STYLE, color: 'rgba(255,255,255,0.70)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          ‹ Förra
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>
          Vecka {getWeekNumber(weekDates[0])} ·{' '}
          {weekDates[0].toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}–{weekDates[6].toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
        </span>
        <button onClick={nextWeek}
          style={{ padding: '5px 14px', borderRadius: 10, border: GLASS_BORDER, background: GLASS, backdropFilter: GB_STYLE, WebkitBackdropFilter: GB_STYLE, color: 'rgba(255,255,255,0.70)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Nästa ›
        </button>
      </div>

      {/* Day strip */}
      <div style={{ padding: '8px 24px 0', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {weekDates.map((d, i) => {
          const ds        = toDateStr(d)
          const isToday   = ds === todayStr
          const isSelected = ds === selectedStr
          const hasEvents = events.some(e => e.start_time?.startsWith(ds))
          return (
            <button key={i} onClick={() => setSelectedDate(startOfDay(d))}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 2px 10px', borderRadius: 14, border: 'none', cursor: 'pointer', background: isSelected ? '#2D5A27' : 'transparent' }}>
              <span style={{ fontSize: 10, fontWeight: 600, marginBottom: 5, color: isSelected ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.45)' }}>
                {DAY_NAMES[i]}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: isToday && !isSelected ? 'rgba(255,255,255,0.20)' : 'transparent', color: isSelected ? 'white' : isToday ? '#FFFFFF' : '#FFFFFF' }}>
                {d.getDate()}
              </span>
              <div style={{ display: 'flex', gap: 2, marginTop: 4, minHeight: 5 }}>
                {events.filter(e => e.start_time?.startsWith(ds)).slice(0, 3).map((e, ei) => (
                  <span key={ei} style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.7)' : (e.color || '#2D5A27') }} />
                ))}
              </div>
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.10)', margin: '14px 24px 16px' }} />

      {/* Events for selected day */}
      <div style={{ padding: '0 24px' }}>
        <p style={{ fontSize: 19, fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--serif)', textTransform: 'capitalize', marginBottom: 14 }}>
          {selectedDate.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Laddar...</div>
        ) : dayEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', background: GLASS, backdropFilter: GB_STYLE, WebkitBackdropFilter: GB_STYLE, borderRadius: 20, border: GLASS_BORDER }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>📅</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>Inga händelser</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Tryck + för att lägga till</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dayEvents.map(ev => {
              const color = barColor(ev)
              return (
                <div key={ev.id} style={{ display: 'flex', background: GLASS, backdropFilter: GB_STYLE, WebkitBackdropFilter: GB_STYLE, borderRadius: 16, border: GLASS_BORDER, overflow: 'hidden' }}>
                  <div style={{ width: 4, background: color, flexShrink: 0 }} />
                  <div style={{ padding: '14px 16px', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.3 }}>{ev.title}</p>
                      {ev.category && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: color + '33', color, flexShrink: 0 }}>
                          {ev.category}
                        </span>
                      )}
                    </div>
                    {(ev.start_time || ev.end_time) && (
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 5 }}>
                        🕐 {formatTime(ev.start_time)}{ev.end_time && formatTime(ev.end_time) ? ` – ${formatTime(ev.end_time)}` : ''}
                      </p>
                    )}
                    {ev.notes && (
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)', marginTop: 4 }}>{ev.notes}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      </div>{/* end max-w-2xl */}

      {/* Add event modal */}
      {showModal && (
        <>
          <div onClick={() => setShowModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,5,15,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 60 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 70, background: 'rgba(15,20,35,0.92)', backdropFilter: 'saturate(180%) blur(28px)', WebkitBackdropFilter: 'saturate(180%) blur(28px)', borderRadius: '24px 24px 0 0', border: '1px solid rgba(255,255,255,0.14)', padding: '0 20px 48px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.20)', margin: '14px auto 22px' }} />
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', marginBottom: 22 }}>Ny händelse</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <ModalField label="Titel" placeholder="T.ex. Läkartid" value={form.title}
                onChange={v => setForm(f => ({ ...f, title: v }))} autoFocus />
              <ModalField label="Datum" type="date" value={form.date}
                onChange={v => setForm(f => ({ ...f, date: v }))} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <ModalField label="Tid från" type="time" value={form.start}
                  onChange={v => setForm(f => ({ ...f, start: v }))} />
                <ModalField label="Tid till" type="time" value={form.end}
                  onChange={v => setForm(f => ({ ...f, end: v }))} />
              </div>

              {/* Person picker */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 10 }}>Vem</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {(['Franck', 'Salona', 'Familjen', 'Båda'] as Person[]).map(p => (
                    <button key={p} onClick={() => setForm(f => ({ ...f, person: p }))}
                      style={{ padding: '10px 4px', borderRadius: 12, border: '1px solid', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        background: form.person === p ? PERSON_COLOR[p] : 'transparent',
                        borderColor: form.person === p ? PERSON_COLOR[p] : 'rgba(255,255,255,0.18)',
                        color: form.person === p ? 'white' : 'rgba(255,255,255,0.70)',
                      }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={saveEvent} disabled={saving || !form.title.trim()}
                style={{ width: '100%', height: 54, borderRadius: 16, border: 'none', fontSize: 16, fontWeight: 800, cursor: saving || !form.title.trim() ? 'not-allowed' : 'pointer',
                  background: saving || !form.title.trim() ? 'rgba(255,255,255,0.20)' : '#2D5A27', color: 'white', marginTop: 4 }}>
                {saving ? 'Sparar...' : 'Spara händelse'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Field helper ──────────────────────────────────────────────────────────────

function ModalField({ label, placeholder = '', value, onChange, type = 'text', autoFocus }: {
  label: string; placeholder?: string; value: string
  onChange: (v: string) => void; type?: string; autoFocus?: boolean
}) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 7 }}>
        {label}
      </label>
      <input type={type} placeholder={placeholder} value={value} autoFocus={autoFocus}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)', color: '#FFFFFF', fontSize: 15, outline: 'none', fontFamily: 'var(--sans)', boxSizing: 'border-box' }} />
    </div>
  )
}
