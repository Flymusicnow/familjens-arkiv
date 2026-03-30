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

const catStyles: Record<string, { color: string; label: string; emoji: string }> = {
  'räkning':   { color: '#F87171', label: 'RÄKNING',    emoji: '💳' },
  'rakning':   { color: '#F87171', label: 'RÄKNING',    emoji: '💳' },
  'myndighet': { color: '#38B6FF', label: 'MYNDIGHET',  emoji: '🏛' },
  'avtal':     { color: '#C67BFF', label: 'AVTAL',      emoji: '📜' },
  'skola':     { color: '#38B6FF', label: 'SKOLA',      emoji: '📚' },
  'kvitto':    { color: '#34D399', label: 'KVITTO',     emoji: '🧾' },
  'övrigt':    { color: '#A8A8B8', label: 'ÖVRIGT',     emoji: '📁' },
  'ovrigt':    { color: '#A8A8B8', label: 'ÖVRIGT',     emoji: '📁' },
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

  // OCR form state
  const [ocr, setOcr] = useState({ sender: '', amount: '', due_date: '', ocr_ref: '', category: 'övrigt' })
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChosen(file: File) {
    setScanStep('processing')
    // Simulate OCR (3s), then show review form
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
      matchCat = (doc.title || '').toLowerCase().includes('hus')
        || (doc.sender || '').toLowerCase().includes('hus')
    } else if (catFilter === 'bilen') {
      matchCat = (doc.title || '').toLowerCase().includes('bil')
        || (doc.sender || '').toLowerCase().includes('bil')
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
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-100px] right-[-80px] w-96 h-96 rounded-full opacity-10"
          style={{ background: '#34D399', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-xl mx-auto space-y-5">
        <PageHeader
          eyebrow="Familjens minne"
          title="Arkiv"
          action={
            <button onClick={() => { setShowScanner(true); setScanStep('choose') }}
              className="flex items-center gap-2 px-5 font-bold text-sm text-white rounded-2xl"
              style={{ background: '#818CF8', height: 48 }}>
              📷 Skanna
            </button>
          }
        />

        {/* Search */}
        <div className="flex items-center gap-3 rounded-2xl px-4 mb-1"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', height: 56 }}>
          <span className="text-xl" style={{ color: 'rgba(255,255,255,0.3)' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Sök företag, datum, belopp..."
            className="flex-1 bg-transparent outline-none text-base"
            style={{ color: '#F0F0F5' }} />
        </div>

        {/* Category filter — horizontal scroll */}
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
                background: catFilter === cat.id ? '#818CF8' : 'rgba(255,255,255,0.04)',
                color: catFilter === cat.id ? 'white' : 'rgba(255,255,255,0.5)',
              }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Count */}
        {search && (
          <p className="text-xs" style={{ color: '#6B6B7B' }}>
            {filtered.length} resultat för &ldquo;{search}&rdquo;
          </p>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <div className="font-bold" style={{ color: '#F0F0F5' }}>Inga dokument här</div>
            <div className="text-sm mt-1" style={{ color: '#A8A8B8' }}>
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
                style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                  style={{ background: `${s.color}15` }}>
                  {s.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate" style={{ color: '#F0F0F5' }}>
                    {doc.title || doc.sender || 'Dokument'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#A8A8B8' }}>
                    {date}
                    {doc.sender && ` · ${doc.sender}`}
                    {doc.amount && ` · ${doc.amount} kr`}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-xs font-bold px-2 py-1 rounded-lg"
                    style={{ background: `${s.color}15`, color: s.color }}>
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
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6 space-y-4"
            style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.09)' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-lg" style={{ color: '#F0F0F5' }}>
                {scanStep === 'choose' ? 'Skanna dokument' : scanStep === 'processing' ? 'Analyserar...' : 'Granska & spara'}
              </h2>
              <button onClick={() => setShowScanner(false)} style={{ color: '#6B6B7B' }}>✕</button>
            </div>

            {/* Step 1: Choose method */}
            {scanStep === 'choose' && (
              <div className="space-y-3">
                <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileChosen(f) }} />
                <ChoiceBtn emoji="📷" title="Ta foto" sub="Öppna kameran" onClick={() => fileRef.current?.click()} />
                <ChoiceBtn emoji="📁" title="Välj fil" sub="PDF, JPG, PNG" onClick={() => fileRef.current?.click()} />
              </div>
            )}

            {/* Step 2: Processing */}
            {scanStep === 'processing' && (
              <div className="text-center py-8 space-y-4">
                <div className="text-4xl animate-spin">⚙️</div>
                <div className="font-semibold" style={{ color: '#A8A8B8' }}>Analyserar dokument...</div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full" style={{ background: '#818CF8', width: '60%', transition: 'width 2s ease' }} />
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {scanStep === 'review' && (
              <div className="space-y-3">
                <OcrField label="Avsändare" value={ocr.sender} onChange={v => setOcr(o => ({ ...o, sender: v }))} placeholder="T.ex. Vattenfall AB" />
                <OcrField label="Belopp" value={ocr.amount} onChange={v => setOcr(o => ({ ...o, amount: v }))} placeholder="T.ex. 892 kr" />
                <OcrField label="Förfallodatum" value={ocr.due_date} onChange={v => setOcr(o => ({ ...o, due_date: v }))} placeholder="ÅÅÅÅ-MM-DD" type="date" />
                <OcrField label="OCR / Referens" value={ocr.ocr_ref} onChange={v => setOcr(o => ({ ...o, ocr_ref: v }))} placeholder="Betalningsreferens" />

                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: '#A8A8B8' }}>Kategori</label>
                  <div className="flex flex-wrap gap-2">
                    {scanCategories.map(cat => (
                      <button key={cat.id} onClick={() => setOcr(o => ({ ...o, category: cat.id }))}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                        style={{
                          background: ocr.category === cat.id ? '#818CF8' : 'rgba(255,255,255,0.06)',
                          color: ocr.category === cat.id ? 'white' : '#A8A8B8',
                          border: '1px solid ' + (ocr.category === cat.id ? '#818CF8' : 'rgba(255,255,255,0.1)'),
                        }}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={saveDocument} disabled={saving}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-sm mt-2"
                  style={{ background: saving ? '#4A4280' : '#818CF8' }}>
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

/* ── Sub-components ─────────────────────────────────────────────────── */

function ChoiceBtn({ emoji, title, sub, onClick }: { emoji: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
      <span className="text-3xl">{emoji}</span>
      <div>
        <div className="font-bold" style={{ color: '#F0F0F5' }}>{title}</div>
        <div className="text-xs mt-0.5" style={{ color: '#A8A8B8' }}>{sub}</div>
      </div>
    </button>
  )
}

function OcrField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string
}) {
  return (
    <div>
      <label className="text-xs font-semibold mb-1 block" style={{ color: '#A8A8B8' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0F5' }} />
    </div>
  )
}
