'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { bloom } from '@/components/Bloom'
import { PageWrapper } from '@/components/PageWrapper'
import { PageHeader } from '@/components/PageHeader'

// ─── Types ────────────────────────────────────────────────────────────────────

type EType = 'inkomst' | 'utgift' | 'deklaration' | 'prenumeration'
type EStatus = 'klar' | 'aktiv' | 'väntar' | 'akut'

interface Entry {
  id: string
  workspace_id: string | null
  type: EType
  category: string
  description: string
  amount: number
  status: EStatus
  month: string
  note: string | null
}

interface Props {
  workspaceId: string
  memberId: string
  initialEntries: Entry[]
}

// ─── Default data (Franck) ────────────────────────────────────────────────────

const DEFAULTS: Entry[] = [
  { id:'d1',  workspace_id:null, type:'deklaration',    category:'aterbetalning', description:'Grundåterbäring (lön + ränta)',  amount:39857, status:'klar',   month:'2025',    note:null },
  { id:'d2',  workspace_id:null, type:'deklaration',    category:'aterbetalning', description:'NE-bilaga underskott',           amount:14500, status:'klar',   month:'2025',    note:null },
  { id:'d3',  workspace_id:null, type:'deklaration',    category:'aterbetalning', description:'Trading-förlust Vantage',        amount:2086,  status:'väntar', month:'2025',    note:'Behöver årsbesked' },
  { id:'d4',  workspace_id:null, type:'deklaration',    category:'aterbetalning', description:'Krypto-förlust USDC',            amount:4200,  status:'väntar', month:'2025',    note:'Kolla Revolut' },
  { id:'d5',  workspace_id:null, type:'deklaration',    category:'aterbetalning', description:'Moms ingående',                  amount:1024,  status:'klar',   month:'2025',    note:null },
  { id:'d6',  workspace_id:null, type:'inkomst',        category:'bidrag',        description:'Studiebidrag Franck',            amount:15000, status:'aktiv',  month:'2026-04', note:null },
  { id:'d7',  workspace_id:null, type:'inkomst',        category:'bidrag',        description:'Studiebidrag Salona',            amount:15000, status:'aktiv',  month:'2026-04', note:null },
  { id:'d8',  workspace_id:null, type:'inkomst',        category:'bidrag',        description:'Barnbidrag + omvård',            amount:4713,  status:'aktiv',  month:'2026-04', note:null },
  { id:'d9',  workspace_id:null, type:'inkomst',        category:'venture',       description:'Salonas Massage',                amount:8000,  status:'aktiv',  month:'2026-04', note:'Växer 📈' },
  { id:'d10', workspace_id:null, type:'inkomst',        category:'venture',       description:'Trading XAUUSD',                 amount:8500,  status:'aktiv',  month:'2026-04', note:'Aktiv 📈' },
  { id:'d11', workspace_id:null, type:'inkomst',        category:'venture',       description:'FlyMusic',                       amount:12000, status:'aktiv',  month:'2026-04', note:'Aktiv 📈' },
  { id:'d12', workspace_id:null, type:'utgift',         category:'boende',        description:'Hyra',                           amount:9500,  status:'akut',   month:'2026-04', note:'Kritisk 🔴' },
  { id:'d13', workspace_id:null, type:'utgift',         category:'mat',           description:'Mat',                            amount:6000,  status:'aktiv',  month:'2026-04', note:null },
  { id:'d14', workspace_id:null, type:'utgift',         category:'räkningar',     description:'Telia',                          amount:459,   status:'akut',   month:'2026-04', note:'Betala nu 🔴' },
  { id:'d15', workspace_id:null, type:'utgift',         category:'räkningar',     description:'El (Vattenfall)',                amount:450,   status:'akut',   month:'2026-04', note:'Betala nu 🔴' },
  { id:'d16', workspace_id:null, type:'utgift',         category:'prenumeration', description:'Netflix',                        amount:169,   status:'klar',   month:'2026-04', note:null },
  { id:'d17', workspace_id:null, type:'utgift',         category:'prenumeration', description:'Spotify Familj',                 amount:219,   status:'klar',   month:'2026-04', note:null },
  { id:'d18', workspace_id:null, type:'deklaration',    category:'underlag',      description:'Lovable Labs ×10',               amount:6820,  status:'klar',   month:'2025',    note:'Verktyg & Dev' },
  { id:'d19', workspace_id:null, type:'deklaration',    category:'underlag',      description:'StackBlitz/Bolt.new ×5',         amount:3120,  status:'klar',   month:'2025',    note:'Verktyg & Dev' },
  { id:'d20', workspace_id:null, type:'deklaration',    category:'underlag',      description:'Anthropic/Claude Pro ×2',        amount:414,   status:'klar',   month:'2025',    note:'Verktyg & Dev' },
  { id:'d21', workspace_id:null, type:'deklaration',    category:'underlag',      description:'Suno Premier ×3',                amount:856,   status:'klar',   month:'2025',    note:'Verktyg & Dev' },
  { id:'d22', workspace_id:null, type:'deklaration',    category:'underlag',      description:'VosuAI ×2',                      amount:208,   status:'klar',   month:'2025',    note:'Verktyg & Dev' },
  { id:'d23', workspace_id:null, type:'deklaration',    category:'underlag',      description:'Revolut-extras',                 amount:1787,  status:'klar',   month:'2025',    note:'Verktyg & Dev' },
  { id:'d24', workspace_id:null, type:'deklaration',    category:'underlag',      description:'Ytterligare bankkvitton',        amount:32230, status:'väntar', month:'2025',    note:'Behöver sammanställas' },
  { id:'d25', workspace_id:null, type:'prenumeration',  category:'granska',       description:'Dubbel Spotify',                 amount:1400,  status:'akut',   month:'2026-04', note:'~1 400 kr/år i onödan' },
  { id:'d26', workspace_id:null, type:'prenumeration',  category:'granska',       description:'Blackbox AI',                    amount:0,     status:'väntar', month:'2026-04', note:'Avslutad — kontrollera att debiteringen stoppats' },
  { id:'d27', workspace_id:null, type:'prenumeration',  category:'granska',       description:'Low Back Ability',               amount:708,   status:'väntar', month:'2026-04', note:'$6/mån × 10 = privat, ej avdragsgill' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => Math.round(n).toLocaleString('sv-SE') + ' kr'

function badge(s: EStatus) {
  if (s === 'klar')   return { icon: '✅', color: '#00C896' }
  if (s === 'aktiv')  return { icon: '📈', color: '#00C896' }
  if (s === 'väntar') return { icon: '⏳', color: '#F5A623' }
  return                     { icon: '🔴', color: '#FF4B6E' }
}

const BLANK = { description:'', amount:'', category:'', type:'utgift' as EType, status:'aktiv' as EStatus, note:'', month:'2026-04' }

// ─── Main component ───────────────────────────────────────────────────────────

export default function EkonomiClient({ workspaceId, initialEntries }: Props) {
  const supabase = createClient()
  const isGuest = workspaceId === 'guest'

  const [entries, setEntries]           = useState<Entry[]>(initialEntries.length > 0 ? initialEntries : DEFAULTS)
  const [openSections, setOpenSections] = useState({ aterbetalning:true, budget:true, underlag:false, prenumeration:true })
  const [editEntry, setEditEntry]       = useState<Entry | null>(null)
  const [addModal, setAddModal]         = useState<{ type:EType; category:string } | null>(null)
  const [deleteId, setDeleteId]         = useState<string | null>(null)
  const [form, setForm]                 = useState(BLANK)
  const [saving, setSaving]             = useState(false)
  const [ocrLoading, setOcrLoading]     = useState(false)
  const [isOcrSuggestion, setIsOcrSuggestion] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Derived ───────────────────────────────────────────────────────────────

  const aterbetalning  = entries.filter(e => e.type === 'deklaration' && e.category === 'aterbetalning')
  const inkomster      = entries.filter(e => e.type === 'inkomst')
  const utgifter       = entries.filter(e => e.type === 'utgift')
  const underlag       = entries.filter(e => e.type === 'deklaration' && e.category === 'underlag')
  const prenumerationer = entries.filter(e => e.type === 'prenumeration')

  const totalSkatt    = aterbetalning.reduce((s,e) => s + e.amount, 0)
  const totalIn       = inkomster.reduce((s,e) => s + e.amount, 0)
  const totalUt       = utgifter.reduce((s,e) => s + e.amount, 0)
  const netto         = totalIn - totalUt
  const totalUnderlag = underlag.reduce((s,e) => s + e.amount, 0)

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async function saveEntry() {
    if (!form.description.trim() || form.amount === '') return
    setSaving(true)
    const type     = editEntry?.type     ?? addModal?.type     ?? 'utgift'
    const category = editEntry?.category ?? addModal?.category ?? ''
    const payload  = {
      workspace_id: isGuest ? null : workspaceId,
      type, category,
      description: form.description.trim(),
      amount: parseFloat(String(form.amount).replace(',','.')),
      status: form.status,
      month: form.month || '2026-04',
      note: form.note || null,
    }

    const isDefault = editEntry?.id.startsWith('d')
    const isNew = !editEntry || isDefault

    if (!isNew && !isGuest) {
      await supabase.from('economy_entries').update(payload).eq('id', editEntry!.id)
      setEntries(prev => prev.map(e => e.id === editEntry!.id ? { ...e, ...payload } : e))
    } else if (!isGuest) {
      const { data } = await supabase.from('economy_entries').insert(payload).select().single()
      if (data) {
        const newList = editEntry ? entries.filter(e => e.id !== editEntry.id) : entries
        setEntries([...newList, data])
        setSaving(false); closeModals(); bloom('Tillagd ✅', payload.description); return
      }
    } else {
      const newEntry: Entry = { ...payload, id: 'tmp_' + Date.now() }
      const newList = editEntry ? entries.filter(e => e.id !== editEntry.id) : entries
      setEntries([...newList, newEntry])
    }

    setSaving(false)
    closeModals()
    bloom(isNew ? 'Tillagd ✅' : 'Uppdaterat ✅', payload.description)
  }

  async function deleteEntry(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id))
    if (!isGuest && !id.startsWith('d')) await supabase.from('economy_entries').delete().eq('id', id)
    setDeleteId(null)
    bloom('Raderad 🗑️', '')
  }

  function openEdit(e: Entry) {
    setEditEntry(e)
    setForm({ description:e.description, amount:String(e.amount), category:e.category, type:e.type, status:e.status, note:e.note||'', month:e.month||'2026-04' })
    setIsOcrSuggestion(false)
  }

  function openAdd(type: EType, category: string) {
    setAddModal({ type, category })
    setEditEntry(null)
    setForm({ ...BLANK, type, category })
    setIsOcrSuggestion(false)
  }

  function closeModals() { setEditEntry(null); setAddModal(null); setIsOcrSuggestion(false) }

  function toggle(k: keyof typeof openSections) { setOpenSections(o => ({ ...o, [k]: !o[k] })) }

  // ── OCR camera ────────────────────────────────────────────────────────────

  async function handleFileChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    if (!file) return
    setOcrLoading(true)
    const reader = new FileReader()
    reader.onload = async (e) => {
      const b64 = (e.target?.result as string).split(',')[1]
      try {
        const res = await fetch('/api/ocr-receipt', {
          method:'POST', headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({ imageBase64: b64 }),
        })
        const { suggestion } = await res.json()
        if (suggestion) {
          setAddModal({ type: suggestion.type || 'utgift', category: suggestion.category || '' })
          setEditEntry(null)
          setForm({
            description: suggestion.description || '',
            amount: String(suggestion.amount || ''),
            category: suggestion.category || '',
            type: suggestion.type || 'utgift',
            status: 'klar',
            note: suggestion.note || '',
            month: '2026-04',
          })
          setIsOcrSuggestion(true)
        } else {
          openAdd('utgift', '')
        }
      } catch { openAdd('utgift', '') }
      setOcrLoading(false)
    }
    reader.readAsDataURL(file)
    ev.target.value = ''
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <PageWrapper>
      {/* BG glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-60px] right-[-60px] w-80 h-80 rounded-full opacity-10"
          style={{ background:'#00C896', filter:'blur(80px)' }} />
        <div className="absolute bottom-[15%] left-[-60px] w-72 h-72 rounded-full opacity-8"
          style={{ background:'#7B6EFF', filter:'blur(70px)' }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto space-y-6">

        <PageHeader
          eyebrow="Familjen"
          title="Ekonomi"
          action={
            <label className="flex items-center gap-2 px-5 font-bold text-sm text-white cursor-pointer rounded-2xl"
              style={{ background:'#7B6EFF', height: 48 }}>
              {ocrLoading ? '⏳' : '📷'} Fota kvitto
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
            </label>
          }
        />

        {/* HERO — Skatteverket */}
        <div className="rounded-3xl p-6 relative overflow-hidden"
          style={{ background:'linear-gradient(135deg,#051A0A,#0A1F0F)', border:'1px solid rgba(0,200,150,0.3)' }}>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 pointer-events-none"
            style={{ background:'#00C896', filter:'blur(60px)', transform:'translate(30%,-30%)' }} />
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color:'rgba(0,200,150,0.7)' }}>
            DEKLARATION 2025 — VÄNTAR PÅ DIG
          </p>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-5xl font-black" style={{ color:'#00C896', letterSpacing:'-1.5px' }}>{fmt(totalSkatt)}</span>
            <div className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background:'#00C896', boxShadow:'0 0 8px #00C896' }} />
          </div>
          <p className="text-sm mb-5 leading-relaxed" style={{ color:'rgba(255,255,255,0.5)' }}>
            Skicka in deklarationen nu för att få tillbaka pengarna
          </p>
          <a href="https://www.skatteverket.se" target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm"
            style={{ background:'#00C896', color:'#051A0A' }}>
            Öppna Skatteverket →
          </a>
        </div>

        {/* SEKTION 1: Återbetalning */}
        <Section title="💰 Återbetalning 2025" isOpen={openSections.aterbetalning}
          onToggle={() => toggle('aterbetalning')}
          onAdd={() => openAdd('deklaration', 'aterbetalning')}
          summary={fmt(totalSkatt)}>
          {aterbetalning.map(e => <EntryRow key={e.id} entry={e} onEdit={() => openEdit(e)} onDelete={() => setDeleteId(e.id)} />)}
          <TotalRow label="TOTALT" amount={totalSkatt} color="#00C896" />
        </Section>

        {/* SEKTION 2: Budget */}
        <Section title="📊 Månadsbudget — April 2026" isOpen={openSections.budget}
          onToggle={() => toggle('budget')}
          onAdd={() => openAdd('inkomst', 'övrigt')}
          summary={`Netto ${netto >= 0 ? '+' : ''}${fmt(netto)}`}>
          {openSections.budget && <>
            {/* Bar */}
            <div className="px-4 py-3 rounded-xl mb-3"
              style={{ background:'rgba(0,200,150,0.06)', border:'1px solid rgba(0,200,150,0.15)' }}>
              <div className="flex justify-between text-xs mb-1.5">
                <span style={{ color:'#00C896' }}>In: {fmt(totalIn)}</span>
                <span style={{ color:'#FF4B6E' }}>Ut: {fmt(totalUt)}</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.07)' }}>
                <div className="h-full rounded-full"
                  style={{ background:'linear-gradient(90deg,#00C896,#4CAF50)', width:`${Math.min(100,(totalIn/(totalIn+totalUt+1))*100)}%` }} />
              </div>
              <div className="text-right text-xs mt-1 font-bold"
                style={{ color: netto >= 0 ? '#00C896' : '#FF4B6E' }}>
                Netto: {netto >= 0 ? '+' : ''}{fmt(netto)} 🟢
              </div>
            </div>
            <SubHeader label="INKOMSTER" />
            {inkomster.map(e => <EntryRow key={e.id} entry={e} onEdit={() => openEdit(e)} onDelete={() => setDeleteId(e.id)} />)}
            <AddRowBtn label="+ Lägg till inkomst" color="#00C896" onClick={() => openAdd('inkomst','övrigt')} />
            <TotalRow label="TOTALT IN" amount={totalIn} color="#00C896" />
            <SubHeader label="UTGIFTER" extraClass="mt-3" />
            {utgifter.map(e => <EntryRow key={e.id} entry={e} onEdit={() => openEdit(e)} onDelete={() => setDeleteId(e.id)} />)}
            <AddRowBtn label="+ Lägg till utgift" color="#FF4B6E" onClick={() => openAdd('utgift','övrigt')} />
            <TotalRow label="TOTALT UT" amount={totalUt} color="#FF4B6E" />
          </>}
        </Section>

        {/* SEKTION 3: Deklarationsunderlag */}
        <Section title="🧾 Deklarationsunderlag 2025" isOpen={openSections.underlag}
          onToggle={() => toggle('underlag')}
          onAdd={() => openAdd('deklaration', 'underlag')}
          summary={`${underlag.length} kvitton · ${fmt(totalUnderlag)}`}>
          {underlag.map(e => <EntryRow key={e.id} entry={e} onEdit={() => openEdit(e)} onDelete={() => setDeleteId(e.id)} />)}
          <TotalRow label="GRAND TOTAL NE-bilaga" amount={totalUnderlag} color="#9D93FF" />
        </Section>

        {/* SEKTION 4: Prenumerationer */}
        <Section title="⚠️ Prenumerationer att se över" isOpen={openSections.prenumeration}
          onToggle={() => toggle('prenumeration')}
          onAdd={() => openAdd('prenumeration', 'granska')}
          summary={`${prenumerationer.filter(e=>e.status==='akut').length} akuta`}>
          {prenumerationer.map(e => (
            <PrenumerationCard key={e.id} entry={e} onEdit={() => openEdit(e)} onDelete={() => setDeleteId(e.id)} />
          ))}
        </Section>

      </div>

      {/* EDIT / ADD MODAL */}

      {(editEntry || addModal) && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={closeModals}
            style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }} />
          <div className="fixed bottom-0 left-0 right-0 z-[70] md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:w-[420px] rounded-t-3xl md:rounded-3xl p-6 space-y-4"
            style={{ background:'rgba(26,26,46,0.98)', backdropFilter:'blur(24px)', borderTop:'1px solid rgba(255,255,255,0.1)' }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-1 md:hidden" style={{ background:'rgba(255,255,255,0.15)' }} />
            {isOcrSuggestion && (
              <div className="px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ background:'rgba(123,110,255,0.15)', color:'#9D93FF', border:'1px solid rgba(123,110,255,0.3)' }}>
                🤖 AI extraherade detta — kontrollera och godkänn
              </div>
            )}
            <h3 className="font-bold text-base" style={{ color:'#F2F2FF' }}>
              {editEntry ? 'Redigera post' : 'Lägg till post'}
            </h3>
            <input
              value={form.description}
              onChange={e => setForm(f=>({...f, description:e.target.value}))}
              onKeyDown={e => e.key==='Enter' && saveEntry()}
              placeholder="Beskrivning" autoFocus
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color:'#F2F2FF' }} />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.amount}
                onChange={e => setForm(f=>({...f, amount:e.target.value}))}
                placeholder="Belopp (kr)" type="number"
                className="px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color:'#F2F2FF' }} />
              <select
                value={form.status}
                onChange={e => setForm(f=>({...f, status:e.target.value as EStatus}))}
                className="px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background:'rgba(26,26,46,0.98)', border:'1px solid rgba(255,255,255,0.12)', color:'#F2F2FF' }}>
                <option value="klar">✅ Klar</option>
                <option value="aktiv">📈 Aktiv</option>
                <option value="väntar">⏳ Väntar</option>
                <option value="akut">🔴 Akut</option>
              </select>
            </div>
            <input
              value={form.note}
              onChange={e => setForm(f=>({...f, note:e.target.value}))}
              placeholder="Notering (valfritt)"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color:'#F2F2FF' }} />
            <div className="flex gap-3">
              <button onClick={closeModals}
                className="flex-1 py-3 rounded-xl font-bold text-sm"
                style={{ background:'rgba(255,255,255,0.07)', color:'#9898B8' }}>
                Avbryt
              </button>
              <button onClick={saveEntry} disabled={saving || !form.description.trim() || form.amount === ''}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all"
                style={{ background: (saving || !form.description.trim() || form.amount === '') ? '#2A2A48' : '#7B6EFF' }}>
                {saving ? 'Sparar...' : isOcrSuggestion ? '✅ Godkänn' : 'Spara'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* DELETE CONFIRM */}
      {deleteId && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setDeleteId(null)}
            style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }} />
          <div className="fixed bottom-0 left-0 right-0 z-[70] p-6 rounded-t-3xl space-y-4"
            style={{ background:'rgba(26,26,46,0.98)', borderTop:'1px solid rgba(255,75,110,0.3)' }}>
            <div className="text-center">
              <div className="text-2xl mb-2">🗑️</div>
              <div className="font-bold" style={{ color:'#F2F2FF' }}>Radera post?</div>
              <div className="text-sm mt-1" style={{ color:'#9898B8' }}>Kan inte ångras</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-3 rounded-xl font-bold text-sm"
                style={{ background:'rgba(255,255,255,0.07)', color:'#9898B8' }}>Avbryt</button>
              <button onClick={() => deleteEntry(deleteId)}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white"
                style={{ background:'#FF4B6E' }}>Radera</button>
            </div>
          </div>
        </>
      )}
    </PageWrapper>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, isOpen, onToggle, onAdd, summary, children }: {
  title: string; isOpen: boolean; onToggle: () => void; onAdd: () => void
  summary: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background:'#1A1A2E', border:'1px solid rgba(255,255,255,0.07)' }}>
      <button className="w-full flex items-center justify-between px-5 py-4 text-left" onClick={onToggle}>
        <span className="font-bold text-sm" style={{ color:'#F2F2FF' }}>{title}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color:'#555570' }}>{summary}</span>
          <span style={{ color:'#555570' }}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-1.5">
          {children}
          <button onClick={e => { e.stopPropagation(); onAdd() }}
            className="w-full text-xs py-2 mt-1 rounded-xl"
            style={{ border:'1px dashed rgba(255,255,255,0.1)', color:'#555570' }}>
            + Lägg till
          </button>
        </div>
      )}
    </div>
  )
}

