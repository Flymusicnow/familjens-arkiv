'use client'

import { useState } from 'react'
import { bloom } from '@/components/Bloom'
import { PageWrapper } from '@/components/PageWrapper'
import { PageHeader } from '@/components/PageHeader'

function GmailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" fill="rgba(255,255,255,0.15)"/>
      <path d="M20 4L12 13 4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <text x="12" y="17" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif">G</text>
    </svg>
  )
}

function OutlookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="2" fill="rgba(255,255,255,0.15)"/>
      <path d="M2 8l8 5a2 2 0 002 0l8-5" stroke="white" strokeWidth="1.5"/>
      <text x="12" y="17" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif">O</text>
    </svg>
  )
}

type MailCategory = 'alla' | 'rakningar' | 'myndigheter' | 'avtal' | 'ovrigt'

const categories: { id: MailCategory; label: string; emoji: string; color: string }[] = [
  { id: 'alla',        label: 'Alla',        emoji: '📬', color: '#A8A8B8' },
  { id: 'rakningar',   label: 'Räkningar',   emoji: '💳', color: '#F87171' },
  { id: 'myndigheter', label: 'Myndigheter', emoji: '🏛',  color: '#38B6FF' },
  { id: 'avtal',       label: 'Avtal',       emoji: '📜', color: '#C67BFF' },
  { id: 'ovrigt',      label: 'Övrigt',      emoji: '📁', color: '#A8A8B8' },
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
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        <div className="absolute top-[-100px] right-[-80px] w-96 h-96 rounded-full opacity-10"
          style={{ background: '#38B6FF', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-xl mx-auto space-y-6">
        <PageHeader eyebrow="Inkorg" title="Mail" />

        {/* Connect email providers */}
        <div className="space-y-3">
          <button
            onClick={() => bloom('Kommer snart 🔜', 'Gmail-integration är under utveckling')}
            className="w-full flex items-center gap-4 rounded-2xl p-5 transition-all active:scale-95"
            style={{ background: 'rgba(234,67,53,0.1)', border: '1px solid rgba(234,67,53,0.2)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg flex-shrink-0"
              style={{ background: '#EA4335' }}>G</div>
            <div className="text-left">
              <p className="font-bold text-white">Anslut Gmail</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Importera räkningar automatiskt</p>
            </div>
            <span className="ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>
          </button>

          <button
            onClick={() => bloom('Kommer snart 🔜', 'Outlook-integration är under utveckling')}
            className="w-full flex items-center gap-4 rounded-2xl p-5 transition-all active:scale-95"
            style={{ background: 'rgba(0,120,212,0.1)', border: '1px solid rgba(0,120,212,0.2)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg flex-shrink-0"
              style={{ background: '#0078D4' }}>O</div>
            <div className="text-left">
              <p className="font-bold text-white">Anslut Outlook</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Microsoft-konto</p>
            </div>
            <span className="ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>
          </button>
        </div>

        {/* Forward address card */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: 'rgba(56,182,255,0.7)' }}>
            📬 DIN VIDAREBEFORDRINGSADRESS
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-sm font-mono rounded-xl px-3 py-2 overflow-hidden text-ellipsis whitespace-nowrap"
              style={{ background: 'rgba(56,182,255,0.05)', color: '#38B6FF', border: '1px solid rgba(56,182,255,0.1)' }}>
              {FORWARD_ADDRESS}
            </code>
            <button onClick={copyAddress}
              className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: copied ? '#34D399' : '#38B6FF' }}>
              {copied ? '✓' : 'Kopiera'}
            </button>
          </div>
        </div>

        {/* How-to steps */}
        <div className="space-y-3">
          {[
            'Kopiera adressen ovan',
            'Gå till Gmail / Outlook → Inställningar → Vidarebefordran',
            'Klistra in adressen och aktivera',
            'Inkommande mail dyker upp sorterat här',
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-4 rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ background: 'rgba(123,110,255,0.2)', color: '#818CF8' }}>
                {i + 1}
              </div>
              <p className="text-sm leading-relaxed pt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{text}</p>
            </div>
          ))}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveTab(cat.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap"
              style={{
                background: activeTab === cat.id ? cat.color : 'rgba(255,255,255,0.04)',
                color: activeTab === cat.id ? 'white' : 'rgba(255,255,255,0.5)',
              }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        <div className="rounded-3xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-6xl mb-4">
            {categories.find(c => c.id === activeTab)?.emoji || '📬'}
          </div>
          <div className="text-xl font-bold mb-2" style={{ color: '#F0F0F5' }}>
            {activeTab === 'alla' ? 'Inga mail än' : `Inga ${categories.find(c => c.id === activeTab)?.label.toLowerCase()} än`}
          </div>
          <div className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Vidarebefordra din e-post till adressen ovan så sorteras den automatiskt hit
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
