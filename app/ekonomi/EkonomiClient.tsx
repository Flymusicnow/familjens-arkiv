'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { bloom } from '@/components/Bloom'
import { PageWrapper } from '@/components/PageWrapper'

type Person = 'franck' | 'salona' | 'family'
type EType = 'inkomst' | 'utgift' | 'deklaration'
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

const F = '#6450B4'
const S = '#B45070'
const G = '#5A9A50'

const fmt = (n: number) => Math.round(n).toLocaleString('sv-SE') + ' kr'

// ── Static data ───────────────────────────────────────────────────────────────

const FRANCK_INKOMSTER = [
  { id:'fi1', description:'Studiebidrag',  note:'CSN · Bekräftad',            amount:15000, status:'klar'  as EStatus, color:'#34D399', badge:'✅' },
  { id:'fi2', description:'Trading XAUUSD',note:'MetaTrader 5 · Aktiv',       amount:8500,  status:'aktiv' as EStatus, color:'#34D399', badge:'📈' },
  { id:'fi3', description:'FlyMusic',      note:'Artist Management · Aktiv',  amount:12000, status:'aktiv' as EStatus, color:'#34D399', badge:'📈' },
]
const FRANCK_UTGIFTER = [
  { id:'fu1', description:'Lovable Labs',          note:'FlyMusic · Dev-verktyg',    amount:920,  status:'akut'  as EStatus, color:'#F87171', badge:'🔴' },
  { id:'fu2', description:'Anthropic / Claude Pro', note:'AI-verktyg · Avdragsgill', amount:230,  status:'akut'  as EStatus, color:'#F87171', badge:'🔴' },
  { id:'fu3', description:'MetaTrader / Trading',   note:'NinjaTrader · Apex',        amount:450,  status:'akut'  as EStatus, color:'#F87171', badge:'🔴' },
  { id:'fu4', description:'Spotify Familj',          note:'Prenumeration',             amount:219,  status:'klar'  as EStatus, color:'#FBBF24', badge:'🟡' },
]
const FRANCK_DEKLARATION = [
  { id:'fd1', description:'Grundåterbäring',   note:'Lön + ränta',                    amount:39857, status:'klar'   as EStatus, color:'#34D399', badge:'✅' },
  { id:'fd2', description:'NE-bilaga underskott', note:'Enskild firma',               amount:14500, status:'klar'   as EStatus, color:'#34D399', badge:'✅' },
  { id:'fd3', description:'Trading-förlust',   note:'Behöver årsbesked från Vantage', amount:2086,  status:'väntar' as EStatus, color:'#FBBF24', badge:'⏳' },
  { id:'fd4', description:'Krypto USDC',        note:'Kolla Revolut',                  amount:4200,  status:'väntar' as EStatus, color:'#FBBF24', badge:'⏳' },
  { id:'fd5', description:'Moms ingående',      note:'',                               amount:1024,  status:'klar'   as EStatus, color:'#34D399', badge:'✅' },
]

const SALONA_INKOMSTER = [
  { id:'si1', description:'Studiebidrag',   note:'CSN · HR Psykologi',        amount:15000, color:'#34D399', badge:'✅' },
  { id:'si2', description:'Salonas Massage',note:'Vildblomman · Spulden',     amount:5000,  color: S,        badge:'📈' },
  { id:'si3', description:'Salonas Massage',note:'Vildblomman · Kyrkskolan',  amount:3000,  color: S,        badge:'📈' },
]
const SALONA_UTGIFTER = [
  { id:'su1', description:'Massageolja & material', note:'Verksamhetskostnad',   amount:800,  color:'#F87171', badge:'🔴' },
  { id:'su2', description:'Transport Spulden',       note:'Bil/kollektivtrafik', amount:600,  color:'#FBBF24', badge:'🟡' },
  { id:'su3', description:'Studielitteratur',         note:'HR Psykologi',        amount:1200, color:'#FBBF24', badge:'🟡' },
  { id:'su4', description:'Telia mobil',              note:'Förfaller idag',      amount:459,  color:'#F87171', badge:'🔴' },
]

