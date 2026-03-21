'use client'

import { useState } from 'react'
import { bloom } from '@/components/Bloom'

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
  { id: 'alla',        label: 'Alla',        emoji: '📬', color: '#9898B8' },
  { id: 'rakningar',   label: 'Räkningar',   emoji: '💳', color: '#FF4B6E' },
  { id: 'myndigheter', label: 'Myndigheter', emoji: '🏛',  color: '#38B6FF' },
  { id: 'avtal',       label: 'Avtal',       emoji: '📜', color: '#C67BFF' },
  { id: 'ovrigt',      label: 'Övrigt',      emoji: '📁', color: '#9898B8' },
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
    <div className="page-in max-w-xl mx-auto px-4 pt-16 pb-28 md:pb-8">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        <div className="absolute top-[-100px] right-[-80px] w-96 h-96 rounded-full opacity-10"
          style={{ background: '#38B6FF', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div>
          <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: '#555570' }}>Inkorg</div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#F2F2FF', letterSpacing: '-0.5px' }}>Mail</h1>
        </div>

        {/* Connect email providers */}
        <div className="rounded-2xl p-6 space-y-4" style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="pb-1">
            <div className="font-bold text-base" style={{ color: '#F2F2FF' }}>Anslut din e-post</div>
            <div className="text-xs mt-1" style={{ color: '#9898B8' }}>Importera räkningar automatiskt</div>
          </div>
          <button
            onClick={() => bloom('Kommer snart 🔜', 'Gmail-integration är under utveckling')}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-bold text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #EA4335cc, #EA433599)', border: '1px solid rgba(234,67,53,0.4)' }}>
            <GmailIcon />
            <span className="text-sm">Anslut Gmail</span>
            <span className="ml-auto text-xs font-normal opacity-60">→</span>
          </button>
          <button
            onClick={() => bloom('Kommer snart 🔜', 'Outlook-integration är under utveckling')}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-bold text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #0078D4cc, #0078D499)', border: '1px solid rgba(0,120,212,0.4)' }}>
            <OutlookIcon />
            <span className="text-sm">Anslut Outlook</span>
            <span className="ml-auto text-xs font-normal opacity-60">→</span>
          </button>
        </div>

        {/* Forward address card */}
        <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg,#001220,#000a14)', border: '1px solid rgba(56,182,255,0.25)' }}>
          <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#38B6FF' }}>
            📨 Din vidarebefordringsadress
          </div>
          <div className="flex items-center gap-3 mb-3">
            <code className="flex-1 px-3 py-2.5 rounded-xl text-sm font-mono font-bold break-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#F2F2FF', border: '1px solid rgba(255,255,255,0.08)' }}>
              {FORWARD_ADDRESS}
            </code>
            <button onClick={copyAddress}
              className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: copied ? '#00C896' : '#38B6FF', minHeight: 44, minWidth: 80 }}>
              {copied ? '✓ Kopierat' : 'Kopiera'}
            </button>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: '#9898B8' }}>
            Vidarebefordra din e-post hit för automatisk sortering. Räkningar och brev sorteras automatiskt i rätt kategori.
          </p>
        </div>

        {/* How-to steps */}
        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="font-bold" style={{ color: '#F2F2FF' }}>Hur det fungerar</h2>
          {[
            { step: '1', text: 'Kopiera adressen ovan', icon: '📋' },
            { step: '2', text: 'Gå till Gmail / Outlook → Inställningar → Vidarebefordran', icon: '⚙️' },
            { step: '3', text: 'Klistra in adressen och aktivera', icon: '✅' },
            { step: '4', text: 'Inkommande mail dyker upp sorterat här', icon: '🪄' },
          ].map(({ step, text, icon }) => (
            <div key={step} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0"
                style={{ background: 'rgba(56,182,255,0.15)', color: '#38B6FF', border: '1px solid rgba(56,182,255,0.3)' }}>
                {step}
              </div>
              <div className="flex items-center gap-2">
                <span>{icon}</span>
                <span className="text-sm" style={{ color: '#9898B8' }}>{text}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveTab(cat.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: activeTab === cat.id ? cat.color : 'rgba(255,255,255,0.05)',
                color: activeTab === cat.id ? 'white' : '#9898B8',
              }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        <div className="rounded-2xl p-10 text-center" style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-5xl mb-4">
            {categories.find(c => c.id === activeTab)?.emoji || '📬'}
          </div>
          <div className="font-bold mb-2" style={{ color: '#F2F2FF' }}>
            {activeTab === 'alla' ? 'Inga mail än' : `Inga ${categories.find(c => c.id === activeTab)?.label.toLowerCase()} än`}
          </div>
          <div className="text-sm" style={{ color: '#9898B8' }}>
            Vidarebefordra din e-post till adressen ovan så sorteras den automatiskt hit
          </div>
        </div>
      </div>
    </div>
  )
}
