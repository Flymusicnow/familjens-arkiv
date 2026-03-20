'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { bloom } from '@/components/Bloom'
import type { Bill } from '@/lib/types'

interface Props {
  workspaceId: string
  memberId: string
  initialBills: Bill[]
  initialPaid: Bill[]
}

function getStatus(bill: Bill): { label: string; color: string; bg: string } {
  const today = new Date().toISOString().split('T')[0]
  const week = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  if (!bill.due_date || bill.due_date <= today) return { label: 'AKUT', color: '#FF4B6E', bg: 'rgba(255,75,110,0.12)' }
  if (bill.due_date <= week) return { label: 'SNART', color: '#F5A623', bg: 'rgba(245,166,35,0.12)' }
  return { label: 'KLAR', color: '#00C896', bg: 'rgba(0,200,150,0.12)' }
}

function formatAmt(n: number | null) {
  if (!n) return '–'
  return n.toLocaleString('sv-SE') + ' kr'
}

export default function EkonomiClient({ workspaceId, memberId, initialBills, initialPaid }: Props) {
  const supabase = createClient()
  const [bills, setBills] = useState<Bill[]>(initialBills)
  const [paid, setPaid] = useState<Bill[]>(initialPaid)
  const [removing, setRemoving] = useState<Set<string>>(new Set())
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<'all' | 'akut' | 'snart'>('all')

  // Add-bill form state
  const [form, setForm] = useState({ title: '', sender: '', amount: '', due_date: '' })
  const [saving, setSaving] = useState(false)

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('bills-realtime')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'bills',
        filter: `workspace_id=eq.${workspaceId}`,
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setBills(prev => [payload.new as Bill, ...prev].filter(b => b.status !== 'betald'))
        }
        if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Bill
          if (updated.status === 'betald') {
            setBills(prev => prev.filter(b => b.id !== updated.id))
            setPaid(prev => [updated, ...prev])
          } else {
            setBills(prev => prev.map(b => b.id === updated.id ? updated : b))
          }
        }
        if (payload.eventType === 'DELETE') {
          setBills(prev => prev.filter(b => b.id !== (payload.old as Bill).id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [workspaceId])

  async function markPaid(bill: Bill) {
    setRemoving(prev => new Set([...prev, bill.id]))
    await new Promise(r => setTimeout(r, 320)) // let slide animation play
    await supabase.from('bills').update({
      status: 'betald',
      paid_by: memberId,
      paid_at: new Date().toISOString(),
    }).eq('id', bill.id)
    bloom('Betald! ✅', `${bill.title} är markerad som betald`)
  }

  async function addBill() {
    if (!form.title.trim()) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const week = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    const due = form.due_date || null
    const status = !due || due <= today ? 'akut' : due <= week ? 'snart' : 'klar'

    const { error } = await supabase.from('bills').insert({
      workspace_id: workspaceId,
      title: form.title.trim(),
      sender: form.sender.trim() || null,
      amount: form.amount ? parseFloat(form.amount) : null,
      due_date: due,
      status,
      source: 'manual',
    })
    setSaving(false)
    if (error) { bloom('Fel ❌', error.message); return }
    setForm({ title: '', sender: '', amount: '', due_date: '' })
    setShowAdd(false)
    bloom('Tillagd! 📋', form.title)
  }

  const filtered = bills.filter(b => {
    if (filter === 'all') return true
    const s = getStatus(b)
    return s.label.toLowerCase() === filter
  })

  const totalOwed = bills.reduce((s, b) => s + (b.amount || 0), 0)

  return (
    <div className="page-in max-w-xl mx-auto px-4 pt-14 pb-4">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-100px] right-[-80px] w-96 h-96 rounded-full opacity-10"
          style={{ background: '#F5A623', filter: 'blur(80px)' }} />
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
            style={{ background: '#7B6EFF' }}>
            + Lägg till
          </button>
        </div>

        {/* Summary */}
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,#1A1040,#0D0D28)', border: '1px solid rgba(123,110,255,0.25)' }}>
          <div className="text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Totalt att betala</div>
          <div className="text-3xl font-extrabold" style={{ color: '#fff', letterSpacing: '-1px' }}>{formatAmt(totalOwed)}</div>
          <div className="flex gap-4 mt-3">
            <Chip label={`${bills.filter(b => getStatus(b).label === 'AKUT').length} akuta`} color="#FF4B6E" />
            <Chip label={`${bills.filter(b => getStatus(b).label === 'SNART').length} snart`} color="#F5A623" />
            <Chip label={`${paid.length} betalda`} color="#00C896" />
          </div>
        </div>

        {/* Add bill form */}
        {showAdd && (
          <div className="rounded-2xl p-5 space-y-3" style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.09)' }}>
            <h3 className="font-bold" style={{ color: '#F2F2FF' }}>Ny räkning</h3>
            <Field label="Titel" placeholder="T.ex. Elräkning" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} />
            <Field label="Avsändare" placeholder="T.ex. Vattenfall" value={form.sender} onChange={v => setForm(f => ({ ...f, sender: v }))} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Belopp (kr)" placeholder="0" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} type="number" />
              <Field label="Förfallodatum" placeholder="" value={form.due_date} onChange={v => setForm(f => ({ ...f, due_date: v }))} type="date" />
            </div>
            <button onClick={addBill} disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: saving ? '#4A4280' : '#7B6EFF' }}>
              {saving ? 'Sparar...' : 'Spara räkning'}
            </button>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['all', 'akut', 'snart'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                background: filter === f ? '#7B6EFF' : 'rgba(255,255,255,0.05)',
                color: filter === f ? 'white' : '#9898B8',
              }}>
              {f === 'all' ? 'Alla' : f === 'akut' ? '🚨 Akuta' : '⏰ Snart'}
            </button>
          ))}
        </div>

        {/* Bills list */}
        {filtered.length === 0 && (
          <EmptyState />
        )}

        <div className="space-y-2">
          {filtered.map(bill => {
            const s = getStatus(bill)
            const isRemoving = removing.has(bill.id)
            return (
              <div key={bill.id}
                className={isRemoving ? 'slide-out' : ''}
                style={{ overflow: 'hidden', borderRadius: 16 }}>
                <div className="rounded-2xl px-5 py-4 flex items-center gap-3"
                  style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: s.bg }}>
                    <span style={{ color: s.color, fontSize: 18 }}>💳</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[15px] truncate" style={{ color: '#F2F2FF' }}>{bill.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#9898B8' }}>
                      {bill.sender && `${bill.sender} · `}
                      {bill.due_date && `Förfaller ${bill.due_date}`}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="font-extrabold text-[15px]" style={{ color: s.color }}>
                      {formatAmt(bill.amount)}
                    </span>
                    <button onClick={() => markPaid(bill)}
                      className="text-xs px-3 py-1.5 rounded-lg font-bold"
                      style={{ background: s.bg, color: s.color }}>
                      Betald ✓
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Paid section */}
        {paid.length > 0 && (
          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#555570' }}>
              ✅ Betalda
            </h3>
            <div className="space-y-2">
              {paid.map(bill => (
                <div key={bill.id} className="rounded-2xl px-5 py-3 flex items-center gap-3 opacity-50"
                  style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: '#F2F2FF', textDecoration: 'line-through' }}>{bill.title}</div>
                    <div className="text-xs" style={{ color: '#9898B8' }}>{formatAmt(bill.amount)}</div>
                  </div>
                  <span className="text-xs font-bold" style={{ color: '#00C896' }}>BETALD</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function Chip({ label, color }: { label: string; color: string }) {
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
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F2F2FF' }} />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">🎉</div>
      <div className="font-bold" style={{ color: '#F2F2FF' }}>Inga räkningar!</div>
      <div className="text-sm mt-1" style={{ color: '#9898B8' }}>Allt är betalt eller inga räkningar tillagda</div>
    </div>
  )
}