function EntryRow({ entry, onEdit, onDelete }: { entry: Entry; onEdit: () => void; onDelete: () => void }) {
  const b = badge(entry.status)
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl group cursor-pointer"
      style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)' }}
      onClick={onEdit}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate" style={{ color:'#F2F2FF' }}>{entry.description}</div>
        {entry.note && <div className="text-xs mt-0.5 truncate" style={{ color:'#555570' }}>{entry.note}</div>}
      </div>
      <span className="text-sm font-bold flex-shrink-0"
        style={{ color: entry.type==='inkomst' ? '#00C896' : '#F2F2FF' }}>
        {fmt(entry.amount)}
      </span>
      <span className="text-sm flex-shrink-0">{b.icon}</span>
      <button onClick={e => { e.stopPropagation(); onDelete() }}
        className="opacity-0 group-hover:opacity-100 px-2 py-1 rounded-lg text-xs transition-all flex-shrink-0"
        style={{ color:'#FF4B6E' }}>
        ✕
      </button>
    </div>
  )
}

function TotalRow({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 mt-1 rounded-xl"
      style={{ background:`${color}10`, border:`1px solid ${color}30` }}>
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color }}>{label}</span>
      <span className="font-extrabold text-base" style={{ color }}>{fmt(amount)}</span>
    </div>
  )
}

