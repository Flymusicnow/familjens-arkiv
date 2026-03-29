'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    <div className="page-in max-w-3xl mx-auto px-6 py-10 pb-28 md:pb-14">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        <div className="absolute top-[-100px] right-[-80px] w-96 h-96 rounded-full opacity-10"
          style={{ background: '#FF4B6E', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#555570' }}>Ekonomi</div>
            <h1 className="text-4xl md:text-5xl font-black" style={{ color: '#F2F2FF', letterSpacing: '-1.5px' }}>Räkningar</h1>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-6 font-bold text-sm text-white rounded-2xl"
            style={{ background: '#FF4B6E', height: 56 }}>
            + Lägg till
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-3xl p-6" style={{ background: '#1A1A2E', border: '1px solid rgba(255,75,110,0.15)' }}>
            <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#FF4B6E' }}>Totalt</div>
            <div className="text-2xl font-black" style={{ color: '#F2F2FF', letterSpacing: '-0.5px' }}>{formatAmt(totalOwed)}</div>
          </div>
          <div className="rounded-3xl p-6" style={{ background: '#1A1A2E', border: '1px solid rgba(255,75,110,0.1)' }}>
            <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#FF4B6E' }}>Akuta</div>
            <div className="text-2xl font-black" style={{ color: '#F2F2FF' }}>{akut.length}</div>
          </div>
          <div className="rounded-3xl p-6" style={{ background: '#1A1A2E', border: '1px solid rgba(245,166,35,0.1)' }}>
            <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#F5A623' }}>Snart</div>
            <div className="text-2xl font-black" style={{ color: '#F2F2FF' }}>{snart.length}</div>
          </div>
        </div>

        {/* AKUT section */}
        <Section
          title="Akuta"
          emoji="🔴"
          color="#FF4B6E"
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
                <div key={bill.id} className="relative rounded-3xl overflow-hidden px-6 py-4 flex items-center gap-3"
                  style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.55 }}>
                  <div className="absolute left-0 w-1 rounded-full" style={{ background: '#00C896', top: 16, bottom: 16 }} />
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

      {/* Add bill modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 md:p-6"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div className="w-full max-w-lg rounded-3xl p-8 space-y-5"
            style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.09)' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-2xl" style={{ color: '#F2F2FF', letterSpacing: '-0.5px' }}>Ny räkning</h3>
              <button onClick={() => setShowAdd(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{ background: 'rgba(255,255,255,0.08)', color: '#9898B8' }}>
                ✕
              </button>
            </div>
            <Field label="Titel" placeholder="T.ex. Elräkning" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} />
            <Field label="Avsändare" placeholder="T.ex. Vattenfall" value={form.sender} onChange={v => setForm(f => ({ ...f, sender: v }))} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Belopp (kr)" placeholder="0" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} type="number" />
              <Field label="Förfallodatum" placeholder="" value={form.due_date} onChange={v => setForm(f => ({ ...f, due_date: v }))} type="date" />
            </div>
            <Field label="OCR-nummer" placeholder="Betalningsreferens" value={form.ocr_number} onChange={v => setForm(f => ({ ...f, ocr_number: v }))} />
            <button onClick={addBill} disabled={saving}
              className="w-full font-bold text-sm text-white rounded-2xl"
              style={{ background: saving ? '#4A4280' : '#FF4B6E', height: 56 }}>
              {saving ? 'Sparar...' : 'Spara räkning'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Sections ── */

interface SectionProps {
  title: string
  emoji: string
  color: string
  bills: Bill[]
  removing: Set<string>
  onPaid: (b: Bill) => void
  onSnooze: (b: Bill) => void
  emptyMsg: string
}

function Section({ title, emoji, color, bills, removing, onPaid, onSnooze, emptyMsg }: SectionProps) {
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
        <div className="rounded-3xl px-6 py-10 text-center flex flex-col items-center gap-3"
          style={{ background: 'linear-gradient(135deg,rgba(0,200,150,0.06),rgba(26,26,46,0.8))', border: '1px solid rgba(0,200,150,0.12)', minHeight: 140 }}>
          <span className="text-4xl">✅</span>
          <div className="font-bold text-base" style={{ color: '#F2F2FF' }}>{emptyMsg}</div>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {bills.map((bill, i) => !removing.has(bill.id) && (
              <motion.div
                key={bill.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
              >
                <div className="relative rounded-3xl overflow-hidden"
                  style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {/* Left accent bar */}
                  <div className="absolute left-0 w-1 rounded-full" style={{ background: color, top: 24, bottom: 24 }} />
                  <div className="pl-6 pr-5 py-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-base truncate" style={{ color: '#F2F2FF' }}>{bill.title}</div>
                        {bill.sender && (
                          <div className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{bill.sender}</div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-black text-xl leading-none" style={{ color }}>
                          {formatAmt(bill.amount)}
                        </div>
                        {bill.due_date && (
                          <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {formatDate(bill.due_date)}
                          </div>
                        )}
                      </div>
                    </div>
                    {bill.ocr_number && (
                      <div className="mb-4 px-4 py-2 rounded-xl text-xs font-mono" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)' }}>
                        OCR: {bill.ocr_number}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button onClick={() => onSnooze(bill)}
                        className="flex-1 text-sm font-semibold rounded-2xl"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', height: 48 }}>
                        💤 Snooze
                      </button>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onPaid(bill)}
                        className="flex-1 text-sm font-bold text-white rounded-2xl"
                        style={{ background: color, height: 48 }}>
                        ✓ Betald
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
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
      <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#9898B8' }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-2xl text-sm outline-none"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F2F2FF', padding: '16px 20px', height: 56 }} />
    </div>
  )
}