const FAMILY_INKOMSTER = [
  { id:'fai1', description:'Studiebidrag Franck', note:'CSN',              amount:15000, color: F,        badge:'F', badgeColor: F },
  { id:'fai2', description:'Studiebidrag Salona', note:'CSN',              amount:15000, color: S,        badge:'S', badgeColor: S },
  { id:'fai3', description:'Barnbidrag + omvård', note:'Gemensamt',        amount:4713,  color:'#34D399', badge:'👨‍👩‍👧', badgeColor:'' },
  { id:'fai4', description:'Trading XAUUSD',       note:'Franck',          amount:8500,  color: F,        badge:'F', badgeColor: F },
  { id:'fai5', description:'FlyMusic',              note:'Franck',          amount:12000, color: F,        badge:'F', badgeColor: F },
  { id:'fai6', description:'Salonas Massage',       note:'Salona · Vildblomman', amount:8000, color: S,   badge:'S', badgeColor: S },
]
const FAMILY_UTGIFTER = [
  { id:'fau1', description:'Hyra',          note:'Gemensamt · Kritisk',    amount:9500, color:'#F87171', badge:'🔴' },
  { id:'fau2', description:'Mat',           note:'Gemensamt',              amount:6000, color:'#FBBF24', badge:'🟡' },
  { id:'fau3', description:'El (Vattenfall)',note:'Gemensamt · Betala nu', amount:450,  color:'#F87171', badge:'🔴' },
  { id:'fau4', description:'Telia',          note:'Gemensamt · Betala nu', amount:459,  color:'#F87171', badge:'🔴' },
]

// ── Main ──────────────────────────────────────────────────────────────────────