function SubHeader({ label, extraClass = '' }: { label: string; extraClass?: string }) {
  return (
    <div className={`text-[10px] font-bold tracking-widest uppercase px-1 pt-1 pb-0.5 ${extraClass}`} style={{ color:'#333355' }}>
      {label}
    </div>
  )
}

function AddRowBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-xs py-2 rounded-xl mb-1"
      style={{ border:`1px dashed ${color}40`, color:'#555570' }}>
      {label}
    </button>
  )
}

function PrenumerationCard({ entry, onEdit, onDelete }: { entry: Entry; onEdit: () => void; onDelete: () => void }) {
  const isAkut = entry.status === 'akut'
  const color  = isAkut ? '#FF4B6E' : '#F5A623'
  return (
    <div className="px-4 py-3 rounded-xl"
      style={{ background:`${color}0D`, border:`1px solid ${color}33` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm" style={{ color:'#F2F2FF' }}>{entry.description}</div>
          {entry.note && <div className="text-xs mt-0.5" style={{ color:'#9898B8' }}>{entry.note}</div>}
          {entry.amount > 0 && (
            <div className="text-xs mt-1 font-bold" style={{ color }}>{fmt(entry.amount)}/år</div>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={onEdit}
            className="px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background:'rgba(255,255,255,0.07)', color:'#9898B8' }}>
            Behåll
          </button>
          <button onClick={onDelete}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
            style={{ background: color }}>
            Säg upp
          </button>
        </div>
      </div>
    </div>
  )
}
