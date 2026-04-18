'use client'

import { useState } from 'react'
import { bloom } from '@/components/Bloom'
import { PageWrapper } from '@/components/PageWrapper'
import { PageHeader } from '@/components/PageHeader'

type MailCategory = 'alla' | 'rakningar' | 'myndigheter' | 'avtal' | 'ovrigt'

const categories: { id: MailCategory; label: string; emoji: string; color: string }[] = [
  { id: 'alla',        label: 'Alla',        emoji: '📬', color: '#8A9888' },
  { id: 'rakningar',   label: 'Räkningar',   emoji: '💳', color: '#C46040' },
  { id: 'myndigheter', label: 'Myndigheter', emoji: '🏛',  color: '#4A8CB4' },
  { id: 'avtal',       label: 'Avtal',       emoji: '📜', color: '#6450B4' },
  { id: 'ovrigt',      label: 'Övrigt',      emoji: '📁', color: '#907060' },
]

const FORWARD_ADDRESS = 'franck@inkorg.arkiv.app'

export default function MailClient() {
  const [activeTab, setActiveTab] = useState<MailCategory>('alla')
  const [copied, setCopied] = useState(false)

  function copyAddress() {
    navigator.clipboard.writeText(FORWARD_ADDRESS).then(() => {
      setCopied(true)
      bloom('Kopierat! ✅', FORWARD_ADDRESS)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <PageWrapper>
      <div className="relative z-10 max-w-xl mx-auto space-y-6">
        <PageHeader eyebrow="Inkorg" title="Mail" />

        {/* Connect email providers */}
        <div className="space-y-3">
          <button
            onClick={() => bloom('Kommer snart 🔜', 'Gmail-integration är under utveckling')}
            className="w-full flex items-center gap-4 rounded-2xl p-5 transition-all active:scale-95"
            style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-xl flex-shrink-0"
              style={{ background: '#EA4335' }}>G</div>
            <div className="text-left">
              <p className="font-bold" style={{ color: '#1A2018' }}>Anslut Gmail</p>
              <p className="text-sm" style={{ color: '#8A9888' }}>Importera räkningar automatiskt</p>
            </div>
            <span className="ml-auto" style={{ color: '#8A9888' }}>→</span>
          </button>

          <button
            onClick={() => bloom('Kommer snart 🔜', 'Outlook-integration är under utveckling')}
            className="w-full flex items-center gap-4 rounded-2xl p-5 transition-all active:scale-95"
            style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-xl flex-shrink-0"
              style={{ background: '#0078D4' }}>O</div>
            <div className="text-left">
              <p className="font-bold" style={{ color: '#1A2018' }}>Anslut Outlook</p>
              <p className="text-sm" style={{ color: '#8A9888' }}>Microsoft-konto</p>
            </div>
            <span className="ml-auto" style={{ color: '#8A9888' }}>→</span>
          </button>
        </div>

        {/* Forward address card */}
        <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: '#4A8CB4' }}>
            📬 DIN VIDAREBEFORDRINGSADRESS
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-sm font-mono rounded-xl px-3 py-2 overflow-hidden text-ellipsis whitespace-nowrap"
              style={{ background: 'rgba(74,140,180,0.07)', color: '#4A8CB4', border: '1px solid rgba(74,140,180,0.15)' }}>
              {FORWARD_ADDRESS}
            </code>
            <button onClick={copyAddress}
              className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: copied ? '#5A9A50' : '#4A8CB4' }}>
              {copied ? '✓' : 'Kopiera'}
            </button>
          </div>
        </div>

        {/* How-to steps */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
          {[
            'Kopiera adressen ovan',
            'Gå till Gmail / Outlook → Inställningar → Vidarebefordran',
            'Klistra in adressen och aktivera',
            'Inkommande mail dyker upp sorterat här',
          ].map((text, i, arr) => (
            <div key={i} className="flex items-start gap-4 px-5 py-4"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(100,80,180,0.1)', color: '#6450B4' }}>
                {i + 1}
              </div>
              <p className="text-[15px] leading-relaxed" style={{ color: '#5A6858' }}>{text}</p>
            </div>
          ))}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveTab(cat.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 h-[40px] rounded-full text-sm font-semibold transition-all whitespace-nowrap"
              style={{
                background: activeTab === cat.id ? cat.color : 'rgba(0,0,0,0.03)',
                color: activeTab === cat.id ? 'white' : '#8A9888',
                border: activeTab === cat.id ? 'none' : '1px solid rgba(0,0,0,0.09)',
              }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        <div className="rounded-2xl p-12 text-center" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="text-[52px] mb-4">
            {categories.find(c => c.id === activeTab)?.emoji || '📭'}
          </div>
          <div className="text-[20px] font-bold mb-2" style={{ color: '#1A2018' }}>
            {activeTab === 'alla' ? 'Inga mail än' : `Inga ${categories.find(c => c.id === activeTab)?.label.toLowerCase()} än`}
          </div>
          <div className="text-[15px] leading-relaxed" style={{ color: '#8A9888' }}>
            Vidarebefordra din e-post till adressen ovan så sorteras den automatiskt hit
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
