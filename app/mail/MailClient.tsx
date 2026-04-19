'use client'

import { useState } from 'react'
import { bloom } from '@/components/Bloom'
import { PageWrapper } from '@/components/PageWrapper'
import { PageHeader } from '@/components/PageHeader'

type MailCategory = 'alla' | 'rakningar' | 'myndigheter' | 'avtal' | 'ovrigt'

const categories: { id: MailCategory; label: string; emoji: string; color: string }[] = [
  { id: 'alla',        label: 'Alla',        emoji: '📬', color: '#8A9888' },
  { id: 'rakningar',   label: 'Räkningar',   emoji: '💳', color: '#A0522D' },
  { id: 'myndigheter', label: 'Myndigheter', emoji: '🏛',  color: '#3A6B8A' },
  { id: 'avtal',       label: 'Avtal',       emoji: '📜', color: '#5C4A7A' },
  { id: 'ovrigt',      label: 'Övrigt',      emoji: '📁', color: '#556B2F' },
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
      <div className="relative z-10 space-y-6">
        <PageHeader eyebrow="Inkorg" title="Mail" />

        {/* Connect email providers */}
        <div className="space-y-4">
          <button
            onClick={() => bloom('Kommer snart 🔜', 'Gmail-integration är under utveckling')}
            className="card-lift w-full flex items-center gap-5 rounded-2xl p-5"
            style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-xl flex-shrink-0"
              style={{ background: '#EA4335' }}>G</div>
            <div className="text-left flex-1">
              <p className="font-bold text-[16px]" style={{ color: '#1C1A17' }}>Anslut Gmail</p>
              <p className="text-[14px] mt-0.5" style={{ color: '#9C9690' }}>Importera räkningar automatiskt</p>
            </div>
            <span className="text-[18px]" style={{ color: '#9C9690' }}>→</span>
          </button>

          <button
            onClick={() => bloom('Kommer snart 🔜', 'Outlook-integration är under utveckling')}
            className="card-lift w-full flex items-center gap-5 rounded-2xl p-5"
            style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-xl flex-shrink-0"
              style={{ background: '#0078D4' }}>O</div>
            <div className="text-left flex-1">
              <p className="font-bold text-[16px]" style={{ color: '#1C1A17' }}>Anslut Outlook</p>
              <p className="text-[14px] mt-0.5" style={{ color: '#9C9690' }}>Microsoft-konto</p>
            </div>
            <span className="text-[18px]" style={{ color: '#9C9690' }}>→</span>
          </button>
        </div>

        {/* Forward address card */}
        <div className="rounded-2xl p-5 w-full" style={{ background: '#C8DDE8', border: '1px solid rgba(58,107,138,0.2)' }}>
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase mb-4" style={{ color: '#3A6B8A' }}>
            📬 Din vidarebefordringsadress
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-[14px] font-mono rounded-xl px-4 py-3 overflow-hidden text-ellipsis whitespace-nowrap"
              style={{ background: 'rgba(58,107,138,0.12)', color: '#3A6B8A', border: '1px solid rgba(58,107,138,0.2)' }}>
              {FORWARD_ADDRESS}
            </code>
            <button onClick={copyAddress}
              className="flex-shrink-0 min-h-[48px] px-5 rounded-xl text-[14px] font-bold text-white"
              style={{ background: copied ? '#2D5A27' : '#3A6B8A' }}>
              {copied ? '✓ Kopierat' : 'Kopiera'}
            </button>
          </div>
        </div>

        {/* How-to steps */}
        <div className="rounded-2xl overflow-hidden w-full"
          style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
          {[
            'Kopiera adressen ovan',
            'Gå till Gmail / Outlook → Inställningar → Vidarebefordran',
            'Klistra in adressen och aktivera',
            'Inkommande mail dyker upp sorterat här',
          ].map((text, i, arr) => (
            <div key={i} className="flex items-start gap-4 px-5 py-5"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[14px] flex-shrink-0"
                style={{ background: '#D0DDB8', color: '#556B2F' }}>
                {i + 1}
              </div>
              <p className="text-[15px] leading-relaxed pt-0.5" style={{ color: '#5C5650' }}>{text}</p>
            </div>
          ))}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveTab(cat.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 h-[44px] rounded-full text-[14px] font-semibold whitespace-nowrap"
              style={{
                background: activeTab === cat.id ? cat.color : 'rgba(0,0,0,0.03)',
                color: activeTab === cat.id ? 'white' : '#9C9690',
                border: activeTab === cat.id ? 'none' : '1px solid rgba(0,0,0,0.09)',
              }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        <div className="rounded-2xl p-12 text-center w-full" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="text-[52px] mb-4">
            {categories.find(c => c.id === activeTab)?.emoji || '📭'}
          </div>
          <div className="text-[20px] font-bold mb-3" style={{ color: '#1C1A17' }}>
            {activeTab === 'alla' ? 'Inga mail än' : `Inga ${categories.find(c => c.id === activeTab)?.label.toLowerCase()} än`}
          </div>
          <div className="text-[15px] leading-relaxed" style={{ color: '#9C9690' }}>
            Vidarebefordra din e-post till adressen ovan så sorteras den automatiskt hit
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
