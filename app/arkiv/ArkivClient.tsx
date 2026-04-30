'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { bloom } from '@/components/Bloom'
import { PageWrapper } from '@/components/PageWrapper'
import { PageHeader } from '@/components/PageHeader'
import type { Document } from '@/lib/types'

type Category = 'all' | 'huset' | 'bilen' | 'avtal' | 'myndigheter' | 'räkning' | 'myndighet' | 'övrigt'

interface Props {
  initialDocs: Document[]
  workspaceId: string | null
  memberId: string | null
}

const GLASS = 'rgba(10,15,25,0.45)'
const GB = { backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)' }
const GLASS_BORDER = '1px solid rgba(255,255,255,0.12)'

const catStyles: Record<string, { color: string; label: string; emoji: string }> = {
  'huset':     { color: '#2D5A27', label: 'HUSET',     emoji: '🏠' },
  'bilen':     { color: '#A0522D', label: 'BILEN',     emoji: '🚗' },
  'räkning':   { color: '#C46040', label: 'RÄKNING',   emoji: '💳' },
  'rakning':   { color: '#C46040', label: 'RÄKNING',   emoji: '💳' },
  'myndighet': { color: '#3A6B8A', label: 'MYNDIGHET', emoji: '🏛' },
  'avtal':     { color: '#5C4A7A', label: 'AVTAL',     emoji: '📜' },
  'skola':     { color: '#4A8CB4', label: 'SKOLA',     emoji: '📚' },
  'kvitto':    { color: '#5A9A50', label: 'KVITTO',    emoji: '🧾' },
  'övrigt':    { color: '#907060', label: 'ÖVRIGT',    emoji: '📁' },
  'ovrigt':    { color: '#907060', label: 'ÖVRIGT',    emoji: '📁' },
}

const scanCategories = [
  { id: 'räkning',   label: '💳 Räkning' },
  { id: 'myndighet', label: '🏛 Myndighet' },
  { id: 'avtal',     label: '📜 Avtal' },
  { id: 'kvitto',    label: '🧾 Kvitto' },
  { id: 'övrigt',    label: '📁 Övrigt' },
]

type ScanStep = 'choose' | 'processing' | 'review'

