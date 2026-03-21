'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { bloom } from '@/components/Bloom'
import type { Bill } from '@/lib/types'

interface Props {
  workspaceId: string
  memberId: string
  akutBills: Bill[]
  snartBills: Bill[]
  klarBills: Bill[]
}

function formatAmt(n: number | null) {
  if (!n) return '–'
  return n.toLocaleString('sv-SE') + ' kr'
}

function formatDate(d: string | null) {
  if (!d) return '–'
  return new Date(d + 'T12:00:00').toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

export default function RakningarClient({ workspaceId, memberId, akutBills: ia, snartBills: is_, klarBills: ik }: Props) {
  const supabase = createClient()
  const [akut, setAkut] = useState<Bill[]>(ia)
  const [snart, setSnart] = useState<Bill[]>(is_)
  const [klar, setKlar] = useState<Bill[]>(ik)
  const [removing, setRemoving] = useState<Set<string>>(new Set())
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', sender: '', amount: '', due_date: '', ocr_number: '' })

  // Real-time subscription
  useEffect(() => {
    if (workspaceId === 'guest') return
    const ch = supabase.channel('rakningar-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills', filter: `workspace_id=eq.${workspaceId}` }, payload => {
        if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Bill
          if (updated.status === 'betald' || updated.status === 'klar') {
            setAkut(prev => prev.filter(b => b.id !== updated.id))
            setSnart(prev => prev.filter(b => b.id !== updated.id))
            setKlar(prev => [updated, ...prev.filter(b => b.id !== updated.id)])
          } else if (updated.status === 'akut') {
            setKlar(prev => prev.filter(b => b.id !== updated.id))
            setSnart(prev => prev.filter(b => b.id !== updated.id))
            setAkut(prev => [updated, ...prev.filter(b => b.id !== updated.id)])
          } else {
            setKlar(prev => prev.filter(b => b.id !== updated.id))
            setAkut(prev => prev.filter(b => b.id !== updated.id))
            setSnart(prev => [updated, ...prev.filter(b => b.id !== updated.id)])
          }
        }
        if (payload.eventType === 'INSERT') {
          const b = payload.new as Bill
          if (b.status === 'akut') setAkut(prev => [b, ...prev])
          else if (b.status === 'snart') setSnart(prev => [b, ...prev])
          else setKlar(prev => [b, ...prev])
        }
        if (payload.eventType === 'DELETE') {
          const id = (payload.old as Bill).id
          setAkut(p => p.filter(b => b.id !== id))
          setSnart(p => p.filter(b => b.id !== id))
          setKlar(p => p.filter(b => b.id !== id))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [workspaceId])

  async function markPaid(bill: Bill) {
    setRemoving(prev => new Set([...prev, bill.id]))
    await new Promise(r => setTimeout(r, 320))
    await supabase.from('bills').update({
      status: 'betald',
      paid_by: memberId === 'guest' ? null : memberId,
      paid_at: new Date().toISOString(),
    }).eq('id', bill.id)
    bloom('Betald! ✅', `${bill.title} är betald`)
  }

  async function snoozeBill(bill: Bill) {
    if (workspaceId === 'guest') { bloom('Logga in', 'Du behöver vara inloggad för att snooze'); return }
    const triggerAt = new Date(Date.now() + 86400000).toISOString()
    await supabase.from('reminders').insert({
      workspace_id: workspaceId,
      title: `Påminnelse: ${bill.title}`,
      body: bill.due_date ? `Förfaller ${formatDate(bill.due_date)}` : undefined,
      trigger_at: triggerAt,
      linked_type: 'bill',
      linked_id: bill.id,
    })
    bloom('Snooze 💤', `Påminnelse imorgon för ${bill.title}`)
  }

  async function addBill() {
    if (!form.title.trim()) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const week = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    const due = form.due_date || null
    const status = !due || due <= today ? 'akut' : due <= week ? 'snart' : 'klar'
    await supabase.from('bills').insert({
      workspace_id: workspaceId,
      title: form.title.trim(),
      sender: form.sender.trim() || null,
      amount: form.amount ? parseFloat(form.amount) : null,
      due_date: due,
      ocr_number: form.ocr_number.trim() || null,
      status,
      source: 'manual',
    })
    setSaving(false)
    setForm({ title: '', sender: '', amount: '', due_date: '', ocr_number: '' })
    setShowAdd(false)
    bloom('Tillagd! 📋', form.title)
  }

  const totalOwed = [...akut, ...snart].reduce((s, b) => s + (b.amount || 0), 0)

  return (
    <div className="page-in max-w-xl mx-auto px-4 pt-14 pb-28 md:pb-8">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        <div className="absolute top-[-100px] right-[-80px] w-96 h-96 rounded-full opacity-10"
          style={{ background: '#FF4B6E', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: '#555570' }}>Ekonomi</div>
            <h1 className="text-2xl font-extrabold" style={{ color: '#F2F2FF', letterSpacing: '-0.5px' }}>Räkningar</h1>
          </div>
          <button onClick={() => setShowAdd(s => !s)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ background: '#FF4B6E', minHeight: 44 }}>
            + Lägg till
          </button>
        </div>

        {/* Summary bar */}
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,#2a0d14,#1a0a0f)', border: '1px solid rgba(255,75,110,0.25)' }}>
          <div className="text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Totalt att betala</div>
          <div className="text-3xl font-extrabold" style={{ color: '#fff', letterSpacing: '-1px' }}>{formatAmt(totalOwed)}</div>
          <div className="flex gap-3 mt-3 flex-wrap">
            <StatusChip label={`${akut.length} akuta`} color="#FF4B6E" />
            <StatusChip label={`${snart.length} snart`} color="#F5A623" />
            <StatusChip label={`${klar.length} betalda`} color="#00C896" />
          </div>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="rounded-2xl p-5 space-y-3" style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.09)' }}>
            <h3 className="font-bold" style={{ color: '#F2F2FF' }}>Ny räkning</h3>
            <Field label="Titel" placeholder="T.ex. Elräkning" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} />
            <Field label="Avsändare" placeholder="T.ex. Vattenfall" value={form.sender} onChange={v => setForm(f => ({ ...f, sender: v }))} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Belopp (kr)" placeholder="0" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} type="number" />
              <Field label="Förfallodatum" placeholder="" value={form.due_date} onChange={v => setForm(f => ({ ...f, due_date: v }))} type="date" />
            </div>
            <Field label="OCR-nummer" placeholder="Betalningsreferens" value={form.ocr_number} onChange={v => setForm(f => ({ ...f, ocr_number: v }))} />
            <button onClick={addBill} disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: saving ? '#4A4280' : '#7B6EFF', minHeight: 48 }}>
              {saving ? 'Sparar...' : 'Spara räkning'}
            </button>
          </div>
        )}

        {/* AKUT section */}
        <Section
          title="Akuta"
          emoji="🔴"
          color="#FF4B6E"
          bg="linear-gradient(135deg, #2a0d14, #1a0a0f)"
          border="rgba(255,75,110,0.25)"
          bills={akut}
          removing={removing}
          onPaid={markPaid}
          onSnooze={snoozeBill}
          emptyMsg="Inga akuta räkningar 🎉"
        />

        {/* SNART section */}
        <Section
          title="Snart förfaller"
          emoji="🟡"
          color="#F5A623"
          bg="linear-gradient(135deg, #1e1500, #140e00)"
          border="rgba(245,166,35,0.2)"
          bills={snart}
          removing={removing}
          onPaid={markPaid}
          onSnooze={snoozeBill}
          emptyMsg="Inga räkningar inom 7 dagar"
        />

        {/* KLARA section */}
        {klar.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">✅</span>
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#00C896' }}>Betalda</h2>
            </div>
            <div className="space-y-2">
              {klar.slice(0, 10).map(bill => (
                <div key={bill.id} className="rounded-2xl px-5 py-3 flex items-center gap-3"
                  style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.55 }}>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: '#F2F2FF', textDecoration: 'line-through' }}>{bill.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#9898B8' }}>{bill.sender} · {formatAmt(bill.amount)}</div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(0,200,150,0.12)', color: '#00C896' }}>BETALD</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Sections ── */

interface SectionProps {
  title: string
  emoji: string
  color: string
  bg: string
  border: string
  bills: Bill[]
  removing: Set<string>
  onPaid: (b: Bill) => void
  onSnooze: (b: Bill) => void
  emptyMsg: string
}

function Section({ title, emoji, color, bg, border, bills, removing, onPaid, onSnooze, emptyMsg }: SectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{emoji}</span>
        <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color }}>{title}</h2>
        {bills.length > 0 && (
          <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>
            {bills.length}
          </span>
        )}
      </div>

      {bills.length === 0 ? (
        <div className="rounded-2xl px-5 py-6 text-center" style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-sm" style={{ color: '#9898B8' }}>{emptyMsg}</div>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map(bill => (
            <div key={bill.id}
              className={removing.has(bill.id) ? 'slide-out' : ''}
              style={{ overflow: 'hidden', borderRadius: 20 }}>
              <div className="rounded-2xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[15px] truncate" style={{ color: '#F2F2FF' }}>{bill.title}</div>
                    {bill.sender && (
                      <div className="text-xs mt-0.5" style={{ color: '#9898B8' }}>{bill.sender}</div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-extrabold text-lg leading-none" style={{ color }}>
                      {formatAmt(bill.amount)}
                    </div>
                    {bill.due_date && (
                      <div className="text-xs mt-1" style={{ color: '#9898B8' }}>Förfaller {formatDate(bill.due_date)}</div>
                    )}
                  </div>
                </div>
                {bill.ocr_number && (
                  <div className="mb-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <span className="text-xs" style={{ color: '#555570' }}>OCR: </span>
                    <span className="text-xs font-mono font-bold" style={{ color: '#9898B8' }}>{bill.ocr_number}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => onSnooze(bill)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: 'rgba(255,255,255,0.07)', color: '#9898B8', minHeight: 44 }}>
                    💤 Snooze
                  </button>
                  <button onClick={() => onPaid(bill)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: color, minHeight: 44 }}>
                    ✓ Betald
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Sub-components ── */

function StatusChip({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{ background: `${color}18`, color }}>
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </div>
  )
}

function Field({ label, placeholder, value, onChange, type = 'text' }: {
  label: string; placeholder: string; value: string
  onChange: (v: string) => void; type?: string
}) {
  return (
    <div>
      <label className="text-xs font-semibold mb-1 block" style={{ color: '#9898B8' }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F2F2FF', minHeight: 44 }} />
    </div>
  )
}