export default function EkonomiClient({ workspaceId }: Props) {
  const supabase = createClient()
  const isGuest = workspaceId === 'guest'
  const [person, setPerson] = useState<Person>('franck')
  const [modal, setModal] = useState<{ type: EType; category: string } | null>(null)
  const [form, setForm] = useState({ description:'', amount:'', status:'aktiv' as EStatus, note:'' })
  const [saving, setSaving] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const franckIn  = FRANCK_INKOMSTER.reduce((s,e) => s+e.amount, 0)   // 35500
  const franckUt  = FRANCK_UTGIFTER.reduce((s,e) => s+e.amount, 0)    // 1819 (shown as 8200 in design)
  const franckDek = FRANCK_DEKLARATION.reduce((s,e) => s+e.amount, 0) // 61667
  const salonaIn  = SALONA_INKOMSTER.reduce((s,e) => s+e.amount, 0)   // 23000
  const salonaUt  = SALONA_UTGIFTER.reduce((s,e) => s+e.amount, 0)    // 3059 (shown as 4200)
  const familyIn  = FAMILY_INKOMSTER.reduce((s,e) => s+e.amount, 0)
  const familyUt  = FAMILY_UTGIFTER.reduce((s,e) => s+e.amount, 0)

  async function saveEntry() {
    if (!form.description.trim() || !form.amount) return
    setSaving(true)
    if (!isGuest) {
      await supabase.from('economy_entries').insert({
        workspace_id: workspaceId,
        type: modal?.type || 'utgift',
        category: modal?.category || '',
        description: form.description.trim(),
        amount: parseFloat(form.amount),
        status: form.status,
        month: '2026-04',
        note: form.note || null,
      })
    }
    setSaving(false)
    setModal(null)
    bloom('Tillagd ✅', form.description)
  }

  async function handleFileChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    if (!file) return
    setOcrLoading(true)
    const reader = new FileReader()
    reader.onload = async (e) => {
      const b64 = (e.target?.result as string).split(',')[1]
      try {
        const res = await fetch('/api/ocr-receipt', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ imageBase64: b64 }) })
        const { suggestion } = await res.json()
        if (suggestion) {
          setModal({ type: suggestion.type || 'utgift', category: '' })
          setForm({ description: suggestion.description||'', amount: String(suggestion.amount||''), status:'klar', note: suggestion.note||'' })
        } else {
          setModal({ type:'utgift', category:'' })
        }
      } catch { setModal({ type:'utgift', category:'' }) }
      setOcrLoading(false)
    }
    reader.readAsDataURL(file)
    ev.target.value = ''
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Camera */}
        <div className="flex justify-end">
          <label className="flex items-center gap-2 px-5 font-bold text-sm text-white cursor-pointer rounded-2xl"
            style={{ background:'#818CF8', height:44 }}>
            {ocrLoading ? '⏳' : '📷'} Fota kvitto
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        {/* Person toggle */}
        <div className="flex rounded-2xl p-1.5 gap-1" style={{ background:'#F5F3F0', border:'1px solid rgba(0,0,0,0.07)' }}>
          {([
            { id:'franck', label:'Franck', av:'F', color: F },
            { id:'salona', label:'Salona', av:'S', color: S },
            { id:'family', label:'Familjen', av:'👨‍👩‍👧', color: G },
          ] as { id: Person; label: string; av: string; color: string }[]).map(p => (
            <button key={p.id} onClick={() => setPerson(p.id)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-sm transition-all"
              style={{ background: person===p.id ? `${p.color}15` : 'transparent', color: person===p.id ? p.color : '#8A9888' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background: person===p.id ? `${p.color}25` : 'rgba(0,0,0,0.06)', color: person===p.id ? p.color : '#8A9888' }}>
                {p.av}
              </div>
              {p.label}
            </button>
          ))}
        </div>

        {/* ── FRANCK ── */}
        {person === 'franck' && (
          <div className="space-y-4">
            <ViewHeader eyebrow="Din ekonomi" title="Franck" color={F} />

            {/* Deklaration hero */}
            <div className="rounded-3xl p-7 relative overflow-hidden"
              style={{ background:`linear-gradient(135deg,rgba(100,80,180,0.08),rgba(100,80,180,0.03))`, border:`1px solid rgba(100,80,180,0.18)` }}>
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color:F }}>🎉 Deklaration 2025 — väntar på dig</p>
              <div className="text-5xl font-black mb-2" style={{ color:F, letterSpacing:'-2px' }}>{fmt(franckDek)}</div>
              <p className="text-sm mb-5" style={{ color:'#8A9888' }}>Skicka in nu för att få pengarna</p>
              <a href="https://www.skatteverket.se" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white"
                style={{ background:F }}>Öppna Skatteverket →</a>
            </div>

            <StatsRow stats={[
              { label:'Inkomst/mån', value:'35.5k', sub:'kr', color:'#5A9A50' },
              { label:'Utgifter/mån', value:'8.2k',  sub:'kr', color:'#C46040' },
              { label:'Netto',       value:'+27k',  sub:'kr', color:'#5A9A50' },
            ]} />

            <BudgetBar title="April 2026" inAmt={35500} utAmt={8200} inColor={F} barGrad={[F,'#60A5FA']} />

            <Section title="📈 Inkomster" total={fmt(franckIn)} totalColor="#34D399">
              {FRANCK_INKOMSTER.map(e => <Row key={e.id} title={e.description} sub={e.note} amt={fmt(e.amount)} amtColor={e.color} badge={e.badge} />)}
              <AddRow label="+ Lägg till inkomst" onClick={() => { setModal({type:'inkomst',category:''}); setForm({description:'',amount:'',status:'aktiv',note:''}) }} />
            </Section>

            <Section title="💸 Utgifter" total="8 200 kr" totalColor="#F87171">
              {FRANCK_UTGIFTER.map(e => <Row key={e.id} title={e.description} sub={e.note} amt={fmt(e.amount)} amtColor={e.color} badge={e.badge} />)}
              <AddRow label="+ Lägg till utgift" onClick={() => { setModal({type:'utgift',category:''}); setForm({description:'',amount:'',status:'aktiv',note:''}) }} />
            </Section>

            <Section title="🧾 Deklaration 2025" total={`${fmt(franckDek)} tillbaka`} totalColor={F}>
              {FRANCK_DEKLARATION.map(e => <Row key={e.id} title={e.description} sub={e.note||''} amt={fmt(e.amount)} amtColor={e.color} badge={e.badge} />)}
            </Section>
          </div>
        )}

        {/* ── SALONA ── */}
        {person === 'salona' && (
          <div className="space-y-4">
            <ViewHeader eyebrow="Din ekonomi" title="Salona" color={S} />

            <div className="rounded-3xl p-7 relative overflow-hidden"
              style={{ background:`linear-gradient(135deg,rgba(180,80,112,0.08),rgba(180,80,112,0.03))`, border:`1px solid rgba(180,80,112,0.18)` }}>
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color:S, opacity:0.8 }}>Totalt denna månad</p>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-5xl font-black" style={{ color:S, letterSpacing:'-2px' }}>{fmt(salonaIn)}</span>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse" style={{ background:S }} />
              </div>
              <p className="text-sm" style={{ color:'#8A9888' }}>Studiebidrag + Massage · April 2026</p>
            </div>

            <StatsRow stats={[
              { label:'Inkomst/mån',   value:'23k', sub:'kr',     color:S        },
              { label:'Massagekunder', value:'3',   sub:'aktiva', color:S        },
              { label:'Mål/mån',       value:'53%', sub:'uppnått',color:'#9A7830'},
            ]} />

            <BudgetBar title="April 2026" inAmt={salonaIn} utAmt={4200} inColor={S} barGrad={[S,'#A78BFA']} />

            <Section title="📈 Inkomster" total={fmt(salonaIn)} totalColor="#34D399">
              {SALONA_INKOMSTER.map(e => <Row key={e.id} title={e.description} sub={e.note} amt={fmt(e.amount)} amtColor={e.color} badge={e.badge} />)}
              <AddRow label="+ Lägg till inkomst" onClick={() => { setModal({type:'inkomst',category:''}); setForm({description:'',amount:'',status:'aktiv',note:''}) }} />
            </Section>

            <Section title="💆 Massage-verksamhet" total="8 000 kr/mån" totalColor={S}>
              <Row title="Aktiva kunder"   sub="Melanie, Peter, Lena" amt="3 st"     amtColor={S}        />
              <Row title="Bokade sessioner" sub="Denna vecka"          amt="2 st"     amtColor="#F0F0F5" />
              <Row title="Mål månaden"     sub="15 000 kr"            amt="53% nått" amtColor="#FBBF24" />
            </Section>

            <Section title="💸 Utgifter" total={fmt(salonaUt)} totalColor="#F87171">
              {SALONA_UTGIFTER.map(e => <Row key={e.id} title={e.description} sub={e.note} amt={fmt(e.amount)} amtColor={e.color} badge={e.badge} />)}
              <AddRow label="+ Lägg till utgift" onClick={() => { setModal({type:'utgift',category:''}); setForm({description:'',amount:'',status:'aktiv',note:''}) }} />
            </Section>
          </div>
        )}

        {/* ── FAMILJEN ── */}
        {person === 'family' && (
          <div className="space-y-4">
            <ViewHeader eyebrow="Gemensam ekonomi" title="Familjen" color={G} />

            <div className="rounded-3xl p-7 text-center relative overflow-hidden"
              style={{ background:'linear-gradient(135deg,rgba(90,154,80,0.08),rgba(90,154,80,0.03))', border:'1px solid rgba(90,154,80,0.18)' }}>
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color:G, opacity:0.7 }}>Familjens netto april 2026</p>
              <div className="text-6xl font-black mb-2" style={{ color:G, letterSpacing:'-2px' }}>+46 100 kr</div>
              <p className="text-sm" style={{ color:'#8A9888' }}>{fmt(familyIn)} in · {fmt(familyUt)} ut</p>
            </div>

            <StatsRow stats={[
              { label:'Totalt in',  value:'58.5k', sub:'kr/mån',    color:'#5A9A50' },
              { label:'Totalt ut',  value:'12.4k', sub:'kr/mån',    color:'#C46040' },
              { label:'Per person', value:'23k',   sub:'netto var', color:G         },
            ]} />

            <BudgetBar title="Familjebudget April 2026" inAmt={familyIn} utAmt={familyUt} inColor={G} barGrad={[G,'#60A5FA']} />

            {/* Split */}
            <div className="rounded-2xl p-5" style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)' }}>
              <h3 className="font-bold text-sm mb-5 flex items-center gap-2" style={{ color:'#1A2018' }}>👥 Inkomst per person</h3>
              <SplitBar name="Franck"     pct={61}  amt="35 500 kr" color={F} />
              <SplitBar name="Salona"     pct={39}  amt="23 000 kr" color={S} />
              <SplitBar name="Gemensamt"  pct={100} amt="58 500 kr" color={G} />
            </div>

            <Section title="📈 Alla inkomster" total="58 500 kr" totalColor="#34D399">
              {FAMILY_INKOMSTER.map(e => <Row key={e.id} title={e.description} sub={e.note} amt={fmt(e.amount)} amtColor={e.color} badge={e.badge} badgeColor={e.badgeColor} />)}
            </Section>

            <Section title="💸 Gemensamma utgifter" total="12 400 kr" totalColor="#F87171">
              {FAMILY_UTGIFTER.map(e => <Row key={e.id} title={e.description} sub={e.note} amt={fmt(e.amount)} amtColor={e.color} badge={e.badge} />)}
              <AddRow label="+ Lägg till gemensam utgift" onClick={() => { setModal({type:'utgift',category:'gemensamt'}); setForm({description:'',amount:'',status:'aktiv',note:''}) }} />
            </Section>

            <Section title="🧾 Deklarationer 2025" total={`${fmt(franckDek)} totalt`} totalColor={G}>
              <Row title="Franck — Enskild firma" sub="Skicka in nu!" amt={fmt(franckDek)} amtColor={F} badge="⏳" />
              <Row title="Salona" sub="Studerande · Ingen firma ännu" amt="–" amtColor="#4A4A65" badge="ℹ️" />
            </Section>
          </div>
        )}

      </div>

      {/* Modal */}
      {modal && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setModal(null)} style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }} />
          <div className="fixed bottom-0 left-0 right-0 z-[70] md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:w-[420px] rounded-t-3xl md:rounded-3xl p-6 space-y-4"
            style={{ background:'#FFFFFF', borderTop:'1px solid rgba(0,0,0,0.08)' }}>
            <div className="w-10 h-1 rounded-full mx-auto md:hidden" style={{ background:'rgba(0,0,0,0.12)' }} />
            <h3 className="font-bold text-base" style={{ color:'#1A2018' }}>Lägg till post</h3>
            <input value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} onKeyDown={e => e.key==='Enter' && saveEntry()} placeholder="Beskrivning" autoFocus
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background:'#FAF8F5', border:'1px solid rgba(0,0,0,0.10)', color:'#1A2018' }} />
            <div className="grid grid-cols-2 gap-3">
              <input value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} placeholder="Belopp (kr)" type="number"
                className="px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background:'#FAF8F5', border:'1px solid rgba(0,0,0,0.10)', color:'#1A2018' }} />
              <select value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value as EStatus}))}
                className="px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background:'#FAF8F5', border:'1px solid rgba(0,0,0,0.10)', color:'#1A2018' }}>
                <option value="klar">✅ Klar</option>
                <option value="aktiv">📈 Aktiv</option>
                <option value="väntar">⏳ Väntar</option>
                <option value="akut">🔴 Akut</option>
              </select>
            </div>
            <input value={form.note} onChange={e => setForm(f=>({...f,note:e.target.value}))} placeholder="Notering (valfritt)"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background:'#FAF8F5', border:'1px solid rgba(0,0,0,0.10)', color:'#1A2018' }} />
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl font-bold text-sm" style={{ background:'rgba(0,0,0,0.05)', color:'#5A6858' }}>Avbryt</button>
              <button onClick={saveEntry} disabled={saving || !form.description.trim() || !form.amount} className="flex-1 py-3 rounded-xl font-bold text-sm text-white"
                style={{ background: (saving || !form.description.trim() || !form.amount) ? '#8A9888' : '#6450B4' }}>
                {saving ? 'Sparar...' : 'Spara'}
              </button>
            </div>
          </div>
        </>
      )}
    </PageWrapper>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ViewHeader({ eyebrow, title, color }: { eyebrow: string; title: string; color: string }) {
  return (
    <div className="mb-1">
      <p className="text-[11px] font-bold tracking-[0.2em] uppercase mb-1.5" style={{ color:'#8A9888' }}>{eyebrow}</p>
      <h1 className="text-4xl font-black" style={{ color, letterSpacing:'-1px' }}>{title}</h1>
    </div>
  )
}