export default function ArkivClient({ initialDocs, workspaceId, memberId }: Props) {
  const supabase = createClient()
  const [docs, setDocs] = useState<Document[]>(initialDocs)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<Category>('all')
  const [showScanner, setShowScanner] = useState(false)
  const [scanStep, setScanStep] = useState<ScanStep>('choose')
  const [ocr, setOcr] = useState({ sender: '', amount: '', due_date: '', ocr_ref: '', category: 'övrigt' })
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChosen(file: File) {
    setScanStep('processing')
    setTimeout(() => {
      setOcr({ sender: '', amount: '', due_date: '', ocr_ref: '', category: 'övrigt' })
      setScanStep('review')
    }, 2000)
  }

  async function saveDocument() {
    setSaving(true)
    const sessionId = typeof window !== 'undefined' ? (() => {
      let id = localStorage.getItem('arkiv_session_id')
      if (!id) { id = crypto.randomUUID(); localStorage.setItem('arkiv_session_id', id) }
      return id
    })() : null

    const payload: Partial<Document> = {
      sender: ocr.sender || 'Okänt',
      amount: ocr.amount || null,
      due_date: ocr.due_date || null,
      ocr_ref: ocr.ocr_ref || null,
      category: ocr.category,
      ...(workspaceId ? { workspace_id: workspaceId, uploaded_by: memberId } : { session_id: sessionId }),
    }

    const { data, error } = await supabase.from('documents').insert(payload).select().single()
    setSaving(false)

    if (error || !data) { bloom('Fel ❌', error?.message || 'Kunde inte spara'); return }

    setDocs(prev => [data, ...prev])
    setShowScanner(false)
    setScanStep('choose')
    bloom('Sparat! 📄', (ocr.sender || 'Dokument') + ' finns nu i Arkivet')
  }

  const filtered = docs.filter(doc => {
    const q = search.toLowerCase()
    const matchSearch = !q
      || (doc.sender || '').toLowerCase().includes(q)
      || (doc.title || '').toLowerCase().includes(q)

    let matchCat = false
    if (catFilter === 'all') {
      matchCat = true
    } else if (catFilter === 'huset') {
      matchCat = (doc.title || '').toLowerCase().includes('hus') || (doc.sender || '').toLowerCase().includes('hus')
    } else if (catFilter === 'bilen') {
      matchCat = (doc.title || '').toLowerCase().includes('bil') || (doc.sender || '').toLowerCase().includes('bil')
    } else if (catFilter === 'avtal') {
      matchCat = doc.category === 'avtal'
    } else if (catFilter === 'myndigheter') {
      matchCat = doc.category === 'myndighet'
    } else {
      matchCat = doc.category === catFilter || doc.category === (catFilter as string).replace('ö', 'o')
    }

    return matchCat && matchSearch
  })

  return (
    <PageWrapper>
      <div className="relative z-10 max-w-2xl mx-auto space-y-5">
        <PageHeader
          eyebrow="Familjens minne"
          title="Arkiv"
          action={
            <button onClick={() => { setShowScanner(true); setScanStep('choose') }}
              className="flex items-center gap-2 px-5 font-bold text-sm text-white rounded-2xl"
              style={{ background: '#6450B4', height: 48 }}>
              📷 Skanna
            </button>
          }
        />

        {/* Search */}
        <div className="flex items-center gap-3 rounded-2xl px-5 mb-1"
          style={{ background: GLASS, ...GB, border: '1px solid rgba(255,255,255,0.18)', height: 56 }}>
          <span className="text-xl" style={{ color: 'rgba(255,255,255,0.55)' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Sök företag, datum, belopp..."
            className="flex-1 bg-transparent outline-none text-base"
            style={{ color: '#FFFFFF' }} />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'all',         label: 'Alla',        emoji: '📂' },
            { id: 'huset',       label: 'Huset',       emoji: '🏠' },
            { id: 'bilen',       label: 'Bilen',       emoji: '🚗' },
            { id: 'avtal',       label: 'Avtal',       emoji: '📜' },
            { id: 'myndigheter', label: 'Myndigheter', emoji: '🏛' },
          ].map(cat => (
            <button key={cat.id} onClick={() => setCatFilter(cat.id as Category)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap"
              style={{
                background: catFilter === cat.id ? '#6450B4' : 'rgba(255,255,255,0.08)',
                color: catFilter === cat.id ? 'white' : 'rgba(255,255,255,0.55)',
                border: catFilter === cat.id ? 'none' : '1px solid rgba(255,255,255,0.12)',
              }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {search && (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {filtered.length} resultat för &ldquo;{search}&rdquo;
          </p>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="rounded-2xl p-12 text-center" style={{ background: GLASS, ...GB, border: GLASS_BORDER }}>
            <div className="text-[52px] mb-4">🔍</div>
            <div className="text-[20px] font-bold mb-2" style={{ color: '#FFFFFF' }}>Inga dokument här</div>
            <div className="text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {search ? 'Prova ett annat sökord' : 'Tryck på Skanna för att lägga till ditt första dokument'}
            </div>
          </div>
        )}

        {/* Document list */}
        <div className="space-y-2">
          {filtered.map(doc => {
            const s = catStyles[doc.category] || catStyles['övrigt']
            const date = new Date(doc.created_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
            return (
              <div key={doc.id} className="rounded-2xl px-5 py-4 flex items-center gap-3"
                style={{ background: GLASS, ...GB, border: GLASS_BORDER }}>
                <div className="w-[50px] h-[50px] rounded-[14px] flex items-center justify-center flex-shrink-0 text-2xl"
                  style={{ background: 'rgba(255,255,255,0.12)' }}>
                  {s.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[15px] truncate" style={{ color: '#FFFFFF' }}>
                    {doc.title || doc.sender || 'Dokument'}
                  </div>
                  <div className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.60)' }}>
                    {date}
                    {doc.sender && ` · ${doc.sender}`}
                    {doc.amount && ` · ${doc.amount} kr`}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-xs font-bold px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.80)' }}>
                    {s.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4"
          style={{ background: 'rgba(0,5,15,0.60)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6 space-y-4"
            style={{ background: 'rgba(15,20,35,0.92)', ...GB, border: '1px solid rgba(255,255,255,0.14)' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-lg" style={{ color: '#FFFFFF' }}>
                {scanStep === 'choose' ? 'Skanna dokument' : scanStep === 'processing' ? 'Analyserar...' : 'Granska & spara'}
              </h2>
              <button onClick={() => setShowScanner(false)} style={{ color: 'rgba(255,255,255,0.55)' }}>✕</button>
            </div>

            {scanStep === 'choose' && (
              <div className="space-y-3">
                <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileChosen(f) }} />
                <ChoiceBtn emoji="📷" title="Ta foto" sub="Öppna kameran" onClick={() => fileRef.current?.click()} />
                <ChoiceBtn emoji="📁" title="Välj fil" sub="PDF, JPG, PNG" onClick={() => fileRef.current?.click()} />
              </div>
            )}

            {scanStep === 'processing' && (
              <div className="text-center py-8 space-y-4">
                <div className="text-4xl animate-spin">⚙️</div>
                <div className="font-semibold" style={{ color: 'rgba(255,255,255,0.70)' }}>Analyserar dokument...</div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <div className="h-full rounded-full" style={{ background: '#6450B4', width: '60%', transition: 'width 2s ease' }} />
                </div>
              </div>
            )}

            {scanStep === 'review' && (
              <div className="space-y-3">
                <OcrField label="Avsändare" value={ocr.sender} onChange={v => setOcr(o => ({ ...o, sender: v }))} placeholder="T.ex. Vattenfall AB" />
                <OcrField label="Belopp" value={ocr.amount} onChange={v => setOcr(o => ({ ...o, amount: v }))} placeholder="T.ex. 892 kr" />
                <OcrField label="Förfallodatum" value={ocr.due_date} onChange={v => setOcr(o => ({ ...o, due_date: v }))} placeholder="ÅÅÅÅ-MM-DD" type="date" />
                <OcrField label="OCR / Referens" value={ocr.ocr_ref} onChange={v => setOcr(o => ({ ...o, ocr_ref: v }))} placeholder="Betalningsreferens" />
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: 'rgba(255,255,255,0.70)' }}>Kategori</label>
                  <div className="flex flex-wrap gap-2">
                    {scanCategories.map(cat => (
                      <button key={cat.id} onClick={() => setOcr(o => ({ ...o, category: cat.id }))}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                        style={{
                          background: ocr.category === cat.id ? '#6450B4' : 'rgba(255,255,255,0.08)',
                          color: ocr.category === cat.id ? 'white' : 'rgba(255,255,255,0.60)',
                          border: '1px solid ' + (ocr.category === cat.id ? '#6450B4' : 'rgba(255,255,255,0.12)'),
                        }}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={saveDocument} disabled={saving}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-sm mt-2"
                  style={{ background: saving ? 'rgba(255,255,255,0.20)' : '#6450B4' }}>
                  {saving ? 'Sparar...' : '💾 Spara dokument'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

function ChoiceBtn({ emoji, title, sub, onClick }: { emoji: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all"
      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
      <span className="text-3xl">{emoji}</span>
      <div>
        <div className="font-bold" style={{ color: '#FFFFFF' }}>{title}</div>
        <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.60)' }}>{sub}</div>
      </div>
    </button>
  )
}

function OcrField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string
}) {
  return (
    <div>
      <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(255,255,255,0.70)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#FFFFFF' }} />
    </div>
  )
}
