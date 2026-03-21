'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

type Step = 'email' | 'check-email' | 'choose' | 'create' | 'join'

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function OnboardingInner() {
  const supabase = createClient()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const urlStep = searchParams.get('step') as Step | null
    if (urlStep && ['choose', 'create', 'join'].includes(urlStep)) {
      setStep(urlStep)
    }
    const urlError = searchParams.get('error')
    if (urlError === 'otp_expired' || urlError === 'access_denied') {
      setError('Din inloggningslänk har gått ut. Ange din e-post igen för att få en ny länk.')
    }
  }, [searchParams])

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) return
    const params = new URLSearchParams(hash)
    const errorCode = params.get('error_code')
    const err = params.get('error')
    if (errorCode === 'otp_expired' || err === 'access_denied' || errorCode === 'access_denied') {
      setError('Din inloggningslänk har gått ut. Ange din e-post igen för att få en ny länk.')
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [])

  async function sendOtp() {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin + '/auth/callback',
      },
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setStep('check-email')
  }

  async function createFamily() {
    if (!name.trim() || !familyName.trim()) return
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Inte inloggad — försök logga in igen.'); setLoading(false); return }

    const code = generateInviteCode()
    const { data: ws, error: wsErr } = await supabase
      .from('family_workspace')
      .insert({ name: familyName.trim(), invite_code: code })
      .select('id')
      .single()
    if (wsErr || !ws) { setError(wsErr?.message || 'Fel vid skapande av familj'); setLoading(false); return }

    const { error: memErr } = await supabase.from('family_members').insert({
      workspace_id: ws.id,
      user_id: user.id,
      name: name.trim(),
      email: user.email,
      avatar_color: '#7B6EFF',
      role: 'adult',
    })
    setLoading(false)
    if (memErr) { setError(memErr.message); return }
    window.location.href = '/hem'
  }

  async function joinFamily() {
    if (!name.trim() || !inviteCode.trim()) return
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Inte inloggad — försök logga in igen.'); setLoading(false); return }

    const { data: ws, error: wsErr } = await supabase
      .from('family_workspace')
      .select('id')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .single()
    if (wsErr || !ws) { setError('Fel kod — kontrollera igen.'); setLoading(false); return }

    const { error: memErr } = await supabase.from('family_members').insert({
      workspace_id: ws.id,
      user_id: user.id,
      name: name.trim(),
      email: user.email,
      avatar_color: '#00C896',
      role: 'adult',
    })
    setLoading(false)
    if (memErr) { setError(memErr.message); return }
    window.location.href = '/hem'
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6"
      style={{ background: '#0D0D1A' }}>
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-100px] right-[-80px] w-96 h-96 rounded-full opacity-10"
          style={{ background: '#7B6EFF', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[20%] left-[-80px] w-72 h-72 rounded-full opacity-[0.08]"
          style={{ background: '#C67BFF', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 w-full" style={{ maxWidth: '360px' }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏠</div>
          <div className="text-3xl font-extrabold" style={{ color: '#F2F2FF', letterSpacing: '-0.5px' }}>
            Familjens Arkiv
          </div>
          <div className="text-sm mt-2" style={{ color: '#9898B8' }}>
            Ert digitala familjehem
          </div>
        </div>

        {/* Step: Email */}
        {step === 'email' && (
          <Card title="Välkommen!" sub="Ange din e-post för att logga in">
            <input
              type="email"
              placeholder="din@email.se"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendOtp()}
              className="w-full px-4 py-3.5 rounded-xl text-base font-medium outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.11)',
                color: '#F2F2FF',
              }}
            />
            {error && <p className="text-sm mt-2" style={{ color: '#FF4B6E' }}>{error}</p>}
            <Btn onClick={sendOtp} loading={loading}>
              Skicka länk →
            </Btn>
            <button onClick={() => { window.location.href = '/hem' }}
              className="w-full text-sm py-2 mt-1"
              style={{ color: '#555570' }}>
              Hoppa över (testa utan inloggning)
            </button>
          </Card>
        )}

        {/* Step: Check email */}
        {step === 'check-email' && (
          <Card title="Kolla din inkorg ✉️" sub={`Vi skickade en inloggningslänk till ${email}`}>
            <p className="text-sm text-center" style={{ color: '#9898B8' }}>
              Klicka på länken i mailet för att logga in. Länken är giltig i 1 timme.
            </p>
            {error && <p className="text-sm mt-2" style={{ color: '#FF4B6E' }}>{error}</p>}
            <button onClick={() => { setStep('email'); setError('') }}
              className="w-full text-sm py-2 mt-1"
              style={{ color: '#555570' }}>
              ← Annan e-post
            </button>
          </Card>
        )}

        {/* Step: Choose */}
        {step === 'choose' && (
          <Card title="Vad vill du göra?" sub="Skapa en ny familj eller gå med i en befintlig">
            <div className="space-y-3">
              <ChoiceBtn emoji="✨" title="Skapa familj" sub="Bli den som startar familjearbetsytan"
                onClick={() => setStep('create')} />
              <ChoiceBtn emoji="🔗" title="Gå med i familj" sub="Du har fått en inbjudningskod"
                onClick={() => setStep('join')} />
            </div>
          </Card>
        )}

        {/* Step: Create family */}
        {step === 'create' && (
          <Card title="Skapa din familj ✨" sub="Steg 2 av 2 — ditt namn och familjens namn">
            <div className="space-y-3">
              <input type="text" placeholder="Ditt namn (t.ex. Franck)"
                value={name} onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl text-base font-medium outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.11)', color: '#F2F2FF' }} />
              <input type="text" placeholder="Familjens namn (t.ex. Familjen Johansson)"
                value={familyName} onChange={e => setFamilyName(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl text-base font-medium outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.11)', color: '#F2F2FF' }} />
            </div>
            {error && <p className="text-sm mt-2" style={{ color: '#FF4B6E' }}>{error}</p>}
            <Btn onClick={createFamily} loading={loading}>Skapa familj 🏠</Btn>
            <button onClick={() => setStep('choose')} className="w-full text-sm py-2 mt-1" style={{ color: '#555570' }}>← Tillbaka</button>
          </Card>
        )}

        {/* Step: Join family */}
        {step === 'join' && (
          <Card title="Gå med i familj 🔗" sub="Ange din inbjudningskod">
            <div className="space-y-3">
              <input type="text" placeholder="Ditt namn"
                value={name} onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl text-base font-medium outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.11)', color: '#F2F2FF' }} />
              <input type="text" placeholder="6-siffrig kod (t.ex. ABC123)"
                value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full px-4 py-3.5 rounded-xl text-base font-medium outline-none tracking-widest text-center"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.11)', color: '#F2F2FF' }} />
            </div>
            {error && <p className="text-sm mt-2" style={{ color: '#FF4B6E' }}>{error}</p>}
            <Btn onClick={joinFamily} loading={loading}>Gå med →</Btn>
            <button onClick={() => setStep('choose')} className="w-full text-sm py-2 mt-1" style={{ color: '#555570' }}>← Tillbaka</button>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingInner />
    </Suspense>
  )
}

// ── Sub-components ────────────────────────────────────────────────────

function Card({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl p-7 space-y-5" style={{ background: '#1E1E35', border: '1.5px solid rgba(123,110,255,0.25)', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#F2F2FF' }}>{title}</h1>
        <p className="text-sm mt-1.5" style={{ color: '#9898B8' }}>{sub}</p>
      </div>
      {children}
    </div>
  )
}

function Btn({ onClick, loading, children }: { onClick: () => void; loading: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="w-full py-3.5 rounded-xl font-bold text-base text-white transition-all mt-2"
      style={{ background: loading ? '#4A4280' : '#7B6EFF', opacity: loading ? 0.7 : 1 }}>
      {loading ? 'Laddar...' : children}
    </button>
  )
}

function ChoiceBtn({ emoji, title, sub, onClick }: { emoji: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
      <span className="text-2xl">{emoji}</span>
      <div>
        <div className="font-bold text-sm" style={{ color: '#F2F2FF' }}>{title}</div>
        <div className="text-xs mt-0.5" style={{ color: '#9898B8' }}>{sub}</div>
      </div>
    </button>
  )
}