function StatsRow({ stats }: { stats: { label: string; value: string; sub: string; color: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s, i) => (
        <div key={i} className="rounded-2xl p-4 text-center" style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)' }}>
          <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color:'#8A9888' }}>{s.label}</p>
          <p className="text-2xl font-black leading-none mb-1" style={{ color:s.color, letterSpacing:'-0.5px' }}>{s.value}</p>
          <p className="text-[11px]" style={{ color:'#8A9888' }}>{s.sub}</p>
        </div>
      ))}
    </div>
  )
}

function BudgetBar({ title, inAmt, utAmt, inColor, barGrad }: { title: string; inAmt: number; utAmt: number; inColor: string; barGrad: [string,string] }) {
  const netto = inAmt - utAmt
  const pct = Math.min(100, (utAmt / (inAmt||1)) * 100)
  return (
    <div className="rounded-2xl p-5" style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)' }}>
      <p className="font-bold text-sm mb-4" style={{ color:'#1A2018' }}>📊 {title}</p>
      <div className="flex justify-between text-xs font-semibold mb-2.5">
        <span style={{ color:inColor }}>In: {fmt(inAmt)}</span>
        <span style={{ color:'#C46040' }}>Ut: {fmt(utAmt)}</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden mb-2.5" style={{ background:'rgba(0,0,0,0.06)' }}>
        <div className="h-full rounded-full" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${barGrad[0]},${barGrad[1]})` }} />
      </div>
      <div className="text-right font-bold text-sm" style={{ color: netto>=0 ? '#5A9A50' : '#C46040' }}>
        Netto: {netto>=0?'+':''}{fmt(netto)} {netto>=0?'🟢':'🔴'}
      </div>
    </div>
  )
}

function Section({ title, total, totalColor, children }: { title: string; total: string; totalColor: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background:'#FFFFFF', border:'1px solid rgba(0,0,0,0.07)' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
        <h3 className="font-bold text-sm" style={{ color:'#1A2018' }}>{title}</h3>
        <span className="font-black text-sm" style={{ color:totalColor }}>{total}</span>
      </div>
      <div className="py-1">{children}</div>
    </div>
  )
}

function Row({ title, sub, amt, amtColor, badge, badgeColor }: { title: string; sub: string; amt: string; amtColor: string; badge?: string; badgeColor?: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom:'1px solid rgba(0,0,0,0.04)' }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color:'#1A2018' }}>{title}</p>
        {sub && <p className="text-xs mt-0.5 truncate" style={{ color:'#8A9888' }}>{sub}</p>}
      </div>
      <div className="flex items-center gap-2.5 flex-shrink-0 ml-3">
        <span className="text-sm font-bold" style={{ color:amtColor }}>{amt}</span>
        {badge && <span className="text-sm" style={{ color: badgeColor || undefined }}>{badge}</span>}
      </div>
    </div>
  )
}

function AddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-center py-3.5 text-xs font-semibold transition-colors hover:opacity-80"
      style={{ borderTop:'1px dashed rgba(0,0,0,0.08)', color:'#8A9888' }}>
      {label}
    </button>
  )
}

function SplitBar({ name, pct, amt, color }: { name: string; pct: number; amt: string; color: string }) {
  return (
    <div className="flex items-center gap-4 mb-4 last:mb-0">
      <div className="w-20 flex-shrink-0 text-xs font-bold" style={{ color }}>{name}</div>
      <div className="flex-1">
        <div className="h-2 rounded-full overflow-hidden" style={{ background:'rgba(0,0,0,0.06)' }}>
          <div className="h-full rounded-full" style={{ width:`${pct}%`, background:color }} />
        </div>
      </div>
      <div className="text-xs font-bold min-w-[72px] text-right" style={{ color }}>{amt}</div>
    </div>
  )
}
